import { create } from 'zustand';
import { Task, TaskStatus, TaskPriority } from '../types/task';

interface TaskStore {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  filterTasks: (status?: TaskStatus, priority?: TaskPriority) => Task[];
  setTasks: (tasks: Task[]) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      // For now, we'll use mock data since we haven't set up Firebase
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Implement user authentication',
          description: 'Add JWT-based authentication to the application',
          status: 'completed',
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
          actualTime: 420,
          timeEntries: [
            {
              id: '1',
              userId: '1',
              duration: 420,
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
        {
          id: '2',
          title: 'Design responsive dashboard',
          description: 'Create a modern, responsive dashboard with analytics',
          status: 'in_progress',
          priority: 'medium',
          type: 'feature',
          labels: ['frontend', 'design'],
          dueDate: '2024-03-20',
          assignedTo: '1',
          archived: false,
          sprintId: 'sprint-1',
          epicId: 'epic-2',
          storyPoints: 8,
          acceptanceCriteria: [
            'Dashboard is responsive on all devices',
            'Charts and metrics are properly displayed',
            'User can filter data by date range',
          ],
          estimatedTime: 360,
          actualTime: 180,
          timeEntries: [
            {
              id: '2',
              userId: '1',
              duration: 180,
              description: 'Initial design and layout',
              date: '2024-03-12',
              createdAt: '2024-03-12T14:00:00Z',
            },
          ],
          dependencies: [],
          environment: 'development',
          browsers: ['Chrome', 'Firefox', 'Safari'],
          devices: ['Desktop', 'Tablet', 'Mobile'],
          operatingSystems: ['Windows', 'macOS', 'iOS', 'Android'],
          tags: ['dashboard', 'ui'],
          subtasks: [
            {
              id: '2',
              title: 'Create chart components',
              description: 'Implement reusable chart components',
              completed: true,
              assignedTo: '1',
              dueDate: '2024-03-15',
            },
          ],
          notes: 'Focus on mobile-first design',
          isRecurring: false,
          comments: [
            {
              id: '2',
              userId: '1',
              content: 'Started working on the dashboard design',
              createdAt: '2024-03-12T14:00:00Z',
              updatedAt: '2024-03-12T14:00:00Z',
            },
          ],
          attachments: [],
          customFields: {},
          isTemplate: false,
          workflowRules: [],
          createdAt: '2024-03-05T10:00:00Z',
          updatedAt: '2024-03-12T14:00:00Z',
        },
        {
          id: '3',
          title: 'Fix login page bug',
          description: 'Users cannot log in on mobile devices',
          status: 'blocked',
          priority: 'urgent',
          type: 'bug',
          labels: ['frontend', 'mobile'],
          dueDate: '2024-03-08',
          assignedTo: '1',
          archived: false,
          sprintId: 'sprint-1',
          epicId: 'epic-1',
          storyPoints: 3,
          acceptanceCriteria: [
            'Login works on all mobile devices',
            'No console errors',
            'User experience is smooth',
          ],
          estimatedTime: 120,
          actualTime: 90,
          timeEntries: [
            {
              id: '3',
              userId: '1',
              duration: 90,
              description: 'Debugging mobile login issues',
              date: '2024-03-08',
              createdAt: '2024-03-08T09:00:00Z',
            },
          ],
          dependencies: [],
          environment: 'production',
          browsers: ['Chrome Mobile', 'Safari Mobile'],
          devices: ['Mobile'],
          operatingSystems: ['iOS', 'Android'],
          tags: ['bug', 'mobile'],
          subtasks: [],
          notes: 'Critical issue affecting 50% of users',
          isRecurring: false,
          comments: [
            {
              id: '3',
              userId: '1',
              content: 'Found the issue - CSS conflicts on mobile',
              createdAt: '2024-03-08T09:00:00Z',
              updatedAt: '2024-03-08T09:00:00Z',
            },
          ],
          attachments: [],
          customFields: {},
          isTemplate: false,
          workflowRules: [],
          createdAt: '2024-03-07T08:00:00Z',
          updatedAt: '2024-03-08T09:00:00Z',
        },
        {
          id: '4',
          title: 'Write API documentation',
          description: 'Create comprehensive API documentation',
          status: 'todo',
          priority: 'low',
          type: 'documentation',
          labels: ['documentation'],
          dueDate: '2024-03-25',
          assignedTo: '1',
          archived: false,
          sprintId: 'sprint-2',
          epicId: 'epic-3',
          storyPoints: 5,
          acceptanceCriteria: [
            'All endpoints are documented',
            'Examples are provided',
            'Documentation is clear and concise',
          ],
          estimatedTime: 240,
          actualTime: 0,
          timeEntries: [],
          dependencies: [],
          environment: 'development',
          browsers: [],
          devices: ['Desktop'],
          operatingSystems: ['Windows', 'macOS'],
          tags: ['docs', 'api'],
          subtasks: [],
          notes: 'Use OpenAPI specification',
          isRecurring: false,
          comments: [],
          attachments: [],
          customFields: {},
          isTemplate: false,
          workflowRules: [],
          createdAt: '2024-03-10T10:00:00Z',
          updatedAt: '2024-03-10T10:00:00Z',
        },
        {
          id: '5',
          title: 'Performance optimization',
          description: 'Optimize application performance',
          status: 'review',
          priority: 'high',
          type: 'maintenance',
          labels: ['performance', 'optimization'],
          dueDate: '2024-03-18',
          assignedTo: '1',
          archived: false,
          sprintId: 'sprint-1',
          epicId: 'epic-4',
          storyPoints: 6,
          acceptanceCriteria: [
            'Page load time under 2 seconds',
            'Bundle size reduced by 20%',
            'Lighthouse score above 90',
          ],
          estimatedTime: 300,
          actualTime: 280,
          timeEntries: [
            {
              id: '5',
              userId: '1',
              duration: 280,
              description: 'Code splitting and lazy loading',
              date: '2024-03-11',
              createdAt: '2024-03-11T11:00:00Z',
            },
          ],
          dependencies: [],
          environment: 'development',
          browsers: ['Chrome', 'Firefox'],
          devices: ['Desktop'],
          operatingSystems: ['Windows', 'macOS'],
          tags: ['performance', 'optimization'],
          subtasks: [],
          notes: 'Focus on critical rendering path',
          isRecurring: false,
          comments: [
            {
              id: '5',
              userId: '1',
              content: 'Completed performance optimizations',
              createdAt: '2024-03-11T11:00:00Z',
              updatedAt: '2024-03-11T11:00:00Z',
            },
          ],
          attachments: [],
          customFields: {},
          isTemplate: false,
          workflowRules: [],
          createdAt: '2024-03-06T10:00:00Z',
          updatedAt: '2024-03-11T11:00:00Z',
        },
      ];
      set({ tasks: mockTasks, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch tasks', loading: false });
    }
  },

  addTask: async (task) => {
    set({ loading: true, error: null });
    try {
      const now = new Date().toISOString();
      const newTask: Task = {
        ...task,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
      };
      set((state) => ({
        tasks: [...state.tasks, newTask],
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to add task', loading: false });
    }
  },

  updateTask: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const now = new Date().toISOString();
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...task, ...updates, updatedAt: now } : task
        ),
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to update task', loading: false });
    }
  },

  deleteTask: async (id) => {
    set({ loading: true, error: null });
    try {
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to delete task', loading: false });
    }
  },

  filterTasks: (status?: TaskStatus, priority?: TaskPriority) => {
    const { tasks } = get();
    return tasks.filter((task) => {
      if (status && task.status !== status) return false;
      if (priority && task.priority !== priority) return false;
      return true;
    });
  },

  setTasks: (tasks) => set({ tasks }),
})); 