import { User } from '../types/task';

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export declare const useAuth: () => AuthContextType;
export declare const AuthProvider: React.FC<{ children: React.ReactNode }>; 