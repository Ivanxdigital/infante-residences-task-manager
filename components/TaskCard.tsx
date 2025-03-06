import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Clock, CircleAlert as AlertCircle } from 'lucide-react-native';

export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  completed: boolean;
  estimatedTime?: string;
}

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
}

const priorityColors = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

export function TaskCard({ task, onToggle }: TaskCardProps) {
  return (
    <Pressable
      style={[styles.card, task.completed && styles.completedCard]}
      onPress={() => onToggle(task.id)}>
      <View style={[styles.priorityIndicator, { backgroundColor: priorityColors[task.priority] }]} />
      <View style={styles.content}>
        <Text style={[styles.title, task.completed && styles.completedText]}>{task.title}</Text>
        <Text style={[styles.description, task.completed && styles.completedText]}>
          {task.description}
        </Text>
        <View style={styles.metadata}>
          {task.estimatedTime && (
            <View style={styles.metaItem}>
              <Clock size={16} color="#64748b" />
              <Text style={styles.metaText}>{task.estimatedTime}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <AlertCircle size={16} color={priorityColors[task.priority]} />
            <Text style={[styles.metaText, { color: priorityColors[task.priority] }]}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedCard: {
    opacity: 0.6,
  },
  priorityIndicator: {
    width: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 12,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
});