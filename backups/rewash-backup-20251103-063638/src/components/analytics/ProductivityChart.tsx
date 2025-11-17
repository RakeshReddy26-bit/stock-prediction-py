import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { Task } from '../../types/task';

interface ProductivityChartProps {
  tasks: Task[];
  timeRange: '7d' | '30d' | '90d' | '1y';
}

export const ProductivityChart: React.FC<ProductivityChartProps> = ({ tasks, timeRange }) => {
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const gridColor = useColorModeValue('gray.200', 'gray.600');

  // Generate date range based on timeRange
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // Generate data points
  const generateDataPoints = () => {
    const dataPoints = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const tasksForDate = tasks.filter(task => {
        const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
        return taskDate === dateStr;
      });
      
      dataPoints.push({
        date: dateStr,
        completed: tasksForDate.filter(task => task.status === 'completed').length,
        created: tasksForDate.length,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dataPoints;
  };

  const dataPoints = generateDataPoints();
  
  if (dataPoints.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.500">No productivity data available</Text>
      </Box>
    );
  }

  // Chart dimensions
  const width = 400;
  const height = 200;
  const padding = 40;

  // Calculate scales
  const maxCompleted = Math.max(...dataPoints.map(d => d.completed), 1);
  const maxCreated = Math.max(...dataPoints.map(d => d.created), 1);
  const maxValue = Math.max(maxCompleted, maxCreated);

  const xScale = (index: number) => padding + (index / (dataPoints.length - 1)) * (width - 2 * padding);
  const yScale = (value: number) => height - padding - (value / maxValue) * (height - 2 * padding);

  // Generate path for completed tasks
  const completedPath = dataPoints
    .map((point, index) => {
      const x = xScale(index);
      const y = yScale(point.completed);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  // Generate path for created tasks
  const createdPath = dataPoints
    .map((point, index) => {
      const x = xScale(index);
      const y = yScale(point.created);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  return (
    <VStack spacing={4} align="stretch">
      {/* Chart */}
      <Box position="relative" height={`${height}px`}>
        <svg width={width} height={height}>
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = height - padding - (i / 4) * (height - 2 * padding);
            return (
              <line
                key={i}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke={gridColor}
                strokeWidth="1"
                opacity="0.3"
              />
            );
          })}
          
          {/* Y-axis labels */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = height - padding - (i / 4) * (height - 2 * padding);
            const value = Math.round((i / 4) * maxValue);
            return (
              <text
                key={i}
                x={padding - 10}
                y={y + 4}
                fontSize="10"
                fill={textColor}
                textAnchor="end"
              >
                {value}
              </text>
            );
          })}

          {/* Completed tasks line */}
          <path
            d={completedPath}
            stroke="#38A169"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Created tasks line */}
          <path
            d={createdPath}
            stroke="#3182CE"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {dataPoints.map((point, index) => {
            const x = xScale(index);
            const yCompleted = yScale(point.completed);
            const yCreated = yScale(point.created);
            
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={yCompleted}
                  r="4"
                  fill="#38A169"
                />
                <circle
                  cx={x}
                  cy={yCreated}
                  r="4"
                  fill="#3182CE"
                />
              </g>
            );
          })}
        </svg>
      </Box>

      {/* Legend */}
      <HStack spacing={6} justify="center">
        <HStack spacing={2}>
          <Box width="12px" height="3px" bg="#38A169" borderRadius="1px" />
          <Text fontSize="sm" color={textColor}>Completed</Text>
        </HStack>
        <HStack spacing={2}>
          <Box width="12px" height="3px" bg="#3182CE" borderRadius="1px" />
          <Text fontSize="sm" color={textColor}>Created</Text>
        </HStack>
      </HStack>

      {/* Summary stats */}
      <HStack justify="space-between" pt={2}>
        <VStack align="start" spacing={1}>
          <Text fontSize="xs" color="gray.500">Total Completed</Text>
          <Text fontSize="lg" fontWeight="bold" color="green.600">
            {dataPoints.reduce((sum, d) => sum + d.completed, 0)}
          </Text>
        </VStack>
        <VStack align="start" spacing={1}>
          <Text fontSize="xs" color="gray.500">Total Created</Text>
          <Text fontSize="lg" fontWeight="bold" color="blue.600">
            {dataPoints.reduce((sum, d) => sum + d.created, 0)}
          </Text>
        </VStack>
        <VStack align="start" spacing={1}>
          <Text fontSize="xs" color="gray.500">Avg Daily</Text>
          <Text fontSize="lg" fontWeight="bold" color={textColor}>
            {(dataPoints.reduce((sum, d) => sum + d.completed, 0) / dataPoints.length).toFixed(1)}
          </Text>
        </VStack>
      </HStack>
    </VStack>
  );
}; 