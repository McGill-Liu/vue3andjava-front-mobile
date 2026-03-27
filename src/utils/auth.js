export function saveProfile(profile) {
  uni.setStorageSync('mobile_profile', profile)
  uni.setStorageSync('mobile_access_token', profile.accessToken)
  uni.setStorageSync('mobile_refresh_token', profile.refreshToken)
}

export function saveRememberedLogin(payload) {
  uni.setStorageSync('mobile_saved_login', payload)
}

export function getRememberedLogin() {
  return uni.getStorageSync('mobile_saved_login') || null
}

export function getProfile() {
  return uni.getStorageSync('mobile_profile') || null
}

export function clearProfile() {
  uni.removeStorageSync('mobile_profile')
  uni.removeStorageSync('mobile_access_token')
  uni.removeStorageSync('mobile_refresh_token')
}

export function clearRememberedLogin() {
  uni.removeStorageSync('mobile_saved_login')
}

export function isGuest() {
  return uni.getStorageSync('mobile_guest_mode') === '1'
}

export function enterGuest() {
  uni.setStorageSync('mobile_guest_mode', '1')
}

export function exitGuest() {
  uni.removeStorageSync('mobile_guest_mode')
}
