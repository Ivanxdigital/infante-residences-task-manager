import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Pressable
} from 'react-native';
import { router } from 'expo-router';
import { isAdmin, getAllProfiles, Profile } from '../../lib/profiles';
import { Task } from '../../components/TaskCard';
import { fetchTasks, assignTask, updateTaskNotes } from '../../lib/tasks';
import { User, FileText, X, Check, Edit } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';

export default function AdminScreen() {
  const [loading, setLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'tasks' | 'users'>('tasks');

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      const adminStatus = await isAdmin();
      setIsUserAdmin(adminStatus);
      
      if (adminStatus) {
        await Promise.all([loadProfiles(), loadTasks()]);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    try {
      const profilesData = await getAllProfiles();
      setProfiles(profilesData);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const tasksData = await fetchTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleAssignTask = async (task: Task, profile: Profile) => {
    try {
      setLoading(true);
      const updatedTask = await assignTask(task.id, profile.id);
      if (updatedTask) {
        Alert.alert('Success', `Task assigned to ${profile.full_name || 'user'}`);
        await loadTasks();
      }
    } catch (error) {
      console.error('Error assigning task:', error);
      Alert.alert('Error', 'Failed to assign task');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (!selectedTask) return;
    
    try {
      setLoading(true);
      const updatedTask = await updateTaskNotes(selectedTask.id, notes);
      if (updatedTask) {
        Alert.alert('Success', 'Task notes updated');
        await loadTasks();
        setModalVisible(false);
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      Alert.alert('Error', 'Failed to update notes');
    } finally {
      setLoading(false);
    }
  };

  const openNotesModal = (task: Task) => {
    setSelectedTask(task);
    setNotes(task.notes || '');
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0891b2" />
      </View>
    );
  }

  if (!isUserAdmin) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>You don't have admin privileges</Text>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.subtitle}>Manage tasks and users</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
          onPress={() => setActiveTab('tasks')}
        >
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Users</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'tasks' ? (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>All Tasks</Text>
          {tasks.length === 0 ? (
            <Text style={styles.emptyText}>No tasks found</Text>
          ) : (
            tasks.map(task => (
              <Animatable.View 
                key={task.id} 
                animation="fadeIn" 
                duration={500}
                style={styles.taskItem}
              >
                <View style={styles.taskHeader}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View style={styles.taskActions}>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={() => openNotesModal(task)}
                    >
                      <FileText size={18} color="#0891b2" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={() => {
                        setSelectedTask(task);
                        setSelectedProfile(null);
                      }}
                    >
                      <User size={18} color="#0891b2" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.taskDescription}>{task.description}</Text>
                
                {task.notes && (
                  <View style={styles.notesContainer}>
                    <FileText size={14} color="#64748b" />
                    <Text style={styles.notesText}>{task.notes}</Text>
                  </View>
                )}
                
                {task.assignedTo && (
                  <View style={styles.assignedContainer}>
                    <User size={14} color="#64748b" />
                    <Text style={styles.assignedText}>
                      Assigned to: {profiles.find(p => p.id === task.assignedTo)?.full_name || 'Unknown user'}
                    </Text>
                  </View>
                )}
                
                {selectedTask?.id === task.id && !selectedProfile && (
                  <Animatable.View animation="fadeIn" duration={300} style={styles.profilesList}>
                    <Text style={styles.profilesTitle}>Assign to:</Text>
                    {profiles.map(profile => (
                      <TouchableOpacity 
                        key={profile.id}
                        style={styles.profileItem}
                        onPress={() => handleAssignTask(task, profile)}
                      >
                        <User size={16} color="#64748b" />
                        <Text style={styles.profileName}>{profile.full_name || profile.id.substring(0, 8)}</Text>
                        <Text style={styles.profileRole}>{profile.role}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity 
                      style={styles.cancelButton}
                      onPress={() => setSelectedTask(null)}
                    >
                      <X size={16} color="#ef4444" />
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </Animatable.View>
                )}
              </Animatable.View>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>All Users</Text>
          {profiles.length === 0 ? (
            <Text style={styles.emptyText}>No users found</Text>
          ) : (
            profiles.map(profile => (
              <Animatable.View 
                key={profile.id} 
                animation="fadeIn" 
                duration={500}
                style={styles.userItem}
              >
                <View style={styles.userHeader}>
                  <View style={styles.userInfo}>
                    <User size={18} color="#64748b" />
                    <Text style={styles.userName}>{profile.full_name || profile.id.substring(0, 8)}</Text>
                  </View>
                  <View style={[
                    styles.roleBadge, 
                    profile.role === 'admin' ? styles.adminBadge : styles.housekeeperBadge
                  ]}>
                    <Text style={styles.roleText}>{profile.role}</Text>
                  </View>
                </View>
                <Text style={styles.userDetail}>ID: {profile.id}</Text>
                <Text style={styles.userDetail}>Created: {new Date(profile.created_at).toLocaleDateString()}</Text>
              </Animatable.View>
            ))
          )}
        </ScrollView>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Task Notes</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Enter notes for this task"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveModalButton]}
                onPress={handleUpdateNotes}
              >
                <Text style={styles.saveModalText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ef4444',
    marginBottom: 20,
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0891b2',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
  },
  activeTabText: {
    color: '#0891b2',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    marginTop: 20,
  },
  taskItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    flex: 1,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  taskDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 12,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    gap: 6,
  },
  notesText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    flex: 1,
  },
  assignedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  assignedText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  profilesList: {
    marginTop: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
  },
  profilesTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
    marginBottom: 8,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  profileName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    flex: 1,
  },
  profileRole: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 8,
    gap: 6,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ef4444',
  },
  userItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adminBadge: {
    backgroundColor: '#0891b2',
  },
  housekeeperBadge: {
    backgroundColor: '#22c55e',
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  userDetail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  notesInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    minHeight: 120,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelModalButton: {
    backgroundColor: '#f1f5f9',
  },
  saveModalButton: {
    backgroundColor: '#0891b2',
  },
  cancelModalText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
  },
  saveModalText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
}); 