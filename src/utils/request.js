import { clearProfile } from './auth'

const baseURL = 'http://10.238.139.189:8080/api'

let redirecting = false

function handleExpiredLogin(message) {
  clearProfile()
  if (redirecting) {
    return
  }
  redirecting = true
  uni.showToast({
    title: message || '登录已过期',
    icon: 'none',
    duration: 1800
  })
  setTimeout(() => {
    uni.reLaunch({ url: '/src/pages/login/index' })
    redirecting = false
  }, 400)
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
          handleExpiredLogin('登录已过期，请重新登录')
          reject(new Error('登录已过期，请重新登录'))
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
