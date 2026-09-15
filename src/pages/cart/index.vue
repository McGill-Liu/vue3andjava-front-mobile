<script>
import { getCart, setCartSelection, syncCartProducts, updateCart } from '../../utils/cart'
import { getProfile, isGuest, updatePointsBalance } from '../../utils/auth'
import { hidePageLoading, showPageLoading } from '../../utils/loading'
import { request, showRequestError } from '../../utils/request'

export default {
  data() {
    return {
      items: [],
      pointsBalance: 0,
      refreshing: false,
      confirmingProductId: null,
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
    selectableItems() {
      return this.items.filter((item) => this.canSelect(item))
    },
    selectedItems() {
      return this.selectableItems.filter((item) => item.selected !== false)
    },
    selectedCount() {
      return this.selectedItems.length
    },
    allSelected() {
      return this.selectableItems.length > 0 && this.selectedCount === this.selectableItems.length
    },
    total() {
      return this.selectedItems.reduce((sum, item) => sum + item.pointsCost * item.quantity, 0)
    },
    pointsShortfall() {
      return Math.max(0, this.total - this.pointsBalance)
    }
  },
  onShow() {
    hidePageLoading()
    this.load()
  },
  methods: {
    async load() {
      this.items = getCart()
      const profile = getProfile()
      this.pointsBalance = Number(profile?.pointsBalance || 0)
      if (profile?.role !== 'CUSTOMER' || isGuest()) {
        return
      }
      await this.refreshCart(false)
    },
    async refreshCart(showSuccess = true) {
      if (this.refreshing) return
      this.refreshing = true
      const previousItems = this.items.map((item) => ({ ...item }))
      try {
        const products = await request({ url: '/products' })
        const productIds = this.items.map((item) => item.productId)
        const availabilities = productIds.length
          ? await request({ url: '/orders/purchase-availability', method: 'POST', data: { productIds } })
          : []
        this.items = syncCartProducts(products, availabilities)
        this.pointsBalance = Number(await request({ url: '/points/balance' }))
        updatePointsBalance(this.pointsBalance)

        const quantityAdjusted = []
        const selectionAdjusted = []
        for (const previous of previousItems) {
          const current = this.items.find((item) => item.productId === previous.productId)
          if (!current) continue
          if (current.quantity < previous.quantity) quantityAdjusted.push(current.name)
          if (previous.selected !== false && current.selected === false) selectionAdjusted.push(current.name)
        }
        if (quantityAdjusted.length || selectionAdjusted.length) {
          const notices = []
          if (quantityAdjusted.length) notices.push(`库存或限购数量发生变化，购物车数量已调整：${quantityAdjusted.join('、')}`)
          if (selectionAdjusted.length) notices.push(`已售罄、已下架或达到累计限购，已取消勾选：${selectionAdjusted.join('、')}`)
          uni.showModal({ title: '购物车商品信息已更新', content: notices.join('\n'), showCancel: false })
        } else if (showSuccess) {
          uni.showToast({ title: '购物车数据已刷新', icon: 'success' })
        }
      } catch (error) {
        // 请求失败时保留本地购物车，不覆盖客户原有选择和数量。
        showRequestError(error, '购物车刷新失败')
      } finally {
        this.refreshing = false
      }
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
    hasKnownStock(item) {
      return item.stock !== null && item.stock !== undefined && item.stock !== '' && Number.isFinite(Number(item.stock))
    },
    canSelect(item) {
      return item.available !== false
        && (!this.hasKnownStock(item) || Number(item.stock) > 0)
        && (item.remainingTotal === null || Number(item.remainingTotal) > 0)
    },
    changeSelection(event) {
      this.items = setCartSelection(event.detail.value)
    },
    changeAllSelection(event) {
      const selectedIds = event.detail.value.length ? this.items.map((item) => item.productId) : []
      this.items = setCartSelection(selectedIds)
    },
    change(item, delta) {
      if (delta < 0 && item.quantity <= 1) {
        this.confirmRemove(item)
        return
      }
      if (delta > 0 && this.hasKnownStock(item) && item.quantity >= Number(item.stock)) {
        uni.showToast({ title: '已达到商品剩余数量', icon: 'none' })
        return
      }
      if (delta > 0 && item.perOrderLimit != null && item.quantity >= Number(item.perOrderLimit)) {
        uni.showToast({ title: `该商品每笔订单限购 ${item.perOrderLimit} 件`, icon: 'none' })
        return
      }
      if (delta > 0 && item.remainingTotal != null && item.quantity >= Number(item.remainingTotal)) {
        uni.showToast({ title: `累计限购还可购买 ${item.remainingTotal} 件`, icon: 'none' })
        return
      }
      this.items = updateCart(item.productId, item.quantity + delta)
    },
    confirmRemove(item) {
      if (this.confirmingProductId !== null) {
        return
      }
      this.confirmingProductId = item.productId
      uni.showModal({
        title: '删除商品',
        content: `确定要从购物车删除“${item.name}”吗？`,
        confirmText: '删除',
        confirmColor: '#dc2626',
        success: (result) => {
          if (!result.confirm) return
          this.items = updateCart(item.productId, 0)
          uni.showToast({ title: '已从购物车删除', icon: 'success' })
        },
        complete: () => {
          this.confirmingProductId = null
        }
      })
    },
    checkout() {
      if (!this.items.length) {
        uni.showToast({ title: '购物车为空', icon: 'none' })
        return
      }
      if (!this.selectedItems.length) {
        uni.showToast({ title: '请先勾选要下单的商品', icon: 'none' })
        return
      }
      if (this.pointsShortfall > 0) {
        uni.showToast({ title: `积分不足，还差 ${this.pointsShortfall} 积分`, icon: 'none' })
        return
      }
      uni.navigateTo({ url: '/src/pages/checkout/index' })
    }
  }
}
</script>

<template>
  <view class="page-shell">
    <view class="card page-toolbar">
      <view>
        <view class="toolbar-title">我的购物车</view>
        <view class="toolbar-tip">商品价格和剩余数量会自动同步</view>
      </view>
      <button class="toolbar-refresh-btn" :disabled="refreshing" @click="refreshCart(true)">{{ refreshing ? '刷新中' : '刷新' }}</button>
    </view>
    <view v-if="!items.length" class="card empty-box">购物车还是空的，先去挑选商品吧</view>

    <checkbox-group @change="changeSelection">
      <view v-for="item in items" :key="item.productId" class="card item-card">
        <view class="row between">
          <view class="item-content">
            <label class="select-box">
              <checkbox :value="String(item.productId)" :checked="item.selected !== false" :disabled="!canSelect(item)" color="#2563eb" />
            </label>
            <view class="item-main">
              <view class="name">{{ item.name }}</view>
              <view class="price">{{ item.pointsCost }} 积分</view>
              <view v-if="item.available === false" class="unavailable">商品已下架或不可兑换</view>
              <view v-else-if="hasKnownStock(item) && Number(item.stock) <= 0" class="unavailable">已售罄（剩余数量：0）</view>
              <view v-else-if="item.remainingTotal !== null && Number(item.remainingTotal) <= 0" class="unavailable">已达到累计限购数量</view>
              <view v-else-if="hasKnownStock(item)" class="remaining">剩余数量：{{ item.stock }}</view>
              <view class="limit-text">每单限购：{{ item.perOrderLimit == null ? '不限购' : `${item.perOrderLimit} 件` }}</view>
              <view class="limit-text">累计限购：{{ item.customerTotalLimit == null ? '不限购' : `${item.customerTotalLimit} 件（已购 ${item.purchasedQuantity} 件，还可购买 ${item.remainingTotal} 件）` }}</view>
            </view>
          </view>
          <view class="item-actions">
            <view class="stepper">
              <button size="mini" class="step-btn minus" @click="change(item, -1)">-</button>
              <text class="qty-text">{{ item.quantity }}</text>
              <button size="mini" class="step-btn plus" :disabled="!canSelect(item)" @click="change(item, 1)">+</button>
            </view>
            <button size="mini" class="delete-btn" @click="confirmRemove(item)">删除</button>
          </view>
        </view>
      </view>
    </checkbox-group>

    <view class="card footer">
      <view class="points-summary">
        <checkbox-group class="select-all" @change="changeAllSelection">
          <label><checkbox value="all" :checked="allSelected" color="#2563eb" />全选（已选 {{ selectedCount }} 种）</label>
        </checkbox-group>
        <view class="total-text">已选商品总积分：{{ total }}</view>
        <view class="balance-text">账户剩余积分：{{ pointsBalance }}</view>
        <view v-if="pointsShortfall" class="shortfall-text">积分不足，还差 {{ pointsShortfall }} 积分</view>
      </view>
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
}

.item-main {
  min-width: 0;
}

.item-content {
  display: flex;
  align-items: center;
  min-width: 0;
}

.select-box {
  flex-shrink: 0;
  margin-right: 14rpx;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
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

.remaining {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 20rpx;
}

.unavailable {
  margin-top: 6rpx;
  color: #dc2626;
  font-size: 20rpx;
  font-weight: 700;
}

.limit-text {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 20rpx;
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

.delete-btn {
  min-width: 86rpx;
  height: 48rpx;
  line-height: 48rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 20rpx;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 14rpx;
}

.total-text {
  font-size: 24rpx;
  font-weight: 700;
}

.points-summary {
  min-width: 0;
}

.select-all {
  margin-bottom: 10rpx;
  color: #334155;
  font-size: 22rpx;
}

.balance-text {
  margin-top: 6rpx;
  color: #475569;
  font-size: 21rpx;
}

.shortfall-text {
  margin-top: 6rpx;
  color: #dc2626;
  font-size: 21rpx;
  font-weight: 700;
}

.primary-btn {
  flex: 0 0 180rpx;
  width: 180rpx;
  margin: 0 0 0 16rpx;
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
