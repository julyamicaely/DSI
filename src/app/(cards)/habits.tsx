import { Text, View, StyleSheet, Modal, FlatList, TouchableOpacity, Button, Image, Alert } from 'react-native';
import { SafeAreaView} from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { addHabit, listHabits, updateHabit, deleteHabit } from "./services/habitsServices";
import { DateTimePickerComponent } from '../../com/DateTimePicker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import CustomButton from '../../com/CustomButton';
import CustomTextInput from '../../com/CustomTextInput';
import colors from '../../com/Colors';
import { hairlineWidth } from 'react-native/types_generated/Libraries/StyleSheet/StyleSheetExports';

type Habit = {
  id: string;
  name: string;
  time: any;
  reminders?: Date[];
};

function HabitModal ({ isVisible, onClose, onSave, editingHabit, habitName, setHabitName, onDelete, habitTime, onTimeChange, onAddReminder, reminders, onEditReminder, onDeleteReminder} : { isVisible: boolean, onClose: () => void, onSave: () => void, editingHabit: Habit | null, habitName: string, setHabitName: (text: string) => void, onDelete: () => void, habitTime: Date | null, onTimeChange: (event: DateTimePickerEvent, selectedDate?: Date) => void, onAddReminder: () => void, reminders: Date[], onEditReminder: (index: number) => void, onDeleteReminder: (index: number) => void}) {
  
  const handleReminderPress = (index: number) => {
    Alert.alert(
      'Editar Lembrete',
      'O que você gostaria de fazer?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          onPress: () => onDeleteReminder(index),
          style: 'destructive',
        },
        {
          text: 'Editar',
          onPress: () => onEditReminder(index),
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View>
      <Modal animationType='fade' transparent={true} visible={isVisible}>
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
            <View style={styles.remindersContainer}>
              {reminders.map((reminder, index) => (
                <CustomButton
                  key={index}
                  title={reminder.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  onPress={() => handleReminderPress(index)}
                  backgroundColor={'#FFFFFF'}
                  textColor={colors.ligthBlue}
                  width={'auto'}
                />
              ))}
            </View>
            <CustomButton
              title="Adicionar Lembrete"
              onPress={onAddReminder}
              backgroundColor={'#FFFFFF'}
              textColor={colors.ligthBlue}
              width={'90%'}
              height={40}
            />
          </View>
          <View style={styles.modalButtons}>
            <CustomButton
              title={'Voltar'}
              onPress = {onClose}
              backgroundColor={'#FFFFFF'}
              textColor={colors.ligthBlue}
              width={'50%'}
              height={40}
            />
            <CustomButton
              title={editingHabit ? 'Salvar Hábito' : 'Adicionar Hábito'}
              onPress={onSave}
              backgroundColor={'#FFFFFF'}
              textColor={colors.ligthBlue}
              width={'50%'}
              height={40}
            />
          </View>
          {editingHabit && (
            <View style={styles.deleteButtonContainer}>
              <CustomButton
                title="Excluir Hábito"
                onPress={onDelete}
                backgroundColor={'#FFFFFF'}
                textColor={colors.red}
                width={'90%'}
                height={40}
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
  const [habitName, setHabitName] = useState<string>('');
  const [habitTime, setHabitTime] = useState<Date | null>(new Date());
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [reminders, setReminders] = useState<Date[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingReminderIndex, setEditingReminderIndex] = useState<number | null>(null);

  useEffect(() => {
    loadHabitsFromStorage();
  }, []);

  const loadHabitsFromStorage = async () => {
    try {
      const storedHabits = await listHabits();
      if (storedHabits !== null) {
        setHabits(storedHabits as Habit[]);
      }
    } catch (error) {
      console.error('Failed to load habits from storage', error);
    }
  };

  const onAddHabit = () => {
    setEditingHabit(null);
    setHabitName('');
    setHabitTime(new Date());
    setReminders([]);
    setIsModalVisible(true);
  }

  const onModalClose = () => {
    setIsModalVisible(false);
    setEditingHabit(null);
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (event.type === 'set' && selectedDate) {
      if (editingReminderIndex !== null) {
        const updatedReminders = [...reminders];
        updatedReminders[editingReminderIndex] = selectedDate;
        setReminders(updatedReminders);
        setEditingReminderIndex(null);
      } else {
        setReminders([...reminders, selectedDate]);
      }
    }
  };

  const handleAddReminder = () => {
    setEditingReminderIndex(null);
    setShowTimePicker(true);
  };

  const handleEditReminder = (index: number) => {
    setEditingReminderIndex(index);
    setShowTimePicker(true);
  };

  const handleDeleteReminder = (index: number) => {
    const updatedReminders = reminders.filter((_, i) => i !== index);
    setReminders(updatedReminders);
  };

  const handleSaveHabits = async () => {
    if (editingHabit) {
      // Update existing habit
      await updateHabit(editingHabit.id, { name: habitName, time: habitTime, reminders: reminders });
    } else {
      // Add new habit
      await addHabit({ name: habitName, time: habitTime, reminders: reminders });
    }
    setHabitName('');
    onModalClose();

    loadHabitsFromStorage();
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setHabitName(habit.name);
    if (habit.time && typeof habit.time.seconds === 'number') {
      setHabitTime(new Date(habit.time.seconds * 1000));
    } else if (habit.time && typeof habit.time === 'string') {
      setHabitTime(new Date(habit.time));
    } else {
      setHabitTime(new Date());
    }
    if (habit.reminders) {
      const reminderDates = habit.reminders.map(r => {
        if (r && typeof (r as any).seconds === 'number') {
          return new Date((r as any).seconds * 1000);
        }
        return new Date(r);
      });
      setReminders(reminderDates);
    } else {
      setReminders([]);
    }
    setIsModalVisible(true);
  };

  const handleDeleteHabit = async () => {
    if (editingHabit) {
      const updatedHabits = habits.filter(g => g.id !== editingHabit.id);
      setHabits(updatedHabits);
      await deleteHabit(editingHabit.id);
      onModalClose();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hábitos Inteligentes</Text>
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
      <View style={styles.button}>
        <CustomButton
          title='Adicionar Hábito'
          onPress={onAddHabit}
          backgroundColor={colors.red}
          textColor={colors.lightRed}
          width={326}
        />
      </View>
      <HabitModal 
        isVisible={isModalVisible} 
        onClose={onModalClose}
        onSave={handleSaveHabits}
        editingHabit={editingHabit}
        habitName={habitName}
        setHabitName={setHabitName}
        onDelete={handleDeleteHabit}
        habitTime={habitTime}
        onTimeChange={onTimeChange}
        onAddReminder={handleAddReminder}
        reminders={reminders}
        onEditReminder={handleEditReminder}
        onDeleteReminder={handleDeleteReminder}
      />
      {showTimePicker && (
        <DateTimePicker
          value={habitTime || new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onTimeChange}
        />
      )}
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
    marginBottom: 50,
  },
  modalContent: {
    width: '90%',
    height: 'auto',
    backgroundColor: colors.lighterBlue,
    marginHorizontal: '5%',
    borderRadius: 30,
    position: 'absolute',
    bottom: '20%',
    borderWidth: 1,
    borderColor: colors.ligthBlue,
    borderStyle: 'dashed'
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
  remindersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
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