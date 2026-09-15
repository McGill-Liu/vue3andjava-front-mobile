import { clearProfile } from './auth'
import { API_BASE_URL } from '../../api.config'

const baseURL = API_BASE_URL

let redirecting = false
let errorDialogVisible = false

function requestError(message, handled = false) {
  const error = new Error(message || '请求失败，请稍后重试')
  error.handled = handled
  return error
}

export function showRequestError(error, title = '操作失败') {
  if (error?.handled || errorDialogVisible) return
  const content = String(error?.message || '请求失败，请稍后重试')
  errorDialogVisible = true
  uni.showModal({
    title,
    content,
    showCancel: false,
    confirmText: '我知道了',
    complete: () => {
      errorDialogVisible = false
    }
  })
}

function handleExpiredLogin(message) {
  clearProfile()
  if (redirecting) {
    return
  }
  redirecting = true
  uni.showModal({
    title: '登录失效',
    content: message || '登录状态已失效，请重新登录',
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
      timeout: 10000,
      success: ({ statusCode, data: res }) => {
        if (statusCode === 401) {
          handleExpiredLogin((res && res.message) || '登录状态已失效，请重新登录')
          reject(requestError((res && res.message) || '登录状态已失效，请重新登录', true))
          return
        }
        if (statusCode === 403 && res && res.message === '请先修改临时密码') {
          uni.reLaunch({ url: '/src/pages/password/index' })
          reject(requestError(res.message, true))
          return
        }
        if (res && res.success) {
          resolve(res.data)
          return
        }
        if (statusCode >= 500) {
          reject(requestError(`服务器暂时无法访问（错误码 ${statusCode}），请稍后重试`))
          return
        }
        reject(requestError((res && res.message) || `请求失败（错误码 ${statusCode}）`))
      },
      fail: (error) => {
        const rawMessage = error?.errMsg || error?.message || ''
        const message = rawMessage.includes('timeout')
          ? '网络请求超时，请检查网络后重试'
          : '网络连接失败，请检查网络后重试'
        reject(requestError(message))
      }
    })
  })
}
