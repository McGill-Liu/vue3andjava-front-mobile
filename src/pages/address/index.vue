<script>
import { isGuest } from '../../utils/auth'
import { hidePageLoading, showPageLoading } from '../../utils/loading'
import { request } from '../../utils/request'

function emptyForm() {
  return {
    recipientName: '',
    recipientPhone: '',
    detailAddress: '',
    defaultAddress: true
  }
}

export default {
  data() {
    return {
      rows: [],
      editingId: null,
      showForm: false,
      form: emptyForm(),
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
    this.load()
  },
  methods: {
    async load() {
      this.rows = await request({ url: '/addresses' })
    },
    tabDisabled(item) {
      return isGuest() && item.key !== 'mall'
    },
    goTab(item) {
      if (this.tabDisabled(item) || item.key === 'address') {
        return
      }
      showPageLoading()
      uni.reLaunch({ url: item.url })
    },
    startCreate() {
      this.editingId = null
      this.form = emptyForm()
      this.showForm = true
    },
    startEdit(item) {
      this.editingId = item.id
      this.form = {
        recipientName: item.recipientName,
        recipientPhone: item.recipientPhone,
        detailAddress: item.detailAddress,
        defaultAddress: item.defaultAddress
      }
      this.showForm = true
    },
    cancelEdit() {
      this.editingId = null
      this.form = emptyForm()
      this.showForm = false
    },
    async save() {
      if (this.editingId) {
        await request({ url: `/addresses/${this.editingId}`, method: 'PUT', data: this.form })
      } else {
        await request({ url: '/addresses', method: 'POST', data: this.form })
      }
      uni.showToast({ title: '地址已保存', icon: 'success' })
      this.cancelEdit()
      this.load()
    },
    async remove(item) {
      uni.showModal({
        title: '删除地址',
        content: '确认删除这条地址吗？',
        success: async (res) => {
          if (!res.confirm) return
          await request({ url: `/addresses/${item.id}`, method: 'DELETE' })
          uni.showToast({ title: '已删除', icon: 'success' })
          this.load()
        }
      })
    },
    async setDefault(item) {
      await request({
        url: `/addresses/${item.id}`,
        method: 'PUT',
        data: {
          recipientName: item.recipientName,
          recipientPhone: item.recipientPhone,
          detailAddress: item.detailAddress,
          defaultAddress: true
        }
      })
      uni.showToast({ title: '已设为默认地址', icon: 'success' })
      this.load()
    }
  }
}
</script>

<template>
  <view class="page-shell">
    <view class="card header-card">
      <view>
        <view class="section-title">地址管理</view>
        <view class="sub-title">维护收货信息，下单时会优先使用默认地址。</view>
      </view>
      <button class="mini-primary" @click="startCreate">新增地址</button>
    </view>

    <view v-if="showForm" class="card form-card">
      <view class="form-title">{{ editingId ? '编辑地址' : '新增地址' }}</view>
      <input v-model="form.recipientName" class="input" placeholder="姓名" />
      <input v-model="form.recipientPhone" class="input" placeholder="手机号" />
      <input v-model="form.detailAddress" class="input" placeholder="详细地址" />
      <label class="default-row">
        <checkbox :checked="form.defaultAddress" @click="form.defaultAddress = !form.defaultAddress" />
        <text>设为默认地址</text>
      </label>
      <view class="btn-row">
        <button class="line-btn" @click="cancelEdit">取消</button>
        <button class="primary-btn" @click="save">保存</button>
      </view>
    </view>

    <view v-if="!rows.length" class="card empty-card">还没有地址，先新增一条吧</view>

    <view v-for="item in rows" :key="item.id" class="card address-card">
      <view class="address-top">
        <view class="address-user">{{ item.recipientName }} {{ item.recipientPhone }}</view>
        <view v-if="item.defaultAddress" class="default-badge">默认</view>
      </view>
      <view class="address-text">{{ item.detailAddress }}</view>
      <view class="action-row">
        <button class="small-btn" @click="startEdit(item)">修改</button>
        <button class="small-btn" @click="remove(item)">删除</button>
        <button class="small-btn primary" @click="setDefault(item)">设为默认</button>
      </view>
    </view>

    <view class="tabbar-shell">
      <view
        v-for="item in tabItems"
        :key="item.key"
        class="tab-item"
        :class="{ active: item.key === 'address', disabled: tabDisabled(item) }"
        @click="goTab(item)"
      >
        <text class="tab-text">{{ item.label }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.sub-title {
  color: #64748b;
  font-size: 22rpx;
  line-height: 1.6;
}

.mini-primary {
  min-width: 148rpx;
  height: 64rpx;
  line-height: 64rpx;
  border-radius: 16rpx;
  background: #2563eb;
  color: #fff;
  font-size: 22rpx;
}

.form-card,
.address-card,
.empty-card {
  margin-bottom: 12rpx;
}

.form-title {
  font-size: 24rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
}

.input {
  height: 72rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 0 18rpx;
  margin-bottom: 12rpx;
  font-size: 24rpx;
}

.default-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
  color: #475569;
  margin-bottom: 12rpx;
}

.btn-row,
.action-row {
  display: flex;
  gap: 10rpx;
}

.line-btn,
.primary-btn,
.small-btn {
  flex: 1;
  border-radius: 16rpx;
  font-size: 22rpx;
}

.line-btn,
.primary-btn {
  height: 68rpx;
  line-height: 68rpx;
}

.line-btn,
.small-btn {
  background: #e2e8f0;
  color: #0f172a;
}

.primary-btn,
.small-btn.primary {
  background: #2563eb;
  color: #fff;
}

.small-btn {
  height: 56rpx;
  line-height: 56rpx;
  font-size: 20rpx;
  padding: 0 14rpx;
}

.address-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.address-user {
  font-size: 24rpx;
  font-weight: 700;
}

.default-badge {
  background: #2563eb;
  color: #fff;
  font-size: 20rpx;
  font-weight: 700;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  box-shadow: 0 6rpx 16rpx rgba(37, 99, 235, 0.18);
}

.address-text {
  color: #475569;
  font-size: 22rpx;
  line-height: 1.7;
  margin-bottom: 12rpx;
}

.empty-card {
  text-align: center;
  color: #64748b;
  font-size: 24rpx;
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
