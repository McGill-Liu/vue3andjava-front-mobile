const API_TARGETS = {
  development: 'http://192.168.50.159:8080/api',
  production: 'http://49.235.175.56/api'
}

export const API_BASE_URL = API_TARGETS[process.env.NODE_ENV] || API_TARGETS.development

// Keep disabled until the backend has a real WeChat AppID/AppSecret and the HTTPS domain is ready.
export const WECHAT_OPEN_ID_LOGIN_ENABLED = false
