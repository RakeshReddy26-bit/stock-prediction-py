import React from 'react';
import { Box, VStack, HStack, Text, useColorModeValue } from '@chakra-ui/react';
import { Task } from '../../types/task';

interface BurndownChartProps {
  tasks: Task[];
  sprintStart: string; // ISO date string
  sprintEnd: string;   // ISO date string
}

export const BurndownChart: React.FC<BurndownChartProps> = ({ tasks, sprintStart, sprintEnd }) => {
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const gridColor = useColorModeValue('gray.200', 'gray.600');

  // Generate date range for the sprint
  const getDateRange = (start: Date, end: Date) => {
    const range = [];
    const current = new Date(start);
    while (current <= end) {
      range.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return range;
  };

  const sprintStartDate = new Date(sprintStart);
  const sprintEndDate = new Date(sprintEnd);
  const dateRange = getDateRange(sprintStartDate, sprintEndDate);

  // Calculate ideal burndown (linear)
  const totalTasks = tasks.length;
  const idealBurndown = dateRange.map((_, i) => totalTasks - (i * totalTasks) / (dateRange.length - 1));

  // Calculate actual burndown (remaining tasks per day)
  const actualBurndown = dateRange.map((date) => {
    // Count tasks not completed by this day
    return tasks.filter(
      (task) => {
        const created = new Date(task.createdAt);
        const completed = task.status === 'completed' ? new Date(task.updatedAt) : null;
        return created <= date && (!completed || completed > date);
      }
    ).length;
  });

  // Chart dimensions
  const width = 400;
  const height = 200;
  const padding = 40;
  const maxY = totalTasks;

  const xScale = (index: number) => padding + (index / (dateRange.length - 1)) * (width - 2 * padding);
  const yScale = (value: number) => height - padding - (value / maxY) * (height - 2 * padding);

  // Generate path for ideal burndown
  const idealPath = idealBurndown
    .map((y, i) => {
      const x = xScale(i);
      const yVal = yScale(y);
      return i === 0 ? `M ${x} ${yVal}` : `L ${x} ${yVal}`;
    })
    .join(' ');

  // Generate path for actual burndown
  const actualPath = actualBurndown
    .map((y, i) => {
      const x = xScale(i);
      const yVal = yScale(y);
      return i === 0 ? `M ${x} ${yVal}` : `L ${x} ${yVal}`;
    })
    .join(' ');

  return (
    <VStack spacing={4} align="stretch">
      <Box position="relative" height={`${height}px`}>
        <svg width={width} height={height}>
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = height - padding - (i / 4) * (height - 2 * padding);
            const value = Math.round((i / 4) * maxY);
            return (
              <g key={i}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke={gridColor}
                  strokeWidth="1"
                  opacity="0.3"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  fontSize="10"
                  fill={textColor}
                  textAnchor="end"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* Ideal burndown line */}
          <path
            d={idealPath}
            stroke="#3182CE"
            strokeWidth="3"
            fill="none"
            strokeDasharray="6,4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Actual burndown line */}
          <path
            d={actualPath}
            stroke="#E53E3E"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Box>
      {/* Legend */}
      <HStack spacing={6} justify="center">
        <HStack spacing={2}>
          <Box width="12px" height="3px" bg="#3182CE" borderRadius="1px" />
          <Text fontSize="sm" color={textColor}>Ideal</Text>
        </HStack>
        <HStack spacing={2}>
          <Box width="12px" height="3px" bg="#E53E3E" borderRadius="1px" />
          <Text fontSize="sm" color={textColor}>Actual</Text>
        </HStack>
      </HStack>
    </VStack>
  );
}; 