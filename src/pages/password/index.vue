<script>
import { request } from '../../utils/request'

export default {
  data() {
    return {
      form: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    }
  },
  methods: {
    async submit() {
      try {
        if (!/^[A-Za-z0-9]{6,}$/.test(this.form.newPassword)) {
          uni.showToast({ title: '新密码至少 6 位，仅支持数字和英文字母', icon: 'none' })
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
        uni.showToast({ title: '修改成功', icon: 'success' })
        this.form.oldPassword = ''
        this.form.newPassword = ''
        this.form.confirmPassword = ''
      } catch (error) {
        uni.showToast({ title: error.message, icon: 'none' })
      }
    }
  }
}
</script>

<template>
  <view class="page-shell">
    <view class="card">
      <view class="section-title">修改密码</view>
      <view class="helper-text">请输入原密码，并连续输入两次新密码。新密码至少 6 位，仅支持数字和英文字母。</view>
      <input v-model="form.oldPassword" class="input" password placeholder="原密码" />
      <input v-model="form.newPassword" class="input" password placeholder="新密码" />
      <input v-model="form.confirmPassword" class="input" password placeholder="确认新密码" />
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
