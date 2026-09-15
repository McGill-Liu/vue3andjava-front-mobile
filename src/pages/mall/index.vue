<script>
import { getProfile, isGuest, exitGuest } from '../../utils/auth'
import { hidePageLoading, showPageLoading } from '../../utils/loading'
import { request, showRequestError } from '../../utils/request'
import { productImageUrl } from '../../utils/image'

export default {
  data() {
    return {
      categories: [{ id: 0, name: '全部' }],
      products: [],
      activeCategory: null,
      keyword: '',
      guestMode: false,
      refreshing: false,
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
    if (this.categories.length <= 1) {
      this.loadCategories().then((loaded) => {
        if (loaded) this.loadProducts()
      })
      return
    }
    if (!this.products.length) {
      this.loadProducts()
    }
  },
  methods: {
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
      try {
        const remoteCategories = await request({ url: '/categories', auth: !this.guestMode })
        this.categories = [{ id: 0, name: '全部' }, ...remoteCategories]
        if (this.activeCategory === null || !this.categories.some((item) => item.id === this.activeCategory)) {
          this.activeCategory = 0
        }
        return true
      } catch (error) {
        showRequestError(error, '商品分类加载失败')
        return false
      }
    },
    async loadProducts() {
      try {
        const query = []
        if (this.activeCategory) query.push(`categoryId=${this.activeCategory}`)
        if (this.keyword) query.push(`keyword=${this.keyword}`)
        this.products = await request({ url: `/products${query.length ? `?${query.join('&')}` : ''}`, auth: !this.guestMode })
        return true
      } catch (error) {
        showRequestError(error, '商品加载失败')
        return false
      }
    },
    async refreshProducts() {
      if (this.guestMode || this.refreshing) return
      this.refreshing = true
      try {
        const categoriesLoaded = await this.loadCategories()
        if (!categoriesLoaded) return
        const productsLoaded = await this.loadProducts()
        if (productsLoaded) uni.showToast({ title: '商品数据已刷新', icon: 'success' })
      } finally {
        this.refreshing = false
      }
    },
    coverImage(item) {
      return productImageUrl(item.coverImageUrl)
    },
    clearFailedImage(item) {
      item.coverImageUrl = ''
    },
    selectCategory(id) {
      if (this.guestMode) return
      this.activeCategory = id
      this.loadProducts()
    },
    openDetail(product) {
      if (this.guestMode) return
      uni.navigateTo({ url: `/src/pages/detail/index?id=${product.id}` })
    },
    goLogin() {
      exitGuest()
      showPageLoading()
      uni.reLaunch({ url: '/src/pages/login/index' })
    }
  }
}
</script>

<template>
  <view class="page-shell mall-page">
    <view class="card search-card">
      <input
        v-model="keyword"
        class="search-input"
        :disabled="guestMode"
        :placeholder="guestMode ? '登录后可搜索商品' : '搜索商品'"
        @confirm="loadProducts"
      />
      <button class="mini-btn" :disabled="guestMode" @click="loadProducts">搜索</button>
      <button class="mini-btn refresh-btn" :disabled="guestMode || refreshing" @click="refreshProducts">{{ refreshing ? '刷新中' : '刷新' }}</button>
      <button v-if="guestMode" class="mini-btn secondary" @click="goLogin">账号登录</button>
    </view>

    <view class="mall-board">
      <view class="category-wrap">
        <scroll-view scroll-y class="category-pane" show-scrollbar="false">
          <view
            v-for="item in categories"
            :key="item.id"
            class="category-item"
            :class="{ active: activeCategory === item.id, readonly: guestMode }"
            @click="selectCategory(item.id)"
          >
            {{ item.name }}
          </view>
        </scroll-view>
      </view>

      <view class="product-wrap">
        <scroll-view scroll-y class="product-pane" show-scrollbar="false">
          <view
            v-for="item in products"
            :key="item.id"
            class="product-card"
            :class="{ readonly: guestMode }"
            @click="openDetail(item)"
          >
            <image v-if="item.coverImageUrl" :src="coverImage(item)" class="product-cover" mode="aspectFill" @error="clearFailedImage(item)" />
            <view v-else class="product-cover image-placeholder">暂无图片</view>
            <view class="product-body">
              <view class="product-name">{{ item.name }}</view>
              <view v-if="!guestMode" class="product-meta">
                <text>{{ item.pointsCost }} 积分</text>
                <text v-if="Number(item.stock) > 0">剩余数量：{{ item.stock }}</text>
                <text v-else class="sold-out">已售罄</text>
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

.search-input[disabled] {
  background: #f1f5f9;
  color: #94a3b8;
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

.mini-btn[disabled] {
  opacity: 0.46;
}

.mini-btn.secondary {
  background: #111827;
}

.mini-btn.refresh-btn {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1rpx solid #bfdbfe;
  box-shadow: 0 6rpx 16rpx rgba(37, 99, 235, 0.08);
}

.mini-btn.refresh-btn::after {
  border: 0;
}

.mini-btn.refresh-btn[disabled] {
  opacity: 0.58;
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

.category-item.readonly {
  color: #94a3b8;
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

.product-card.readonly {
  border-color: #e2e8f0;
}

.product-cover {
  width: 116rpx;
  height: 116rpx;
  flex-shrink: 0;
  border-radius: 16rpx;
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  color: #94a3b8;
  font-size: 19rpx;
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

.sold-out {
  color: #dc2626;
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
