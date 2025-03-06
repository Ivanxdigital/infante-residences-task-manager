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
  Modal
} from 'react-native';
import { router } from 'expo-router';
import { isAdmin } from '../../lib/profiles';
import { Room, fetchRooms, createRoom, updateRoom, deleteRoom } from '../../lib/rooms';
import { Home, Plus, Edit, Trash, X, Check } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';

export default function RoomsScreen() {
  const [loading, setLoading] = useState(true);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      const adminStatus = await isAdmin();
      setUserIsAdmin(adminStatus);
      await loadRooms();
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      const roomsData = await fetchRooms();
      setRooms(roomsData);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      Alert.alert('Error', 'Please enter a room name');
      return;
    }

    try {
      setLoading(true);
      await createRoom(roomName, roomDescription);
      await loadRooms();
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Error creating room:', error);
      Alert.alert('Error', 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoom = async () => {
    if (!editingRoom || !roomName.trim()) {
      Alert.alert('Error', 'Please enter a room name');
      return;
    }

    try {
      setLoading(true);
      await updateRoom(editingRoom.id, { 
        name: roomName, 
        description: roomDescription 
      });
      await loadRooms();
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Error updating room:', error);
      Alert.alert('Error', 'Failed to update room');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (room: Room) => {
    Alert.alert(
      'Delete Room',
      `Are you sure you want to delete "${room.name}"? This will not delete tasks in this room, but they will no longer be associated with it.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteRoom(room.id);
              await loadRooms();
            } catch (error) {
              console.error('Error deleting room:', error);
              Alert.alert('Error', 'Failed to delete room');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const openCreateModal = () => {
    setEditingRoom(null);
    setRoomName('');
    setRoomDescription('');
    setModalVisible(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setRoomName(room.name);
    setRoomDescription(room.description || '');
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingRoom(null);
    setRoomName('');
    setRoomDescription('');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0891b2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rooms</Text>
        <Text style={styles.subtitle}>Manage rooms for task organization</Text>
      </View>

      {userIsAdmin && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={openCreateModal}
        >
          <Plus size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Add New Room</Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.content}>
        {rooms.length === 0 ? (
          <Text style={styles.emptyText}>No rooms found</Text>
        ) : (
          rooms.map(room => (
            <Animatable.View 
              key={room.id} 
              animation="fadeIn" 
              duration={500}
              style={styles.roomItem}
            >
              <View style={styles.roomHeader}>
                <View style={styles.roomInfo}>
                  <Home size={20} color="#0891b2" />
                  <Text style={styles.roomName}>{room.name}</Text>
                </View>
                {userIsAdmin && (
                  <View style={styles.roomActions}>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={() => openEditModal(room)}
                    >
                      <Edit size={18} color="#0891b2" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={() => handleDeleteRoom(room)}
                    >
                      <Trash size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {room.description && (
                <Text style={styles.roomDescription}>{room.description}</Text>
              )}
              <TouchableOpacity 
                style={styles.viewTasksButton}
                onPress={() => router.push({
                  pathname: '/(tabs)',
                  params: { roomId: room.id, roomName: room.name }
                })}
              >
                <Text style={styles.viewTasksText}>View Tasks</Text>
              </TouchableOpacity>
            </Animatable.View>
          ))
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Room Name</Text>
              <TextInput
                style={styles.input}
                value={roomName}
                onChangeText={setRoomName}
                placeholder="Enter room name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={roomDescription}
                onChangeText={setRoomDescription}
                placeholder="Enter room description"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveModalButton]}
                onPress={editingRoom ? handleUpdateRoom : handleCreateRoom}
              >
                <Text style={styles.saveModalText}>
                  {editingRoom ? 'Update' : 'Create'}
                </Text>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0891b2',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    marginTop: 20,
  },
  roomItem: {
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
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  roomActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  roomDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginBottom: 12,
  },
  viewTasksButton: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewTasksText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#0891b2',
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#0f172a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
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