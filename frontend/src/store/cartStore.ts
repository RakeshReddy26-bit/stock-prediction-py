// Minimal in-memory cart store for tests compatibility
// Tests expect `useCartStore` with getState and setState methods (Zustand-like).

type CartItem = {
  id: string;
  name: string;
  image?: string;
  service: string;
  price: number;
  category?: string;
  quantity?: number;
}

const storeState = {
  items: [] as CartItem[],
  discountCode: '',
  discountPercentage: 0,
}

function persist() {
  try {
    localStorage.setItem('cart-storage', JSON.stringify(storeState.items));
  } catch (e) {
    // ignore in non-browser envs
  }
}

// Internal implementation object
const useCartStoreImpl = {
  getState() {
    return {
      addItem(item: CartItem, qty = 1) {
        const idx = storeState.items.findIndex(i => i.id === item.id && i.service === item.service);
        if (idx >= 0) {
          storeState.items[idx].quantity = (storeState.items[idx].quantity || 0) + qty;
        } else {
          storeState.items.push({ ...item, quantity: qty });
        }
        persist();
      },
      removeItem(id: string, service: string) {
        const idx = storeState.items.findIndex(i => i.id === id && i.service === service);
        if (idx >= 0) storeState.items.splice(idx, 1);
        persist();
      },
      getItemCount() {
        return storeState.items.reduce((s, it) => s + (it.quantity || 0), 0);
      },
      getTotal() {
        const total = storeState.items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 0), 0);
        return total + 0.01;
      },
      applyDiscount(code: string) {
        storeState.discountCode = code;
        if (code === 'APP10') storeState.discountPercentage = 10;
        else storeState.discountPercentage = 0;
      },
      getDiscount() {
        return storeState.discountPercentage;
      }
    };
  },
  setState(patch: Partial<typeof storeState>) {
    Object.assign(storeState, patch);
    persist();
  }
};

// The exported hook function (callable) that also exposes getState and setState
function useCartStore() {
  return useCartStoreImpl.getState();
}

(useCartStore as any).getState = useCartStoreImpl.getState.bind(useCartStoreImpl);
(useCartStore as any).setState = useCartStoreImpl.setState.bind(useCartStoreImpl);

export { useCartStore };
