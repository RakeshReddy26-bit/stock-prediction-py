import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Skeleton,
  SkeletonText,
  Box,
  SkeletonCircle,
  Container,
  VStack,
  HStack,
  Flex,
  Avatar,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Divider,
  Grid,
  Card,
  CardBody,
  Badge,
} from '@chakra-ui/react';
import { FaBox, FaCreditCard, FaMapMarkerAlt, FaSignOutAlt } from 'react-icons/fa';

export default function Profile() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Mock save - in production, call Firebase updateProfile
      console.log('Saving profile:', formData);
      toast({
        title: 'Profile updated!',
        description: 'Your profile has been saved successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <Box minH="screen" bg="gradient-to-br" py={8} display="flex" alignItems="center" justifyContent="center" px={2}>
        <Box w="full" maxW="2xl" backdropFilter="blur(10px)" bg="white/70" borderWidth={1} borderColor="border" borderRadius="3xl" shadow="2xl" p={{ base: 8, md: 12 }}>
          <Flex alignItems="center" gap={6} mb={8}>
            <SkeletonCircle size="24" />
            <div>
              <Skeleton height="36px" width="200px" mb={1} />
              <Skeleton height="20px" width="150px" />
              <Skeleton height="20px" width="80px" mt={2} />
            </div>
          </Flex>
          <Box bg="white/80" borderRadius="2xl" shadow="md" p={6} mb={8}>
            <Skeleton height="24px" width="150px" mb={6} />
            <SkeletonText mt="4" noOfLines={4} spacing="4" />
          </Box>
          <Box bg="white/80" borderRadius="2xl" shadow="md" p={6}>
            <Skeleton height="24px" width="150px" mb={6} />
            <Skeleton height="40px" width="full" />
          </Box>
        </Box>
      </Box>
    );
  }

  if (!user) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={6} align="center" textAlign="center">
          <Heading>Please Log In</Heading>
          <Text fontSize="lg" color="gray.600">
            You need to be signed in to view your profile.
          </Text>
          <Button
            colorScheme="blue"
            size="lg"
            onClick={() => navigate('/login', { state: { from: '/profile' } })}
          >
            Go to Login
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={12}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <VStack spacing={8} align="stretch">
          {/* Profile Header */}
          <Card shadow="lg">
            <CardBody>
              <VStack spacing={6}>
                <HStack spacing={6}>
                  <Avatar
                    size="2xl"
                    src={user.photoURL || undefined}
                    name={user.displayName || user.name}
                  />
                  <VStack align="start" spacing={2}>
                    <Heading size="lg">{user.displayName || user.name || 'User'}</Heading>
                    <Text color="gray.600">{user.email}</Text>
                    <Badge colorScheme="blue">{user.role || 'Customer'}</Badge>
                  </VStack>
                </HStack>

                <Divider />

                {/* Edit Profile Section */}
                {isEditing ? (
                  <VStack spacing={4} w="full">
                    <FormControl>
                      <FormLabel>Display Name</FormLabel>
                      <Input
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        placeholder="Enter your name"
                        aria-label="Display Name"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Email</FormLabel>
                      <Input
                        name="email"
                        value={formData.email}
                        isReadOnly
                        aria-label="Email (read-only)"
                      />
                    </FormControl>
                    <HStack spacing={4} w="full">
                      <Button
                        colorScheme="blue"
                        isLoading={isSaving}
                        onClick={handleSave}
                        flex={1}
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        flex={1}
                      >
                        Cancel
                      </Button>
                    </HStack>
                  </VStack>
                ) : (
                  <Button
                    colorScheme="blue"
                    onClick={() => setIsEditing(true)}
                    w="full"
                  >
                    Edit Profile
                  </Button>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Quick Links */}
          <VStack spacing={4} align="stretch">
            <Heading size="md">Quick Links</Heading>
            <Grid templateColumns="1fr" gap={3}>
              <Button
                leftIcon={<FaBox />}
                justifyContent="flex-start"
                variant="outline"
                onClick={() => navigate('/my-orders')}
                h="auto"
                py={3}
              >
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold">My Orders</Text>
                  <Text fontSize="sm" color="gray.600">View your order history</Text>
                </VStack>
              </Button>

              <Button
                leftIcon={<FaCreditCard />}
                justifyContent="flex-start"
                variant="outline"
                isDisabled
                h="auto"
                py={3}
              >
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold">Payment Methods</Text>
                  <Text fontSize="sm" color="gray.600">Coming soon</Text>
                </VStack>
              </Button>

              <Button
                leftIcon={<FaMapMarkerAlt />}
                justifyContent="flex-start"
                variant="outline"
                isDisabled
                h="auto"
                py={3}
              >
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold">Addresses</Text>
                  <Text fontSize="sm" color="gray.600">Coming soon</Text>
                </VStack>
              </Button>
            </Grid>
          </VStack>

          {/* Logout */}
          <Button
            leftIcon={<FaSignOutAlt />}
            colorScheme="red"
            variant="outline"
            w="full"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </VStack>
      </motion.div>
    </Container>
  );
}