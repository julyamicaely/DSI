import { Text, View, StyleSheet, Modal, FlatList, TouchableOpacity, Image } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from '../../com/CustomButton';
import CustomTextInput from '../../com/CustomTextInput';
import colors from '../../com/Colors';


type Habit = {
  id: string;
  name: string;
};

function HabitModal ({ isVisible, onClose, onSave, editingHabit, habitName, setHabitName, onDelete} : { isVisible: boolean, onClose: () => void, onSave: () => void, editingHabit: Habit | null, habitName: string, setHabitName: (text: string) => void, onDelete: () => void}) {
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
              backgroundColor={colors.white}
              borderRadius={8}
            />
          </View>
          <View style={styles.modalButtons}>
            <CustomButton
              title={'Voltar'}
              onPress = {onClose}
              backgroundColor={colors.blue}
              textColor="#FFFFFF"
              width={147}
            />
            <CustomButton
              title={editingHabit ? 'Salvar Hábito' : 'Adicionar Hábito'}
              onPress={onSave}
              backgroundColor={colors.blue}
              textColor="#FFFFFF"
              width={147}
            />
          </View>
          {editingHabit && (
            <View style={styles.deleteButtonContainer}>
              <CustomButton
                title="Excluir Hábito"
                onPress={onDelete}
                backgroundColor={colors.blue}
                textColor="#FFFFFF"
                width={312}
              />
            </View>
          )}
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

  const handleDeleteHabit = () => {
    if (editingHabit) {
      const updatedHabits = habits.filter(g => g.id !== editingHabit.id);
      setHabits(updatedHabits);
      saveHabitsToStorage(updatedHabits);
      onModalClose();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hábitos Inteligentes</Text>
      <View style={styles.button}>
        <CustomButton
          title='Adicionar Hábito'
          onPress={onAddHabit}
          backgroundColor={colors.red}
          textColor={colors.lightRed}
          width={326}
          />
        </View>

      <FlatList
        data={habits}
        renderItem={({ item }) => (
          <View style={styles.habitItem}>
            <View style={styles.habitButtons}>
              <TouchableOpacity onPress={() => handleEditHabit(item)} style={styles.editButton}>
                <Text style={styles.habitText} >{item.name}</Text>
                <Image source={require('../../assets/editButton.svg')}/>
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyExtractor={item => item.id}
        style={styles.column}
        contentContainerStyle={{ gap: 10 }}
      />

      <HabitModal 
        isVisible={isModalVisible} 
        onClose={onModalClose}
        onSave={handleSaveHabits}
        editingHabit={editingHabit}
        habitName={habitName}
        setHabitName={setHabitName}
        onDelete={handleDeleteHabit}
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
    height: '30%',
    backgroundColor: colors.lighterBlue,
    marginHorizontal: '5%',
    borderRadius: 30,
    position: 'absolute',
    bottom: '30%',
  },
  modalTitles: {
    top: 5,
    color: colors.blue,
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
  deleteButtonContainer: {
    alignItems: 'center',
  },
  list: {
    alignSelf: 'center'
  },
  habitItem: {
  },
  habitButtons: {
    columnGap: 10
  },
    habitText: {
      lineHeight: 22,
      fontSize: 16,
      fontWeight: 'bold',

  },
  editButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 350,
    height: 50,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.lighterBlue
  },
  deleteButton: {

  },
  column: {
    alignSelf: 'center'
  },
})