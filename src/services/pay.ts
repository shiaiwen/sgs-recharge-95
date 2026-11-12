import Taro from '@tarojs/taro'
import { md5 } from './md5'

interface OrderResponse {
  code: number
  msg?: string
  data?: {
    order_id?: string
    code_url?: string
    order_status?: number
  }
}

export type PayChannel = 'wechat' | 'alipay'

export interface PayOrder {
  channel: PayChannel
  orderId: string
  imageUrl?: string
  pageUrl?: string
  amount?: string
}

/** 官方支付地址。H5 走本站代理，既避免跨域，也把 Origin 改成官网域名（官方会拦截其他来源）。 */
const OFFICIAL_PAYMENT_BASE_URL = 'https://ol-payment.sanguosha.com'
const PAYMENT_BASE_URL = process.env.TARO_ENV === 'h5' ? '/ol-payment' : OFFICIAL_PAYMENT_BASE_URL
const SIGN_KEY = 'IqCUMcHyvGTtw4ThpEky5jtjEl8PG0V5'
const SERVER_ID = 1100
const CHANNEL = '210000'

function signPayload(payload: Record<string, string | number>) {
  const withTimestamp = {
    ...payload,
    timestamp: Math.floor(Date.now() / 1000)
  }
  const plain = Object.keys(withTimestamp)
    .sort()
    .map((key) => `${key}=${withTimestamp[key as keyof typeof withTimestamp]}`)
    .join('')
  return {
    ...withTimestamp,
    sign: md5(plain + SIGN_KEY).toUpperCase()
  }
}

function parseJson(raw: unknown): OrderResponse | null {
  if (raw && typeof raw === 'object') {
    return raw as OrderResponse
  }
  if (typeof raw !== 'string' || !raw) {
    return null
  }
  try {
    return JSON.parse(raw) as OrderResponse
  } catch {
    return null
  }
}

function readOrderResponse(statusCode: number, raw: unknown): OrderResponse {
  const data = parseJson(raw)
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(data?.msg || '官方充值服务暂时不可用')
  }
  if (!data) {
    throw new Error('官方充值服务返回异常')
  }
  return data
}

async function postOrder(path: string, payload: Record<string, string | number>) {
  const body = signPayload(payload)
  const url = `${PAYMENT_BASE_URL}${path}`

  if (process.env.TARO_ENV === 'h5') {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer'
    })
    return readOrderResponse(response.status, await response.text())
  }

  const { data, statusCode } = await Taro.request<OrderResponse | string>({
    url,
    method: 'POST',
    data: body,
    header: { 'Content-Type': 'application/json' },
    timeout: 15000
  })
  return readOrderResponse(statusCode, data)
}

async function getOrder(path: string, payload: Record<string, string | number>) {
  const query = signPayload(payload)
  const url = `${PAYMENT_BASE_URL}${path}?${new URLSearchParams(
    Object.fromEntries(Object.entries(query).map(([key, value]) => [key, String(value)]))
  ).toString()}`

  if (process.env.TARO_ENV === 'h5') {
    const response = await fetch(url, {
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer'
    })
    return readOrderResponse(response.status, await response.text())
  }

  const { data, statusCode } = await Taro.request<OrderResponse | string>({
    url,
    method: 'GET',
    timeout: 15000
  })
  return readOrderResponse(statusCode, data)
}

function readWechatImage(codeUrl: string) {
  if (!/^data:image\/(?:png|jpeg);base64,[a-z0-9+/=\r\n]+$/i.test(codeUrl)) {
    throw new Error('官方接口返回的二维码图片异常')
  }
  return codeUrl
}

function readAlipayPage(codeUrl: string, orderId: string) {
  const page = new URL(codeUrl)
  if (
    page.origin !== 'https://openapi.alipay.com' ||
    page.pathname !== '/gateway.do' ||
    page.username ||
    page.password ||
    page.searchParams.get('method') !== 'alipay.trade.page.pay'
  ) {
    throw new Error('官方接口返回的支付宝地址异常')
  }
  const content = JSON.parse(page.searchParams.get('biz_content') || '{}') as {
    out_trade_no?: string
    total_amount?: string | number
  }
  const amount = Number(content.total_amount)
  if (content.out_trade_no !== orderId || !Number.isFinite(amount) || amount <= 0) {
    throw new Error('支付宝订单信息异常')
  }
  return {
    pageUrl: page.href,
    amount: amount.toFixed(2)
  }
}

export async function createPayOrder(channel: PayChannel, account: string, yuanbao: number): Promise<PayOrder> {
  const path = channel === 'alipay'
    ? '/v1/alipay/qrcode/order/create'
    : '/v1/wechat/qrcode/order/create'
  const result = await postOrder(path, {
    account,
    yb: yuanbao,
    server_id: SERVER_ID,
    channel: CHANNEL
  })
  const orderId = result.data?.order_id
  const codeUrl = result.data?.code_url
  if (result.code !== 0 || !orderId || !codeUrl) {
    throw new Error(result.msg || '官方下单失败')
  }

  if (channel === 'alipay') {
    const page = readAlipayPage(codeUrl, orderId)
    return {
      channel,
      orderId,
      pageUrl: page.pageUrl,
      amount: page.amount
    }
  }

  return {
    channel,
    orderId,
    imageUrl: readWechatImage(codeUrl)
  }
}

export async function fetchOrderPaid(channel: PayChannel, orderId: string) {
  const path = channel === 'alipay'
    ? '/v1/alipay/web/order/status'
    : '/v1/wechatpay/web/order/status'
  const result = await getOrder(path, { order_id: orderId })
  return result.code === 0 && result.data?.order_status === 1
}
