import { supabase } from './supabase';
import { Task } from '../components/TaskCard';

// Type for the database task
export interface DbTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  estimated_time: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Convert database task to app task
export const dbTaskToAppTask = (dbTask: DbTask): Task => ({
  id: dbTask.id,
  title: dbTask.title,
  description: dbTask.description,
  priority: dbTask.priority,
  completed: dbTask.completed,
  estimatedTime: dbTask.estimated_time,
});

// Convert app task to database task (for inserts/updates)
export const appTaskToDbTask = (task: Partial<Task>): Partial<DbTask> => ({
  title: task.title,
  description: task.description,
  priority: task.priority,
  completed: task.completed,
  estimated_time: task.estimatedTime,
});

// Fetch all tasks for the current user
export const fetchTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }

  return (data as DbTask[]).map(dbTaskToAppTask);
};

// Create a new task
export const createTask = async (task: Omit<Task, 'id'>): Promise<Task> => {
  const { data, error } = await supabase
    .from('tasks')
    .insert(appTaskToDbTask(task))
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    throw error;
  }

  return dbTaskToAppTask(data as DbTask);
};

// Update an existing task
export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
  const { data, error } = await supabase
    .from('tasks')
    .update(appTaskToDbTask(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating task:', error);
    throw error;
  }

  return dbTaskToAppTask(data as DbTask);
};

// Delete a task
export const deleteTask = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Toggle task completion status
export const toggleTaskCompletion = async (id: string, completed: boolean): Promise<Task> => {
  return updateTask(id, { completed });
}; 