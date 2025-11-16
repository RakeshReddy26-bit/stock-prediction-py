# 🧺 ReWash App - Complete Testing Guide

## 🚀 Server Status
✅ **Development Server Running**
- **Local**: http://localhost:3001/
- **Network**: http://192.168.178.20:3001/

---

## 📋 Testing Checklist

### 1. **Navigation & Navbar** ✅
#### What to Test:
- [ ] ReWash logo appears in top-left
- [ ] Logo is clickable and links to home
- [ ] "Services" link visible in navbar
- [ ] Cart icon shows with badge (if items added)
- [ ] Profile menu appears on right side (when logged in)

#### Steps:
1. Open http://localhost:3001/
2. Look at the top navigation bar
3. Verify logo, Services link, Cart icon visible
4. Click logo - should return to home

---

### 2. **Home Page Features** ✅
#### What to Test:
- [ ] Hero section displays with background image
- [ ] "Browse Services" button works
- [ ] Stats section shows (5000+ Customers, 24hr Service, 100% Guarantee)
- [ ] **4 Service Category Cards**:
  - [ ] Washing ($2/item)
  - [ ] Ironing ($1.50/item)
  - [ ] Leather Care ($18/item)
  - [ ] Alterations (Custom Pricing)
- [ ] Each card has "Book Service" button
- [ ] "Why Choose ReWash?" section visible

#### Steps:
1. Scroll down the home page
2. Verify all 4 service category cards appear
3. Click "Book Service" on Washing card
4. Should navigate to /washing with filtered items

---

### 3. **Services Page - Add to Cart** ✅
#### What to Test:
- [ ] Clothing items display with images
- [ ] Item names are clear (Dress Shirt, Jeans, Blouse, etc.)
- [ ] **Add to Cart buttons appear** for each service type:
  - [ ] "Add Wash & Fold"
  - [ ] "Add Dry Clean"
  - [ ] "Add Iron Only"
  - [ ] "Add Express"
- [ ] Prices display correctly
- [ ] Toast notification appears when adding item
- [ ] **Cart badge updates** with item count

#### Steps:
1. Go to Services page: http://localhost:3001/services
2. Scroll through clothing items
3. Click "Add Wash & Fold - $3.50" on Dress Shirt
4. Watch for success toast
5. **Check cart badge** - should show "1"
6. Add another item (Jeans - Iron Only $2.00)
7. **Cart badge should now show "2"**

---

### 4. **Service Category Filtering** ✅
#### What to Test:
- [ ] /washing route shows washing items
- [ ] /iron route shows ironing items
- [ ] /leather route shows leather care items
- [ ] /alterations route shows alteration items

#### Steps:
1. Click service category buttons on home page
2. **Washing**: http://localhost:3001/washing
   - Should show items with wash prices
3. **Ironing**: http://localhost:3001/iron
   - Should show items with iron prices
4. **Leather**: http://localhost:3001/leather
   - Should show leather jackets, etc.
5. **Alterations**: http://localhost:3001/alterations
   - Should show alteration items

---

### 5. **Cart Page** ✅
#### What to Test:
- [ ] Cart displays added items
- [ ] Item image, name, service type visible
- [ ] Quantity can be adjusted with +/- buttons
- [ ] "Remove" button works
- [ ] **Subtotal calculates correctly**
- [ ] Tax (10%) calculates
- [ ] Total price displays
- [ ] Empty cart shows friendly message

#### Steps:
1. Add 2-3 items from Services page
2. Click cart icon in navbar
3. Verify all items displayed correctly
4. Change quantity on one item (e.g., 1 → 2)
5. Verify subtotal updates
6. Click "Remove" on an item
7. Verify item disappears and totals recalculate
8. Click "Continue Shopping" - should go back to /services
9. Click "Proceed to Checkout" - should go to checkout page

---

### 6. **Cart Badge Live Update** ✅
#### What to Test:
- [ ] Badge shows correct item count
- [ ] Badge updates when adding items
- [ ] Badge updates when removing items
- [ ] Badge is visible in navbar at all times

