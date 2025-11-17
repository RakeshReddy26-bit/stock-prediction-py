import React from 'react';
import { Box, VStack, HStack, Text, useColorModeValue } from '@chakra-ui/react';
import { Task } from '../../types/task';

interface SprintVelocityChartProps {
  tasks: Task[];
}

export const SprintVelocityChart: React.FC<SprintVelocityChartProps> = ({ tasks }) => {
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const gridColor = useColorModeValue('gray.200', 'gray.600');

  // Group completed story points by sprint
  const sprintMap: Record<string, { name: string; points: number }> = {};
  tasks.forEach((task) => {
    if (task.sprintId && task.status === 'completed') {
      if (!sprintMap[task.sprintId]) {
        sprintMap[task.sprintId] = { name: task.sprintId, points: 0 };
      }
      sprintMap[task.sprintId].points += task.storyPoints || 0;
    }
  });
  const sprints = Object.values(sprintMap).sort((a, b) => a.name.localeCompare(b.name));
  const maxPoints = Math.max(...sprints.map(s => s.points), 1);

  // Chart dimensions
  const width = 400;
  const height = 200;
  const padding = 40;
  const barWidth = (width - 2 * padding) / (sprints.length || 1) * 0.6;

  const xScale = (index: number) => padding + (index + 0.5) * ((width - 2 * padding) / (sprints.length || 1));
  const yScale = (value: number) => height - padding - (value / maxPoints) * (height - 2 * padding);

  return (
    <VStack spacing={4} align="stretch">
      <Box position="relative" height={`${height}px`}>
        <svg width={width} height={height}>
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => {
            const y = height - padding - (i / 4) * (height - 2 * padding);
            const value = Math.round((i / 4) * maxPoints);
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

          {/* Bars */}
          {sprints.map((sprint, i) => {
            const x = xScale(i) - barWidth / 2;
            const y = yScale(sprint.points);
            return (
              <g key={sprint.name}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={height - padding - y}
                  fill="#3182CE"
                  stroke="#2B6CB0"
                  strokeWidth="1"
                  rx={4}
                />
                <text
                  x={x + barWidth / 2}
                  y={height - padding + 16}
                  fontSize="10"
                  fill={textColor}
                  textAnchor="middle"
                >
                  {sprint.name}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  fontSize="10"
                  fill={textColor}
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {sprint.points}
                </text>
              </g>
            );
          })}
        </svg>
      </Box>
      <HStack spacing={2} justify="center">
        <Box width="12px" height="12px" bg="#3182CE" borderRadius="2px" />
        <Text fontSize="sm" color={textColor}>Story Points Completed</Text>
      </HStack>
    </VStack>
  );
}; 