import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { Habit, Colors } from '../types';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface HabitSelectorProps {
  habits: Habit[];
  selectedHabitId: string;
  onSelect: (habitId: string) => void;
  placeholder?: string;
}

const HabitSelector: React.FC<HabitSelectorProps> = ({ 
  habits, 
  selectedHabitId, 
  onSelect,
  placeholder = "Selecione um hábito..."
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedHabit = habits.find(h => h.id === selectedHabitId);

  return (
    <>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.selector}>
        <Text style={[styles.selectorText, !selectedHabit && styles.placeholderText]}>
          {selectedHabit ? selectedHabit.name : placeholder}
        </Text>
        <Icon name="arrow-drop-down" size={24} color={Colors.blue} />
      </TouchableOpacity>

      <Modal 
        visible={modalVisible} 
        transparent 
        animationType="fade" 
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione um Hábito</Text>
            {habits.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum hábito disponível.</Text>
            ) : (
                <FlatList
                data={habits}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity 
                    style={styles.item} 
                    onPress={() => {
                        onSelect(item.id);
                        setModalVisible(false);
                    }}
                    >
                    <Text style={[styles.itemText, item.id === selectedHabitId && styles.selectedItemText]}>
                        {item.name}
                    </Text>
                    {item.id === selectedHabitId && <Icon name="check" size={20} color={Colors.blue} />}
                    </TouchableOpacity>
                )}
                />
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.lightBlue,
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.white,
    marginBottom: 10,
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '60%',
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: Colors.blue,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lighterBlue,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedItemText: {
    color: Colors.blue,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
  closeButton: {
    marginTop: 15,
    alignItems: 'center',
    padding: 10,
  },
  closeButtonText: {
    color: Colors.red,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HabitSelector;