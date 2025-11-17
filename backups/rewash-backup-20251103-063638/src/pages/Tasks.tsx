import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Button,
  useDisclosure,
  VStack,
  HStack,
  useToast,
  Stack,
  Select,
  Input,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { Task, TaskStatus, TaskPriority } from '../types/task';
import { TaskList } from '../components/task/TaskList';
import { TaskForm } from '../components/TaskForm';
import { useTaskStore } from '../store/taskStore';

type SortField = 'title' | 'status' | 'priority' | 'dueDate';
type SortOrder = 'asc' | 'desc';

export const Tasks: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [sortBy, setSortBy] = useState<SortField>('dueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const { tasks, loading, error, fetchTasks, addTask, updateTask, deleteTask } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await addTask(newTask);
    onClose();
    toast({
      title: 'Task created',
      status: 'success',
      duration: 3000,
    });
  };

  const handleUpdateTask = async (task: Task) => {
    const { id, createdAt, updatedAt, ...updates } = task;
    await updateTask(id, updates);
    toast({
      title: 'Task updated',
      status: 'success',
      duration: 3000,
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    toast({
      title: 'Task deleted',
      status: 'success',
      duration: 3000,
    });
  };

  const filteredTasks = tasks
    .filter((task: Task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || task.status === statusFilter;
      const matchesPriority = !priorityFilter || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a: Task, b: Task) => {
      const order = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'dueDate':
          return order * (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        case 'priority': {
          const priorityOrder: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1, urgent: 4 };
          return order * (priorityOrder[a.priority] - priorityOrder[b.priority]);
        }
        case 'status': {
          const statusOrder: Record<TaskStatus, number> = {
            completed: 3,
            in_progress: 2,
            todo: 1,
            blocked: 0,
            review: 4,
          };
          return order * (statusOrder[a.status] - statusOrder[b.status]);
        }
        case 'title':
          return order * a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  if (loading) {
    return <Box>Loading...</Box>;
  }

  if (error) {
    return <Box color="red.500">{error}</Box>;
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Tasks</Heading>
          <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onOpen}>
            Create Task
          </Button>
        </HStack>

        <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
          >
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
            <option value="review">Review</option>
          </Select>
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | '')}
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortField)}
          >
            <option value="title">Title</option>
            <option value="status">Status</option>
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
          </Select>
          <Button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </Stack>

        <TaskList
          tasks={filteredTasks}
          onEdit={handleUpdateTask}
          onDelete={handleDeleteTask}
          onView={() => {}}
          availableUsers={[]}
          userId="1"
        />

        {isOpen && (
          <TaskForm
            isOpen={isOpen}
            onClose={onClose}
            onSubmit={handleAddTask}
            userId="1"
            availableUsers={[]}
          />
        )}
      </VStack>
    </Container>
  );
}; 