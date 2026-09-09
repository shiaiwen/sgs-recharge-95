import { useState } from 'react'
import { Button, Input, Text, View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import type { GameAccount } from '@/store/account'
import { addAccount, getAccounts, removeAccount } from '@/store/accountService'
import './index.scss'

export default function Account() {
  const [accounts, setAccounts] = useState<GameAccount[]>([])
  const [accountValue, setAccountValue] = useState('')

  const refresh = () => {
    setAccounts(getAccounts())
  }

  useDidShow(() => {
    refresh()
  })

  const onAdd = () => {
    if (!accountValue.trim()) {
      Taro.showToast({ title: '请输入游戏账号', icon: 'none' })
      return
    }
    try {
      addAccount(accountValue)
      setAccountValue('')
      refresh()
      Taro.showToast({ title: '已添加', icon: 'success' })
    } catch (error) {
      Taro.showToast({
        title: error instanceof Error ? error.message : '添加失败',
        icon: 'none'
      })
    }
  }

  const onDelete = (account: GameAccount) => {
    Taro.showModal({
      title: '删除账号',
      content: `确定删除 ${account.account} 吗？`,
      confirmColor: '#2563EB',
      success: (res) => {
        if (res.confirm) {
          removeAccount(account.id)
          refresh()
          Taro.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  }

  return (
    <View className='account'>
      <View className='section'>
        <Text className='section-title'>添加账号</Text>
        <Input
          className='field'
          placeholder='游戏账号'
          value={accountValue}
          onInput={(event) => setAccountValue(event.detail.value)}
        />
        <Button className='add-btn' onClick={onAdd}>
          保存到本地
        </Button>
      </View>

      <View className='section'>
        <Text className='section-title'>本地账号</Text>
        {accounts.length === 0 ? (
          <View className='empty'>暂无账号，添加后可在充值页搜索选择</View>
        ) : (
          accounts.map((item) => (
            <View className='account-item' key={item.id}>
              <View className='account-info'>
                <View className='name'>{item.account}</View>
              </View>
              <Text className='delete' onClick={() => onDelete(item)}>
                删除
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  )
}
