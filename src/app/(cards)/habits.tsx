import { Text, View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { addHabit, listHabits, updateHabit, deleteHabit } from "../../services/habitsServices";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import CustomButton from '../../components/CustomButton';
import CustomTextInput from '../../components/CustomTextInput';
import colors from '../../components/Colors';
import Accordion from '../../components/Accordion';
import { registerForPushNotificationsAsync } from '../../utils/registerForPushNotifications';
import * as Notifications from 'expo-notifications';
import { List } from 'react-native-paper';
import ConfirmationModal from '../../components/ConfirmationModal';

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

export default function HabitsScreen() {

  const [habits, setHabits] = useState<Habit[]>([]);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [habitName, setHabitName] = useState<string>('');
  const [habitTime, setHabitTime] = useState<Date | null>(new Date());
  const [isNewHabitAccordionExpanded, setIsNewHabitAccordionExpanded] = useState<boolean>(false);
  const [reminders, setReminders] = useState<Date[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingReminderIndex, setEditingReminderIndex] = useState<number | null>(null);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(
    undefined
  );
  const [isHabitNameFocused, setIsHabitNameFocused] = useState(false);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalActions, setModalActions] = useState<React.ReactNode | null>(null);

  const openModal = (title: string, message: string, actions: React.ReactNode) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalActions(actions);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalActions(null);
  };

  const handleReminderPress = (index: number) => {
    openModal(
      'Editar Lembrete',
      'Editar ou excluir este lembrete?',
      <>
        <CustomButton title="Cancelar" onPress={closeModal} backgroundColor={colors.lightGray} textColor={colors.black} width={'30%'} />
        <CustomButton
          title="Excluir"
          onPress={() => {
            handleDeleteReminder(index);
            closeModal();
          }}
          backgroundColor={colors.red}
          textColor={colors.white}
          width={'30%'}
        />
        <CustomButton
          title="Editar"
          onPress={() => {
            handleEditReminder(index);
            closeModal();
          }}
          backgroundColor={colors.lightBlue}
          textColor={colors.white}
          width={'30%'}
        />
      </>
    );
  };

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
    // Check if there's already a new habit being created
    if (habits.find(h => h.id.startsWith('new-'))) {
      return; // Or show an alert to the user
    }

    const newHabit: Habit = {
      id: `new-${Date.now()}`,
      name: 'Novo Hábito',
      time: new Date(),
      reminders: [],
      weekdays: []
    };

    setHabits(prev => [newHabit, ...prev]);
    setEditingHabit(newHabit);
    setHabitName('');
    setHabitTime(new Date());
    setReminders([]);
    setSelectedWeekdays([]);
    setIsNewHabitAccordionExpanded(false);
  }

  const onModalClose = () => {
    setIsNewHabitAccordionExpanded(false);
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

  const handleToggleSelect = (habitId: string) => {
    setSelectedHabits(prev => 
      prev.includes(habitId) 
        ? prev.filter(id => id !== habitId)
        : [...prev, habitId]
    );
  };

  const handleDeleteSelected = () => {
    const title = selectedHabits.length === 1 ? 'Excluir Hábito' : 'Excluir Hábitos';
    const message = selectedHabits.length === 1 
      ? 'Tem certeza que deseja excluir o hábito selecionado?'
      : `Tem certeza que deseja excluir os ${selectedHabits.length} hábitos selecionados?`;

    openModal(
      title,
      message,
      <>
        <CustomButton title="Cancelar" onPress={closeModal} backgroundColor={colors.lightGray} textColor={colors.black} width={'45%'} />
        <CustomButton
          title="Excluir"
          onPress={async () => {
            try {
              await Promise.all(selectedHabits.map(id => deleteHabit(id)));
              setSelectedHabits([]);
              loadHabitsFromStorage();
              closeModal();
            } catch (error) {
              closeModal();
              openModal('Erro', 'Não foi possível excluir os hábitos selecionados.', 
                <CustomButton title="OK" onPress={closeModal} backgroundColor={colors.lightBlue} textColor={colors.white} />
              );
            }
          }}
          backgroundColor={colors.red}
          textColor={colors.white}
          width={'45%'}
        />
      </>
    );
  };

  const handleSaveHabits = async () => {
    if (editingHabit) {
      // Update existing habit
      const isNew = editingHabit.id.startsWith('new-');
      if (isNew) {
        await addHabit({ name: habitName, time: habitTime, reminders: reminders, weekdays: selectedWeekdays });
      } else {
        await updateHabit(editingHabit.id, { name: habitName, time: habitTime, reminders: reminders, weekdays: selectedWeekdays });
      }
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
    if (editingHabit?.id === habit.id) {
      // If the same habit is clicked again, close the accordion
      setEditingHabit(null);
    } else {
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
      setIsNewHabitAccordionExpanded(false); // Close "Novo Hábito" accordion if open
    }
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
          <List.Section key={item.id} style={styles.listSection}>
            <Accordion
              title={item.name}
              isExpanded={editingHabit?.id === item.id}
              onPress={() => handleEditHabit(item)}
              isSelected={selectedHabits.includes(item.id)}
              onSelect={() => handleToggleSelect(item.id)}
            >
              <View>
                <View style={styles.textInputs}>
                  <Text style={styles.modalTitles}>Nome da atividade</Text>
                  <CustomTextInput
                    placeholder="Insira aqui"
                    value={habitName}
                    onChangeText={setHabitName}
                    borderRadius={8}
                  />
                </View>
                <View style={styles.remindersContainer}>
                  {reminders.map((reminder, index) => (
                    <CustomButton
                      key={index}
                      title={reminder.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      onPress={() => handleReminderPress(index)}
                      backgroundColor={colors.white}
                      textColor={colors.lightBlue}
                      width={'auto'}
                      borderWidth={1}
                      borderColor={colors.lightBlue}
                      padding={8}
                    />
                  ))}
                </View>
                <View style={styles.reminderButton}>
                  <CustomButton
                    title="Adicionar Horário"
                    onPress={handleAddReminder}
                    backgroundColor={colors.lighterBlue}
                    textColor={colors.lightBlue2}
                    width={'95%'}
                    height={28}
                    borderRadius={30}
                    borderWidth={1}
                    borderColor={colors.lightBlue2}
                  />
                </View>
                <View style={styles.weekdaysContainer}>
                  {weekDays.map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleToggleWeekday(index)}
                      style={[
                        styles.weekdayButton,
                        selectedWeekdays.includes(index) &&
                          styles.weekdayButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.weekdayText,
                          selectedWeekdays.includes(index) &&
                            styles.weekdayTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.modalButtons}>
                  <CustomButton
                    title={editingHabit?.id.startsWith('new-') ? 'Adicionar' : 'Salvar'}
                    onPress={handleSaveHabits}
                    backgroundColor={colors.lighterBlue}
                    textColor={colors.lightBlue2}
                    width={'95%'}
                    height={28}
                    borderWidth={1}
                    borderColor={colors.lightBlue2}
                  />
                </View>
                <Text style={styles.deleteHintText}>
                  Pressione o hábito para excluí-lo
                </Text>
              </View>
            </Accordion>
          </List.Section>
        )}
        keyExtractor={(item) => item.id}
        style={styles.column}
        contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}
      />
      <View style={styles.button}>
        {selectedHabits.length > 0 ? (
          <CustomButton
            title={selectedHabits.length === 1 ? 'Excluir Hábito' : `Excluir ${selectedHabits.length} Hábitos`}
            onPress={handleDeleteSelected}
            backgroundColor={colors.red}
            textColor={colors.white}
            width={326}
          />
        ) : (
          <CustomButton
            title="Novo Hábito"
            onPress={onAddHabit}
            backgroundColor={colors.red}
            textColor={colors.white}
            width={326}
          />
        )}
      </View>
      {showTimePicker && (
        <DateTimePicker
          value={habitTime || new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onTimeChange}
        />
      )}
      <ConfirmationModal
        visible={isModalVisible}
        title={modalTitle}
        message={modalMessage}
        onClose={closeModal}
      >
        {modalActions}
      </ConfirmationModal>
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
    marginBottom: 70,
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
  accordion: {
    width: '90%',
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
    marginBottom: -10,
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
    gap: 10,
    marginBottom: 20,
  },
  deleteHintText: {
    textAlign: 'center',
    color: colors.blue,
    fontSize: 12,
    marginBottom: 15,
    marginTop: -15
  },
  deleteButtonContainer: {
    alignItems: 'center',
    marginTop: -20,
    textDecorationStyle: 'dashed',
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
  column: {
    alignSelf: 'center'
  },
  listSection: {
    width: 350,
    marginEnd: 30,
  },
})