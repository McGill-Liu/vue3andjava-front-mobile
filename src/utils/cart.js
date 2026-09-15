const KEY = 'mobile_local_cart'

function normalizedStock(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const stock = Number(value)
  return Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : null
}

function normalizedLimit(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const limit = Number(value)
  return Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : null
}

export function getCart() {
  const items = uni.getStorageSync(KEY) || []
  return items.map((item) => ({
    ...item,
    perOrderLimit: item.perOrderLimit ?? item.purchaseLimit ?? null,
    customerTotalLimit: item.customerTotalLimit ?? null,
    purchasedQuantity: Math.max(0, Number(item.purchasedQuantity || 0)),
    remainingTotal: item.remainingTotal === null || item.remainingTotal === undefined
      ? null
      : Math.max(0, Number(item.remainingTotal)),
    available: item.available !== false,
    selected: item.available !== false
      && (item.remainingTotal === null || item.remainingTotal === undefined || Number(item.remainingTotal) > 0)
      && item.selected !== false
  }))
}

export function saveCart(items) {
  uni.setStorageSync(KEY, items)
}

export function getCartQuantity(productId) {
  const current = getCart().find((item) => item.productId === productId)
  return current ? current.quantity : 0
}

export function addToCart(product) {
  return setCartQuantity(product, getCartQuantity(product.id) + 1)
}

export function setCartQuantity(product, quantity) {
  const items = getCart()
  const stock = normalizedStock(product.stock)
  const perOrderLimit = normalizedLimit(product.perOrderLimit ?? product.purchaseLimit)
  const customerTotalLimit = normalizedLimit(product.customerTotalLimit)
  const purchasedQuantity = Math.max(0, Number(product.purchasedQuantity || 0))
  const remainingTotal = customerTotalLimit === null
    ? null
    : Math.max(0, Number(product.remainingTotal ?? (customerTotalLimit - purchasedQuantity)))
  const requestedQuantity = Math.max(0, Math.floor(Number(quantity) || 0))
  const stockLimitedQuantity = stock === null ? requestedQuantity : Math.min(requestedQuantity, stock)
  const perOrderLimitedQuantity = perOrderLimit === null ? stockLimitedQuantity : Math.min(stockLimitedQuantity, perOrderLimit)
  const nextQuantity = remainingTotal === null ? perOrderLimitedQuantity : Math.min(perOrderLimitedQuantity, remainingTotal)
  const index = items.findIndex((item) => item.productId === product.id)

  if (nextQuantity <= 0) {
    if (index >= 0) {
      items.splice(index, 1)
    }
    saveCart(items)
    return items
  }

  const payload = {
    productId: product.id,
    name: product.name,
    coverImageUrl: product.coverImageUrl,
    pointsCost: product.pointsCost,
    stock,
    perOrderLimit,
    customerTotalLimit,
    purchasedQuantity,
    remainingTotal,
    quantity: nextQuantity,
    available: true,
    selected: index >= 0 ? items[index].selected !== false : true
  }

  if (index >= 0) {
    items.splice(index, 1, payload)
  } else {
    items.push(payload)
  }

  saveCart(items)
  return items
}

export function updateCart(productId, quantity) {
  const items = getCart()
  const index = items.findIndex((item) => item.productId === productId)

  if (index < 0) {
    return items
  }
  const stock = normalizedStock(items[index].stock)
  const perOrderLimit = normalizedLimit(items[index].perOrderLimit)
  const remainingTotal = items[index].remainingTotal === null ? null : Math.max(0, Number(items[index].remainingTotal))
  const requestedQuantity = Math.max(0, Math.floor(Number(quantity) || 0))
  const stockLimitedQuantity = stock === null ? requestedQuantity : Math.min(requestedQuantity, stock)
  const perOrderLimitedQuantity = perOrderLimit === null ? stockLimitedQuantity : Math.min(stockLimitedQuantity, perOrderLimit)
  const nextQuantity = remainingTotal === null ? perOrderLimitedQuantity : Math.min(perOrderLimitedQuantity, remainingTotal)
  if (nextQuantity <= 0) {
    items.splice(index, 1)
  } else {
    items[index] = { ...items[index], quantity: nextQuantity }
  }
  saveCart(items)
  return items
}

export function setCartSelection(selectedProductIds) {
  const selectedIds = new Set(selectedProductIds.map((id) => Number(id)))
  const items = getCart().map((item) => ({
    ...item,
    selected: item.available !== false
      && (normalizedStock(item.stock) === null || normalizedStock(item.stock) > 0)
      && (item.remainingTotal === null || Number(item.remainingTotal) > 0)
      && selectedIds.has(Number(item.productId))
  }))
  saveCart(items)
  return items
}

export function getSelectedCartItems() {
  return getCart().filter((item) => item.selected !== false
    && item.available !== false
    && (normalizedStock(item.stock) === null || normalizedStock(item.stock) > 0)
    && (item.remainingTotal === null || Number(item.remainingTotal) > 0))
}

export function removeCartItems(productIds) {
  const removedIds = new Set(productIds.map((id) => Number(id)))
  const items = getCart().filter((item) => !removedIds.has(Number(item.productId)))
  saveCart(items)
  return items
}

export function syncCartProducts(products, availabilities = []) {
  const latestProducts = new Map(products.map((product) => [Number(product.id), product]))
  const latestAvailabilities = new Map(availabilities.map((item) => [Number(item.productId), item]))
  const items = getCart().map((item) => {
    const latest = latestProducts.get(Number(item.productId))
    if (!latest) {
      return { ...item, available: false, selected: false }
    }

    const stock = normalizedStock(latest.stock)
    const availability = latestAvailabilities.get(Number(item.productId)) || {}
    const perOrderLimit = normalizedLimit(availability.perOrderLimit ?? latest.perOrderLimit)
    const customerTotalLimit = normalizedLimit(availability.customerTotalLimit ?? latest.customerTotalLimit)
    const purchasedQuantity = Math.max(0, Number(availability.purchasedQuantity || 0))
    const remainingTotal = customerTotalLimit === null
      ? null
      : Math.max(0, Number(availability.remainingTotal ?? (customerTotalLimit - purchasedQuantity)))
    const available = latest.enabled !== false
    const selectable = available && (stock === null || stock > 0) && (remainingTotal === null || remainingTotal > 0)
    const maximumQuantity = Math.min(
      stock !== null && stock > 0 ? stock : Number.MAX_SAFE_INTEGER,
      perOrderLimit ?? Number.MAX_SAFE_INTEGER,
      remainingTotal !== null && remainingTotal > 0 ? remainingTotal : Number.MAX_SAFE_INTEGER
    )
    const quantity = maximumQuantity === Number.MAX_SAFE_INTEGER ? item.quantity : Math.min(item.quantity, maximumQuantity)
    return {
      ...item,
      name: latest.name,
      coverImageUrl: latest.coverImageUrl,
      pointsCost: latest.pointsCost,
      stock,
      perOrderLimit,
      customerTotalLimit,
      purchasedQuantity,
      remainingTotal,
      quantity,
      available,
      selected: selectable && item.selected !== false
    }
  })
  saveCart(items)
  return items
}

export function clearCart() {
  saveCart([])
}
