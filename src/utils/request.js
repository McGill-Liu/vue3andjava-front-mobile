import { clearProfile } from './auth'
import { API_BASE_URL } from '../../api.config'

const baseURL = API_BASE_URL

let redirecting = false

function handleExpiredLogin(message) {
  clearProfile()
  if (redirecting) {
    return
  }
  redirecting = true
  uni.showModal({
    title: '登录失效',
    content: message || '登录超时，请重新登录',
    showCancel: false,
    success: () => {
      uni.reLaunch({ url: '/src/pages/login/index' })
      redirecting = false
    }
  })
  setTimeout(() => {
    if (!redirecting) return
    uni.reLaunch({ url: '/src/pages/login/index' })
    redirecting = false
  }, 3000)
}

export function request({ url, method = 'GET', data, auth = true }) {
  const headers = {}
  if (auth) {
    const token = uni.getStorageSync('mobile_access_token')
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${baseURL}${url}`,
      method,
      data,
      header: headers,
      success: ({ statusCode, data: res }) => {
        if (statusCode === 401) {
          handleExpiredLogin('登录超时，请重新登录')
          reject(new Error('登录超时，请重新登录'))
          return
        }
        if (res && res.success) {
          resolve(res.data)
          return
        }
        reject(new Error((res && res.message) || '请求失败'))
      },
      fail: (error) => reject(error)
    })
  })
}
