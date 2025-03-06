import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Task } from '../../components/TaskCard';
import { Plus } from 'lucide-react-native';
import { createTask } from '../../lib/tasks';
import { router } from 'expo-router';

export default function ManageScreen() {
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    estimatedTime: '',
  });
  const [loading, setLoading] = useState(false);

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
      await createTask({
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        completed: false,
        estimatedTime: newTask.estimatedTime,
      });

      // Reset form
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        estimatedTime: '',
      });

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
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
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