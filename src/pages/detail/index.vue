<script>
import { setCartQuantity, getCartQuantity } from '../../utils/cart'
import { isGuest } from '../../utils/auth'
import { request } from '../../utils/request'

export default {
  data() {
    return {
      product: null,
      guestMode: false,
      quantity: 0
    }
  },
  onLoad(options) {
    this.guestMode = isGuest()
    this.loadProduct(options.id)
  },
  methods: {
    async loadProduct(id) {
      this.product = await request({ url: `/products/${id}`, auth: false })
      this.quantity = getCartQuantity(this.product.id)
    },
    plus() {
      setCartQuantity(this.product, this.quantity + 1)
      this.quantity = getCartQuantity(this.product.id)
    },
    minus() {
      setCartQuantity(this.product, this.quantity - 1)
      this.quantity = getCartQuantity(this.product.id)
    },
    inputQuantity(event) {
      setCartQuantity(this.product, Number(event.detail.value || 0))
      this.quantity = getCartQuantity(this.product.id)
    }
  }
}
</script>

<template>
  <view v-if="product" class="page-shell">
    <view class="card">
      <image :src="product.coverImageUrl" class="cover" mode="aspectFill" />
      <view class="section-title">{{ product.name }}</view>
      <view v-if="!guestMode" class="meta">
        <text>{{ product.pointsCost }} 积分</text>
        <text>库存 {{ product.stock }}</text>
      </view>
      <view class="desc">{{ product.description || '暂无商品描述' }}</view>

      <view v-if="!guestMode" class="action-bar">
        <view v-if="quantity > 0" class="stepper">
          <button class="icon-btn sub" @click="minus">-</button>
          <input class="count-input" type="number" :value="String(quantity)" @input="inputQuantity" />
          <button class="icon-btn add" @click="plus">+</button>
        </view>
        <button v-else class="icon-btn add solo" @click="plus">+</button>
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

.action-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 10rpx;
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

.icon-btn.add {
  background: #2563eb;
  color: #fff;
}

.icon-btn.sub {
  background: #e2e8f0;
  color: #0f172a;
}

.icon-btn.solo {
  margin-left: auto;
}

.count-input {
  width: 68rpx;
  height: 46rpx;
  text-align: center;
  background: #f8fafc;
  border-radius: 12rpx;
  font-size: 22rpx;
}
</style>
