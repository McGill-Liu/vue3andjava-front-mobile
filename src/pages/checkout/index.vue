<script>
import { clearCart, getCart } from '../../utils/cart'
import { request } from '../../utils/request'

export default {
  data() {
    return {
      cartItems: [],
      addresses: [],
      selectedAddressId: null
    }
  },
  computed: {
    total() {
      return this.cartItems.reduce((sum, item) => sum + item.pointsCost * item.quantity, 0)
    }
  },
  onShow() {
    this.load()
  },
  methods: {
    async load() {
      this.cartItems = getCart()
      this.addresses = await request({ url: '/addresses' })
      const defaultAddress = this.addresses.find((item) => item.defaultAddress)
      this.selectedAddressId = defaultAddress ? defaultAddress.id : (this.addresses[0] ? this.addresses[0].id : null)
    },
    async submit() {
      try {
        await request({
          url: '/orders/checkout',
          method: 'POST',
          data: {
            addressId: this.selectedAddressId,
            items: this.cartItems.map((item) => ({ productId: item.productId, quantity: item.quantity }))
          }
        })
        clearCart()
        uni.showModal({
          title: '下单成功',
          content: '积分已扣减，管理员会收到待发货和同步积分通知。',
          showCancel: false,
          success: () => uni.reLaunch({ url: '/src/pages/orders/index' })
        })
      } catch (error) {
        uni.showToast({ title: error.message, icon: 'none' })
      }
    },
    goAddress() {
      uni.reLaunch({ url: '/src/pages/address/index' })
    },
    onAddressChange(event) {
      this.selectedAddressId = Number(event.detail.value)
    }
  }
}
</script>

<template>
  <view class="page-shell">
    <view class="card">
      <view class="section-title">选择收货地址</view>
      <view v-if="!addresses.length" class="empty-box">
        暂无地址，请先维护地址。
        <button class="ghost-btn" @click="goAddress">去维护地址</button>
      </view>
      <radio-group v-else @change="onAddressChange">
        <label v-for="item in addresses" :key="item.id" class="address-item">
          <radio :value="String(item.id)" :checked="selectedAddressId === item.id" />
          <view class="address-text">
            <view>{{ item.recipientName }} {{ item.recipientPhone }}</view>
            <view>{{ item.detailAddress }}</view>
          </view>
        </label>
      </radio-group>
    </view>
    <view class="card">
      <view class="section-title">商品清单</view>
      <view v-for="item in cartItems" :key="item.productId" class="line-item">
        <text>{{ item.name }} x {{ item.quantity }}</text>
        <text>{{ item.pointsCost * item.quantity }} 积分</text>
      </view>
      <view class="total-row">合计：{{ total }} 积分</view>
      <button class="primary-btn" @click="submit">提交订单</button>
    </view>
  </view>
</template>

<style scoped>
.address-item {
  display: flex;
  gap: 12rpx;
  margin-bottom: 14rpx;
}

.address-text {
  color: #334155;
  line-height: 1.7;
  font-size: 22rpx;
}

.empty-box {
  color: #64748b;
  line-height: 1.8;
  font-size: 22rpx;
}

.ghost-btn,
.primary-btn {
  margin-top: 14rpx;
  border-radius: 999rpx;
  height: 68rpx;
  line-height: 68rpx;
  font-size: 24rpx;
}

.ghost-btn {
  background: #e2e8f0;
  color: #0f172a;
}

.primary-btn {
  background: #2563eb;
  color: #fff;
}

.line-item,
.total-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
  font-size: 22rpx;
}

.total-row {
  font-weight: 700;
  margin-top: 14rpx;
}
</style>
