import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Button,
  useDisclosure,
  VStack,
  HStack,
  useToast,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { Task } from '../types/task';
import { TaskList } from '../components/task/TaskList';
import { TaskDetail } from '../components/task/TaskDetail';
import { TaskForm } from '../components/TaskForm';

// Mock data for testing
const MOCK_USERS = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
  { id: '3', name: 'Bob Johnson' },
];

const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: 'Implement user authentication',
    description: 'Add JWT-based authentication to the application',
    status: 'in_progress',
    priority: 'high',
    type: 'feature',
    labels: ['frontend', 'backend'],
    dueDate: '2024-03-15',
    assignedTo: '1',
    archived: false,
    sprintId: 'sprint-1',
    epicId: 'epic-1',
    storyPoints: 5,
    acceptanceCriteria: [
      'User can sign up with email and password',
      'User can log in with credentials',
      'JWT token is properly stored and managed',
    ],
    estimatedTime: 480,
    actualTime: 240,
    timeEntries: [
      {
        id: '1',
        userId: '1',
        duration: 240,
        description: 'Initial setup and research',
        date: '2024-03-10',
        createdAt: '2024-03-10T10:00:00Z',
      },
    ],
    dependencies: [],
    environment: 'development',
    browsers: ['Chrome', 'Firefox'],
    devices: ['Desktop'],
    operatingSystems: ['Windows', 'macOS'],
    tags: ['auth', 'security'],
    subtasks: [
      {
        id: '1',
        title: 'Set up JWT middleware',
        description: 'Implement JWT verification middleware',
        completed: true,
        assignedTo: '1',
        dueDate: '2024-03-12',
      },
    ],
    notes: 'Consider adding OAuth support in the future',
    isRecurring: false,
    comments: [
      {
        id: '1',
        userId: '1',
        content: 'Started working on the authentication system',
        createdAt: '2024-03-10T10:00:00Z',
        updatedAt: '2024-03-10T10:00:00Z',
      },
    ],
    attachments: [],
    customFields: {},
    isTemplate: false,
    workflowRules: [],
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
  },
];

export const TaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks([...tasks, newTask]);
    toast({
      title: 'Task created',
      status: 'success',
      duration: 3000,
    });
  };

  const handleEditTask = async (task: Task) => {
    setTasks(tasks.map((t) => (t.id === task.id ? task : t)));
    toast({
      title: 'Task updated',
      status: 'success',
      duration: 3000,
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
    toast({
      title: 'Task deleted',
      status: 'success',
      duration: 3000,
    });
  };

  const handleViewTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setSelectedTask(task);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Task Management</Heading>
          <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onOpen}>
            Create Task
          </Button>
        </HStack>

        {selectedTask ? (
          <Box>
            <Button mb={4} onClick={() => setSelectedTask(null)}>
              Back to List
            </Button>
            <TaskDetail
              task={selectedTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              availableUsers={MOCK_USERS}
              userId="1"
            />
          </Box>
        ) : (
          <TaskList
            tasks={tasks}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onView={handleViewTask}
            availableUsers={MOCK_USERS}
            userId="1"
          />
        )}

        <TaskForm
          isOpen={isOpen}
          onClose={onClose}
          onSubmit={handleCreateTask}
          userId="1"
          availableUsers={MOCK_USERS}
        />
      </VStack>
    </Container>
  );
};