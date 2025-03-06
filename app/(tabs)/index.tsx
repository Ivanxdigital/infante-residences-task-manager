import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { TaskCard, Task } from '../../components/TaskCard';
import { fetchTasks, toggleTaskCompletion } from '../../lib/tasks';
import { isAdmin } from '../../lib/profiles';
import { useLocalSearchParams, router } from 'expo-router';
import { Home, X } from 'lucide-react-native';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  
  // Get room filter from URL params
  const params = useLocalSearchParams<{ roomId?: string; roomName?: string }>();
  const roomId = params.roomId;
  const roomName = params.roomName;

  useEffect(() => {
    checkAdminStatus();
    loadTasks();
  }, [roomId]);

  const checkAdminStatus = async () => {
    try {
      const adminStatus = await isAdmin();
      setUserIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const tasksData = await fetchTasks(roomId);
      setTasks(tasksData);
      setError(null);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (id: string) => {
    try {
      const taskToToggle = tasks.find(task => task.id === id);
      if (!taskToToggle) return;

      // Optimistically update the UI
      setTasks(tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      ));

      // Update in the database
      await toggleTaskCompletion(id, !taskToToggle.completed);
    } catch (err) {
      console.error('Failed to toggle task:', err);
      // Revert the optimistic update if there was an error
      loadTasks();
    }
  };

  const clearRoomFilter = () => {
    router.replace('/(tabs)');
  };

  const incompleteTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0891b2" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Tasks</Text>
        <Text style={styles.subtitle}>
          {incompleteTasks.length} remaining • {completedTasks.length} completed
        </Text>
      </View>

      {roomId && roomName && (
        <View style={styles.roomFilterContainer}>
          <View style={styles.roomFilter}>
            <Home size={16} color="#0891b2" />
            <Text style={styles.roomFilterText}>
              Filtered by room: {roomName}
            </Text>
            <TouchableOpacity 
              style={styles.clearFilterButton}
              onPress={clearRoomFilter}
            >
              <X size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {roomId 
              ? `No tasks found in ${roomName || 'this room'}.` 
              : userIsAdmin 
                ? "No tasks yet. Add some tasks to get started!" 
                : "No tasks assigned to you yet."}
          </Text>
          {roomId && (
            <TouchableOpacity 
              style={styles.clearFilterButton}
              onPress={clearRoomFilter}
            >
              <Text style={styles.clearFilterText}>Clear room filter</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          {incompleteTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onToggle={toggleTask} 
              showAssignee={userIsAdmin}
              showNotes={userIsAdmin}
              showRoom={!roomId}
            />
          ))}

          {completedTasks.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Completed</Text>
              {completedTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onToggle={toggleTask} 
                  showAssignee={userIsAdmin}
                  showNotes={userIsAdmin}
                  showRoom={!roomId}
                />
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  roomFilterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  roomFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  roomFilterText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#0891b2',
  },
  clearFilterButton: {
    padding: 4,
  },
  clearFilterText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#0891b2',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});