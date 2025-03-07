import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { TaskCard, Task } from '../../components/TaskCard';
import { RoomTaskGroup } from '../../components/RoomTaskGroup';
import { UncategorizedTaskGroup } from '../../components/UncategorizedTaskGroup';
import { fetchTasks, toggleTaskCompletion } from '../../lib/tasks';
import { fetchRooms, Room } from '../../lib/rooms';
import { isAdmin } from '../../lib/profiles';
import { useLocalSearchParams, router } from 'expo-router';
import { Home, X, RefreshCw } from 'lucide-react-native';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  
  // Get room filter from URL params
  const params = useLocalSearchParams<{ roomId?: string; roomName?: string }>();
  const roomId = params.roomId;
  const roomName = params.roomName;

  useEffect(() => {
    checkAdminStatus();
    loadData();
  }, [roomId]);

  const checkAdminStatus = async () => {
    try {
      const adminStatus = await isAdmin();
      setUserIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load tasks and rooms in parallel
      const [tasksData, roomsData] = await Promise.all([
        fetchTasks(roomId),
        fetchRooms()
      ]);
      
      setTasks(tasksData);
      setRooms(roomsData);
      setError(null);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
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
      loadData();
    }
  };

  const clearRoomFilter = () => {
    router.replace('/(tabs)');
  };

  // Group tasks by room
  const groupTasksByRoom = () => {
    const tasksByRoom: Record<string, Task[]> = {};
    const uncategorizedTasks: Task[] = [];
    
    // Initialize with empty arrays for all rooms
    rooms.forEach(room => {
      tasksByRoom[room.id] = [];
    });
    
    // Add tasks to their respective rooms
    tasks.forEach(task => {
      if (task.roomId) {
        if (!tasksByRoom[task.roomId]) {
          tasksByRoom[task.roomId] = [];
        }
        tasksByRoom[task.roomId].push(task);
      } else {
        uncategorizedTasks.push(task);
      }
    });
    
    return { tasksByRoom, uncategorizedTasks };
  };

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
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <RefreshCw size={16} color="#0891b2" />
          <Text style={styles.refreshButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If filtering by room, show only that room's tasks
  if (roomId && roomName) {
    const roomTasks = tasks.filter(task => task.roomId === roomId);
    const incompleteTasks = roomTasks.filter(task => !task.completed);
    
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Room Tasks</Text>
          <Text style={styles.subtitle}>
            {incompleteTasks.length} remaining • {roomTasks.length - incompleteTasks.length} completed
          </Text>
        </View>

        <View style={styles.roomFilterContainer}>
          <View style={styles.roomFilter}>
            <Home size={16} color="#0891b2" />
            <Text style={styles.roomFilterText}>
              {roomName}
            </Text>
            <TouchableOpacity 
              style={styles.clearFilterButton}
              onPress={clearRoomFilter}
            >
              <X size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {roomTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No tasks found in {roomName}.
            </Text>
            <TouchableOpacity 
              style={styles.clearFilterButton}
              onPress={clearRoomFilter}
            >
              <Text style={styles.clearFilterText}>View all tasks</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <RoomTaskGroup
            roomName={roomName}
            roomId={roomId}
            tasks={roomTasks}
            onToggle={toggleTask}
            showAssignee={userIsAdmin}
            showNotes={userIsAdmin}
          />
        )}
      </ScrollView>
    );
  }

  // For the main view, group tasks by room
  const { tasksByRoom, uncategorizedTasks } = groupTasksByRoom();
  const totalIncompleteTasks = tasks.filter(task => !task.completed).length;
  const totalCompletedTasks = tasks.filter(task => task.completed).length;
  
  // Get rooms that have tasks
  const roomsWithTasks = rooms.filter(room => tasksByRoom[room.id]?.length > 0);
  const hasAnyTasks = roomsWithTasks.length > 0 || uncategorizedTasks.length > 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Tasks</Text>
        <Text style={styles.subtitle}>
          {totalIncompleteTasks} remaining • {totalCompletedTasks} completed
        </Text>
      </View>

      {!hasAnyTasks ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {userIsAdmin 
              ? "No tasks yet. Add some tasks to get started!" 
              : "No tasks assigned to you yet."}
          </Text>
        </View>
      ) : (
        <>
          {/* Show rooms with tasks */}
          {roomsWithTasks.map(room => (
            <RoomTaskGroup
              key={room.id}
              roomName={room.name}
              roomId={room.id}
              tasks={tasksByRoom[room.id]}
              onToggle={toggleTask}
              showAssignee={userIsAdmin}
              showNotes={userIsAdmin}
            />
          ))}
          
          {/* Show uncategorized tasks */}
          {uncategorizedTasks.length > 0 && (
            <UncategorizedTaskGroup
              tasks={uncategorizedTasks}
              onToggle={toggleTask}
              showAssignee={userIsAdmin}
              showNotes={userIsAdmin}
            />
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
    marginBottom: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#0891b2',
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