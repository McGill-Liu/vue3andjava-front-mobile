<script>
import { getCartQuantity, setCartQuantity } from '../../utils/cart'
import { getProfile, isGuest, exitGuest } from '../../utils/auth'
import { hidePageLoading, showPageLoading } from '../../utils/loading'
import { request } from '../../utils/request'

export default {
  data() {
    return {
      categories: [],
      products: [],
      activeCategory: null,
      keyword: '',
      guestMode: false,
      cartMap: {},
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
    this.guestMode = isGuest() || !getProfile()
    this.syncCartMap()
    if (!this.categories.length) {
      this.loadCategories().then(() => {
        this.loadProducts()
      })
      return
    }
    if (!this.products.length) {
      this.loadProducts()
    }
  },
  methods: {
    syncCartMap() {
      const map = {}
      this.products.forEach((item) => {
        map[item.id] = getCartQuantity(item.id)
      })
      this.cartMap = map
    },
    tabDisabled(item) {
      return this.guestMode && item.key !== 'mall'
    },
    goTab(item) {
      if (this.tabDisabled(item) || item.key === 'mall') {
        return
      }
      showPageLoading()
      uni.reLaunch({ url: item.url })
    },
    async loadCategories() {
      this.categories = await request({ url: '/categories', auth: false })
      if (this.categories.length && !this.activeCategory) {
        this.activeCategory = this.categories[0].id
      }
    },
    async loadProducts() {
      const query = []
      if (this.activeCategory) query.push(`categoryId=${this.activeCategory}`)
      if (this.keyword) query.push(`keyword=${this.keyword}`)
      this.products = await request({ url: `/products${query.length ? `?${query.join('&')}` : ''}`, auth: false })
      this.syncCartMap()
    },
    selectCategory(id) {
      this.activeCategory = id
      this.loadProducts()
    },
    openDetail(product) {
      uni.navigateTo({ url: `/src/pages/detail/index?id=${product.id}` })
    },
    goLogin() {
      exitGuest()
      showPageLoading()
      uni.reLaunch({ url: '/src/pages/login/index' })
    },
    plus(product) {
      setCartQuantity(product, (this.cartMap[product.id] || 0) + 1)
      this.cartMap = { ...this.cartMap, [product.id]: getCartQuantity(product.id) }
    },
    minus(product) {
      setCartQuantity(product, (this.cartMap[product.id] || 0) - 1)
      this.cartMap = { ...this.cartMap, [product.id]: getCartQuantity(product.id) }
    }
  }
}
</script>

<template>
  <view class="page-shell mall-page">
    <view class="card search-card">
      <input v-model="keyword" class="search-input" placeholder="搜索商品" @confirm="loadProducts" />
      <button class="mini-btn" @click="loadProducts">搜索</button>
      <button v-if="guestMode" class="mini-btn secondary" @click="goLogin">账号登录</button>
    </view>

    <view class="mall-board">
      <view class="category-wrap">
        <scroll-view scroll-y class="category-pane" enhanced="true" show-scrollbar="false">
          <view
            v-for="item in categories"
            :key="item.id"
            class="category-item"
            :class="{ active: activeCategory === item.id }"
            @click="selectCategory(item.id)"
          >
            {{ item.name }}
          </view>
        </scroll-view>
      </view>

      <view class="product-wrap">
        <scroll-view scroll-y class="product-pane" enhanced="true" show-scrollbar="false">
          <view v-for="item in products" :key="item.id" class="product-card" @click="openDetail(item)">
            <image :src="item.coverImageUrl" class="product-cover" mode="aspectFill" />
            <view class="product-body">
              <view class="product-name">{{ item.name }}</view>
              <view v-if="!guestMode" class="product-meta">
                <text>{{ item.pointsCost }} 积分</text>
                <text>库存 {{ item.stock }}</text>
              </view>
              <view v-if="!guestMode" class="action-line" @click.stop="">
                <view class="stepper">
                  <button class="icon-btn sub" :class="{ disabled: !cartMap[item.id] }" @click="minus(item)">-</button>
                  <text class="count-text">{{ cartMap[item.id] || 0 }}</text>
                  <button class="icon-btn add" @click="plus(item)">+</button>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <view class="tabbar-shell">
      <view
        v-for="item in tabItems"
        :key="item.key"
        class="tab-item"
        :class="{ active: item.key === 'mall', disabled: tabDisabled(item) }"
        @click="goTab(item)"
      >
        <text class="tab-text">{{ item.label }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.mall-page {
  background: #f1f5f9;
}

.search-card {
  display: flex;
  gap: 12rpx;
  align-items: center;
  margin-bottom: 16rpx;
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 66rpx;
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 0 18rpx;
  font-size: 24rpx;
}

.mini-btn {
  height: 66rpx;
  line-height: 66rpx;
  border-radius: 999rpx;
  background: #2563eb;
  color: #fff;
  font-size: 22rpx;
  padding: 0 22rpx;
}

.mini-btn.secondary {
  background: #111827;
}

.mall-board {
  display: flex;
  gap: 10rpx;
  height: calc(100vh - 164rpx);
  background: #f1f5f9;
}

.category-wrap {
  width: 170rpx;
  flex-shrink: 0;
  background: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
}

.product-wrap {
  flex: 1;
  min-width: 0;
  background: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
}

.category-pane,
.product-pane {
  height: 100%;
  box-sizing: border-box;
}

.category-pane {
  padding: 12rpx;
}

.product-pane {
  padding: 12rpx;
}

.category-item {
  padding: 18rpx 12rpx;
  border-radius: 14rpx;
  margin-bottom: 10rpx;
  background: #f8fafc;
  font-size: 23rpx;
  color: #475569;
  word-break: break-all;
}

.category-item.active {
  background: #dbeafe;
  color: #1d4ed8;
  font-weight: 700;
}

.product-card {
  display: flex;
  align-items: stretch;
  gap: 14rpx;
  width: 100%;
  box-sizing: border-box;
  padding: 14rpx;
  margin-bottom: 10rpx;
  border-radius: 18rpx;
  background: #f8fafc;
  border: 2rpx solid #bfdbfe;
}

.product-cover {
  width: 116rpx;
  height: 116rpx;
  flex-shrink: 0;
  border-radius: 16rpx;
}

.product-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1.45;
  margin-bottom: 12rpx;
  word-break: break-word;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  gap: 10rpx;
  color: #334155;
  font-size: 21rpx;
  margin-bottom: auto;
}

.action-line {
  display: flex;
  justify-content: flex-end;
  margin-top: 12rpx;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.icon-btn {
  width: 46rpx;
  min-width: 46rpx;
  height: 46rpx;
  line-height: 46rpx;
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

.icon-btn.disabled {
  opacity: 0.45;
}

.count-text {
  min-width: 44rpx;
  text-align: center;
  font-size: 22rpx;
  color: #0f172a;
  font-weight: 700;
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
