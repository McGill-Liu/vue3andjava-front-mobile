const KEY = 'mobile_local_cart'

export function getCart() {
  return uni.getStorageSync(KEY) || []
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
  const nextQuantity = Math.max(0, Number(quantity) || 0)
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
    quantity: nextQuantity
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
  const nextQuantity = Math.max(0, Number(quantity) || 0)
  const index = items.findIndex((item) => item.productId === productId)

  if (index < 0) {
    return items
  }
  if (nextQuantity <= 0) {
    items.splice(index, 1)
  } else {
    items[index] = { ...items[index], quantity: nextQuantity }
  }
  saveCart(items)
  return items
}

export function clearCart() {
  saveCart([])
}
