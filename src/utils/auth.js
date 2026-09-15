const REMEMBERED_LOGIN_KEY = 'mobile_remembered_login'
const LEGACY_SAVED_LOGIN_KEY = 'mobile_saved_login'
const MANUAL_LOGOUT_KEY = 'mobile_manual_logout'

export function saveProfile(profile) {
  uni.setStorageSync('mobile_profile', profile)
  uni.setStorageSync('mobile_access_token', profile.accessToken)
  uni.setStorageSync('mobile_refresh_token', profile.refreshToken)
  uni.removeStorageSync(MANUAL_LOGOUT_KEY)
}

export function getProfile() {
  return uni.getStorageSync('mobile_profile') || null
}

export function updatePointsBalance(pointsBalance) {
  const profile = getProfile()
  if (profile) {
    uni.setStorageSync('mobile_profile', { ...profile, pointsBalance })
  }
}

export function clearProfile() {
  uni.removeStorageSync('mobile_profile')
  uni.removeStorageSync('mobile_access_token')
  uni.removeStorageSync('mobile_refresh_token')
}

export function clearRememberedLogin() {
  uni.removeStorageSync(REMEMBERED_LOGIN_KEY)
  uni.removeStorageSync(LEGACY_SAVED_LOGIN_KEY)
}

export function markManualLogout() {
  uni.setStorageSync(MANUAL_LOGOUT_KEY, '1')
}

export function wasManuallyLoggedOut() {
  return uni.getStorageSync(MANUAL_LOGOUT_KEY) === '1'
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
