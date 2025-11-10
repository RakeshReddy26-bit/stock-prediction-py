# E-commerce Platform with Stock Market Prediction

This repository contains a monorepo with two independent projects:

1. **E-commerce Backend and Frontend**: A full-stack e-commerce application built with React, TypeScript, and Node.js.
2. **Stock Market Prediction**: A standalone ML utility for stock market predictions using Python.hon.

## Repository Structure

- `frontend/` - React frontend for the e-commerce platform
- `backend/` - Node.js backend for the e-commerce platform
- `stock-market-prediction/` - Independent Python-based stock prediction service
- `personal-assistant-ai/` - Additional AI utilities

## Getting Started

### E-commerce Platform

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the backend:
   ```bash
   npm run dev:backend
   ```

3. Start the frontend:
   ```bash
   npm run dev:frontend
   ```

4. Run tests:
   ```bash
   npm test
   ```

### Stock Market Prediction

1. Navigate to the directory:
   ```bash
   cd stock-market-prediction
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the prediction script:
   ```bash
   python quick_predict.py --ticker AAPL
   ```

4. Run tests:
   ```bash
   python -m pytest
   ```

## Environment Variables

Create a `.env` file in the root for backend configuration:

```
MONGODB_URI=mongodb://localhost:27017/ecommerce
```

For frontend, create `.env.local`:

```
VITE_BACKEND_URL=http://localhost:3001
```

## Development

- Use `npm run dev:all` to start both frontend and backend concurrently.
- The root-level `vitest.config.ts` excludes legacy folders for clean testing.

## Notes

- The `stock-market-prediction/` project is fully independent and does not reference other parts of the repository.
- All legacy branding has been removed; this is now a generic e-commerce platform.
- Archived documentation is in `archive/` if needed for historical reference.