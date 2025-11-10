import React, { ReactNode } from 'react';

type Props = { children?: ReactNode };

// Simple passthrough component used where animated route transitions are not required
// in the frontend workspace test environment.
export default function PageTransition({ children }: Props) {
  return <>{children}</>;
}
