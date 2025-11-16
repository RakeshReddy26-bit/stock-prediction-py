import React, { ReactNode } from 'react';

type Props = { children?: ReactNode };

// Simple passthrough used in the top-level src workspace to satisfy imports.
export default function PageTransition({ children }: Props) {
  return <>{children}</>;
}
