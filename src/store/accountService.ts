import Taro from '@tarojs/taro'
import { ACCOUNT_STORAGE_KEY, type GameAccount } from './account'

export function getAccounts(): GameAccount[] {
  return Taro.getStorageSync<GameAccount[]>(ACCOUNT_STORAGE_KEY) || []
}

export function saveAccounts(accounts: GameAccount[]) {
  Taro.setStorageSync(ACCOUNT_STORAGE_KEY, accounts)
}

export function addAccount(accountValue: string): GameAccount {
  const trimmed = accountValue.trim()
  const accounts = getAccounts()
  const duplicated = accounts.find((item) => item.account === trimmed)
  if (duplicated) {
    throw new Error('账号已存在')
  }
  const account: GameAccount = {
    id: `${Date.now()}`,
    account: trimmed
  }
  saveAccounts([...accounts, account])
  return account
}

export function removeAccount(id: string) {
  saveAccounts(getAccounts().filter((item) => item.id !== id))
}

export function searchAccounts(keyword: string): GameAccount[] {
  const accounts = getAccounts()
  const query = keyword.trim().toLowerCase()
  if (!query) {
    return accounts
  }
  return accounts.filter((item) => item.account.toLowerCase().includes(query))
}
