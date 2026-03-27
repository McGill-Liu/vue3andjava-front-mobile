<script>
import { request } from '../../utils/request'

export default {
  data() {
    return {
      form: {
        name: '',
        phone: '',
        idCardNo: '',
        password: '',
        confirmPassword: ''
      }
    }
  },
  methods: {
    async submit() {
      if (this.form.password !== this.form.confirmPassword) {
        uni.showToast({ title: '两次密码不一致', icon: 'none' })
        return
      }
      try {
        await request({ url: '/auth/user/register', method: 'POST', data: this.form, auth: false })
        uni.showModal({
          title: '注册成功',
          content: '账号已提交，等待超级管理员审核。审核通过后即可登录使用。',
          showCancel: false,
          success: () => uni.navigateBack()
        })
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
      <view class="section-title">注册账号</view>
      <input v-model="form.name" class="input" placeholder="姓名" />
      <input v-model="form.phone" class="input" placeholder="手机号" />
      <input v-model="form.idCardNo" class="input" placeholder="身份证号" />
      <input v-model="form.password" class="input" password placeholder="设置密码" />
      <input v-model="form.confirmPassword" class="input" password placeholder="确认密码" />
      <button class="primary-btn" @click="submit">提交注册</button>
    </view>
  </view>
</template>

<style scoped>
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
  border-radius: 999rpx;
  height: 72rpx;
  line-height: 72rpx;
  background: #2563eb;
  color: #fff;
  font-size: 24rpx;
}
</style>
