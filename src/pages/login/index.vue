<script>
import {
  clearRememberedLogin,
  enterGuest,
  exitGuest,
  saveProfile
} from '../../utils/auth'
import { hidePageLoading, showPageLoading } from '../../utils/loading'
import { request, showRequestError } from '../../utils/request'
import { WECHAT_OPEN_ID_LOGIN_ENABLED } from '../../../api.config'

export default {
  data() {
    return {
      form: {
        phone: '',
        password: ''
      },
      passwordVisible: false
    }
  },
  onLoad() {
    clearRememberedLogin()
  },
  onShow() {
    hidePageLoading()
  },
  methods: {
    togglePasswordVisible() {
      this.passwordVisible = !this.passwordVisible
    },
    copyWechat() {
      uni.setClipboardData({
        data: 'boss-wechat',
        success: () => {
          uni.showToast({ title: '微信号已复制', icon: 'success' })
        }
      })
    },
    async login() {
      try {
        const wechatCode = await this.getWechatCode()
        const data = await request({
          url: '/auth/user/login',
          method: 'POST',
          data: { ...this.form, wechatCode },
          auth: false
        })
        exitGuest()
        saveProfile(data)
        if (data.mustChangePassword) {
          clearRememberedLogin()
          uni.showToast({ title: '请先修改临时密码', icon: 'none' })
          uni.reLaunch({ url: '/src/pages/password/index' })
          return
        }
        clearRememberedLogin()
        uni.showToast({ title: '登录成功', icon: 'success' })
        showPageLoading()
        uni.reLaunch({ url: '/src/pages/mall/index' })
      } catch (error) {
        showRequestError(error, '登录失败')
      }
    },
    getWechatCode() {
      if (!WECHAT_OPEN_ID_LOGIN_ENABLED || typeof wx === 'undefined') {
        return Promise.resolve('')
      }
      return new Promise((resolve) => {
        wx.login({
          success: (result) => resolve(result.code || ''),
          fail: () => resolve('')
        })
      })
    },
    guestBrowse() {
      enterGuest()
      hidePageLoading()
      uni.reLaunch({ url: '/src/pages/mall/index' })
    }
  }
}
</script>

<template>
  <view class="page-shell">
    <view class="card">
      <view class="section-title">积分商城登录</view>
      <view class="sub-title">使用手机号和密码登录，登录后即可浏览并兑换商品。</view>
      <view class="password-tip">临时密码首次登录后必须修改。新密码为 6-18 位，仅支持数字和英文字母。</view>

      <input v-model="form.phone" class="input" placeholder="请输入手机号" />
      <view class="password-row">
        <input
          v-model="form.password"
          class="input password-input"
          :password="!passwordVisible"
          placeholder="请输入密码"
        />
        <button
          class="password-toggle"
          :aria-label="passwordVisible ? '隐藏密码' : '显示密码'"
          @click="togglePasswordVisible"
        >
          <view class="eye-icon" :class="{ closed: !passwordVisible }">
            <view class="eye-pupil"></view>
          </view>
        </button>
      </view>

      <button class="primary-btn small-btn" @click="login">登录</button>
      <button class="ghost-btn small-btn" @click="guestBrowse">游客身份，仅浏览商品</button>

      <view class="support-box">
        <text>管理员微信：boss-wechat</text>
        <button class="copy-btn" @click="copyWechat">点击复制微信号</button>
      </view>
    </view>
  </view>
</template>

<style scoped>
.sub-title {
  color: #64748b;
  font-size: 22rpx;
  line-height: 1.7;
  margin-bottom: 20rpx;
}

.password-tip {
  margin: -6rpx 0 20rpx;
  color: #b45309;
  font-size: 20rpx;
  line-height: 1.6;
}

.input {
  height: 72rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 0 18rpx;
  margin-bottom: 14rpx;
  font-size: 24rpx;
}

.password-row {
  position: relative;
}

.password-input {
  padding-right: 90rpx;
  box-sizing: border-box;
  width: 100%;
}

.password-toggle {
  position: absolute;
  top: 0;
  right: 18rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  width: 58rpx;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
}

.password-toggle::after {
  border: none;
}

.eye-icon {
  position: relative;
  width: 34rpx;
  height: 22rpx;
  border: 3rpx solid #2563eb;
  border-radius: 50%;
  box-sizing: border-box;
}

.eye-pupil {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 9rpx;
  height: 9rpx;
  border-radius: 50%;
  background: #2563eb;
  transform: translate(-50%, -50%);
}

.eye-icon.closed::after {
  content: '';
  position: absolute;
  top: 8rpx;
  left: -5rpx;
  width: 40rpx;
  height: 3rpx;
  border-radius: 999rpx;
  background: #2563eb;
  transform: rotate(38deg);
}

.small-btn {
  width: 66%;
  margin: 10rpx auto 0;
  border-radius: 999rpx;
  height: 62rpx;
  line-height: 62rpx;
  font-size: 22rpx;
}

.primary-btn {
  background: #2563eb;
  color: #fff;
}

.ghost-btn {
  background: #e2e8f0;
  color: #0f172a;
}

.support-box {
  margin-top: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  color: #475569;
  font-size: 22rpx;
}

.copy-btn {
  min-width: 168rpx;
  height: 52rpx;
  line-height: 52rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 20rpx;
  border: none;
}

.copy-btn::after {
  border: none;
}
</style>
