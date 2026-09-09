import request from './request'

interface WechatOrderResponse {
  code: number
  data?: {
    order_id: string
  }
}

interface WechatQrResponse {
  code: number
  data?: {
    qr_image: string
  }
}

interface AlipayQrResponse {
  qrcode_img_url: string
}

const PAYMENT_BASE_URL = 'https://payment.sanguosha.com'

export async function fetchWechatQr(account: string, yuanbao: number): Promise<string> {
  const order = await request.get<WechatOrderResponse>(
    `${PAYMENT_BASE_URL}/ol/qr_pay/wechat/order/create`,
    { account, yuanbao }
  )

  if (order.code !== 0 || !order.data?.order_id) {
    throw new Error('微信支付接口未返回订单号')
  }

  const qrCode = await request.get<WechatQrResponse>(
    `${PAYMENT_BASE_URL}/ol/qr_pay/wechat/qrcode/show`,
    { order_id: order.data.order_id }
  )

  if (qrCode.code !== 0 || !qrCode.data?.qr_image) {
    throw new Error('微信支付接口未返回二维码')
  }

  return qrCode.data.qr_image
}

export async function fetchAlipayQr(account: string, yuanbao: number): Promise<string> {
  const data = await request.get<AlipayQrResponse>(
    `${PAYMENT_BASE_URL}/ol/qr_pay/alipay/qrcode/info`,
    { account, yuanbao }
  )

  if (!data.qrcode_img_url) {
    throw new Error('支付宝接口未返回二维码')
  }

  return data.qrcode_img_url
}
