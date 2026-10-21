import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

type NavKey = 'recharge' | 'account'

const ITEMS: Array<{ key: NavKey; title: string; url: string }> = [
  { key: 'recharge', title: '充值', url: '/pages/recharge/index' },
  { key: 'account', title: '账号', url: '/pages/account/index' }
]

export default function DesktopNav({ current }: { current: NavKey }) {
  const go = (url: string, key: NavKey) => {
    if (key === current) {
      return
    }
    Taro.switchTab({ url })
  }

  return (
    <View className='desktop-nav'>
      <Text className='desktop-nav-brand'>官服95折充值</Text>
      <View className='desktop-nav-links'>
        {ITEMS.map((item) => (
          <Text
            key={item.key}
            className={`desktop-nav-link ${item.key === current ? 'active' : ''}`}
            onClick={() => go(item.url, item.key)}
          >
            {item.title}
          </Text>
        ))}
      </View>
    </View>
  )
}
