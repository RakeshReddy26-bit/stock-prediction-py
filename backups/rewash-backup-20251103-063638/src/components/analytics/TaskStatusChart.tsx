import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Circle,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';

interface TaskStatusData {
  todo: number;
  in_progress: number;
  completed: number;
  blocked: number;
  review: number;
}

interface TaskStatusChartProps {
  data: TaskStatusData;
}

const statusColors = {
  todo: '#E2E8F0',
  in_progress: '#3182CE',
  completed: '#38A169',
  blocked: '#E53E3E',
  review: '#D69E2E',
};

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
  review: 'Review',
};

export const TaskStatusChart: React.FC<TaskStatusChartProps> = ({ data }) => {
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const bgColor = useColorModeValue('white', 'gray.800');

  // Calculate total and percentages
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  const percentages = Object.entries(data).map(([key, value]) => ({
    status: key as keyof TaskStatusData,
    value,
    percentage: total > 0 ? (value / total) * 100 : 0,
  }));

  // Filter out zero values
  const nonZeroData = percentages.filter(item => item.value > 0);

  if (nonZeroData.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.500">No task data available</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* Chart */}
      <Box position="relative" height="200px" display="flex" alignItems="center" justifyContent="center">
        <Box
          position="relative"
          width="150px"
          height="150px"
          borderRadius="50%"
          background={`conic-gradient(${nonZeroData
            .map((item, index) => {
              const startAngle = nonZeroData
                .slice(0, index)
                .reduce((sum, d) => sum + d.percentage, 0);
              const endAngle = startAngle + item.percentage;
              return `${statusColors[item.status]} ${startAngle}% ${endAngle}%`;
            })
            .join(', ')})`}
        />
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          width="80px"
          height="80px"
          borderRadius="50%"
          bg={bgColor}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text fontSize="lg" fontWeight="bold" color={textColor}>
            {total}
          </Text>
        </Box>
      </Box>

      {/* Legend */}
      <VStack spacing={2} align="stretch">
        {nonZeroData.map((item) => (
          <Flex key={item.status} justify="space-between" align="center">
            <HStack spacing={3}>
              <Circle size="12px" bg={statusColors[item.status]} />
              <Text fontSize="sm" color={textColor}>
                {statusLabels[item.status]}
              </Text>
            </HStack>
            <HStack spacing={1}>
              <Text fontSize="sm" fontWeight="bold" color={textColor}>
                {item.value}
              </Text>
              <Text fontSize="xs" color="gray.500">
                ({item.percentage.toFixed(1)}%)
              </Text>
            </HStack>
          </Flex>
        ))}
      </VStack>
    </VStack>
  );
}; 