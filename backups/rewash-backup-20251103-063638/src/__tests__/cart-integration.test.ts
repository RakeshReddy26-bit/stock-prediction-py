/**
 * Cart and Services Integration Tests
 * Tests Add to Cart functionality and cart store updates
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from '../store/cartStore';
import { CLOTHING_CATALOG } from '../data/clothingCatalog';

// Ensure a clean store and localStorage between tests
const getStore = () => useCartStore.getState();

describe('Cart Integration', () => {
  beforeEach(() => {
    // Reset persisted storage
    localStorage.clear();
    // Reset store state directly
    useCartStore.setState({ items: [], discountCode: '', discountPercentage: 0 });
  });

  it('should add item to cart from Services page', () => {
    const { addItem, getItemCount } = getStore();
    const dressShirt = CLOTHING_CATALOG.find(item => item.id === 'mens-dress-shirt');

    if (dressShirt) {
      addItem({
        id: dressShirt.id,
        name: dressShirt.name,
        image: dressShirt.image,
        service: 'wash',
        price: dressShirt.prices.wash || 0,
        category: dressShirt.category,
      }, 1);

      expect(getItemCount()).toBe(1);
    }
  });

  it('should increase total items count when adding multiple services', () => {
    const { addItem, getItemCount } = getStore();

    // Add wash service
    addItem({ id: 'test-item', name: 'Test Item', image: 'https://example.com/image.jpg', service: 'wash', price: 5.00, category: 'test' }, 2);

    // Add dry clean service for same item
    addItem({ id: 'test-item', name: 'Test Item', image: 'https://example.com/image.jpg', service: 'dryClean', price: 8.00, category: 'test' }, 1);

    expect(getItemCount()).toBe(3);
  });

  it('should calculate total price correctly', () => {
    const { addItem, getTotal } = getStore();

    addItem({ id: 'item-1', name: 'Shirt', image: 'https://example.com/shirt.jpg', service: 'wash', price: 10.00, category: 'mens' }, 2);

    const total = getTotal();
    expect(total).toBeGreaterThan(20);
  });

  it('should remove item from cart', () => {
    const { addItem, removeItem, getItemCount } = getStore();

    addItem({ id: 'test-item', name: 'Test', image: 'https://example.com/test.jpg', service: 'wash', price: 5.00, category: 'test' }, 1);
    expect(getItemCount()).toBe(1);

    removeItem('test-item', 'wash');
    expect(getItemCount()).toBe(0);
  });

  it('should persist cart to localStorage', () => {
    const { addItem } = getStore();

    addItem({ id: 'persist-test', name: 'Persist Test', image: 'https://example.com/test.jpg', service: 'wash', price: 3.00, category: 'test' }, 1);

    // The persist middleware default name is 'cart-storage'
    const stored = localStorage.getItem('cart-storage');
    expect(stored).toBeTruthy();
  });

  it('should apply discount code correctly', () => {
    const { addItem, applyDiscount, getDiscount } = getStore();

    addItem({ id: 'item-1', name: 'Item', image: 'https://example.com/item.jpg', service: 'wash', price: 100.00, category: 'test' }, 1);

    applyDiscount('REWASH10');
    const discount = getDiscount();
    expect(discount).toBeGreaterThan(0);
  });
});
