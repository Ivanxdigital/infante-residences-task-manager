import { supabase } from './supabase';
import { isAdmin } from './profiles';

export interface Room {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Fetch all rooms
export const fetchRooms = async (): Promise<Room[]> => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }

    return data as Room[];
  } catch (error) {
    console.error('Error in fetchRooms:', error);
    return [];
  }
};

// Create a new room (admin only)
export const createRoom = async (name: string, description?: string): Promise<Room | null> => {
  try {
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      console.error('Only admins can create rooms');
      return null;
    }

    const { data: user } = await supabase.auth.getUser();
    
    if (!user || !user.user) {
      return null;
    }

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        name,
        description: description || null,
        created_by: user.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating room:', error);
      return null;
    }

    return data as Room;
  } catch (error) {
    console.error('Error in createRoom:', error);
    return null;
  }
};

// Update a room (admin only)
export const updateRoom = async (id: string, updates: { name?: string; description?: string }): Promise<Room | null> => {
  try {
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      console.error('Only admins can update rooms');
      return null;
    }

    const { data, error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating room:', error);
      return null;
    }

    return data as Room;
  } catch (error) {
    console.error('Error in updateRoom:', error);
    return null;
  }
};

// Delete a room (admin only)
export const deleteRoom = async (id: string): Promise<boolean> => {
  try {
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      console.error('Only admins can delete rooms');
      return false;
    }

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting room:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteRoom:', error);
    return false;
  }
}; 