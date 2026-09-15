<script>
import { isGuest } from '../../utils/auth'
import { hidePageLoading, showPageLoading } from '../../utils/loading'
import { request, showRequestError } from '../../utils/request'

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
      addressRenderVersion: 0,
      editingId: null,
      editingDefaultAddress: false,
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
  computed: {
    defaultSelectionLocked() {
      return this.editingDefaultAddress || (!this.editingId && this.rows.length === 0)
    },
    defaultSelectionText() {
      if (this.editingDefaultAddress) return '当前默认地址，如需更换请将其他地址设为默认'
      if (!this.editingId && this.rows.length === 0) return '第一条地址将自动设为默认'
      return '设为默认地址'
    }
  },
  onShow() {
    hidePageLoading()
    this.load()
  },
  methods: {
    async load() {
      try {
        const rows = await request({ url: '/addresses' })
        this.addressRenderVersion += 1
        this.rows = rows.map((item) => ({
          ...item,
          renderKey: `${this.addressRenderVersion}-${item.id}`
        }))
      } catch (error) {
        showRequestError(error, '地址加载失败')
      }
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
      this.editingDefaultAddress = false
      this.form = emptyForm()
      this.showForm = true
    },
    startEdit(item) {
      this.editingId = item.id
      this.editingDefaultAddress = item.defaultAddress
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
      this.editingDefaultAddress = false
      this.form = emptyForm()
      this.showForm = false
    },
    async save() {
      if (!this.form.recipientName.trim() || !this.form.recipientPhone.trim() || !this.form.detailAddress.trim()) {
        uni.showToast({ title: '请完整填写姓名、手机号和详细地址', icon: 'none' })
        return
      }
      try {
        if (this.editingId) {
          await request({ url: `/addresses/${this.editingId}`, method: 'PUT', data: this.form })
        } else {
          await request({ url: '/addresses', method: 'POST', data: this.form })
        }
        this.cancelEdit()
        await this.load()
        uni.showToast({ title: '地址已保存', icon: 'success' })
      } catch (error) {
        showRequestError(error, '地址保存失败')
      }
    },
    async remove(item) {
      uni.showModal({
        title: '删除地址',
        content: item.defaultAddress
          ? (this.rows.length > 1
              ? '这是当前默认地址。删除后，系统会自动将下一条地址设为新的默认地址。确认删除吗？'
              : '这是当前唯一地址。删除后将没有可用的收货地址，确认删除吗？')
          : '确认删除这条地址吗？',
        success: async (res) => {
          if (!res.confirm) return
          try {
            await request({ url: `/addresses/${item.id}`, method: 'DELETE' })
            await this.load()
            uni.showToast({
              title: item.defaultAddress && this.rows.length ? '已设置新的默认地址' : '已删除',
              icon: 'success'
            })
          } catch (error) {
            showRequestError(error, '删除地址失败')
          }
        }
      })
    },
    async setDefault(item) {
      if (item.defaultAddress) return
      try {
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
        await this.load()
        uni.showToast({ title: '已设为默认地址', icon: 'success' })
      } catch (error) {
        showRequestError(error, '设置默认地址失败')
      }
    },
    toggleDefaultSelection() {
      if (this.defaultSelectionLocked) return
      this.form.defaultAddress = !this.form.defaultAddress
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

    <view v-if="showForm" class="modal-mask" @touchmove.stop.prevent>
      <view class="card address-modal" @click.stop>
        <view class="form-title">{{ editingId ? '编辑地址' : '新增地址' }}</view>
        <input v-model="form.recipientName" class="input" placeholder="姓名" />
        <input v-model="form.recipientPhone" class="input" placeholder="手机号" />
        <input v-model="form.detailAddress" class="input" placeholder="详细地址" />
        <view class="address-tip">请填写省、市、区（县）、街道、小区、门牌号等完整收货地址。</view>
        <label class="default-row" :class="{ locked: defaultSelectionLocked }">
          <checkbox
            :checked="form.defaultAddress"
            :disabled="defaultSelectionLocked"
            @click="toggleDefaultSelection"
          />
          <text>{{ defaultSelectionText }}</text>
        </label>
        <view class="btn-row">
          <button class="line-btn" @click="cancelEdit">取消</button>
          <button class="primary-btn" @click="save">保存</button>
        </view>
      </view>
    </view>

    <view v-if="!rows.length" class="card empty-card">还没有地址，先新增一条吧</view>

    <view
      v-for="item in rows"
      :key="item.renderKey"
      class="card address-card"
      :class="{ 'address-card-default': item.defaultAddress }"
    >
      <view class="address-top">
        <view class="address-user">{{ item.recipientName }} {{ item.recipientPhone }}</view>
        <view v-if="item.defaultAddress" class="default-badge">默认</view>
      </view>
      <view class="address-text">{{ item.detailAddress }}</view>
      <view class="action-row">
        <button class="small-btn" @click="startEdit(item)">修改</button>
        <button class="small-btn" @click="remove(item)">删除</button>
        <button v-if="!item.defaultAddress" class="small-btn primary" @click="setDefault(item)">设为默认</button>
        <button v-else class="small-btn current-default" disabled>当前默认</button>
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

.address-card,
.empty-card {
  margin-bottom: 12rpx;
}

.address-card {
  border: 2rpx solid rgba(148, 163, 184, 0.16);
}

.address-card-default {
  background: #f5f9ff;
  border-color: #93c5fd;
  box-shadow: 0 14rpx 34rpx rgba(37, 99, 235, 0.14);
}

.modal-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx;
  box-sizing: border-box;
  background: rgba(15, 23, 42, 0.48);
}

.address-modal {
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-sizing: border-box;
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

.address-tip {
  margin: -2rpx 0 14rpx;
  color: #dc2626;
  font-size: 20rpx;
  line-height: 1.6;
}

.default-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 22rpx;
  color: #475569;
  margin-bottom: 12rpx;
}

.default-row.locked {
  color: #1d4ed8;
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

.small-btn.current-default[disabled] {
  opacity: 1;
  background: #dbeafe;
  color: #1d4ed8;
  border: 1rpx solid #bfdbfe;
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
  height: 118rpx;
  padding: 14rpx 14rpx 24rpx;
  box-sizing: border-box;
  background: #ffffff;
  border-top: 1rpx solid #e2e8f0;
}

.tab-item {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 68rpx;
  margin: 0 6rpx;
  border-radius: 999rpx;
}

.tab-item.active {
  background: #2563eb;
}

.tab-item.disabled {
  background: #f1f5f9;
}

.tab-text {
  font-size: 24rpx;
  color: #64748b;
  font-weight: 700;
}

.tab-item.active .tab-text {
  color: #ffffff;
}

.tab-item.disabled .tab-text {
  color: #cbd5e1;
}
</style>
