<script>
import { isGuest } from '../../utils/auth'
import { hidePageLoading, showPageLoading } from '../../utils/loading'
import { request } from '../../utils/request'

export default {
  data() {
    return {
      orders: [],
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
      this.orders = await request({ url: '/orders' })
    },
    tabDisabled(item) {
      return isGuest() && item.key !== 'mall'
    },
    goTab(item) {
      if (this.tabDisabled(item) || item.key === 'orders') {
        return
      }
      showPageLoading()
      uni.reLaunch({ url: item.url })
    },
    async confirmOrder(id) {
      await request({ url: `/orders/${id}/confirm`, method: 'POST' })
      uni.showToast({ title: '已确认收货', icon: 'success' })
      this.load()
    },
    statusText(status) {
      const map = {
        PENDING_SHIPMENT: '待发货',
        SHIPPED: '已发货',
        COMPLETED: '已完成',
        CANCELLED: '已取消'
      }
      return map[status] || status
    }
  }
}
</script>

<template>
  <view class="page-shell">
    <view v-if="!orders.length" class="card empty-box">暂时还没有订单记录</view>

    <view v-for="item in orders" :key="item.id" class="card order-card">
      <view class="row between">
        <view class="order-main">
          <view class="order-no">{{ item.orderNo }}</view>
          <view class="order-meta">{{ item.createdAt }}</view>
        </view>
        <view class="status">{{ statusText(item.status) }}</view>
      </view>

      <view class="line">合计积分：{{ item.totalPoints }}</view>
      <view class="line">收货人：{{ item.recipientName }} {{ item.recipientPhone }}</view>
      <view class="line address-line">{{ item.recipientAddress }}</view>

      <button v-if="item.status === 'SHIPPED'" class="primary-btn" @click="confirmOrder(item.id)">确认收货</button>
    </view>

    <view class="tabbar-shell">
      <view
        v-for="item in tabItems"
        :key="item.key"
        class="tab-item"
        :class="{ active: item.key === 'orders', disabled: tabDisabled(item) }"
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
  margin-bottom: 12rpx;
}

.order-card {
  margin-bottom: 12rpx;
}

.order-main {
  min-width: 0;
}

.order-no {
  font-weight: 700;
  font-size: 24rpx;
  margin-bottom: 4rpx;
  word-break: break-all;
}

.order-meta,
.line {
  color: #64748b;
  margin-bottom: 8rpx;
  font-size: 22rpx;
  line-height: 1.7;
}

.address-line {
  word-break: break-all;
}

.status {
  color: #2563eb;
  font-size: 22rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.primary-btn {
  margin-top: 8rpx;
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
