import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  Divider,
  Badge,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';

const OrderConfirmation: React.FC = () => {
  // In a real app, this would come from route params or context
  const orderNumber = `RW${Date.now().toString().slice(-8)}`;

  return (
    <Container maxW="container.md" py={16}>
      <VStack spacing={8} align="stretch">
        <VStack spacing={4}>
          <Alert status="success" borderRadius="lg">
            <AlertIcon />
            <Box>
              <Heading size="md">Order Confirmed!</Heading>
              <Text>Your laundry order has been successfully placed.</Text>
            </Box>
          </Alert>

          <Card>
            <CardBody>
              <VStack spacing={6} align="stretch">
                <VStack spacing={2}>
                  <Heading size="lg">Thank you for choosing ReWash!</Heading>
                  <Text color="gray.600">
                    Your order has been confirmed and is being processed. You'll receive an email confirmation shortly.
                  </Text>
                </VStack>

                <Divider />

                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <Text fontWeight="medium">Order Number:</Text>
                    <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                      {orderNumber}
                    </Badge>
                  </HStack>

                  <HStack justify="space-between">
                    <Text fontWeight="medium">Estimated Pickup:</Text>
                    <Text>2-3 business days</Text>
                  </HStack>

                  <HStack justify="space-between">
                    <Text fontWeight="medium">Status:</Text>
                    <Badge colorScheme="green">Confirmed</Badge>
                  </HStack>
                </VStack>

                <Divider />

                <VStack spacing={4}>
                  <Text fontWeight="medium">What's next?</Text>
                  <VStack align="start" spacing={2} fontSize="sm" color="gray.600">
                    <Text>• You'll receive a confirmation email with order details</Text>
                    <Text>• Our team will inspect and process your items</Text>
                    <Text>• We'll notify you when your laundry is ready for pickup</Text>
                    <Text>• You can track your order status in your account</Text>
                  </VStack>
                </VStack>

                <HStack spacing={4} justify="center" pt={4}>
                  <Button as={Link} to="/dashboard" colorScheme="blue">
                    View My Orders
                  </Button>
                  <Button as={Link} to="/services" variant="outline">
                    Order More Services
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </VStack>
    </Container>
  );
};

export default OrderConfirmation;
