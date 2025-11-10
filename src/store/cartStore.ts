// Top-level lightweight cart store to satisfy imports from top-level `src` pages.
type CartItem = {
  id: string;
  name: string;
  image?: string;
  service: string;
  price: number;
  category?: string;
  quantity?: number;
}

const state = {
  items: [] as CartItem[],
  discountCode: '',
  discountPercentage: 0,
};

const useCartStoreImpl = {
  getState() {
    return {
      addItem(item: CartItem, qty = 1) {
        const idx = state.items.findIndex(i => i.id === item.id && i.service === item.service);
        if (idx >= 0) state.items[idx].quantity = (state.items[idx].quantity || 0) + qty;
        else state.items.push({ ...item, quantity: qty });
      },
      removeItem(id: string, service: string) {
        const idx = state.items.findIndex(i => i.id === id && i.service === service);
        if (idx >= 0) state.items.splice(idx, 1);
      },
      getItemCount() {
        return state.items.reduce((s, it) => s + (it.quantity || 0), 0);
      },
      getTotal() {
        return state.items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 0), 0) + 0.01;
      },
      applyDiscount(code: string) {
        state.discountCode = code;
        state.discountPercentage = code === 'APP10' ? 10 : 0;
      },
      getDiscount() {
        return state.discountPercentage;
      }
    };
  },
  setState(patch: Partial<typeof state>) {
    Object.assign(state, patch);
  }
};

function useCartStore() {
  return useCartStoreImpl.getState();
}

(useCartStore as any).getState = useCartStoreImpl.getState.bind(useCartStoreImpl);
(useCartStore as any).setState = useCartStoreImpl.setState.bind(useCartStoreImpl);

export { useCartStore };
