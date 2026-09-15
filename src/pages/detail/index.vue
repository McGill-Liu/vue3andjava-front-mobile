<script>
import { setCartQuantity, getCartQuantity } from '../../utils/cart'
import { getProfile, isGuest } from '../../utils/auth'
import { request, showRequestError } from '../../utils/request'
import { productImageUrl } from '../../utils/image'

export default {
  data() {
    return {
      product: null,
      guestMode: false,
      addDialogVisible: false,
      addQuantity: 1,
      existingQuantity: 0,
      availabilityLoaded: false
    }
  },
  computed: {
    perOrderLimit() {
      if (this.product?.perOrderLimit === null || this.product?.perOrderLimit === undefined) return null
      return Math.max(1, Math.floor(Number(this.product.perOrderLimit)))
    },
    customerTotalLimit() {
      if (this.product?.customerTotalLimit === null || this.product?.customerTotalLimit === undefined) return null
      return Math.max(1, Math.floor(Number(this.product.customerTotalLimit)))
    },
    purchasedQuantity() {
      return Math.max(0, Number(this.product?.purchasedQuantity || 0))
    },
    remainingTotal() {
      if (this.customerTotalLimit === null) return null
      return Math.max(0, Number(this.product?.remainingTotal ?? (this.customerTotalLimit - this.purchasedQuantity)))
    },
    maxAddQuantity() {
      if (!this.product) return 0
      const stockAvailable = Math.max(0, Number(this.product.stock || 0) - this.existingQuantity)
      const perOrderAvailable = this.perOrderLimit === null
        ? Number.MAX_SAFE_INTEGER
        : Math.max(0, this.perOrderLimit - this.existingQuantity)
      const cumulativeAvailable = this.remainingTotal === null
        ? Number.MAX_SAFE_INTEGER
        : Math.max(0, this.remainingTotal - this.existingQuantity)
      return Math.min(stockAvailable, perOrderAvailable, cumulativeAvailable)
    }
  },
  onLoad(options) {
    this.guestMode = isGuest() || !getProfile()
    this.loadProduct(options.id)
  },
  methods: {
    async loadProduct(id) {
      try {
        this.product = await request({ url: `/products/${id}`, auth: !this.guestMode })
      } catch (error) {
        showRequestError(error, '商品加载失败')
        return
      }
      if (!this.guestMode) {
        try {
          await this.loadAvailability(id)
        } catch (error) {
          showRequestError(error, '累计限购信息加载失败')
        }
      }
    },
    async loadAvailability(productId) {
      this.availabilityLoaded = false
      const results = await request({
        url: '/orders/purchase-availability',
        method: 'POST',
        data: { productIds: [Number(productId)] }
      })
      if (results[0]) this.product = { ...this.product, ...results[0] }
      this.availabilityLoaded = true
    },
    coverImage() {
      return productImageUrl(this.product.coverImageUrl)
    },
    clearFailedImage() {
      this.product.coverImageUrl = ''
    },
    openAddDialog() {
      if (this.guestMode) {
        uni.reLaunch({ url: '/src/pages/login/index' })
        return
      }
      this.existingQuantity = getCartQuantity(this.product.id)
      if (Number(this.product.stock || 0) <= 0) {
        uni.showToast({ title: '该商品暂时无货', icon: 'none' })
        return
      }
      if (this.customerTotalLimit !== null && !this.availabilityLoaded) {
        uni.showModal({ title: '累计限购信息未加载', content: '请返回商品页刷新后重试。', showCancel: false })
        return
      }
      if (this.remainingTotal !== null && this.remainingTotal <= 0) {
        uni.showModal({
          title: '已达到累计限购数量',
          content: `该商品每位客户累计限购 ${this.customerTotalLimit} 件，您已经购买 ${this.purchasedQuantity} 件，不能继续添加。`,
          showCancel: false
        })
        return
      }
      if (this.perOrderLimit !== null && this.existingQuantity >= this.perOrderLimit) {
        uni.showModal({
          title: '已达到限购数量',
          content: `该商品每笔订单限购 ${this.perOrderLimit} 件，购物车已经有 ${this.existingQuantity} 件，不能继续添加。`,
          showCancel: false
        })
        return
      }
      if (this.maxAddQuantity <= 0) {
        uni.showToast({ title: '购物车数量已达到剩余数量', icon: 'none' })
        return
      }
      this.addQuantity = 1
      this.addDialogVisible = true
    },
    closeAddDialog() {
      this.addDialogVisible = false
    },
    decreaseAddQuantity() {
      this.addQuantity = Math.max(1, this.addQuantity - 1)
    },
    increaseAddQuantity() {
      this.addQuantity = Math.min(this.maxAddQuantity, this.addQuantity + 1)
    },
    inputAddQuantity(event) {
      const value = Math.floor(Number(event.detail.value))
      this.addQuantity = Number.isFinite(value) ? Math.max(1, value) : 1
    },
    confirmAddToCart() {
      const currentQuantity = getCartQuantity(this.product.id)
      const stockAvailable = Math.max(0, Number(this.product.stock || 0) - currentQuantity)
      const perOrderAvailable = this.perOrderLimit === null ? Number.MAX_SAFE_INTEGER : Math.max(0, this.perOrderLimit - currentQuantity)
      const cumulativeAvailable = this.remainingTotal === null ? Number.MAX_SAFE_INTEGER : Math.max(0, this.remainingTotal - currentQuantity)
      const available = Math.min(stockAvailable, perOrderAvailable, cumulativeAvailable)
      const requested = Math.floor(Number(this.addQuantity))
      if (!Number.isFinite(requested) || requested < 1) {
        uni.showToast({ title: '请输入正确的添加数量', icon: 'none' })
        return
      }
      if (requested > available) {
        this.existingQuantity = currentQuantity
        this.addQuantity = Math.max(1, available)
        if (this.remainingTotal !== null && requested > cumulativeAvailable) {
          uni.showModal({
            title: '超过累计限购数量',
            content: `该商品每位客户累计限购 ${this.customerTotalLimit} 件，您已经购买 ${this.purchasedQuantity} 件，购物车已经有 ${currentQuantity} 件，本次最多还能添加 ${Math.max(0, cumulativeAvailable)} 件。`,
            showCancel: false
          })
        } else if (this.perOrderLimit !== null && requested > perOrderAvailable) {
          uni.showModal({
            title: '超过限购数量',
            content: `该商品每笔订单限购 ${this.perOrderLimit} 件，购物车已经有 ${currentQuantity} 件，本次最多还能添加 ${Math.max(0, perOrderAvailable)} 件。`,
            showCancel: false
          })
        } else {
          uni.showToast({ title: available > 0 ? `本次最多还能添加 ${available} 件` : '购物车数量已达到剩余数量', icon: 'none' })
        }
        if (available <= 0) this.closeAddDialog()
        return
      }
      setCartQuantity(this.product, currentQuantity + requested)
      this.closeAddDialog()
      uni.showToast({ title: `已加入购物车，共添加 ${requested} 件`, icon: 'success' })
    },
    goToCart() {
      if (this.guestMode) {
        uni.reLaunch({ url: '/src/pages/login/index' })
        return
      }
      uni.reLaunch({ url: '/src/pages/cart/index' })
    }
  }
}
</script>

