import { get, deletes, post, patch, put } from './base'

export const walletNonceApi = ( address ) => {
    return post(`/api/auth/wallet/nonce`,{ address, origin: window.location.origin })
}
export const walletLoginApi = ({
  message,
  signature,
  username,
  avatar
}) => {
    return post(`/api/auth/wallet/login`,{ 
      message,
      signature,
      username,
      avatar
    })
}

export const logoutApi = ( refreshToken ) => {
    return post(`/api/auth/logout`,{ refreshToken })
}

export const refreshTokenApi = () => {
	// 检查是否在浏览器环境中
	const refreshToken = typeof window !== 'undefined' ? localStorage.getItem("refresh_token") : null
	if (!refreshToken) {
		// 如果没有刷新令牌，清理并重新加载
		if (typeof window !== 'undefined') {
			localStorage.removeItem('token')
			localStorage.removeItem('refresh_token')
			window.location.reload()
		}
		return {
			accessToken: '',
		}
	}
	return post('/api/auth/refresh', { refreshToken })
}

export const userInfoApi = () => {
    return get(`/api/auth/me`, { })
}
export const updateUserInfoApi = ({ username, avatar }) => {
    return put(`/api/auth/me`, { username, avatar })
}

export const revokeAllApi = () => {
    return post(`/api/auth/revoke-all`, { })
}
