# Backend API for Loyalty, Referral, and Pricing System

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your MongoDB URI and email/push credentials.
3. Start the server:
   ```bash
   npm run dev
   ```

### Environment variables

- `SKIP_STOCK_INTEGRATION` (boolean) — when `true` (or when `NODE_ENV=test`) the backend
   will not attempt to call the external stock FastAPI service or execute local Python
   predictor scripts. Instead the backend returns a deterministic health stub. This is
   useful for CI and local test runs when the stock predictor is intentionally
   separate from the e-commerce backend. See `DEV_DOCS.md` for examples.

## API Endpoints

- `POST /api/signup` — User signup (with optional referral code)
- `POST /api/login` — User login
- `POST /api/order` — Place order, earn/redeem points, trigger referral bonus
- `GET /api/user/:id` — Get user profile, points, referral code, history
- `PATCH /api/admin/user/:id/loyalty` — Admin: adjust points/tier
- `GET /api/admin/loyalty/analytics` — Admin: analytics data
- `GET /api/admin/loyalty/export` — Admin: export loyalty data (CSV)
- `POST /api/admin/loyalty/promo` — Admin: schedule promotions
<!-- Stocks endpoints removed: handled by separate service/UI -->

## Models
- User (with referralCode, referredBy, points, loyaltyProfile)
- Order
- LoyaltyPointsHistory

## Notifications
- Email: Nodemailer (configurable)
- Push: Firebase Cloud Messaging (optional)

---

<!-- Stocks documentation removed: now separate microservice with its own UI -->