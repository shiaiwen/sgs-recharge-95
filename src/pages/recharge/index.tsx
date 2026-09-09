import { useState } from 'react'
import { Image, Input, Text, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { YUANBAO_OPTIONS } from '@/constants/recharge'
import { fetchAlipayQr, fetchWechatQr } from '@/services/pay'
import type { GameAccount } from '@/store/account'
import { searchAccounts } from '@/store/accountService'
import './index.scss'

type PayChannel = 'wechat' | 'alipay' | null

export default function Recharge() {
  const isH5 = Taro.getEnv() === Taro.ENV_TYPE.WEB
  const [keyword, setKeyword] = useState('')
  const [selectedAccount, setSelectedAccount] = useState<GameAccount | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [matches, setMatches] = useState<GameAccount[]>([])
  const [yuanbao, setYuanbao] = useState('3000')
  const [customYuanbao, setCustomYuanbao] = useState('')
  const [payChannel, setPayChannel] = useState<PayChannel>(null)
  const [qrImage, setQrImage] = useState('')
  const [loading, setLoading] = useState(false)

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

  const requestQr = async (channel: PayChannel) => {
    if (!channel || !validateForm()) {
      return
    }
    setShowDropdown(false)
    setLoading(true)
    setPayChannel(channel)
    setQrImage('')
    try {
      const image = channel === 'wechat'
        ? await fetchWechatQr(rechargeAccount, yuanbaoNumber)
        : await fetchAlipayQr(rechargeAccount, yuanbaoNumber)
      if (!image) {
        Taro.showToast({ title: '请先在支付服务中接入出码', icon: 'none' })
        return
      }
      setQrImage(image)
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
    <View className='recharge'>
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
        <Text className='section-title'>常用金额</Text>
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
        <Text className='section-title other-title'>其他金额</Text>
        <Input
          className={`search-input ${customYuanbao ? 'active-input' : ''}`}
          type='number'
          placeholder='输入其他元宝数量'
          value={customYuanbao}
          onFocus={() => setShowDropdown(false)}
          onInput={(event) => setCustomYuanbao(event.detail.value)}
        />
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

      {qrImage && payChannel ? (
        <View className='qr-panel' id='qr-panel'>
          <Text className='section-title'>
            {payChannel === 'wechat' ? '微信收款码' : '支付宝收款码'}
          </Text>
          <View className='qr-frame'>
            <Image
              className='qr-image'
              src={qrImage}
              mode='widthFix'
              showMenuByLongpress={!isH5}
            />
          </View>
          <Text className='qr-tip'>
            {isH5
              ? '长按二维码保存到手机相册'
              : '长按二维码，使用微信菜单分享'}
          </Text>
        </View>
      ) : null}
    </View>
  )
}
