import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Task } from '../types/task';
import { FaBox, FaTruck, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import Photo from '../components/media/Photo';
import { Box, Container, Heading, Text, VStack, HStack, Image, Stack, Skeleton, SkeletonText, SkeletonCircle } from '@chakra-ui/react';

const statusSteps = [
  { key: 'Placed', label: 'Order Placed', icon: <FaBox /> },
  { key: 'In Processing', label: 'In Processing', icon: <FaSpinner /> },
  { key: 'Out for Delivery', label: 'Out for Delivery', icon: <FaTruck /> },
  { key: 'Completed', label: 'Completed', icon: <FaCheckCircle /> },
  { key: 'Cancelled', label: 'Cancelled', icon: <FaTimesCircle /> },
];

const statusColors: Record<string, string> = {
  'Placed': 'bg-blue-500',
  'In Processing': 'bg-yellow-500',
  'Out for Delivery': 'bg-purple-500',
  'Completed': 'bg-green-500',
  'Cancelled': 'bg-red-500',
};

const MyOrders: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      setLoading(true);
      const q = query(collection(db, 'tasks'), where('assignedTo', '==', user.id));
      const querySnapshot = await getDocs(q);
      const userOrders: Task[] = [];
      querySnapshot.forEach((doc) => {
        userOrders.push({ id: doc.id, ...doc.data() } as Task);
      });
      setOrders(userOrders);
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  if (authLoading || loading) {
    return (
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading size="lg" textAlign="center">My Orders</Heading>
          {[1, 2, 3].map((i) => (
            <Box key={i} p={6} borderWidth={1} borderRadius="lg" bg="white" shadow="md">
              <HStack spacing={4}>
                <SkeletonCircle size="12" />
                <VStack align="start" flex={1}>
                  <Skeleton height="6" width="200px" />
                  <SkeletonText noOfLines={2} spacing="4" />
                </VStack>
                <VStack align="end">
                  <Skeleton height="6" width="100px" />
                  <Skeleton height="8" width="120px" />
                </VStack>
              </HStack>
            </Box>
          ))}
        </VStack>
      </Container>
    );
  }

  if (!orders.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
        <div className="text-gray-500 mb-6">You haven't placed any orders. Click below to create your first order!</div>
        <a href="/dashboard" className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold shadow hover:bg-primary-700 transition text-lg">Create Order</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted dark:from-black dark:to-gray-900 py-8 px-2 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="w-full max-w-3xl"
      >
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-8 text-center tracking-tight">My Orders</h1>
        <div className="space-y-8">
          {orders.map((order, idx) => {
            // Find the current step index
            const currentStepIdx = statusSteps.findIndex(s => s.key === order.status) || 0;
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 + 0.2, duration: 0.5 }}
                className="rounded-3xl shadow-xl p-8 bg-white/80 dark:bg-black/60 border border-gray-200 dark:border-gray-800 glass-card"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <Photo
                      category="clothes"
                      alt={`${order.title} order`}
                      size="sm"
                      className="w-16 h-16 rounded-lg flex-shrink-0"
                      aspectRatio="square"
                    />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{order.title}</h2>
                      <div className="text-gray-500 dark:text-gray-300 mb-1">Due: {order.dueDate}</div>
                      <div className="text-gray-700 dark:text-gray-200 mb-2">{order.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${statusColors[order.status] || 'bg-gray-400'} text-white shadow`}>{order.status}</span>
                  </div>
                </div>
                {/* Timeline */}
                <div className="flex items-center justify-between gap-2 md:gap-4 mt-4">
                  {statusSteps.map((step, i) => (
                    <div key={step.key} className="flex-1 flex flex-col items-center relative">
                      <motion.div
                        className={`w-10 h-10 flex items-center justify-center rounded-full border-2 shadow-lg mb-1 z-10
                          ${i < currentStepIdx ? 'bg-green-500 border-green-500 text-white' :
                            i === currentStepIdx ? 'bg-primary-600 border-primary-600 text-white animate-pulse' :
                            'bg-gray-200 border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500'}`}
                        animate={i === currentStepIdx ? { scale: [1, 1.1, 1] } : {}}
                        transition={i === currentStepIdx ? { repeat: Infinity, duration: 1.2, ease: 'easeInOut' } : {}}
                      >
                        {step.icon}
                      </motion.div>
                      <div className={`text-xs text-center mt-1 ${i === currentStepIdx ? 'font-bold text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'}`}>{step.label}</div>
                      {/* Connector */}
                      {i < statusSteps.length - 1 && (
                        <div className={`absolute top-5 left-1/2 w-full h-1 z-0 ${i < currentStepIdx ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-700'}`} style={{ width: '100%', height: 2, left: '50%', transform: 'translateX(0%)' }}></div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default MyOrders;