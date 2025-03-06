import { supabase } from './supabase';

export type UserRole = 'housekeeper' | 'admin';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

// Get the current user's profile
export const getCurrentProfile = async (): Promise<Profile | null> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user || !user.user) {
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as Profile;
  } catch (error) {
    console.error('Error in getCurrentProfile:', error);
    return null;
  }
};

// Update the current user's profile
export const updateProfile = async (updates: Partial<Profile>): Promise<Profile | null> => {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user || !user.user) {
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    return data as Profile;
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return null;
  }
};

// Get all profiles (admin only)
export const getAllProfiles = async (): Promise<Profile[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching profiles:', error);
      return [];
    }

    return data as Profile[];
  } catch (error) {
    console.error('Error in getAllProfiles:', error);
    return [];
  }
};

// Check if the current user is an admin
export const isAdmin = async (): Promise<boolean> => {
  const profile = await getCurrentProfile();
  return profile?.role === 'admin';
};

// Set a user as admin (for development purposes)
export const setUserAsAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId);

    if (error) {
      console.error('Error setting user as admin:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in setUserAsAdmin:', error);
    return false;
  }
}; 