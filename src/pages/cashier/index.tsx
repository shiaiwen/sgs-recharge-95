import { WebView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'

export default function Cashier() {
  const router = useRouter()
  const src = decodeURIComponent(router.params.src || '')
  if (!src.startsWith('https://openapi.alipay.com/')) {
    Taro.navigateBack()
    return null
  }
  return <WebView src={src} />
}
