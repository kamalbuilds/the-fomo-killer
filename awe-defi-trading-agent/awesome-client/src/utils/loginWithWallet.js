import { useState, useCallback } from 'react'
import { useSignMessage } from 'wagmi'
import { walletNonceApi, walletLoginApi } from '@/api'
import { showToast } from '@/components'

export const useWalletLogin = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const { signMessageAsync } = useSignMessage()

  /**
   * 登录钱包
   * @param {string} address 钱包地址
   * @param {Function} [onSuccess] 登录成功后的回调函数
   */
  const loginWithWallet = useCallback(
    async (address, onSuccess) => {
      try {
        if (typeof window === 'undefined') {
          throw new Error('Must run in browser')
        }

        setLoading(true)

        // 1. 获取 nonce message
        const nonceRes = await walletNonceApi(address)
        // console.log('nonceRes', nonceRes)
        const { message } = nonceRes || {}
        if (!message) throw new Error('No message returned from nonce API')

        // 2. 签名消息
        const signature = await signMessageAsync({ message })
        // console.log('signature', signature)
        // 3. 登录
        const loginRes = await walletLoginApi({
          message,
          signature,
        })

        const { tokens, user: userData } = loginRes
        const { accessToken, refreshToken } = tokens

        // 4. 保存 token
        localStorage.setItem('token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)

        setUser(userData)
        showToast('success', 'Login successful')

        // ✅ 调用成功回调
        if (typeof onSuccess === 'function') {
          onSuccess(userData)
        }

        return userData
      } catch (err) {
        console.error('[Wallet Login Failed]', err)
        showToast('error', 'Login failed')
        return null
      } finally {
        setLoading(false)
      }
    },
    [signMessageAsync]
  )

  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('token')

  return {
    user,
    loginWithWallet,
    isLoggedIn,
    loading,
  }
}