#### Steps:
1. Start with empty cart (badge hidden or shows 0)
2. Add item → badge shows "1"
3. Add 2 more items → badge shows "3"
4. Go to cart page
5. Remove 1 item → navigate back, badge shows "2"
6. Clear all items → badge disappears

---

### 7. **Profile Page** ✅
#### What to Test:
- [ ] **Unauthenticated**: Redirects to login
- [ ] **Authenticated**: Shows user info
  - [ ] Avatar/Profile picture
  - [ ] Display name
  - [ ] Email address
  - [ ] User role badge
- [ ] "Edit Profile" button works
- [ ] "My Orders" link works
- [ ] "Payment Methods" shows (disabled/coming soon)
- [ ] "Addresses" shows (disabled/coming soon)
- [ ] "Logout" button works

#### Steps:
1. **Without Login**: Go to http://localhost:3001/profile
   - Should redirect to login or show "Please log in" message
2. **After Login** (if you can log in):
   - Go to /profile
   - Verify all sections display
   - Click "Edit Profile" → form appears
   - Click "My Orders" → navigates to orders page

---

### 8. **Responsive Design** ✅
#### What to Test:
- [ ] App looks good on desktop (full width)
- [ ] Mobile-friendly layout (if testing on mobile)
- [ ] All buttons are clickable
- [ ] Images display properly
- [ ] Text is readable

#### Steps:
1. Open http://localhost:3001/
2. Test on different screen sizes:
   - Desktop (1920px)
   - Tablet (768px)
   - Mobile (375px)
3. Verify layout adjusts

---

### 9. **Logo Integration** ✅
#### What to Test:
- [ ] Logo appears in Navbar
- [ ] Logo appears in Footer (if scrolled)
- [ ] Logo appears on Loading screens
- [ ] Favicon visible in browser tab

#### Steps:
1. Home page - logo visible top-left
2. Scroll to bottom - logo in footer
3. Wait for page load - logo shows during load
4. Check browser tab - favicon visible

---

### 10. **Add to Cart Button Visibility** ✅
#### What to Test:
- [ ] Buttons are visible (not hidden)
- [ ] Buttons are clickable
- [ ] Buttons have proper styling
- [ ] Buttons work on all service types

#### Steps:
1. Go to /services
2. Scan through all items
3. **Every item should have 1-4 "Add to Cart" buttons**
   - One for each available service (wash, dryClean, iron, express)
4. Click each button type
5. Verify toast notification and cart update

---

## 🎯 Expected Results Summary

| Feature | Expected | Status |
|---------|----------|--------|
| Navbar with logo | ✅ Logo visible & clickable | ? |
| Cart badge | ✅ Shows item count | ? |
| Services page | ✅ Items + Add to Cart buttons | ? |
| Add to cart | ✅ Toast + badge update | ? |
| Cart page | ✅ Items, totals, tax | ? |
| Service filters | ✅ /washing, /iron, /leather, /alterations | ? |
| Profile page | ✅ Shows user info when logged in | ? |
| Responsive | ✅ Works on mobile & desktop | ? |

---

## 🐛 Troubleshooting

**Button not working?**
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

**Cart not updating?**
- Check browser console (F12 → Console tab)
- Verify localStorage is enabled

**Images not loading?**
- Check browser console for 404 errors
- Verify internet connection

**Page not loading?**
- Verify dev server is running: http://localhost:3001/
- Check terminal for errors

---

## 📝 Notes

- All data is stored in browser's localStorage (survives page refresh)
- Cart persists even after closing browser
- No backend required for basic functionality
- Images from Unsplash/CDN

---

## ✅ Final Checklist

After testing all features, mark completed:

- [ ] Navigation works
- [ ] Home page displays correctly
- [ ] Services page loads items
- [ ] Add to Cart buttons visible & working
- [ ] Cart badge updates in real-time
- [ ] Cart page shows correct totals
- [ ] Service filtering works (/washing, /iron, /leather, /alterations)
- [ ] Profile page accessible (when logged in)
- [ ] Logo appears everywhere
- [ ] Responsive design works

**Status**: Ready for testing! 🚀
