import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { TaskCard, Task } from '../../components/TaskCard';

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Clean Master Bedroom',
    description: 'Dust surfaces, vacuum floor, make bed, and clean windows',
    priority: 'high',
    completed: false,
    estimatedTime: '45 mins',
  },
  {
    id: '2',
    title: 'Kitchen Deep Clean',
    description: 'Clean counters, appliances, and mop floor',
    priority: 'high',
    completed: false,
    estimatedTime: '1 hour',
  },
  {
    id: '3',
    title: 'Bathroom Maintenance',
    description: 'Clean toilet, shower, sink, and mirror',
    priority: 'medium',
    completed: false,
    estimatedTime: '30 mins',
  },
  {
    id: '4',
    title: 'Living Room Tidying',
    description: 'Vacuum sofa, dust surfaces, and arrange cushions',
    priority: 'low',
    completed: false,
    estimatedTime: '20 mins',
  },
];

export default function TasksScreen() {
  const [tasks, setTasks] = useState(initialTasks);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const incompleteTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Tasks</Text>
        <Text style={styles.subtitle}>
          {incompleteTasks.length} remaining • {completedTasks.length} completed
        </Text>
      </View>

      {incompleteTasks.map(task => (
        <TaskCard key={task.id} task={task} onToggle={toggleTask} />
      ))}

      {completedTasks.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Completed</Text>
          {completedTasks.map(task => (
            <TaskCard key={task.id} task={task} onToggle={toggleTask} />
          ))}
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
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
});