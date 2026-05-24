const API_TARGETS = {
  development: 'http://192.168.50.136:8080/api',
  production: 'http://49.235.175.56/api'
}

export const API_BASE_URL = API_TARGETS[process.env.NODE_ENV] || API_TARGETS.development
