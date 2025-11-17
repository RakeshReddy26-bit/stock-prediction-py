import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton, SkeletonText, Box } from '@chakra-ui/react';

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Box className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <Skeleton height="32px" width="200px" mb={4} />
            <SkeletonText mt="4" noOfLines={2} spacing="4" />
            <Skeleton height="40px" width="150px" mt={6} />
            <Skeleton height="40px" width="150px" mt={4} />
          </Box>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Dashboard</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Welcome, {user?.displayName || user?.email}!
          </p>
          <div className="space-y-4">
            <Link
              to="/orders/history"
              className="block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              View Orders
            </Link>
            <Link
              to="/services"
              className="block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              Browse Services
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;