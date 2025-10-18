import { Text, View, StyleSheet, Modal, FlatList, TouchableOpacity } from 'react-native';
import CustomButton from '../../com/CustomButton';
import CustomTextInput from '../../com/CustomTextInput';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Habit = {
  id: string;
  name: string;
};

function HabitModal ({ isVisible, onClose, onSave, editingHabit: editingHabit, habitName: habitName, setHabitName: setHabitName} : { isVisible: boolean, onClose: () => void, onSave: () => void, editingHabit: Habit | null, habitName: string, setHabitName: (text: string) => void}) {
  return (
    <View>
      <Modal animationType='slide' transparent={true} visible={isVisible}>
        <View style={styles.modalContent}>
          <View style={styles.textInputs}>
            <Text style={styles.modalTitles} >Nome da atividade</Text>
            <CustomTextInput
              placeholder='Insira aqui'
              value={habitName}
              onChangeText={setHabitName}
            />
          </View>
          <View style={styles.modalButtons}>
            <CustomButton
              title='Voltar'
              onPress = {onClose}
              backgroundColor="#5B79FF"
              textColor="#FFFFFF"
              width={147}
            />
            <CustomButton
              title={editingHabit ? 'Salvar Hábito' : 'Adicionar Hábito'}
              onPress={onSave}
              backgroundColor="#5B79FF"
              textColor="#FFFFFF"
              width={147}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default function HabitsScreen() {

  const [habits, setHabits] = useState<Habit[]>([]);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitName, setHabitName] = useState('');
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  useEffect(() => {
    loadHabitsFromStorage();
  }, []);

  const loadHabitsFromStorage = async () => {
    try {
      const storedHabits = await AsyncStorage.getItem('habits');
      if (storedHabits !== null) {
        setHabits(JSON.parse(storedHabits));
      }
    } catch (error) {
      console.error('Failed to load habits from storage', error);
    }
  };

  const saveHabitsToStorage = async (habitsToSave: Habit[]) => {
    try {
      await AsyncStorage.setItem('habits', JSON.stringify(habitsToSave));
    } catch (error) {
      console.error('Failed to save habits to storage', error);
    }
  };

  const onAddHabit = () => {
    setEditingHabit(null);
    setHabitName('');
    setIsModalVisible(true);
  }

  const onModalClose = () => {
    setIsModalVisible(false);
    setEditingHabit(null);
  };

  const handleSaveHabits = () => {
    let updatedGoals;
    if (editingHabit) {
      // Update existing habit
      updatedGoals = habits.map(h => h.id === editingHabit.id ? { ...h, name: habitName} : h);
      setHabits(updatedGoals);
    } else {
      // Add new habit
      const newGoal: Habit = {
        id: Date.now().toString(),
        name: habitName,
      };
      updatedGoals = [...habits, newGoal];
      setHabits(updatedGoals);
    }
    saveHabitsToStorage(updatedGoals);
    setHabitName('');
    onModalClose();
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitName(habit.name);
    setIsModalVisible(true);
  };

  const handleDeleteHabit = (habitId: string) => {
    const updatedHabits = habits.filter(g => g.id !== habitId);
    setHabits(updatedHabits);
    saveHabitsToStorage(updatedHabits);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hábitos Inteligentes</Text>
      <View style={styles.button}>
        <CustomButton
          title='Adicionar Hábito'
          onPress={onAddHabit}
          backgroundColor="#E94040"
          textColor="#FFE6E6"
          width={326}
          />
        </View>

      <FlatList
        data={habits}
        renderItem={({ item }) => (
          <View style={styles.goalItem}>
            <Text style={styles.goalText}>{item.name}</Text>
            <View style={styles.goalButtons}>
              <TouchableOpacity onPress={() => handleEditHabit(item)}>
                <Text style={styles.editButton}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteHabit(item.id)}>
                <Text style={styles.deleteButton}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyExtractor={item => item.id}
        numColumns={2}
        style={styles.grid}
      />

      <HabitModal 
        isVisible={isModalVisible} 
        onClose={onModalClose}
        onSave={handleSaveHabits}
        editingHabit={editingHabit}
        habitName={habitName}
        setHabitName={setHabitName}
      />

    
    </View>
  );  
}


const styles = StyleSheet.create ({
  container: {
    flex: 1,
    paddingTop: 30,
    gap: 5,
  },
    scrollContent: {
    paddingBottom: 70,
  },
  title: {
    marginLeft: 10,
    fontSize: 20,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 20,
    alignSelf: 'center',
  },
  button: {
    alignSelf: 'center',
  },
  modalContent: {
    width: '90%',
    height: '35%',
    backgroundColor: '#E5E8FF',
    marginHorizontal: '5%',
    borderRadius: 30,
    position: 'absolute',
    bottom: '30%',
  },
  modalTitles: {
    top: 5,
    color: '#5B79FF',
    alignSelf: 'flex-start',
    marginHorizontal: 30,
  },
  textInputs: {
    alignItems: 'center'
  },
  modalButtons: {
    justifyContent: 'center',
    flexDirection: 'row',
    padding: 15,
    gap: 15
  },
  goalItem: {

  },
  goalText: {

  },
  goalButtons: {

  },
  editButton: {

  },
  deleteButton: {

  },
  grid: {

  },
})