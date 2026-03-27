<script>
import {
  enterGuest,
  exitGuest,
  saveProfile,
  saveRememberedLogin,
  getRememberedLogin,
  clearRememberedLogin
} from '../../utils/auth'
import { hidePageLoading, showPageLoading } from '../../utils/loading'
import { request } from '../../utils/request'

export default {
  data() {
    return {
      form: {
        phone: '',
        password: ''
      },
      rememberPassword: false
    }
  },
  onShow() {
    hidePageLoading()
    const saved = getRememberedLogin()
    if (saved) {
      this.form.phone = saved.phone || ''
      this.form.password = saved.password || ''
      this.rememberPassword = true
    }
  },
  methods: {
    toggleRemember() {
      this.rememberPassword = !this.rememberPassword
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
        const data = await request({
          url: '/auth/user/login',
          method: 'POST',
          data: this.form,
          auth: false
        })
        exitGuest()
        saveProfile(data)
        if (this.rememberPassword) {
          saveRememberedLogin({ phone: this.form.phone, password: this.form.password })
        } else {
          clearRememberedLogin()
        }
        uni.showToast({ title: '登录成功', icon: 'success' })
        showPageLoading()
        uni.reLaunch({ url: '/src/pages/mall/index' })
      } catch (error) {
        uni.showToast({ title: error.message, icon: 'none' })
      }
    },
    goRegister() {
      uni.navigateTo({ url: '/src/pages/register/index' })
    },
    guestBrowse() {
      enterGuest()
      showPageLoading()
      uni.reLaunch({ url: '/src/pages/mall/index' })
    }
  }
}
</script>

<template>
  <view class="page-shell">
    <view class="card">
      <view class="section-title">积分商城登录</view>
      <view class="sub-title">使用手机号和密码登录，审核通过后即可浏览并兑换商品。</view>

      <input v-model="form.phone" class="input" placeholder="请输入手机号" />
      <input v-model="form.password" class="input" password placeholder="请输入密码" />

      <view class="remember-row" @click="toggleRemember">
        <view class="remember-dot" :class="{ checked: rememberPassword }"></view>
        <text>保存密码</text>
      </view>

      <button class="primary-btn small-btn" @click="login">登录</button>
      <button class="ghost-btn small-btn" @click="goRegister">注册</button>
      <button class="ghost-btn small-btn" @click="guestBrowse">游客浏览</button>

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

.input {
  height: 72rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 0 18rpx;
  margin-bottom: 14rpx;
  font-size: 24rpx;
}

.remember-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  color: #475569;
  font-size: 22rpx;
  margin-bottom: 12rpx;
}

.remember-dot {
  width: 26rpx;
  height: 26rpx;
  border: 2rpx solid #cbd5e1;
  border-radius: 50%;
  background: #ffffff;
  box-sizing: border-box;
}

.remember-dot.checked {
  border-color: #2563eb;
  background: radial-gradient(circle at center, #2563eb 0 45%, #ffffff 46%);
}

.small-btn {
  width: 74%;
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
}
</style>
