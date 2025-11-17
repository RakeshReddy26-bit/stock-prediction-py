import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { Task } from '../../types/task';

interface TimeTrackingChartProps {
  tasks: Task[];
}

export const TimeTrackingChart: React.FC<TimeTrackingChartProps> = ({ tasks }) => {
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const gridColor = useColorModeValue('gray.200', 'gray.600');

  // Calculate time tracking data
  const timeData = tasks
    .filter(task => task.estimatedTime > 0 || task.actualTime > 0)
    .slice(0, 8) // Show top 8 tasks
    .map(task => ({
      title: task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title,
      estimated: task.estimatedTime / 60, // Convert to hours
      actual: task.actualTime / 60, // Convert to hours
      accuracy: task.estimatedTime > 0 ? (task.actualTime / task.estimatedTime) * 100 : 0,
    }));

  if (timeData.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.500">No time tracking data available</Text>
      </Box>
    );
  }

  // Chart dimensions
  const width = 400;
  const height = 250;
  const padding = { top: 20, right: 20, bottom: 60, left: 80 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate scales
  const maxTime = Math.max(
    ...timeData.map(d => Math.max(d.estimated, d.actual)),
    1
  );

  const xScale = (index: number) => 
    padding.left + (index / (timeData.length - 1)) * chartWidth;

  const barWidth = chartWidth / timeData.length * 0.6;

  return (
    <VStack spacing={4} align="stretch">
      {/* Chart */}
      <Box position="relative" height={`${height}px`}>
        <svg width={width} height={height}>
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = padding.top + (i / 4) * chartHeight;
            const value = Math.round((i / 4) * maxTime);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={gridColor}
                  strokeWidth="1"
                  opacity="0.3"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  fontSize="10"
                  fill={textColor}
                  textAnchor="end"
                >
                  {value}h
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {timeData.map((data, index) => {
            const x = xScale(index) - barWidth / 2;
            const estimatedHeight = chartHeight - (data.estimated / maxTime) * chartHeight;
            const actualHeight = chartHeight - (data.actual / maxTime) * chartHeight;
            
            return (
              <g key={index}>
                {/* Estimated time bar */}
                <rect
                  x={x - 8}
                  y={padding.top + estimatedHeight}
                  width={barWidth / 2}
                  height={chartHeight - estimatedHeight}
                  fill="#E2E8F0"
                  stroke="#CBD5E0"
                  strokeWidth="1"
                />
                
                {/* Actual time bar */}
                <rect
                  x={x + 8}
                  y={padding.top + actualHeight}
                  width={barWidth / 2}
                  height={chartHeight - actualHeight}
                  fill={data.accuracy > 120 ? "#E53E3E" : data.accuracy > 80 ? "#38A169" : "#D69E2E"}
                  stroke="#2D3748"
                  strokeWidth="1"
                />

                {/* Task title */}
                <text
                  x={xScale(index)}
                  y={height - 10}
                  fontSize="8"
                  fill={textColor}
                  textAnchor="middle"
                  transform={`rotate(-45 ${xScale(index)} ${height - 10})`}
                >
                  {data.title}
                </text>
              </g>
            );
          })}
        </svg>
      </Box>

      {/* Legend */}
      <HStack spacing={6} justify="center">
        <HStack spacing={2}>
          <Box width="12px" height="12px" bg="#E2E8F0" border="1px" borderColor="#CBD5E0" />
          <Text fontSize="sm" color={textColor}>Estimated</Text>
        </HStack>
        <HStack spacing={2}>
          <Box width="12px" height="12px" bg="#38A169" border="1px" borderColor="#2D3748" />
          <Text fontSize="sm" color={textColor}>Actual (Good)</Text>
        </HStack>
        <HStack spacing={2}>
          <Box width="12px" height="12px" bg="#D69E2E" border="1px" borderColor="#2D3748" />
          <Text fontSize="sm" color={textColor}>Actual (Over)</Text>
        </HStack>
      </HStack>

      {/* Summary stats */}
      <VStack spacing={2} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.500">Total Estimated:</Text>
          <Text fontSize="sm" fontWeight="bold" color={textColor}>
            {(timeData.reduce((sum, d) => sum + d.estimated, 0)).toFixed(1)}h
          </Text>
        </HStack>
        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.500">Total Actual:</Text>
          <Text fontSize="sm" fontWeight="bold" color={textColor}>
            {(timeData.reduce((sum, d) => sum + d.actual, 0)).toFixed(1)}h
          </Text>
        </HStack>
        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.500">Average Accuracy:</Text>
          <Text fontSize="sm" fontWeight="bold" color={textColor}>
            {(timeData.reduce((sum, d) => sum + d.accuracy, 0) / timeData.length).toFixed(1)}%
          </Text>
        </HStack>
      </VStack>
    </VStack>
  );
}; 