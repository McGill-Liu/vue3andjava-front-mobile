<script>
import { isGuest, updatePointsBalance } from '../../utils/auth'
import { hidePageLoading, showPageLoading } from '../../utils/loading'
import { request, showRequestError } from '../../utils/request'
import { productImageUrl } from '../../utils/image'

export default {
  data() {
    return {
      orders: [],
      refreshing: false,
      confirmingOrderId: null,
      cancellingOrderId: null,
      staleOrderNoticeVisible: false,
      detailVisible: false,
      detailLoading: false,
      detailOrder: null,
      detailItems: [],
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
      try {
        this.orders = await request({ url: '/orders' })
        return true
      } catch (error) {
        showRequestError(error, '订单加载失败')
        return false
      }
    },
    async refreshOrders() {
      if (this.refreshing) return
      this.refreshing = true
      try {
        if (await this.load()) uni.showToast({ title: '订单数据已刷新', icon: 'success' })
      } finally {
        this.refreshing = false
      }
    },
    async openDetail(item) {
      this.detailOrder = item
      this.detailItems = []
      this.detailVisible = true
      this.detailLoading = true
      try {
        this.detailItems = await request({ url: `/orders/${item.id}` })
      } catch (error) {
        this.detailVisible = false
        showRequestError(error, '订单详情加载失败')
      } finally {
        this.detailLoading = false
      }
    },
    closeDetail() {
      this.detailVisible = false
    },
    detailImage(item) {
      return productImageUrl(item.productCoverImage)
    },
    detailQuantity() {
      return this.detailItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
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
    async confirmOrder(item) {
      if (this.confirmingOrderId !== null) return
      const confirmed = await new Promise((resolve) => {
        uni.showModal({
          title: '确认收货',
          content: `确认已经收到订单 ${item.orderNo} 的商品吗？确认后订单将变为已签收。`,
          confirmText: '确认收货',
          success: (result) => resolve(result.confirm),
          fail: () => resolve(false)
        })
      })
      if (!confirmed) return
      this.confirmingOrderId = item.id
      try {
        await request({ url: `/orders/${item.id}/confirm`, method: 'POST' })
        uni.showToast({ title: '已确认收货', icon: 'success' })
        await this.load()
      } catch (error) {
        showRequestError(error, '确认收货失败')
      } finally {
        this.confirmingOrderId = null
      }
    },
    cancelOrder(item) {
      if (this.cancellingOrderId !== null) return
      uni.showModal({
        title: '取消订单',
        content: '确认取消这笔待发货订单吗？积分将自动返还。',
        success: async ({ confirm }) => {
          if (!confirm) return
          this.cancellingOrderId = item.id
          try {
            const balance = await request({ url: `/orders/${item.id}/cancel`, method: 'POST' })
            updatePointsBalance(balance)
            uni.showToast({ title: '订单已取消，积分已返还', icon: 'success' })
            await this.load()
          } catch (error) {
            if ((error.message || '').includes('仅待发货订单可以取消')) {
              this.staleOrderNoticeVisible = true
            } else {
              showRequestError(error, '取消订单失败')
            }
          } finally {
            this.cancellingOrderId = null
          }
        }
      })
    },
    async refreshAfterConflict() {
      this.staleOrderNoticeVisible = false
      try {
        await this.load()
      } catch (error) {
        showRequestError(error, '刷新失败')
      }
    },
    formatDateTime(value) {
      return value ? String(value).replace('T', ' ').replace(/Z$/, '').slice(0, 19) : '-'
    },
    statusText(status) {
      const map = {
        PENDING_SHIPMENT: '待发货',
        SHIPPED: '已发货',
        COMPLETED: '已签收',
        MANUAL_CANCELLED: '客户手动取消',
        AUTO_CANCELLED: '自动取消'
      }
      return map[status] || status
    }
  }
}
</script>

<template>
  <view class="page-shell">
    <view class="card page-toolbar">
      <view>
        <view class="toolbar-title">我的订单</view>
        <view class="toolbar-tip">点击刷新可获取最新订单状态</view>
      </view>
      <button class="toolbar-refresh-btn" :disabled="refreshing" @click="refreshOrders">{{ refreshing ? '刷新中' : '刷新' }}</button>
    </view>
    <view v-if="!orders.length" class="card empty-box">暂时还没有订单记录</view>

    <view v-for="item in orders" :key="item.id" class="card order-card">
      <view class="row between">
        <view class="order-main">
          <view class="order-no">{{ item.orderNo }}</view>
          <view class="order-meta">{{ formatDateTime(item.createdAt) }}</view>
        </view>
        <view class="status">{{ statusText(item.status) }}</view>
      </view>

      <view class="line">订单消耗积分：{{ item.totalPoints }}</view>
      <view class="line">下单前剩余积分：{{ item.balanceBefore }}，下单后剩余积分：{{ item.balanceAfter }}</view>
      <view class="line">收货人：{{ item.recipientName }} {{ item.recipientPhone }}</view>
      <view class="line address-line">{{ item.recipientAddress }}</view>

      <view class="order-actions">
        <button class="detail-btn" @click="openDetail(item)">查看订单详情</button>
        <button
          v-if="item.status === 'PENDING_SHIPMENT'"
          class="cancel-btn"
          :disabled="cancellingOrderId === item.id"
          @click="cancelOrder(item)"
        >{{ cancellingOrderId === item.id ? '处理中...' : '取消订单' }}</button>
        <button
          v-if="item.status === 'SHIPPED'"
          class="primary-btn"
          :disabled="confirmingOrderId === item.id"
          @click="confirmOrder(item)"
        >{{ confirmingOrderId === item.id ? '处理中...' : '确认收货' }}</button>
      </view>
    </view>

    <view v-if="detailVisible && detailOrder" class="modal-mask detail-mask">
      <view class="order-detail-dialog">
        <view class="detail-title">订单详情</view>
        <scroll-view scroll-y class="detail-scroll">
          <view class="detail-summary">
            <view class="detail-row"><text>订单号</text><text class="detail-value order-number">{{ detailOrder.orderNo }}</text></view>
            <view class="detail-row"><text>订单状态</text><text class="detail-value status-value">{{ statusText(detailOrder.status) }}</text></view>
            <view class="detail-row"><text>下单时间</text><text class="detail-value">{{ formatDateTime(detailOrder.createdAt) }}</text></view>
            <view class="detail-row"><text>下单人</text><text class="detail-value">{{ detailOrder.customerName }} {{ detailOrder.customerPhone }}</text></view>
            <view class="detail-row"><text>收货人</text><text class="detail-value">{{ detailOrder.recipientName }} {{ detailOrder.recipientPhone }}</text></view>
            <view class="detail-row address-detail"><text>收货地址</text><text class="detail-value">{{ detailOrder.recipientAddress }}</text></view>
            <view class="detail-row"><text>订单积分</text><text class="detail-value">{{ detailOrder.totalPoints }}</text></view>
            <view class="detail-row"><text>积分余额</text><text class="detail-value">{{ detailOrder.balanceBefore }} → {{ detailOrder.balanceAfter }}</text></view>
            <view v-if="detailOrder.shippingCompany || detailOrder.shippingNo" class="detail-row"><text>物流信息</text><text class="detail-value">{{ detailOrder.shippingCompany || '-' }} / {{ detailOrder.shippingNo || '-' }}</text></view>
            <view v-if="detailOrder.shippedAt" class="detail-row"><text>发货时间</text><text class="detail-value">{{ formatDateTime(detailOrder.shippedAt) }}</text></view>
            <view v-if="detailOrder.completedAt" class="detail-row"><text>签收时间</text><text class="detail-value">{{ formatDateTime(detailOrder.completedAt) }}</text></view>
            <view v-if="detailOrder.cancelledAt" class="detail-row"><text>取消时间</text><text class="detail-value">{{ formatDateTime(detailOrder.cancelledAt) }}</text></view>
          </view>

          <view class="goods-title">商品明细（{{ detailItems.length }} 种，共 {{ detailQuantity() }} 件）</view>
          <view v-if="detailLoading" class="detail-loading">正在加载...</view>
          <view v-for="goods in detailItems" :key="goods.id" class="detail-goods">
            <image v-if="goods.productCoverImage" :src="detailImage(goods)" class="detail-goods-image" mode="aspectFill" />
            <view v-else class="detail-goods-image image-placeholder">无图</view>
            <view class="detail-goods-main">
              <view class="detail-goods-name">{{ goods.productName }}</view>
              <view class="detail-goods-meta">{{ goods.pointsCost }} 积分 × {{ goods.quantity }}</view>
            </view>
            <view class="detail-goods-subtotal">{{ Number(goods.pointsCost) * Number(goods.quantity) }} 积分</view>
          </view>
        </scroll-view>
        <button class="detail-close-btn" @click="closeDetail">关闭</button>
      </view>
    </view>

    <view v-if="staleOrderNoticeVisible" class="modal-mask">
      <view class="notice-dialog">
        <view class="notice-title">订单状态已更新</view>
        <view class="notice-content">仅待发货订单可以取消。如果页面展示的订单未发货，请刷新页面获取最新数据。</view>
        <button class="refresh-status-btn" @click="refreshAfterConflict">刷新获取最新订单状态</button>
      </view>
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

.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.toolbar-title {
  color: #0f172a;
  font-size: 26rpx;
  font-weight: 700;
}

.toolbar-tip {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 20rpx;
}

.toolbar-refresh-btn {
  width: 126rpx;
  height: 64rpx;
  line-height: 64rpx;
  margin: 0 0 0 18rpx;
  border-radius: 999rpx;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1rpx solid #bfdbfe;
  box-shadow: 0 6rpx 16rpx rgba(37, 99, 235, 0.08);
  font-size: 22rpx;
}

.toolbar-refresh-btn::after {
  border: 0;
}

.toolbar-refresh-btn[disabled] {
  opacity: 0.58;
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

.order-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 8rpx;
}

.order-actions button {
  flex: 1;
  margin-top: 0;
}

.detail-btn {
  height: 68rpx;
  line-height: 68rpx;
  border-radius: 999rpx;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 24rpx;
}

.cancel-btn {
  margin-top: 8rpx;
  height: 68rpx;
  line-height: 68rpx;
  border-radius: 999rpx;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 24rpx;
}

.empty-box {
  text-align: center;
  color: #64748b;
  font-size: 24rpx;
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
  padding: 40rpx;
  box-sizing: border-box;
  background: rgba(15, 23, 42, 0.55);
}

.detail-mask {
  z-index: 110;
}

.order-detail-dialog {
  width: 100%;
  max-width: 680rpx;
  padding: 30rpx;
  box-sizing: border-box;
  border-radius: 24rpx;
  background: #ffffff;
}

.detail-title {
  margin-bottom: 20rpx;
  color: #0f172a;
  font-size: 30rpx;
  font-weight: 700;
  text-align: center;
}

.detail-scroll {
  max-height: 70vh;
}

.detail-summary {
  padding: 20rpx;
  border-radius: 18rpx;
  background: #f8fafc;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  padding: 8rpx 0;
  color: #64748b;
  font-size: 22rpx;
  line-height: 1.6;
}

.detail-value {
  max-width: 68%;
  color: #0f172a;
  text-align: right;
  word-break: break-all;
}

.status-value {
  color: #2563eb;
  font-weight: 700;
}

.order-number {
  font-size: 20rpx;
}

.address-detail {
  align-items: flex-start;
}

.goods-title {
  margin: 24rpx 0 12rpx;
  color: #0f172a;
  font-size: 25rpx;
  font-weight: 700;
}

.detail-loading {
  padding: 24rpx;
  color: #64748b;
  text-align: center;
}

.detail-goods {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #e2e8f0;
}

.detail-goods-image {
  width: 88rpx;
  height: 88rpx;
  flex-shrink: 0;
  border-radius: 14rpx;
}

.detail-goods-main {
  min-width: 0;
  flex: 1;
}

.detail-goods-name {
  color: #0f172a;
  font-size: 23rpx;
  font-weight: 600;
}

.detail-goods-meta,
.detail-goods-subtotal {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 21rpx;
}

.detail-goods-subtotal {
  flex-shrink: 0;
  color: #0f172a;
}

.detail-close-btn {
  height: 68rpx;
  margin-top: 22rpx;
  line-height: 68rpx;
  border-radius: 999rpx;
  background: #2563eb;
  color: #ffffff;
  font-size: 24rpx;
}

.notice-dialog {
  width: 100%;
  max-width: 620rpx;
  padding: 34rpx 30rpx 28rpx;
  box-sizing: border-box;
  border-radius: 24rpx;
  background: #ffffff;
}

.notice-title {
  margin-bottom: 20rpx;
  color: #0f172a;
  font-size: 30rpx;
  font-weight: 700;
  text-align: center;
}

.notice-content {
  color: #475569;
  font-size: 25rpx;
  line-height: 1.8;
}

.refresh-status-btn {
  margin-top: 28rpx;
  height: 76rpx;
  line-height: 76rpx;
  border-radius: 999rpx;
  background: #2563eb;
  color: #ffffff;
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
