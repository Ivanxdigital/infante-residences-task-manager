import { supabase } from './supabase';

export type UserRole = 'housekeeper' | 'admin';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  date_of_birth: string | null;
  bio: string | null;
  avatar_url: string | null;
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

// Test if Supabase storage is accessible and ensure avatars bucket exists
export const testSupabaseStorage = async (): Promise<boolean> => {
  try {
    // Try to list buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error accessing Supabase storage:', error);
      return false;
    }
    
    console.log('Supabase storage buckets:', buckets.map(bucket => bucket.name));
    
    // Check if avatars bucket exists
    const avatarsBucketExists = buckets.some(bucket => bucket.name === 'avatars');
    
    if (!avatarsBucketExists) {
      console.warn('Avatars bucket does not exist, attempting to create it');
      
      try {
        // Try to create the avatars bucket
        const { data, error: createError } = await supabase.storage.createBucket('avatars', {
          public: true
        });
        
        if (createError) {
          console.error('Error creating avatars bucket:', createError);
          return false;
        }
        
        console.log('Successfully created avatars bucket');
      } catch (createError) {
        console.error('Exception creating avatars bucket:', createError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error testing Supabase storage:', error);
    return false;
  }
};

// Upload a profile picture and return the URL
export const uploadProfilePicture = async (
  userId: string,
  uri: string
): Promise<string | null> => {
  try {
    // Validate inputs
    if (!userId || !uri) {
      console.error('Invalid userId or uri in uploadProfilePicture');
      return null;
    }

    // Log the URI for debugging
    console.log('Original URI:', uri);
    
    // Handle different URI formats
    let processedUri = uri;
    
    // For Android content:// URIs, we might need special handling
    // But for now, we'll just log and proceed
    if (uri.startsWith('content://')) {
      console.log('Content URI detected, proceeding with original URI');
    }

    // Create a unique file path for the avatar
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`; // Store directly in the bucket root

    // Convert the image to a Blob
    try {
      console.log('Fetching image from URI:', processedUri);
      const response = await fetch(processedUri);
      
      if (!response.ok) {
        console.error('Failed to fetch image:', response.status, response.statusText);
        return null;
      }
      
      console.log('Converting image to blob');
      const blob = await response.blob();
      
      if (!blob || blob.size === 0) {
        console.error('Invalid blob in uploadProfilePicture');
        return null;
      }

      console.log('Uploading blob to Supabase, size:', blob.size, 'type:', blob.type);
      
      // Try to upload with a smaller chunk size
      try {
        // Upload the image to Supabase Storage using the 'avatars' bucket
        const { data, error } = await supabase.storage
          .from('avatars') // Use the existing 'avatars' bucket
          .upload(filePath, blob, {
            contentType: blob.type || `image/${fileExt}`,
            upsert: true,
          });

        if (error) {
          console.error('Error uploading profile picture:', error);
          return null;
        }

        console.log('Upload successful, getting public URL');
        
        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from('avatars') // Use the existing 'avatars' bucket
          .getPublicUrl(filePath);

        if (!publicUrlData || !publicUrlData.publicUrl) {
          console.error('Failed to get public URL for uploaded image');
          return null;
        }

        console.log('Public URL obtained:', publicUrlData.publicUrl);
        return publicUrlData.publicUrl;
      } catch (uploadError) {
        console.error('Error during Supabase upload:', uploadError);
        return null;
      }
    } catch (fetchError) {
      console.error('Error fetching or processing image:', fetchError);
      return null;
    }
  } catch (error) {
    console.error('Error in uploadProfilePicture:', error);
    return null;
  }
};

// Upload a profile picture using base64 encoding (fallback method)
export const uploadProfilePictureBase64 = async (
  userId: string,
  uri: string
): Promise<string | null> => {
  try {
    // Validate inputs
    if (!userId || !uri) {
      console.error('Invalid userId or uri in uploadProfilePictureBase64');
      return null;
    }

    console.log('Using base64 fallback method for upload');
    
    // Create a unique file path for the avatar
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`; // Store directly in the bucket root

    try {
      // Read the file as base64
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Convert blob to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64data = reader.result as string;
            // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64String = base64data.split(',')[1];
            
            console.log('Converted image to base64, length:', base64String.length);
            
            // Upload the base64 data
            const { data, error } = await supabase.storage
              .from('avatars')
              .upload(filePath, decode(base64String), {
                contentType: `image/${fileExt}`,
                upsert: true,
              });

            if (error) {
              console.error('Error uploading base64 image:', error);
              reject(error);
              return;
            }

            // Get the public URL
            const { data: publicUrlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath);

            if (!publicUrlData || !publicUrlData.publicUrl) {
              console.error('Failed to get public URL for base64 uploaded image');
              reject(new Error('Failed to get public URL'));
              return;
            }

            console.log('Base64 upload successful, URL:', publicUrlData.publicUrl);
            resolve(publicUrlData.publicUrl);
          } catch (error) {
            console.error('Error in base64 upload process:', error);
            reject(error);
          }
        };
        reader.onerror = () => {
          console.error('Error reading file as base64');
          reject(new Error('Error reading file as base64'));
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error in base64 conversion:', error);
      return null;
    }
  } catch (error) {
    console.error('Error in uploadProfilePictureBase64:', error);
    return null;
  }
};

// Helper function to decode base64
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
} 