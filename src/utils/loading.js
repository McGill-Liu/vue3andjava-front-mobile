let loadingVisible = false

export function showPageLoading(title = '加载中') {
  if (loadingVisible) return
  loadingVisible = true
  uni.showLoading({
    title,
    mask: true
  })
}

export function hidePageLoading() {
  if (!loadingVisible) return
  loadingVisible = false
  uni.hideLoading()
}
