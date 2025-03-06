import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Task } from '../../components/TaskCard';
import { Plus, User, Home } from 'lucide-react-native';
import { createTask } from '../../lib/tasks';
import { router } from 'expo-router';
import { isAdmin, getAllProfiles, Profile } from '../../lib/profiles';
import { fetchRooms, Room } from '../../lib/rooms';

export default function ManageScreen() {
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    estimatedTime: '',
    assignedTo: '' as string | undefined,
    roomId: '' as string | undefined,
  });
  const [loading, setLoading] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showAssignees, setShowAssignees] = useState(false);
  const [showRooms, setShowRooms] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      setCheckingAdmin(true);
      const adminStatus = await isAdmin();
      setUserIsAdmin(adminStatus);
      
      if (adminStatus) {
        // Load profiles for assignment
        const profilesData = await getAllProfiles();
        setProfiles(profilesData);
        
        // Load rooms for selection
        const roomsData = await fetchRooms();
        setRooms(roomsData);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setCheckingAdmin(false);
    }
  };

  const priorityOptions: Task['priority'][] = ['low', 'medium', 'high'];

  const handleAddTask = async () => {
    // Validate form
    if (!newTask.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    try {
      setLoading(true);
      
      // Create task in Supabase
      const createdTask = await createTask({
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        completed: false,
        estimatedTime: newTask.estimatedTime,
        assignedTo: newTask.assignedTo || undefined,
        roomId: newTask.roomId || undefined,
      });

      if (!createdTask) {
        Alert.alert('Error', 'Failed to create task. Only admins can create tasks.');
        return;
      }

      // Reset form
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        estimatedTime: '',
        assignedTo: '',
        roomId: '',
      });
      setShowAssignees(false);
      setShowRooms(false);

      // Show success message
      Alert.alert('Success', 'Task created successfully', [
        { 
          text: 'View Tasks', 
          onPress: () => router.navigate('/(tabs)') 
        },
        { 
          text: 'Add Another', 
          style: 'cancel' 
        },
      ]);
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAssignees = () => {
    setShowAssignees(!showAssignees);
    if (!showAssignees) {
      setShowRooms(false);
    }
  };

  const toggleRooms = () => {
    setShowRooms(!showRooms);
    if (!showRooms) {
      setShowAssignees(false);
    }
  };

  const assignToUser = (profileId: string, fullName: string | null) => {
    setNewTask({ ...newTask, assignedTo: profileId });
    setShowAssignees(false);
    Alert.alert('Task Assignment', `Task will be assigned to ${fullName || 'selected user'}`);
  };

  const assignToRoom = (roomId: string, roomName: string) => {
    setNewTask({ ...newTask, roomId });
    setShowRooms(false);
    Alert.alert('Room Selection', `Task will be assigned to ${roomName}`);
  };

  const goToRoomsScreen = () => {
    router.push('/(tabs)/rooms');
  };

  if (checkingAdmin) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0891b2" />
      </View>
    );
  }

  if (!userIsAdmin) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Only admins can create tasks</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add New Task</Text>
        <Text style={styles.subtitle}>Create tasks for Infante Residences staff</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Task Title</Text>
          <TextInput
            style={styles.input}
            value={newTask.title}
            onChangeText={(text) => setNewTask({ ...newTask, title: text })}
            placeholder="Enter task title"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={newTask.description}
            onChangeText={(text) => setNewTask({ ...newTask, description: text })}
            placeholder="Enter task description"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Estimated Time</Text>
          <TextInput
            style={styles.input}
            value={newTask.estimatedTime}
            onChangeText={(text) => setNewTask({ ...newTask, estimatedTime: text })}
            placeholder="e.g. 30 mins, 1 hour"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityContainer}>
            {priorityOptions.map((priority) => (
              <Pressable
                key={priority}
                style={[
                  styles.priorityButton,
                  newTask.priority === priority && styles.priorityButtonActive,
                ]}
                onPress={() => setNewTask({ ...newTask, priority })}
              >
                <Text
                  style={[
                    styles.priorityButtonText,
                    newTask.priority === priority && styles.priorityButtonTextActive,
                  ]}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.assignHeader}>
            <Text style={styles.label}>Assign To</Text>
            <TouchableOpacity 
              style={styles.assignButton}
              onPress={toggleAssignees}
            >
              <User size={16} color="#0891b2" />
              <Text style={styles.assignButtonText}>
                {showAssignees ? 'Hide' : 'Show'} Users
              </Text>
            </TouchableOpacity>
          </View>
          
          {showAssignees && (
            <View style={styles.assigneesContainer}>
              <TouchableOpacity 
                style={styles.assigneeItem}
                onPress={() => assignToUser('', 'Yourself (Default)')}
              >
                <Text style={styles.assigneeName}>Assign to yourself (Default)</Text>
              </TouchableOpacity>
              
              {profiles.map(profile => (
                <TouchableOpacity 
                  key={profile.id}
                  style={styles.assigneeItem}
                  onPress={() => assignToUser(profile.id, profile.full_name)}
                >
                  <Text style={styles.assigneeName}>
                    {profile.full_name || profile.id.substring(0, 8)}
                  </Text>
                  <Text style={styles.assigneeRole}>{profile.role}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {newTask.assignedTo && (
            <View style={styles.selectedAssignee}>
              <User size={14} color="#64748b" />
              <Text style={styles.selectedAssigneeText}>
                Assigned to: {
                  newTask.assignedTo === '' 
                    ? 'Yourself' 
                    : profiles.find(p => p.id === newTask.assignedTo)?.full_name || 'Selected User'
                }
              </Text>
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.assignHeader}>
            <Text style={styles.label}>Room</Text>
            <View style={styles.roomActions}>
              <TouchableOpacity 
                style={styles.assignButton}
                onPress={toggleRooms}
              >
                <Home size={16} color="#0891b2" />
                <Text style={styles.assignButtonText}>
                  {showRooms ? 'Hide' : 'Show'} Rooms
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.assignButton}
                onPress={goToRoomsScreen}
              >
                <Plus size={16} color="#0891b2" />
                <Text style={styles.assignButtonText}>Manage</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {showRooms && (
            <View style={styles.assigneesContainer}>
              <TouchableOpacity 
                style={styles.assigneeItem}
                onPress={() => assignToRoom('', 'No Room (Default)')}
              >
                <Text style={styles.assigneeName}>No specific room (Default)</Text>
              </TouchableOpacity>
              
              {rooms.map(room => (
                <TouchableOpacity 
                  key={room.id}
                  style={styles.assigneeItem}
                  onPress={() => assignToRoom(room.id, room.name)}
                >
                  <Text style={styles.assigneeName}>{room.name}</Text>
                  {room.description && (
                    <Text style={styles.assigneeRole} numberOfLines={1}>
                      {room.description.substring(0, 20)}
                      {room.description.length > 20 ? '...' : ''}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {newTask.roomId && (
            <View style={styles.selectedAssignee}>
              <Home size={14} color="#64748b" />
              <Text style={styles.selectedAssigneeText}>
                Room: {
                  newTask.roomId === '' 
                    ? 'No specific room' 
                    : rooms.find(r => r.id === newTask.roomId)?.name || 'Selected Room'
                }
              </Text>
            </View>
          )}
        </View>

        <Pressable 
          style={styles.addButton} 
          onPress={handleAddTask}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Plus size={20} color="#ffffff" />
              <Text style={styles.addButtonText}>Add Task</Text>
            </>
          )}
        </Pressable>
      </View>
    </ScrollView>
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
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ef4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0891b2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#0f172a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: '#0891b2',
  },
  priorityButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
  },
  priorityButtonTextActive: {
    color: '#ffffff',
  },
  assignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomActions: {
    flexDirection: 'row',
    gap: 8,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  assignButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#0891b2',
  },
  assigneesContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  assigneeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  assigneeName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#0f172a',
    flex: 1,
  },
  assigneeRole: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selectedAssignee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 6,
  },
  selectedAssigneeText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  addButton: {
    backgroundColor: '#0891b2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});