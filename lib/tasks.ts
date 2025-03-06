import { supabase } from './supabase';
import { Task } from '../components/TaskCard';
import { isAdmin } from './profiles';

// Type for the database task
export interface DbTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  estimated_time: string;
  notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Convert database task to app task
export const dbTaskToAppTask = (dbTask: DbTask): Task => ({
  id: dbTask.id,
  title: dbTask.title,
  description: dbTask.description,
  priority: dbTask.priority,
  completed: dbTask.completed,
  estimatedTime: dbTask.estimated_time,
  notes: dbTask.notes || undefined,
  assignedTo: dbTask.assigned_to || undefined,
});

// Convert app task to database task (for inserts/updates)
export const appTaskToDbTask = (task: Partial<Task>): Partial<DbTask> => ({
  title: task.title,
  description: task.description,
  priority: task.priority,
  completed: task.completed,
  estimated_time: task.estimatedTime,
  notes: task.notes || null,
  assigned_to: task.assignedTo || null,
});

// Fetch tasks based on user role
export const fetchTasks = async (): Promise<Task[]> => {
  try {
    const userIsAdmin = await isAdmin();
    const { data: user } = await supabase.auth.getUser();
    
    if (!user || !user.user) {
      return [];
    }

    let query = supabase.from('tasks').select('*');
    
    // If not admin, only fetch tasks assigned to the current user
    if (!userIsAdmin) {
      query = query.eq('assigned_to', user.user.id);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }

    return (data as DbTask[]).map(dbTaskToAppTask);
  } catch (error) {
    console.error('Error in fetchTasks:', error);
    return [];
  }
};

// Create a new task (admin only)
export const createTask = async (task: Omit<Task, 'id'>): Promise<Task | null> => {
  try {
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      console.error('Only admins can create tasks');
      return null;
    }

    const { data: user } = await supabase.auth.getUser();
    
    if (!user || !user.user) {
      return null;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...appTaskToDbTask(task),
        created_by: user.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return null;
    }

    return dbTaskToAppTask(data as DbTask);
  } catch (error) {
    console.error('Error in createTask:', error);
    return null;
  }
};

// Update an existing task
export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task | null> => {
  try {
    const userIsAdmin = await isAdmin();
    const { data: user } = await supabase.auth.getUser();
    
    if (!user || !user.user) {
      return null;
    }

    // If not admin, only allow updating completion status
    if (!userIsAdmin) {
      const allowedUpdates: Partial<DbTask> = {};
      if (updates.completed !== undefined) {
        allowedUpdates.completed = updates.completed;
      } else {
        console.error('Housekeepers can only update completion status');
        return null;
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(allowedUpdates)
        .eq('id', id)
        .eq('assigned_to', user.user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        return null;
      }

      return dbTaskToAppTask(data as DbTask);
    }

    // Admin can update all fields
    const { data, error } = await supabase
      .from('tasks')
      .update(appTaskToDbTask(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return null;
    }

    return dbTaskToAppTask(data as DbTask);
  } catch (error) {
    console.error('Error in updateTask:', error);
    return null;
  }
};

// Delete a task (admin only)
export const deleteTask = async (id: string): Promise<boolean> => {
  try {
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      console.error('Only admins can delete tasks');
      return false;
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteTask:', error);
    return false;
  }
};

// Toggle task completion status
export const toggleTaskCompletion = async (id: string, completed: boolean): Promise<Task | null> => {
  return updateTask(id, { completed });
};

// Assign a task to a user (admin only)
export const assignTask = async (taskId: string, userId: string | null): Promise<Task | null> => {
  try {
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      console.error('Only admins can assign tasks');
      return null;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({ assigned_to: userId })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('Error assigning task:', error);
      return null;
    }

    return dbTaskToAppTask(data as DbTask);
  } catch (error) {
    console.error('Error in assignTask:', error);
    return null;
  }
};

// Add or update notes for a task (admin only)
export const updateTaskNotes = async (taskId: string, notes: string): Promise<Task | null> => {
  try {
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      console.error('Only admins can update task notes');
      return null;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({ notes })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('Error updating task notes:', error);
      return null;
    }

    return dbTaskToAppTask(data as DbTask);
  } catch (error) {
    console.error('Error in updateTaskNotes:', error);
    return null;
  }
}; 