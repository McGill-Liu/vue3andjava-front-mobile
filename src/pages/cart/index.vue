<script>
import { getCart, updateCart } from '../../utils/cart'
import { isGuest } from '../../utils/auth'
import { hidePageLoading, showPageLoading } from '../../utils/loading'

export default {
  data() {
    return {
      items: [],
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
    total() {
      return this.items.reduce((sum, item) => sum + item.pointsCost * item.quantity, 0)
    }
  },
  onShow() {
    hidePageLoading()
    this.load()
  },
  methods: {
    load() {
      this.items = getCart()
    },
    tabDisabled(item) {
      return isGuest() && item.key !== 'mall'
    },
    goTab(item) {
      if (this.tabDisabled(item) || item.key === 'cart') {
        return
      }
      showPageLoading()
      uni.reLaunch({ url: item.url })
    },
    change(item, delta) {
      this.items = updateCart(item.productId, item.quantity + delta)
    },
    checkout() {
      if (!this.items.length) {
        uni.showToast({ title: '购物车为空', icon: 'none' })
        return
      }
      uni.navigateTo({ url: '/src/pages/checkout/index' })
    }
  }
}
</script>

<template>
  <view class="page-shell">
    <view v-if="!items.length" class="card empty-box">购物车还是空的，先去挑选商品吧</view>

    <view v-for="item in items" :key="item.productId" class="card item-card">
      <view class="row between">
        <view class="item-main">
          <view class="name">{{ item.name }}</view>
          <view class="price">{{ item.pointsCost }} 积分</view>
        </view>
        <view class="stepper">
          <button size="mini" class="step-btn minus" @click="change(item, -1)">-</button>
          <text class="qty-text">{{ item.quantity }}</text>
          <button size="mini" class="step-btn plus" @click="change(item, 1)">+</button>
        </view>
      </view>
    </view>

    <view class="card footer">
      <view class="total-text">合计 {{ total }} 积分</view>
      <button class="primary-btn" @click="checkout">去下单</button>
    </view>

    <view class="tabbar-shell">
      <view
        v-for="item in tabItems"
        :key="item.key"
        class="tab-item"
        :class="{ active: item.key === 'cart', disabled: tabDisabled(item) }"
        @click="goTab(item)"
      >
        <text class="tab-text">{{ item.label }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
}

.between {
  justify-content: space-between;
}

.item-main {
  min-width: 0;
}

.name {
  font-size: 24rpx;
  font-weight: 700;
  margin-bottom: 6rpx;
}

.price {
  color: #2563eb;
  font-size: 22rpx;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.step-btn {
  width: 46rpx;
  min-width: 46rpx;
  height: 46rpx;
  line-height: 46rpx;
  padding: 0;
  text-align: center;
  border-radius: 50%;
  font-size: 22rpx;
}

.step-btn.minus {
  background: #e2e8f0;
  color: #0f172a;
}

.step-btn.plus {
  background: #2563eb;
  color: #fff;
}

.qty-text {
  min-width: 44rpx;
  text-align: center;
  font-size: 22rpx;
  color: #0f172a;
  font-weight: 700;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 14rpx;
}

.total-text {
  font-size: 24rpx;
  font-weight: 700;
}

.primary-btn {
  height: 68rpx;
  line-height: 68rpx;
  border-radius: 999rpx;
  background: #2563eb;
  color: #fff;
  font-size: 24rpx;
}

.empty-box {
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
