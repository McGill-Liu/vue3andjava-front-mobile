import { API_BASE_URL } from '../../api.config'

const serverOrigin = API_BASE_URL.replace(/\/api\/?$/, '')

export function productImageUrl(url) {
  if (!url || /^https?:\/\//.test(url)) {
    return url || ''
  }
  return `${serverOrigin}${url.startsWith('/') ? url : `/${url}`}`
}
