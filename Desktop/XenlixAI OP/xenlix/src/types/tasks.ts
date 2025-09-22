export interface Task {
  id: string;
  title: string;
  description?: string;
  category?: string;
  impact?: number; // numeric score delta
  effort?: 'Low' | 'Medium' | 'High';
  snippet?: string;
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt?: string | null;
}

export interface TaskEvent {
  id: string;
  type: 'task_completed' | 'task_unchecked' | 'rescan_started' | 'rescan_completed' | 'score_gain';
  timestamp: string;
  message: string;
  meta?: Record<string, any>;
}
