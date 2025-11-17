import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Progress,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';

interface TaskPriorityData {
  urgent: number;
  high: number;
  medium: number;
  low: number;
}

interface TaskPriorityChartProps {
  data: TaskPriorityData;
}

const priorityColors = {
  urgent: '#E53E3E',
  high: '#DD6B20',
  medium: '#D69E2E',
  low: '#38A169',
};

const priorityLabels = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const TaskPriorityChart: React.FC<TaskPriorityChartProps> = ({ data }) => {
  const textColor = useColorModeValue('gray.700', 'gray.200');

  // Calculate total and percentages
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  const priorities = Object.entries(data).map(([key, value]) => ({
    priority: key as keyof TaskPriorityData,
    value,
    percentage: total > 0 ? (value / total) * 100 : 0,
  }));

  // Filter out zero values
  const nonZeroData = priorities.filter(item => item.value > 0);

  if (nonZeroData.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.500">No priority data available</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {nonZeroData.map((item) => (
        <Box key={item.priority}>
          <Flex justify="space-between" align="center" mb={2}>
            <HStack spacing={3}>
              <Box
                width="12px"
                height="12px"
                borderRadius="2px"
                bg={priorityColors[item.priority]}
              />
              <Text fontSize="sm" color={textColor} fontWeight="medium">
                {priorityLabels[item.priority]}
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
          <Progress
            value={item.percentage}
            colorScheme="gray"
            bg="gray.100"
            sx={{
              '& > div': {
                bg: priorityColors[item.priority],
              },
            }}
            height="8px"
            borderRadius="4px"
          />
        </Box>
      ))}
      
      {/* Summary */}
      <Box pt={4} borderTop="1px" borderColor="gray.200">
        <Flex justify="space-between" align="center">
          <Text fontSize="sm" color="gray.600" fontWeight="medium">
            Total Tasks
          </Text>
          <Text fontSize="lg" fontWeight="bold" color={textColor}>
            {total}
          </Text>
        </Flex>
      </Box>
    </VStack>
  );
}; 