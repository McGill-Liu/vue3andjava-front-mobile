<script>
import { request, showRequestError } from '../../utils/request'
import { clearProfile, clearRememberedLogin } from '../../utils/auth'

export default {
  data() {
    return {
      form: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      passwordVisible: {
        old: false,
        next: false,
        confirm: false
      }
    }
  },
  methods: {
    togglePasswordVisible(field) {
      this.passwordVisible[field] = !this.passwordVisible[field]
    },
    async submit() {
      try {
        if (!/^[A-Za-z0-9]{6,18}$/.test(this.form.newPassword)) {
          uni.showToast({ title: '新密码为 6-18 位，仅支持数字和英文字母', icon: 'none' })
          return
        }
        if (this.form.newPassword !== this.form.confirmPassword) {
          uni.showToast({ title: '两次输入的新密码不一致', icon: 'none' })
          return
        }
        await request({
          url: '/auth/change-password',
          method: 'POST',
          data: {
            oldPassword: this.form.oldPassword,
            newPassword: this.form.newPassword
          }
        })
        clearRememberedLogin()
        clearProfile()
        uni.showToast({ title: '密码已修改，请重新登录', icon: 'success' })
        setTimeout(() => uni.reLaunch({ url: '/src/pages/login/index' }), 1200)
      } catch (error) {
        showRequestError(error, '修改密码失败')
      }
    }
  }
}
</script>

<template>
  <view class="page-shell">
    <view class="card">
      <view class="section-title">修改密码</view>
      <view class="helper-text">首次登录请在“原密码”中输入管理员告知的临时密码。新密码为 6-18 位，可只用数字、只用字母，或数字和字母组合。</view>
      <view class="password-row">
        <input v-model="form.oldPassword" class="input password-input" :password="!passwordVisible.old" placeholder="原密码（首次登录请填临时密码）" />
        <button class="password-toggle" @click="togglePasswordVisible('old')">{{ passwordVisible.old ? '隐藏' : '显示' }}</button>
      </view>
      <view class="password-row">
        <input v-model="form.newPassword" class="input password-input" :password="!passwordVisible.next" placeholder="新密码" />
        <button class="password-toggle" @click="togglePasswordVisible('next')">{{ passwordVisible.next ? '隐藏' : '显示' }}</button>
      </view>
      <view class="password-row">
        <input v-model="form.confirmPassword" class="input password-input" :password="!passwordVisible.confirm" placeholder="确认新密码" />
        <button class="password-toggle" @click="togglePasswordVisible('confirm')">{{ passwordVisible.confirm ? '隐藏' : '显示' }}</button>
      </view>
      <button class="primary-btn" @click="submit">确认修改</button>
    </view>
  </view>
</template>

<style scoped>
.helper-text {
  color: #64748b;
  font-size: 22rpx;
  line-height: 1.7;
  margin-bottom: 16rpx;
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
  width: 100%;
  box-sizing: border-box;
  padding-right: 90rpx;
}

.password-toggle {
  position: absolute;
  top: 0;
  right: 18rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  color: #2563eb;
  font-size: 22rpx;
  padding: 0;
  border: none;
  background: transparent;
}

.primary-btn {
  margin-top: 8rpx;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
  font-size: 24rpx;
}
</style>
