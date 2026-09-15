<script>
import { getSelectedCartItems, removeCartItems } from '../../utils/cart'
import { getProfile, updatePointsBalance } from '../../utils/auth'
import { request, showRequestError } from '../../utils/request'

function createCheckoutToken() {
  const randomPart = Math.random().toString(36).slice(2)
  return `checkout_${Date.now().toString(36)}_${randomPart}`
}

export default {
  data() {
    return {
      cartItems: [],
      addresses: [],
      selectedAddressId: null,
      pointsBalance: 0,
      submitting: false,
      checkoutToken: createCheckoutToken()
    }
  },
  computed: {
    total() {
      return this.cartItems.reduce((sum, item) => sum + item.pointsCost * item.quantity, 0)
    },
    balanceAfter() {
      return this.pointsBalance - this.total
    }
  },
  onShow() {
    this.load()
  },
  methods: {
    async load() {
      this.cartItems = getSelectedCartItems()
      this.pointsBalance = Number(getProfile()?.pointsBalance || 0)
      try {
        this.addresses = await request({ url: '/addresses' })
      } catch (error) {
        showRequestError(error, '订单信息加载失败')
        return
      }
      try {
        this.pointsBalance = Number(await request({ url: '/points/balance' }))
        updatePointsBalance(this.pointsBalance)
      } catch (error) {
        // 地址仍可正常选择；提交前会再次强制获取最新积分，失败时不会创建订单。
        showRequestError(error, '积分刷新失败')
      }
      const defaultAddress = this.addresses.find((item) => item.defaultAddress)
      this.selectedAddressId = defaultAddress ? defaultAddress.id : (this.addresses[0] ? this.addresses[0].id : null)
    },
    async submit() {
      if (this.submitting) return
      if (!this.cartItems.length || !this.selectedAddressId) {
        uni.showToast({ title: this.cartItems.length ? '请选择收货地址' : '购物车为空', icon: 'none' })
        return
      }
      this.submitting = true
      try {
        this.pointsBalance = Number(await request({ url: '/points/balance' }))
        updatePointsBalance(this.pointsBalance)
        if (this.balanceAfter < 0) {
          uni.showToast({ title: `积分不足，还差 ${Math.abs(this.balanceAfter)} 积分`, icon: 'none' })
          return
        }
        const confirmed = await new Promise((resolve) => {
          uni.showModal({
            title: '确认提交订单',
            content: `本次花费：${this.total} 积分\n当前积分：${this.pointsBalance}\n提交后剩余：${this.balanceAfter} 积分\n\n确认提交订单吗？`,
            confirmText: '确认提交',
            success: (result) => resolve(result.confirm),
            fail: () => resolve(false)
          })
        })
        if (!confirmed) return
        const order = await request({
          url: '/orders/checkout',
          method: 'POST',
          data: {
            checkoutToken: this.checkoutToken,
            addressId: this.selectedAddressId,
            expectedTotalPoints: this.total,
            expectedBalanceBefore: this.pointsBalance,
            items: this.cartItems.map((item) => ({ productId: item.productId, quantity: item.quantity }))
          }
        })
        updatePointsBalance(order.balanceAfter)
        removeCartItems(this.cartItems.map((item) => item.productId))
        uni.showModal({
          title: '温馨提示',
          content: '下单成功，7个工作日内发货，订单后续物流信息请在订单页面查询。',
          showCancel: false,
          success: () => uni.reLaunch({ url: '/src/pages/orders/index' })
        })
      } catch (error) {
        showRequestError(error, '提交订单失败')
      } finally {
        this.submitting = false
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
      <view class="section-title">请确认下单商品</view>
      <view v-for="item in cartItems" :key="item.productId" class="line-item">
        <view>
          <view>{{ item.name }} x {{ item.quantity }}</view>
          <view class="limit-summary">
            每单限购：{{ item.perOrderLimit == null ? '不限购' : `${item.perOrderLimit} 件` }}；
            累计限购：{{ item.customerTotalLimit == null ? '不限购' : `${item.customerTotalLimit} 件，已购 ${item.purchasedQuantity} 件` }}
          </view>
        </view>
        <text>{{ item.pointsCost * item.quantity }} 积分</text>
      </view>
      <view class="total-row">合计：{{ total }} 积分</view>
      <view class="balance-row"><text>目前积分余额</text><text>{{ pointsBalance }} 积分</text></view>
      <view class="balance-row" :class="{ insufficient: balanceAfter < 0 }">
        <text>提交后剩余积分</text><text>{{ balanceAfter }} 积分</text>
      </view>
      <button class="primary-btn" :disabled="submitting" @click="submit">{{ submitting ? '提交中...' : '已确定下单商品无误，点此提交订单' }}</button>
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

.limit-summary {
  margin-top: 5rpx;
  color: #64748b;
  font-size: 19rpx;
}

.total-row {
  font-weight: 700;
  margin-top: 14rpx;
}

.balance-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10rpx;
  color: #475569;
  font-size: 22rpx;
}

.balance-row.insufficient {
  color: #dc2626;
}
</style>