<template>
  <view v-if="product" class="page-shell">
    <view class="card">
      <image v-if="product.coverImageUrl" :src="coverImage()" class="cover" mode="aspectFill" @error="clearFailedImage" />
      <view v-else class="cover image-placeholder">暂无图片</view>
      <view class="section-title">{{ product.name }}</view>
      <view v-if="!guestMode" class="meta">
        <text>{{ product.pointsCost }} 积分</text>
        <text v-if="Number(product.stock) > 0">剩余数量：{{ product.stock }}</text>
        <text v-else class="sold-out">已售罄</text>
      </view>
      <view class="purchase-limit">每笔订单限购：{{ perOrderLimit === null ? '不限购' : `${perOrderLimit} 件` }}</view>
      <view class="purchase-limit">每位客户累计限购：{{ customerTotalLimit === null ? '不限购' : `${customerTotalLimit} 件` }}</view>
      <view v-if="!guestMode && customerTotalLimit !== null" class="purchase-remaining">您已购买 {{ purchasedQuantity }} 件，累计还可购买 {{ remainingTotal }} 件</view>
      <view class="desc">{{ product.description || '暂无商品描述' }}</view>

      <view class="action-bar">
        <button
          class="add-cart-btn"
          :class="{ disabled: !guestMode && (product.stock <= 0 || remainingTotal === 0 || (customerTotalLimit !== null && !availabilityLoaded)) }"
          :disabled="!guestMode && (product.stock <= 0 || remainingTotal === 0 || (customerTotalLimit !== null && !availabilityLoaded))"
          @click="openAddDialog"
        >
          {{ guestMode ? '登录后加入购物车' : (product.stock <= 0 ? '暂时无货' : ((customerTotalLimit !== null && !availabilityLoaded) ? '限购信息加载中' : (remainingTotal === 0 ? '已达到累计限购数量' : '加入购物车'))) }}
        </button>
        <button v-if="!guestMode" class="go-cart-btn" @click="goToCart">前往购物车</button>
      </view>
    </view>

    <view v-if="addDialogVisible" class="dialog-mask" @click="closeAddDialog">
      <view class="quantity-dialog" @click.stop>
        <view class="dialog-title">加入购物车</view>
        <view class="dialog-product">{{ product.name }}</view>
        <view class="dialog-line"><text>所需积分</text><text>{{ product.pointsCost }} / 件</text></view>
        <view class="dialog-line"><text>剩余数量</text><text>{{ product.stock }}</text></view>
        <view class="dialog-line"><text>每单限购</text><text>{{ perOrderLimit === null ? '不限购' : `${perOrderLimit} 件` }}</text></view>
        <view class="dialog-line"><text>累计限购</text><text>{{ customerTotalLimit === null ? '不限购' : `${customerTotalLimit} 件` }}</text></view>
        <view v-if="customerTotalLimit !== null" class="dialog-line"><text>历史已购买</text><text>{{ purchasedQuantity }} 件</text></view>
        <view class="dialog-line"><text>购物车已有</text><text>{{ existingQuantity }} 件</text></view>
        <view class="quantity-row">
          <text>本次添加</text>
          <view class="stepper">
            <button class="icon-btn sub" :disabled="addQuantity <= 1" @click="decreaseAddQuantity">-</button>
            <input class="count-input" type="number" :value="String(addQuantity)" @input="inputAddQuantity" />
            <button class="icon-btn add" :disabled="addQuantity >= maxAddQuantity" @click="increaseAddQuantity">+</button>
          </view>
        </view>
        <view class="dialog-actions">
          <button class="dialog-btn cancel" @click="closeAddDialog">取消</button>
          <button class="dialog-btn confirm" @click="confirmAddToCart">确认添加</button>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.cover {
  width: 100%;
  height: 320rpx;
  border-radius: 18rpx;
  margin-bottom: 16rpx;
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  color: #94a3b8;
  font-size: 24rpx;
}

