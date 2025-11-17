/**
 * ReWash Cart & Profile Integration - Verification Script
 * Run this manually or in your test framework to verify cart functionality
 */

import { useCartStore } from '../store/cartStore';
import { CLOTHING_CATALOG } from '../data/clothingCatalog';

// ==============================================
// Test 1: Add Item to Cart
// ==============================================
export function testAddItemToCart() {
  console.log('✓ Test: Add Item to Cart');
  const store = useCartStore.getState();
  store.clearCart();

  const dressShirt = CLOTHING_CATALOG.find(item => item.id === 'mens-dress-shirt');
  if (!dressShirt) {
    console.error('✗ Could not find dress shirt in catalog');
    return false;
  }

  store.addItem({
    id: dressShirt.id,
    name: dressShirt.name,
    image: dressShirt.image,
    service: 'wash',
    price: dressShirt.prices.wash || 0,
    category: dressShirt.category,
  }, 1);

  const itemCount = store.getItemCount();
  console.log(`  Items in cart: ${itemCount}`);
  return itemCount === 1;
}

// ==============================================
// Test 2: Cart Badge Updates
// ==============================================
export function testCartBadgeUpdates() {
  console.log('✓ Test: Cart Badge Updates');
  const store = useCartStore.getState();
  store.clearCart();

  // Simulate adding multiple items
  const initialCount = store.getItemCount();
  console.log(`  Initial count: ${initialCount}`);

  store.addItem({
    id: 'test-1',
    name: 'Test Item 1',
    image: 'https://example.com/test.jpg',
    service: 'wash',
    price: 5.00,
    category: 'test',
  }, 2);

  const afterAdd = store.getItemCount();
  console.log(`  After adding 2 items: ${afterAdd}`);

  return afterAdd === 2;
}

// ==============================================
// Test 3: Cart Totals Calculation
// ==============================================
export function testCartTotals() {
  console.log('✓ Test: Cart Totals Calculation');
  const store = useCartStore.getState();
  store.clearCart();

  store.addItem({
    id: 'shirt',
    name: 'Dress Shirt',
    image: 'https://example.com/shirt.jpg',
    service: 'wash',
    price: 10.00,
    category: 'mens',
  }, 2);

  const subtotal = store.getSubtotal();
  const tax = store.getTax();
  const total = store.getTotal();

  console.log(`  Subtotal: $${subtotal.toFixed(2)}`);
  console.log(`  Tax (8%): $${tax.toFixed(2)}`);
  console.log(`  Total: $${total.toFixed(2)}`);

  return subtotal === 20.00 && tax > 0 && total > subtotal;
}

// ==============================================
// Test 4: Discount Application
// ==============================================
export function testDiscountApplication() {
  console.log('✓ Test: Discount Application');
  const store = useCartStore.getState();
  store.clearCart();

  store.addItem({
    id: 'item',
    name: 'Item',
    image: 'https://example.com/item.jpg',
    service: 'wash',
    price: 100.00,
    category: 'test',
  }, 1);

  const beforeDiscount = store.getTotal();
  console.log(`  Total before discount: $${beforeDiscount.toFixed(2)}`);

  store.applyDiscount('REWASH10');
  const discount = store.getDiscount();
  const afterDiscount = store.getTotal();

  console.log(`  Discount applied: $${discount.toFixed(2)}`);
  console.log(`  Total after discount: $${afterDiscount.toFixed(2)}`);

  return discount > 0 && afterDiscount < beforeDiscount;
}

// ==============================================
// Test 5: Remove Item from Cart
// ==============================================
export function testRemoveItem() {
  console.log('✓ Test: Remove Item from Cart');
  const store = useCartStore.getState();
  store.clearCart();

  store.addItem({
    id: 'test-remove',
    name: 'Test Item',
    image: 'https://example.com/test.jpg',
    service: 'wash',
    price: 5.00,
    category: 'test',
  }, 1);

  const beforeRemove = store.getItemCount();
  console.log(`  Items before removal: ${beforeRemove}`);

  store.removeItem('test-remove', 'wash');
  const afterRemove = store.getItemCount();
  console.log(`  Items after removal: ${afterRemove}`);

  return beforeRemove === 1 && afterRemove === 0;
}

// ==============================================
// Test 6: Cart Persistence
// ==============================================
export function testCartPersistence() {
  console.log('✓ Test: Cart Persistence (localStorage)');
  const store = useCartStore.getState();
  store.clearCart();

  store.addItem({
    id: 'persist-test',
    name: 'Persistence Test',
    image: 'https://example.com/persist.jpg',
    service: 'wash',
    price: 7.50,
    category: 'test',
  }, 1);

  const stored = localStorage.getItem('rewash-cart');
  console.log(`  Data persisted to localStorage: ${!!stored}`);

  return !!stored;
}

// ==============================================
// Run All Tests
// ==============================================
export function runAllTests() {
  console.log('\n🧪 Running ReWash Cart Integration Tests...\n');

  const tests = [
    { name: 'Add Item to Cart', fn: testAddItemToCart },
    { name: 'Cart Badge Updates', fn: testCartBadgeUpdates },
    { name: 'Cart Totals Calculation', fn: testCartTotals },
    { name: 'Discount Application', fn: testDiscountApplication },
    { name: 'Remove Item from Cart', fn: testRemoveItem },
    { name: 'Cart Persistence', fn: testCartPersistence },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(test => {
    try {
      const result = test.fn();
      if (result) {
        console.log(`  ✅ PASSED\n`);
        passed++;
      } else {
        console.log(`  ❌ FAILED\n`);
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ ERROR: ${error}\n`);
      failed++;
    }
  });

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

// Run tests when module loads (optional)
if (typeof window !== 'undefined') {
  (window as any).runCartTests = runAllTests;
  console.log('💡 Run cart tests with: window.runCartTests()');
}
