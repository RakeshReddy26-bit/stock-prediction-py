import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  image: string;
  service: 'wash' | 'dryClean' | 'iron' | 'express';
  quantity: number;
  price: number;
  category: string;
}

interface CartStore {
  items: CartItem[];
  discountCode: string;
  discountPercentage: number;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string, service: string) => void;
  updateQuantity: (id: string, service: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTax: () => number;
  getDiscount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  applyDiscount: (code: string) => void;
  removeDiscount: () => void;
}

const TAX_RATE = 0.08; // 8% tax
const DISCOUNT_CODES = {
  'REWASH10': 0.1, // 10% off
  'CLEAN20': 0.2, // 20% off
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      discountCode: '',
      discountPercentage: 0,
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (cartItem) => cartItem.id === item.id && cartItem.service === item.service
          );
          if (existingItemIndex >= 0) {
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += quantity;
            return { items: updatedItems };
          } else {
            return { items: [...state.items, { ...item, quantity }] };
          }
        }),
      removeItem: (id, service) =>
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.id === id && item.service === service)
          ),
        })),
      updateQuantity: (id, service, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (item) => !(item.id === id && item.service === service)
              ),
            };
          }
          const updatedItems = state.items.map((item) =>
            item.id === id && item.service === service
              ? { ...item, quantity }
              : item
          );
          return { items: updatedItems };
        }),
      clearCart: () => set({ items: [], discountCode: '', discountPercentage: 0 }),
      getSubtotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      getTax: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        return (subtotal - discount) * TAX_RATE;
      },
      getDiscount: () => {
        const { discountPercentage } = get();
        const subtotal = get().getSubtotal();
        return subtotal * discountPercentage;
      },
      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        const tax = get().getTax();
        return subtotal - discount + tax;
      },
      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },
      applyDiscount: (code) => {
        const percentage = DISCOUNT_CODES[code.toUpperCase() as keyof typeof DISCOUNT_CODES];
        if (percentage) {
          set({ discountCode: code.toUpperCase(), discountPercentage: percentage });
        }
      },
      removeDiscount: () => set({ discountCode: '', discountPercentage: 0 }),
    }),
    {
      name: 'cart-storage',
    }
  )
);