.desc {
  color: #475569;
  line-height: 1.8;
  font-size: 24rpx;
  margin-bottom: 14rpx;
}

.meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 14rpx;
  font-size: 24rpx;
  font-weight: 700;
}

.sold-out {
  color: #dc2626;
  font-weight: 700;
}

.purchase-limit {
  margin-bottom: 14rpx;
  color: #475569;
  font-size: 23rpx;
}

.purchase-remaining {
  margin: -8rpx 0 14rpx;
  color: #2563eb;
  font-size: 22rpx;
  font-weight: 700;
}

.action-bar {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 18rpx;
}

.add-cart-btn {
  width: 100%;
  height: 76rpx;
  line-height: 76rpx;
  border-radius: 999rpx;
  background: #2563eb;
  color: #fff;
  font-size: 25rpx;
  font-weight: 700;
}

.add-cart-btn.disabled {
  background: #cbd5e1;
  color: #64748b;
}

.go-cart-btn {
  width: 100%;
  height: 72rpx;
  line-height: 72rpx;
  border-radius: 999rpx;
  background: #e2e8f0;
  color: #334155;
  font-size: 24rpx;
  font-weight: 700;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  box-sizing: border-box;
  background: rgba(15, 23, 42, 0.48);
}

.quantity-dialog {
  width: 100%;
  max-width: 620rpx;
  padding: 30rpx;
  box-sizing: border-box;
  border-radius: 24rpx;
  background: #fff;
}

.dialog-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #0f172a;
}

.dialog-product {
  margin: 10rpx 0 22rpx;
  color: #475569;
  font-size: 23rpx;
}

.dialog-line,
.quantity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 58rpx;
  color: #334155;
  font-size: 23rpx;
}

.quantity-row {
  margin-top: 12rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #e2e8f0;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.icon-btn {
  width: 50rpx;
  min-width: 50rpx;
  height: 50rpx;
  line-height: 50rpx;
  padding: 0;
  text-align: center;
  border-radius: 50%;
  font-size: 24rpx;
}

.icon-btn[disabled] {
  opacity: 0.4;
}

.icon-btn.add {
  background: #2563eb;
  color: #fff;
}

.icon-btn.sub {
  background: #e2e8f0;
  color: #0f172a;
}

.count-input {
  width: 68rpx;
  height: 46rpx;
  text-align: center;
  background: #f8fafc;
  border-radius: 12rpx;
  font-size: 22rpx;
}

.dialog-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 26rpx;
}

.dialog-btn {
  flex: 1;
  height: 68rpx;
  line-height: 68rpx;
  border-radius: 999rpx;
  font-size: 23rpx;
}

.dialog-btn.cancel {
  background: #e2e8f0;
  color: #334155;
}

.dialog-btn.confirm {
  background: #2563eb;
  color: #fff;
}
</style>
