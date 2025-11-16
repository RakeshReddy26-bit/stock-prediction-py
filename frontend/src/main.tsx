import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import theme from './theme';
import './index.css';

// Expose BACKEND_URL to runtime via window for the api helper.
// This lets the helper pick up VITE_BACKEND_URL when Vite injects it, or (in Node-like envs) process.env when available.
// Avoid referencing `process` directly in the browser where it's undefined.
// @ts-ignore
const runtimeBackend = (import.meta as any)?.env?.VITE_BACKEND_URL ?? (typeof process !== 'undefined' && process.env ? (process.env.BACKEND_URL as any) : undefined);
;(window as any).__BACKEND_URL = runtimeBackend;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ChakraProvider>
    </BrowserRouter>
  </React.StrictMode>
);