<script>
import { APP_VERSION } from './src/config/app'
import { hidePageLoading, showPageLoading } from './src/utils/loading'

export default {
  onLaunch() {
    showPageLoading('启动中')
    this.checkForMiniProgramUpdate()
  },
  onShow() {
    setTimeout(() => {
      hidePageLoading()
    }, 250)
  },
  onHide() {},
  methods: {
    checkForMiniProgramUpdate() {
      // Only WeChat mini programs support the native update manager.
      // It prompts users to restart after a newly uploaded build is ready.
      // #ifdef MP-WEIXIN
      if (typeof wx === 'undefined' || !wx.canIUse('getUpdateManager')) {
        return
      }

      const updateManager = wx.getUpdateManager()

      updateManager.onCheckForUpdate(() => {})

      updateManager.onUpdateReady(() => {
        uni.showModal({
          title: '发现新版本',
          content: `当前版本 ${APP_VERSION} 已有更新，是否立即重启小程序？`,
          confirmText: '立即更新',
          cancelText: '稍后',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate()
            }
          }
        })
      })

      updateManager.onUpdateFailed(() => {
        uni.showToast({
          title: '新版本下载失败，请稍后重试',
          icon: 'none'
        })
      })
      // #endif
    }
  }
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
