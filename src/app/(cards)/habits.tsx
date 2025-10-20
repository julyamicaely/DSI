import { Text, View, StyleSheet, Modal, FlatList, TouchableOpacity, Button, Image, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { addHabit, listHabits, updateHabit, deleteHabit } from "./services/habitsServices";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import CustomButton from '../../com/CustomButton';
import CustomTextInput from '../../com/CustomTextInput';
import colors from '../../com/Colors';
import { registerForPushNotificationsAsync } from '../../utils/registerForPushNotifications';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, 
    shouldShowList: true,
  }),
});

async function schedulePushNotification(habitName: string, reminder: Date, weekdays: number[]) {
  const reminderTime = new Date(reminder);

  for (const weekday of weekdays) {
    const dayIndex = weekday; // 0 for Sunday, 1 for Monday, etc.

    const trigger = {
      type: 'weekly' as const,
      channelId: 'default',
      weekday: dayIndex + 1,
      hour: reminderTime.getHours(),
      minute: reminderTime.getMinutes(),
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Lembrete de Hábito",
        body: `Está na hora de: ${habitName}`,
        data: { habit: habitName },
      },
      trigger,
    });
  }
}

type Habit = {
  id: string;
  name: string;
  time: any;
  reminders?: Date[];
  weekdays?: number[];
};

const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function HabitModal ({ isVisible, onClose, onSave, editingHabit, habitName, setHabitName, onDelete, habitTime, onTimeChange, onAddReminder, reminders, onEditReminder, onDeleteReminder, selectedWeekdays, onToggleWeekday} : { isVisible: boolean, onClose: () => void, onSave: () => void, editingHabit: Habit | null, habitName: string, setHabitName: (text: string) => void, onDelete: () => void, habitTime: Date | null, onTimeChange: (event: DateTimePickerEvent, selectedDate?: Date) => void, onAddReminder: () => void, reminders: Date[], onEditReminder: (index: number) => void, onDeleteReminder: (index: number) => void, selectedWeekdays: number[], onToggleWeekday: (dayIndex: number) => void}) {
  
  const handleReminderPress = (index: number) => {
    Alert.alert(
      'Editar Lembrete',
      'Editar ou excluir este lembrete?',
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
          </View>
            <View style={styles.remindersContainer}>
              {reminders.map((reminder, index) => (
                  <CustomButton
                    key={index}
                    title={reminder.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    onPress={() => handleReminderPress(index)}
                    backgroundColor={'#FFFFFF'}
                    textColor={colors.lightBlue}
                    width={'auto'}
                    borderWidth={2}
                    borderColor={colors.lightBlue}
                    padding={8}/>
              ))}
            </View  >
            <View style={styles.reminderButton}>
            <CustomButton
              title="Adicionar Horário"
              onPress={onAddReminder}
              backgroundColor={colors.lighterBlue}
              textColor={colors.lightBlue2}
              width={'95%'}
              height={28}
              borderRadius={30}
            />
            </View>
            <View style={styles.weekdaysContainer}>
              {weekDays.map((day, index) => (
                <TouchableOpacity key={index} onPress={() => onToggleWeekday(index)} style={[styles.weekdayButton, selectedWeekdays.includes(index) && styles.weekdayButtonSelected]}>
                  <Text style={[styles.weekdayText, selectedWeekdays.includes(index) && styles.weekdayTextSelected]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          <View style={styles.modalButtons}>
            <CustomButton
              title={'Voltar'}
              onPress = {onClose}
              backgroundColor={colors.lighterBlue}
              textColor={colors.lightBlue2}
              width={'50%'}
              height={28}
            />
            <CustomButton
              title={editingHabit ? 'Salvar' : 'Adicionar'}
              onPress={onSave}
              backgroundColor={colors.lighterBlue}
              textColor={colors.lightBlue2}
              width={'50%'}
              height={28}
            />
          </View>
          {editingHabit && (
            <View style={styles.deleteButtonContainer}>
              <CustomButton
                title="Excluir Hábito"
                onPress={onDelete}
                backgroundColor={colors.lighterBlue}
                textColor={colors.red}
                width={'95%'}
                height={28}
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
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(
    undefined
  );

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then(token => setExpoPushToken(token ?? ''))
      .catch((error: any) => setExpoPushToken(`${error}`));

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

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
    setSelectedWeekdays([]);
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

  const handleToggleWeekday = (dayIndex: number) => {
    setSelectedWeekdays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex) 
        : [...prev, dayIndex]
    );
  };

  const handleSaveHabits = async () => {
    if (editingHabit) {
      // Update existing habit
      await updateHabit(editingHabit.id, { name: habitName, time: habitTime, reminders: reminders, weekdays: selectedWeekdays });
    } else {
      // Add new habit
      await addHabit({ name: habitName, time: habitTime, reminders: reminders, weekdays: selectedWeekdays });
    }

    await Notifications.cancelAllScheduledNotificationsAsync();
    const allHabits = await listHabits() as Habit[];
    if (allHabits) {
      for (const habit of allHabits) {
        if (habit.reminders && habit.weekdays && habit.weekdays.length > 0) {
          const reminderDates = habit.reminders.map(r =>
            r && typeof (r as any).seconds === 'number'
              ? new Date((r as any).seconds * 1000)
              : new Date(r)
          );
          for (const reminderDate of reminderDates) {
            await schedulePushNotification(habit.name, reminderDate, habit.weekdays);
          }
        }
      }
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
    setSelectedWeekdays(habit.weekdays || []);
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
                <Text style={styles.habitText1} >{item.name}</Text>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
      {/*             <Text style={styles.habitText2} >{item.reminders && item.reminders.length > 0 ? item.reminders.slice(0, 2).map(r => {
                      if (r && typeof (r as any).seconds === 'number') {
                          return new Date((r as any).seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }
                      return new Date(r).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }).join(', ') : ''}</Text> */}
                  {editingHabit ? 
                  <Image source={require('../../assets/Vector 78.png')} style={styles.habitIcon}/> : <Image source={require('../../assets/Iconezitos.png')}/>}
                </View>
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
          title='Novo Hábito'
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
        selectedWeekdays={selectedWeekdays}
        onToggleWeekday={handleToggleWeekday}
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
    backgroundColor: '#fff',
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
    backgroundColor: colors.lightestBlue,
    marginHorizontal: '5%',
    borderRadius: 30,
    position: 'absolute',
    bottom: '30%',
    borderWidth: 1,
    borderColor: colors.lightBlue,
    borderStyle: 'dashed',
    gap: -5,
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
  reminderButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -10
  },
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
    gap: 5,
  },
  weekdayButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.lightBlue,
  },
  weekdayButtonSelected: {
    backgroundColor: colors.lightBlue,
  },
  weekdayText: {
    color: colors.lightBlue,
  },
  weekdayTextSelected: {
    color: '#FFFFFF',
  },
  modalButtons: {
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: -10,
    padding: 15,
    gap: 10,
  },
  deleteButtonContainer: {
    alignItems: 'center',
    marginTop: -20,
  },
  list: {
    alignSelf: 'center'
  },
  habitItem: {
  },
  habitButtons: {
    columnGap: 10
  },
    habitText1: {
      lineHeight: 22,
      fontSize: 16,
      fontWeight: 'bold',
  },
  habitText2: {
    lineHeight: 22,
    fontSize: 14,
    fontWeight: '300',
  },
  habitIcon: {
    tintColor: colors.red
  },
  editButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 350,
    height: 50,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.lighterBlue,
  },
  deleteButton: {

  },
  column: {
    alignSelf: 'center'
  },
})