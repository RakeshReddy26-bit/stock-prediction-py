import React, { ReactNode } from 'react';

type Props = { children?: ReactNode };

// Lightweight AuthProvider used by the frontend workspace for tests and dev.
export const AuthProvider: React.FC<Props> = ({ children }) => {
  // In the full app this would provide auth state; for workspace tests we provide a no-op provider.
  return <>{children}</>;
};

export default AuthProvider;
