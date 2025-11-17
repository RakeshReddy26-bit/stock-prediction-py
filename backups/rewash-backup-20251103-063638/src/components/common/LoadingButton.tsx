import React from 'react';
import { Button, ButtonProps, Spinner } from '@chakra-ui/react';

interface LoadingButtonProps extends ButtonProps {
  loading: boolean;
  children: React.ReactNode;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({ loading, children, ...props }) => {
  return (
    <Button {...props} disabled={loading || props.disabled}>
      {loading && <Spinner size="sm" mr={2} />}
      {children}
    </Button>
  );
};

export default LoadingButton;
