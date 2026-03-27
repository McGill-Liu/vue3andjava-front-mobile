<script>
import { getProfile } from '../../utils/auth'
import { request } from '../../utils/request'

export default {
  data() {
    return {
      form: {
        phone: '',
        idCardNo: '',
        oldPassword: '',
        newPassword: ''
      }
    }
  },
  onShow() {
    const profile = getProfile() || {}
    this.form.phone = profile.phone || ''
  },
  methods: {
    async submit() {
      try {
        await request({ url: '/auth/change-password', method: 'POST', data: this.form })
        uni.showToast({ title: '修改成功', icon: 'success' })
        this.form.idCardNo = ''
        this.form.oldPassword = ''
        this.form.newPassword = ''
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
      <view class="helper-text">请填写原密码、手机号和身份证号，再设置新的登录密码。</view>
      <input v-model="form.phone" class="input" placeholder="手机号" />
      <input v-model="form.idCardNo" class="input" placeholder="身份证号" />
      <input v-model="form.oldPassword" class="input" password placeholder="原密码" />
      <input v-model="form.newPassword" class="input" password placeholder="新密码" />
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
  background: #2563eb;
  color: #fff;
  font-size: 24rpx;
}
</style>
