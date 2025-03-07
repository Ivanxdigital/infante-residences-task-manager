import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp, Home } from 'lucide-react-native';
import { Task } from './TaskCard';
import { TaskCard } from './TaskCard';

interface RoomTaskGroupProps {
  roomName: string;
  roomId: string;
  tasks: Task[];
  onToggle: (id: string) => void;
  showAssignee?: boolean;
  showNotes?: boolean;
}

export function RoomTaskGroup({ 
  roomName, 
  roomId, 
  tasks, 
  onToggle, 
  showAssignee = false, 
  showNotes = false 
}: RoomTaskGroupProps) {
  const [expanded, setExpanded] = useState(true);
  
  // Split tasks into incomplete and completed
  const incompleteTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);
  
  // Only show completed tasks when expanded
  const visibleTasks = expanded 
    ? [...incompleteTasks, ...completedTasks] 
    : incompleteTasks;
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.roomInfo}>
          <View style={styles.roomIconContainer}>
            <Home size={16} color="#ffffff" />
          </View>
          <Text style={styles.roomName}>{roomName}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.taskCount}>
            {incompleteTasks.length} task{incompleteTasks.length !== 1 ? 's' : ''}
          </Text>
          {expanded ? (
            <ChevronUp size={20} color="#64748b" />
          ) : (
            <ChevronDown size={20} color="#64748b" />
          )}
        </View>
      </TouchableOpacity>
      
      {expanded && visibleTasks.length > 0 && (
        <View style={styles.tasksContainer}>
          {visibleTasks.map((task, index) => (
            <View key={task.id} style={[
              styles.taskWrapper,
              index === visibleTasks.length - 1 && styles.lastTask
            ]}>
              <TaskCard 
                task={task} 
                onToggle={onToggle} 
                showAssignee={showAssignee}
                showNotes={showNotes}
                showRoom={false}
              />
            </View>
          ))}
        </View>
      )}
      
      {expanded && visibleTasks.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tasks in this room</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roomIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0891b2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#0f172a',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskCount: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  tasksContainer: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  taskWrapper: {
    marginVertical: 0,
    paddingVertical: 4,
  },
  lastTask: {
    marginBottom: 0,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    fontStyle: 'italic',
  },
}); 