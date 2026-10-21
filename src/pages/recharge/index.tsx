import { useEffect, useState } from 'react'
import { Image, Input, Text, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import DesktopNav from '@/components/DesktopNav'
import { YUANBAO_OPTIONS } from '@/constants/recharge'
import { createPayOrder, fetchOrderPaid, type PayChannel, type PayOrder } from '@/services/pay'
import type { GameAccount } from '@/store/account'
import { searchAccounts } from '@/store/accountService'
import './index.scss'

export default function Recharge() {
  const isH5 = process.env.TARO_ENV === 'h5'
  const [keyword, setKeyword] = useState('')
  const [selectedAccount, setSelectedAccount] = useState<GameAccount | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [matches, setMatches] = useState<GameAccount[]>([])
  const [yuanbao, setYuanbao] = useState('3000')
  const [customYuanbao, setCustomYuanbao] = useState('')
  const [payChannel, setPayChannel] = useState<PayChannel | null>(null)
  const [payOrder, setPayOrder] = useState<PayOrder | null>(null)
  const [loading, setLoading] = useState(false)
  const [paid, setPaid] = useState(false)

  const refreshMatches = (value: string) => {
    setMatches(searchAccounts(value))
  }

  useDidShow(() => {
    refreshMatches(keyword)
    if (selectedAccount) {
      const latest = searchAccounts(selectedAccount.account)
        .find((item) => item.id === selectedAccount.id)
      if (!latest) {
        setSelectedAccount(null)
      }
    }
  })

  const onKeywordChange = (value: string) => {
    setKeyword(value)
    setSelectedAccount(null)
    setMatches(searchAccounts(value))
    setShowDropdown(true)
  }

  const onSelectAccount = (account: GameAccount) => {
    setSelectedAccount(account)
    setKeyword(account.account)
    setShowDropdown(false)
  }

  const yuanbaoNumber = Number(customYuanbao || yuanbao)
  const referenceYuan = Number.isInteger(yuanbaoNumber) && yuanbaoNumber > 0
    ? (yuanbaoNumber / 100 * 0.95).toFixed(2)
    : ''
  const rechargeAccount = keyword.trim()

  const validateForm = () => {
    if (!rechargeAccount) {
      Taro.showToast({ title: '请输入或选择充值账号', icon: 'none' })
      return false
    }
    if (!Number.isInteger(yuanbaoNumber) || yuanbaoNumber <= 0) {
      Taro.showToast({ title: '请输入有效元宝数量', icon: 'none' })
      return false
    }
    return true
  }

  useEffect(() => {
    if (!payOrder || paid) {
      return undefined
    }
    let timer = 0
    let stopped = false
    const poll = async () => {
      try {
        const done = await fetchOrderPaid(payOrder.channel, payOrder.orderId)
        if (stopped) {
          return
        }
        if (done) {
          setPaid(true)
          return
        }
      } catch {
        return
      }
      timer = setTimeout(poll, 4000) as unknown as number
    }
    timer = setTimeout(poll, 4000) as unknown as number
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [payOrder, paid])

  const requestQr = async (channel: PayChannel) => {
    if (!validateForm()) {
      return
    }
    setShowDropdown(false)
    setLoading(true)
    setPayChannel(channel)
    setPayOrder(null)
    setPaid(false)
    try {
      const order = await createPayOrder(channel, rechargeAccount, yuanbaoNumber)
      setPayOrder(order)
      if (order.pageUrl && !isH5) {
        Taro.navigateTo({
          url: `/pages/cashier/index?src=${encodeURIComponent(order.pageUrl)}`
        })
        return
      }
      Taro.nextTick(() => {
        Taro.pageScrollTo({
          selector: '#qr-panel',
          duration: 300
        })
      })
    } catch (error) {
      Taro.showToast({
        title: error instanceof Error ? error.message : '出码失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='recharge-page'>
      <DesktopNav current='recharge' />
      <View className='recharge'>
      <View className='recharge-main'>
      <View className='notice'>
        <Text className='notice-title'>官服95折充值</Text>
        <Text className='notice-line'>二维码由官方支付服务提供。</Text>
        <Text className='notice-line'>使用本功能需自担风险，推荐使用前先小额充值以测试渠道可用性。</Text>
      </View>
      {showDropdown ? (
        <View
          className='dropdown-mask'
          catchMove
          onClick={() => setShowDropdown(false)}
        />
      ) : null}
      <View className={`section ${showDropdown ? 'section-front' : ''}`}>
        <Text className='section-title'>充值账号</Text>
        <View className='search-box'>
          <Input
            className='search-input'
            placeholder='输入账号进行模糊匹配'
            value={keyword}
            onFocus={() => {
              refreshMatches(keyword)
              setShowDropdown(true)
            }}
            onInput={(event) => onKeywordChange(event.detail.value)}
          />
          {showDropdown ? (
            <View className='dropdown'>
              {matches.length === 0 ? (
                <View className='dropdown-empty'>
                  {keyword.trim() ? '没有匹配到本地账号，可直接使用输入的账号' : '暂无本地账号，也可直接输入账号充值'}
                </View>
              ) : (
                matches.map((item) => (
                  <View
                    className='dropdown-item'
                    key={item.id}
                    hoverClass='dropdown-item-hover'
                    onClick={() => onSelectAccount(item)}
                  >
                    <View className='dropdown-name'>{item.account}</View>
                  </View>
                ))
              )}
            </View>
          ) : null}
        </View>
        <Text className='selected-tip'>
          {rechargeAccount
            ? `当前账号：${rechargeAccount}`
            : '可直接输入账号，或从下拉列表点选'}
        </Text>
      </View>

      <View className='section'>
        <Text className='section-title'>充值测试</Text>
        <View
          className={`yuanbao-option test-option ${!customYuanbao && yuanbao === '1' ? 'active' : ''}`}
          onClick={() => {
            setYuanbao('1')
            setCustomYuanbao('')
          }}
        >
          1 元宝
        </View>
        <Text className='test-tip'>
          第一次充值前，建议先充值 1 元宝，花费0.01 元, 进行测试。确认元宝总额和累计充值都发生变化后，再进行充值。
        </Text>
        <Text className='section-title'>常用元宝</Text>
        <View className='yuanbao-options'>
          {YUANBAO_OPTIONS.map((item) => (
            <View
              key={item}
              className={`yuanbao-option ${!customYuanbao && yuanbao === String(item) ? 'active' : ''}`}
              onClick={() => {
                setYuanbao(String(item))
                setCustomYuanbao('')
              }}
            >
              {item}
            </View>
          ))}
        </View>
        <Text className='section-title other-title'>其他元宝</Text>
        <Input
          className={`search-input ${customYuanbao ? 'active-input' : ''}`}
          type='number'
          placeholder='输入其他元宝数量'
          value={customYuanbao}
          onFocus={() => setShowDropdown(false)}
          onInput={(event) => {
            const value = event.detail.value.replace(/[^\d]/g, '')
            setCustomYuanbao(value)
          }}
        />
        <Text className='reference-price'>
          {referenceYuan
            ? `参考金额 ¥${referenceYuan}（100 元宝 = 0.95 元）`
            : '参考金额按 100 元宝 = 0.95 元计算'}
        </Text>
      </View>

      <View className='pay-actions'>
        <View
          className={`pay-btn wechat ${loading && payChannel === 'wechat' ? 'disabled' : ''}`}
          onClick={() => requestQr('wechat')}
        >
          {loading && payChannel === 'wechat' ? '生成中...' : '微信支付'}
        </View>
        <View
          className={`pay-btn alipay ${loading && payChannel === 'alipay' ? 'disabled' : ''}`}
          onClick={() => requestQr('alipay')}
        >
          {loading && payChannel === 'alipay' ? '生成中...' : '支付宝支付'}
        </View>
      </View>
      </View>

      <View className={`qr-panel ${payOrder && payChannel ? '' : 'qr-panel-empty'}`} id='qr-panel'>
        {payOrder && payChannel ? (
          <>
          <Text className='section-title'>
            {paid ? '支付成功' : payChannel === 'wechat' ? '微信收款码' : '支付宝收款码'}
          </Text>
          {payOrder.imageUrl ? (
            <View className='qr-frame'>
              <Image
                className='qr-image'
                src={payOrder.imageUrl}
                mode='aspectFit'
                showMenuByLongpress={!isH5}
              />
            </View>
          ) : null}
          {payOrder.pageUrl && isH5 ? (
            <View className='qr-frame'>
              <iframe className='pay-frame' src={payOrder.pageUrl} title='支付宝支付' scrolling='no' />
            </View>
          ) : null}
          <Text className='qr-tip'>
            {paid
              ? '请返回游戏核对元宝到账'
              : '二维码由官方支付服务提供。支付前请核对账号与金额。'}
          </Text>
          </>
        ) : (
          <Text className='qr-placeholder'>生成后，二维码会显示在这里</Text>
        )}
      </View>
      </View>
    </View>
  )
}
