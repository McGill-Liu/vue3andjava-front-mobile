<script>
import { clearProfile, exitGuest, getProfile, isGuest } from '../../utils/auth'
import { hidePageLoading, showPageLoading } from '../../utils/loading'

export default {
  data() {
    return {
      profile: {},
      guestMode: false,
      tabItems: [
        { key: 'mall', label: '商品', url: '/src/pages/mall/index' },
        { key: 'cart', label: '购物车', url: '/src/pages/cart/index' },
        { key: 'orders', label: '订单', url: '/src/pages/orders/index' },
        { key: 'address', label: '地址', url: '/src/pages/address/index' },
        { key: 'profile', label: '我的', url: '/src/pages/profile/index' }
      ]
    }
  },
  onShow() {
    hidePageLoading()
    this.profile = getProfile() || {}
    this.guestMode = isGuest() || !this.profile || !this.profile.role
  },
  methods: {
    tabDisabled(item) {
      return this.guestMode && item.key !== 'mall'
    },
    goTab(item) {
      if (this.tabDisabled(item) || item.key === 'profile') {
        return
      }
      showPageLoading()
      uni.reLaunch({ url: item.url })
    },
    logout() {
      showPageLoading()
      clearProfile()
      exitGuest()
      uni.reLaunch({ url: '/src/pages/login/index' })
    },
    goPassword() {
      uni.navigateTo({ url: '/src/pages/password/index' })
    },
    copyWechat() {
      uni.setClipboardData({
        data: 'boss-wechat',
        success: () => {
          uni.showToast({ title: '微信号已复制', icon: 'success' })
        }
      })
    }
  }
}
</script>

<template>
  <view class="page-shell">
    <view class="card profile-card">
      <view class="hero-row">
        <view>
          <view class="section-title">个人中心</view>
          <view class="hint-text">查看账户信息，快速处理常用操作。</view>
        </view>
        <view class="badge">{{ guestMode ? '游客' : '已登录' }}</view>
      </view>

      <view class="profile-grid">
        <view class="info-box">
          <view class="label">姓名</view>
          <view class="value">{{ profile.name || '-' }}</view>
        </view>
        <view class="info-box">
          <view class="label">手机号</view>
          <view class="value">{{ profile.phone || '-' }}</view>
        </view>
        <view class="info-box">
          <view class="label">身份证号</view>
          <view class="value">{{ profile.idCardNo || '-' }}</view>
        </view>
        <view class="info-box">
          <view class="label">积分余额</view>
          <view class="value">{{ profile.pointsBalance !== undefined && profile.pointsBalance !== null ? profile.pointsBalance : '-' }}</view>
        </view>
      </view>

      <view class="action-row">
        <button class="action-btn light" @click="goPassword">修改密码</button>
        <button class="action-btn dark" @click="logout">退出登录</button>
      </view>

      <view class="notice-card">
        <view>
          <view class="notice-title">管理员微信</view>
          <view class="notice-text">boss-wechat</view>
        </view>
        <button class="copy-btn" @click="copyWechat">点击复制微信号</button>
      </view>
    </view>

    <view class="tabbar-shell">
      <view
        v-for="item in tabItems"
        :key="item.key"
        class="tab-item"
        :class="{ active: item.key === 'profile', disabled: tabDisabled(item) }"
        @click="goTab(item)"
      >
        <text class="tab-text">{{ item.label }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.profile-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.hero-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12rpx;
}

.hint-text {
  color: #64748b;
  font-size: 22rpx;
  line-height: 1.7;
}

.badge {
  flex-shrink: 0;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 20rpx;
  font-weight: 700;
  padding: 10rpx 14rpx;
  border-radius: 999rpx;
}

.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
}

.info-box {
  background: #f8fafc;
  border-radius: 18rpx;
  padding: 18rpx;
}

.label {
  font-size: 20rpx;
  color: #64748b;
  margin-bottom: 6rpx;
}

.value {
  font-size: 24rpx;
  color: #0f172a;
  font-weight: 700;
  word-break: break-all;
}

.action-row {
  display: flex;
  gap: 10rpx;
}

.action-btn {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 18rpx;
  font-size: 22rpx;
  padding: 0;
}

.action-btn.light {
  background: #e2e8f0;
  color: #0f172a;
}

.action-btn.dark {
  background: #111827;
  color: #fff;
}

.notice-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
  border-radius: 18rpx;
  padding: 18rpx;
}

.notice-title {
  font-size: 22rpx;
  color: #64748b;
}

.notice-text {
  font-size: 24rpx;
  font-weight: 700;
}

.copy-btn {
  min-width: 188rpx;
  height: 56rpx;
  line-height: 56rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  background: #2563eb;
  color: #fff;
  font-size: 20rpx;
}

.tabbar-shell {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 104rpx;
  padding: 12rpx 12rpx 18rpx;
  box-sizing: border-box;
  background: #ffffff;
  border-top: 1rpx solid #e2e8f0;
}

.tab-item {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 58rpx;
  margin: 0 4rpx;
  border-radius: 999rpx;
}

.tab-item.active {
  background: #2563eb;
}

.tab-item.disabled {
  background: #f1f5f9;
}

.tab-text {
  font-size: 22rpx;
  color: #64748b;
  font-weight: 600;
}

.tab-item.active .tab-text {
  color: #ffffff;
}

.tab-item.disabled .tab-text {
  color: #cbd5e1;
}
</style>
