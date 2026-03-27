<script>
import { hidePageLoading, showPageLoading } from './src/utils/loading'

export default {
  onLaunch() {
    showPageLoading('启动中')
  },
  onShow() {
    setTimeout(() => {
      hidePageLoading()
    }, 250)
  },
  onHide() {}
}
</script>

<style>
page {
  background: linear-gradient(180deg, #eef4ff 0%, #f8fafc 45%, #ffffff 100%);
  color: #1e293b;
  font-family: "PingFang SC", sans-serif;
  font-size: 26rpx;
}

.page-shell {
  min-height: 100vh;
  padding: 20rpx 20rpx 124rpx;
  box-sizing: border-box;
}

.card {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 22rpx;
  padding: 22rpx;
  box-shadow: 0 14rpx 32rpx rgba(148, 163, 184, 0.1);
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  margin-bottom: 14rpx;
}

</style>
