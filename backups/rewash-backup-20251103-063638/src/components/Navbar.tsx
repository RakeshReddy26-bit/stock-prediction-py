import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCartStore } from '../store/cartStore';
import { motion } from 'framer-motion';
import {
  Box,
  Flex,
  Text,
  Button,
  Avatar,
  HStack,
  Link,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  IconButton,
  Image as ChakraImage,
} from '@chakra-ui/react';
import { FaShoppingCart, FaSignOutAlt, FaUser, FaBox, FaCreditCard } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { items } = useCartStore();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfileClick = () => {
    if (!user) {
      navigate('/login', { state: { from: '/profile' } });
    }
  };

  return (
    <Box bg="white" shadow="sm" borderBottom="1px" borderColor="gray.200">
      <Box maxW="7xl" mx="auto" px={4} py={4}>
        <Flex justify="space-between" align="center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              as={RouterLink}
              to="/"
              _hover={{ textDecoration: 'none' }}
              aria-label="ReWash Home"
            >
              <ChakraImage
                src="https://user-gen-media-assets.s3.amazonaws.com/seedream_images/7986ccd2-e769-40ba-99ac-5e248a7d8bdb.png"
                alt="ReWash Logo"
                height="40px"
                objectFit="contain"
              />
            </Link>
          </motion.div>

          <Flex align="center" gap={4}>
            {user ? (
              <>
                <Link
                  as={RouterLink}
                  to="/services"
                  color="gray.700"
                  _hover={{ color: 'brand.500' }}
                  px={3}
                  py={2}
                  borderRadius="md"
                  fontSize="sm"
                  fontWeight="medium"
                >
                  Services
                </Link>
                {/* Stocks link removed */}

                {/* Cart Icon with Badge */}
                <IconButton
                  icon={<FaShoppingCart />}
                  onClick={() => navigate('/cart')}
                  variant="ghost"
                  aria-label="Shopping cart"
                  position="relative"
                  _hover={{ color: 'brand.500' }}
                >
                  {totalItems > 0 && (
                    <Badge
                      position="absolute"
                      top="-1"
                      right="-1"
                      borderRadius="full"
                      bg="red.500"
                      color="white"
                      fontSize="10px"
                      fontWeight="bold"
                      aria-label={`${totalItems} items in cart`}
                    >
                      {totalItems}
                    </Badge>
                  )}
                </IconButton>

                {/* Profile Menu */}
                <Menu>
                  <MenuButton
                    as={Button}
                    variant="ghost"
                    size="sm"
                    borderRadius="full"
                  >
                    <Avatar
                      size="sm"
                      src={user.photoURL || undefined}
                      name={user.displayName || user.name || 'User'}
                      aria-label={`${user.displayName || 'Profile'}`}
                    />
                  </MenuButton>
                  <MenuList>
                    <MenuItem
                      icon={<FaUser />}
                      onClick={() => navigate('/profile')}
                    >
                      My Profile
                    </MenuItem>
                    <MenuItem icon={<FaBox />} onClick={() => navigate('/my-orders')}>
                      My Orders
                    </MenuItem>
                    <MenuItem icon={<FaCreditCard />} isDisabled>
                      Payment Methods
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem
                      icon={<FaSignOutAlt />}
                      onClick={handleLogout}
                      color="red.600"
                    >
                      Logout
                    </MenuItem>
                  </MenuList>
                </Menu>
              </>
            ) : (
              <>
                <Link
                  as={RouterLink}
                  to="/services"
                  color="gray.700"
                  _hover={{ color: 'brand.500' }}
                  px={3}
                  py={2}
                  borderRadius="md"
                  fontSize="sm"
                  fontWeight="medium"
                >
                  Services
                </Link>
                {/* Stocks link removed */}

                {/* Cart Icon with Badge (unauthenticated) */}
                <IconButton
                  icon={<FaShoppingCart />}
                  onClick={() => navigate('/cart')}
                  variant="ghost"
                  aria-label="Shopping cart"
                  position="relative"
                  _hover={{ color: 'brand.500' }}
                >
                  {totalItems > 0 && (
                    <Badge
                      position="absolute"
                      top="-1"
                      right="-1"
                      borderRadius="full"
                      bg="red.500"
                      color="white"
                      fontSize="10px"
                      fontWeight="bold"
                      aria-label={`${totalItems} items in cart`}
                    >
                      {totalItems}
                    </Badge>
                  )}
                </IconButton>

                <Link
                  as={RouterLink}
                  to="/login"
                  color="gray.700"
                  _hover={{ color: 'brand.500' }}
                  px={3}
                  py={2}
                  borderRadius="md"
                  fontSize="sm"
                  fontWeight="medium"
                >
                  Login
                </Link>
                <Button
                  as={RouterLink}
                  to="/signup"
                  bg="brand.500"
                  color="white"
                  _hover={{ bg: 'brand.600' }}
                  px={4}
                  py={2}
                  borderRadius="md"
                  fontSize="sm"
                  fontWeight="medium"
                >
                  Sign Up
                </Button>
              </>
            )}
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
};

export default Navbar;