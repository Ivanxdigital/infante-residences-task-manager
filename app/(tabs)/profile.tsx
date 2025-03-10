import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { User, Calendar, FileText, Save, X, Check, Camera, Upload } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentProfile, updateProfile, Profile, uploadProfilePicture, uploadProfilePictureBase64, testSupabaseStorage } from '../../lib/profiles';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [bio, setBio] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // For iOS modal date picker
  const [tempDate, setTempDate] = useState<Date>(new Date());

  useEffect(() => {
    loadProfile();
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    try {
      const storageAccessible = await testSupabaseStorage();
      if (!storageAccessible) {
        console.warn('Supabase storage is not accessible');
      } else {
        console.log('Supabase storage is accessible');
      }
    } catch (error) {
      console.error('Error testing Supabase connection:', error);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await getCurrentProfile();
      setProfile(userProfile);
      
      if (userProfile) {
        setFullName(userProfile.full_name || '');
        setBio(userProfile.bio || '');
        setAvatarUrl(userProfile.avatar_url);
        if (userProfile.date_of_birth) {
          const dob = new Date(userProfile.date_of_birth);
          setDateOfBirth(dob);
          setTempDate(dob);
        } else {
          setTempDate(new Date());
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      const updates: Partial<Profile> = {
        full_name: fullName,
        bio: bio,
        date_of_birth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : null,
        avatar_url: avatarUrl,
      };

      const updatedProfile = await updateProfile(updates);
      
      if (updatedProfile) {
        setProfile(updatedProfile);
        Alert.alert('Success', 'Profile updated successfully');
        setIsEditing(false);
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile information');
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      if (Platform.OS === 'ios') {
        setTempDate(selectedDate);
      } else {
        setDateOfBirth(selectedDate);
      }
    }
  };

  const confirmIOSDate = () => {
    setDateOfBirth(tempDate);
    setShowDatePicker(false);
  };

  const cancelIOSDate = () => {
    setShowDatePicker(false);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const openDatePicker = () => {
    if (dateOfBirth) {
      setTempDate(dateOfBirth);
    } else {
      setTempDate(new Date());
    }
    setShowDatePicker(true);
  };

  const pickImage = async () => {
    try {
      // Test Supabase storage access first
      const storageAccessible = await testSupabaseStorage();
      if (!storageAccessible) {
        console.error('Supabase storage is not accessible');
        Alert.alert('Storage Error', 'Unable to access storage service. Please try again later.');
        return;
      }

      // Request permission to access the photo library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile picture.');
        return;
      }

      // Launch the image picker with lower quality settings
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Lower quality to decrease file size
        exif: false, // Don't include EXIF data to reduce file size
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // Check if the image is valid
        if (!selectedImage.uri) {
          Alert.alert('Error', 'Selected image is invalid. Please try another image.');
          return;
        }
        
        // Check file size (limit to 2MB)
        if (selectedImage.fileSize && selectedImage.fileSize > 2 * 1024 * 1024) {
          Alert.alert('Error', 'Image is too large. Please select an image smaller than 2MB or try taking a photo instead.');
          return;
        }
        
        try {
          await uploadImage(selectedImage.uri);
        } catch (uploadError) {
          console.error('Error in uploadImage:', uploadError);
          Alert.alert('Upload Failed', 'Failed to upload the image. Please try again with a smaller image.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      // Test Supabase storage access first
      const storageAccessible = await testSupabaseStorage();
      if (!storageAccessible) {
        console.error('Supabase storage is not accessible');
        Alert.alert('Storage Error', 'Unable to access storage service. Please try again later.');
        return;
      }

      // Request permission to access the camera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera to take a profile picture.');
        return;
      }

      // Launch the camera with lower quality settings
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Lower quality to decrease file size
        exif: false, // Don't include EXIF data to reduce file size
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // Check if the image is valid
        if (!selectedImage.uri) {
          Alert.alert('Error', 'Captured image is invalid. Please try again.');
          return;
        }
        
        // Check file size (limit to 2MB)
        if (selectedImage.fileSize && selectedImage.fileSize > 2 * 1024 * 1024) {
          Alert.alert('Error', 'Image is too large. Please try taking a different photo with lower resolution.');
          return;
        }
        
        try {
          await uploadImage(selectedImage.uri);
        } catch (uploadError) {
          console.error('Error in uploadImage:', uploadError);
          Alert.alert('Upload Failed', 'Failed to upload the image. Please try again with a smaller image.');
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      if (!profile) {
        Alert.alert('Error', 'Profile not loaded. Please try again later.');
        return;
      }
      
      setUploadingImage(true);
      
      // Validate the URI
      if (!uri || typeof uri !== 'string') {
        Alert.alert('Error', 'Invalid image format. Please try another image.');
        setUploadingImage(false);
        return;
      }
      
      console.log('Starting upload process for image:', uri.substring(0, 50) + '...');
      
      try {
        // First try the regular upload method
        console.log('Trying regular upload method...');
        let imageUrl = await uploadProfilePicture(profile.id, uri);
        
        // If regular method fails, try base64 method
        if (!imageUrl) {
          console.log('Regular upload failed, trying base64 method...');
          imageUrl = await uploadProfilePictureBase64(profile.id, uri);
        }
        
        console.log('Upload result:', imageUrl ? 'Success' : 'Failed');
        
        if (imageUrl) {
          console.log('Setting avatar URL:', imageUrl.substring(0, 50) + '...');
          setAvatarUrl(imageUrl);
          
          // Update the profile with the new avatar URL
          console.log('Updating profile with new avatar URL');
          const updates: Partial<Profile> = {
            avatar_url: imageUrl,
          };
          
          const updatedProfile = await updateProfile(updates);
          
          if (updatedProfile) {
            console.log('Profile updated successfully');
            setProfile(updatedProfile);
            Alert.alert('Success', 'Profile picture updated successfully');
          } else {
            console.error('Failed to update profile with new avatar URL');
            Alert.alert('Error', 'Failed to update profile with new picture. The image was uploaded but not saved to your profile.');
          }
        } else {
          console.error('Both upload methods failed');
          Alert.alert('Error', 'Failed to upload profile picture. Please try again with a smaller image.');
        }
      } catch (uploadError) {
        console.error('Exception in uploadImage:', uploadError);
        Alert.alert('Upload Error', 'An unexpected error occurred while uploading your profile picture. Please try again with a smaller image.');
      }
    } catch (error) {
      console.error('Error in uploadImage outer block:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again later.');
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0891b2" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0891b2', '#0e7490']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Animatable.View 
          animation="fadeIn" 
          duration={800} 
          style={styles.header}
        >
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.subtitle}>Manage your personal information</Text>
        </Animatable.View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animatable.View 
          animation="fadeInUp" 
          duration={800} 
          delay={200}
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Personal Information</Text>
              {!isEditing ? (
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsEditing(false);
                    // Reset form values to current profile
                    if (profile) {
                      setFullName(profile.full_name || '');
                      setBio(profile.bio || '');
                      setDateOfBirth(profile.date_of_birth ? new Date(profile.date_of_birth) : null);
                      setAvatarUrl(profile.avatar_url);
                    }
                  }}
                >
                  <X size={16} color="#64748b" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.avatarContainer}>
              {uploadingImage ? (
                <View style={styles.avatarLoading}>
                  <ActivityIndicator size="small" color="#ffffff" />
                </View>
              ) : (
                <Image
                  source={avatarUrl ? { uri: avatarUrl } : require('../../assets/default-avatar.png')}
                  style={styles.avatar}
                  contentFit="cover"
                  transition={300}
                />
              )}
              
              {isEditing && (
                <View style={styles.avatarActions}>
                  <TouchableOpacity 
                    style={styles.avatarActionButton}
                    onPress={takePhoto}
                    disabled={uploadingImage}
                  >
                    <Camera size={18} color="#0891b2" />
                    <Text style={styles.avatarActionText}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.avatarActionButton}
                    onPress={pickImage}
                    disabled={uploadingImage}
                  >
                    <Upload size={18} color="#0891b2" />
                    <Text style={styles.avatarActionText}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <View style={styles.fieldIcon}>
                <User size={20} color="#0891b2" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#94a3b8"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profile?.full_name || 'Not set'}</Text>
                )}
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <View style={styles.fieldIcon}>
                <Calendar size={20} color="#0891b2" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Date of Birth</Text>
                {isEditing ? (
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={openDatePicker}
                  >
                    <Text style={styles.datePickerText}>
                      {dateOfBirth ? formatDate(dateOfBirth) : 'Select date of birth'}
                    </Text>
                    <Calendar size={16} color="#64748b" />
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.fieldValue}>
                    {profile?.date_of_birth ? formatDate(new Date(profile.date_of_birth)) : 'Not set'}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <View style={styles.fieldIcon}>
                <FileText size={20} color="#0891b2" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Bio</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell us about yourself"
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profile?.bio || 'Not set'}</Text>
                )}
              </View>
            </View>

            {isEditing && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Save size={18} color="#ffffff" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </Animatable.View>

        <View style={styles.accountInfo}>
          <Text style={styles.accountInfoText}>
            Account created on {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
          </Text>
          <Text style={styles.accountInfoText}>
            Role: {profile?.role === 'admin' ? 'Administrator' : 'Housekeeper'}
          </Text>
        </View>
      </ScrollView>

      {/* Date Picker for Android */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={dateOfBirth || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
          themeVariant="light"
        />
      )}

      {/* Modal Date Picker for iOS */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Date of Birth</Text>
                <TouchableOpacity onPress={cancelIOSDate}>
                  <X size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  style={styles.iosDatePicker}
                  textColor="#0f172a"
                />
              </View>
              
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={confirmIOSDate}
              >
                <Check size={18} color="#ffffff" />
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#0f172a',
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#0891b2',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
  },
  fieldContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#0f172a',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#0f172a',
  },
  textArea: {
    minHeight: 100,
  },
  datePickerButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#0f172a',
  },
  saveButton: {
    backgroundColor: '#0891b2',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  accountInfo: {
    marginTop: 24,
    marginBottom: 40,
    padding: 16,
  },
  accountInfoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#0f172a',
  },
  iosDatePicker: {
    height: 200,
    width: '100%',
    backgroundColor: '#ffffff',
  },
  confirmButton: {
    backgroundColor: '#0891b2',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  datePickerContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
    borderWidth: 3,
    borderColor: '#0891b2',
  },
  avatarLoading: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0891b2',
  },
  avatarActions: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'center',
    gap: 16,
  },
  avatarActionButton: {
    padding: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0891b2',
    gap: 8,
  },
  avatarActionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#0891b2',
    marginLeft: 4,
  },
}); 