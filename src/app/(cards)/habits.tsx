import { Text, View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { addHabit, listHabits, updateHabit, deleteHabit } from "../../services/habitsServices";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import CustomButton from '../../components/CustomButton';
import CustomTextInput from '../../components/CustomTextInput';
import Colors from '../../components/Colors';
import Accordion from '../../components/Accordion';
import { registerForPushNotificationsAsync } from '../../utils/registerForPushNotifications';
import * as Notifications from 'expo-notifications';
import { List } from 'react-native-paper';
import ConfirmationModal from '../../components/ConfirmationModal';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, 
    shouldShowList: true,
  }),
});

LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  monthNamesShort: ['Jan.','Fev.','Mar.','Abr.','Mai.','Jun.','Jul.','Ago.','Set.','Out.','Nov.','Dez.'],
  dayNames: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],
  dayNamesShort: ['D','S','T','Q','Q','S','S']
};
LocaleConfig.defaultLocale = 'pt-br';

async function schedulePushNotification(habitName: string, reminder: Date, weekdays: number[], frequency: Frequency, selectedDates: { [date: string]: { selected: true; } }) {
  const reminderTime = new Date(reminder);

  if (frequency === 'daily') {
    // Schedule for every day of the week
    for (let i = 1; i <= 7; i++) {
      const trigger = {
        type: 'weekly' as const,
        channelId: 'default',
        weekday: i,
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
  } else if (frequency === 'weekly') {
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
  } else if (frequency === 'monthly' || frequency === 'yearly') {
    for (const dateStr in selectedDates) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const trigger = {
        channelId: 'default',
        year: frequency === 'yearly' ? year : undefined,
        month: month,
        day: day,
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
}

type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

type Habit = {
  id: string;
  name: string;
  time: any;
  reminders?: Date[];
  weekdays?: number[];
  frequency?: Frequency;
  selectedDates?: { [date: string]: { selected: true; } };
};

const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const frequencies: { label: string; value: Frequency }[] = [
    { label: 'Diariamente', value: 'daily' },
    { label: 'Semanalmente', value: 'weekly' },
    { label: 'Mensalmente', value: 'monthly' },
    { label: 'Anualmente', value: 'yearly' },
];

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
  const [frequency, setFrequency] = useState<Frequency>('weekly');
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [selectedDates, setSelectedDates] = useState<{ [date: string]: { selected: true; } }>({});
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
  const [isSaving, setIsSaving] = useState(false);

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
        <CustomButton title="Cancelar" onPress={closeModal} backgroundColor={Colors.lightGray} textColor={Colors.black} width={'30%'} />
        <CustomButton
          title="Excluir"
          onPress={() => {
            handleDeleteReminder(index);
            closeModal();
          }}
          backgroundColor={Colors.red}
          textColor={Colors.white}
          width={'30%'}
        />
        <CustomButton
          title="Editar"
          onPress={() => {
            handleEditReminder(index);
            closeModal();
          }}
          backgroundColor={Colors.lightBlue}
          textColor={Colors.white}
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
    setFrequency('weekly');
    setSelectedDates({});
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

  const onDayPress = (day: any) => {
    const dateString = day.dateString;
    setSelectedDates(prev => {
      const newDates = {...prev};
      if (newDates[dateString]) {
        delete newDates[dateString];
      } else {
        newDates[dateString] = { selected: true };
      }
      return newDates;
    });
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
        <CustomButton title="Cancelar" onPress={closeModal} backgroundColor={Colors.lightGray} textColor={Colors.black} width={'45%'} />
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
                <CustomButton title="OK" onPress={closeModal} backgroundColor={Colors.lightBlue} textColor={Colors.white} />
              );
            }
          }}
          backgroundColor={Colors.red}
          textColor={Colors.white}
          width={'45%'}
        />
      </>
    );
  };

  const handleSaveHabits = async () => {
    if (editingHabit) {
      setIsSaving(true);
      // Update existing habit
      const isNew = editingHabit.id.startsWith('new-');
      const habitData = { 
        name: habitName, 
        time: habitTime, 
        reminders: reminders, 
        weekdays: frequency === 'weekly' ? selectedWeekdays : (frequency === 'daily' ? [0,1,2,3,4,5,6] : []),
        frequency: frequency,
        selectedDates: selectedDates,
      };

      if (isNew) {
        await addHabit(habitData);
      } else {
        await updateHabit(editingHabit.id, habitData);
      }
    }

    await Notifications.cancelAllScheduledNotificationsAsync();
    const allHabits = await listHabits() as Habit[];
    if (allHabits) {
      for (const habit of allHabits) {
        if (habit.reminders && (habit.weekdays && habit.weekdays.length > 0 || habit.selectedDates)) {
          const reminderDates = habit.reminders.map(r =>
            r && typeof (r as any).seconds === 'number'
              ? new Date((r as any).seconds * 1000)
              : new Date(r)
          );
          for (const reminderDate of reminderDates) {
            await schedulePushNotification(habit.name, reminderDate, habit.weekdays || [], habit.frequency || 'weekly', habit.selectedDates || {});
          }
        }
      }
    }

    setHabitName('');
    onModalClose();

    loadHabitsFromStorage();
    setIsSaving(false);
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
      setFrequency(habit.frequency || 'weekly');
      setSelectedDates(habit.selectedDates || {});
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
                      backgroundColor={Colors.white}
                      textColor={Colors.blue}
                      width={'auto'}
                      borderWidth={1}
                      borderColor={Colors.blue}
                      padding={8}
                    />
                  ))}
                </View>
                <View style={styles.reminderButton}>
                  <CustomButton
                    title="Adicionar Horário"
                    iconName='add'
                    onPress={handleAddReminder}
                    backgroundColor={Colors.lightBlue}
                    textColor={Colors.white}
                    width={'95%'}
                    height={55}
                    padding={15}
                    borderColor={Colors.lightBlue2}
                  />
                </View>
                <Text style={styles.modalTitles}>Frequência</Text>
                <TouchableOpacity
                  style={styles.selectField}
                  onPress={() => setShowFrequencyPicker(!showFrequencyPicker)}
                >
                  <Text style={styles.selectFieldText}>
                    {frequencies.find(f => f.value === frequency)?.label || 'Selecione'}
                  </Text>
                </TouchableOpacity>

                {showFrequencyPicker && (
                  <View style={styles.dropdownList}>
                    {frequencies.map(freq => (
                      <TouchableOpacity
                        key={freq.value}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setFrequency(freq.value);
                          setShowFrequencyPicker(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{freq.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {frequency === 'weekly' && (
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
                )}
                {(frequency === 'monthly' || frequency === 'yearly') && (
                    <Calendar
                        onDayPress={onDayPress}
                        markedDates={selectedDates}
                        markingType={'multi-dot'}
                        theme={{
                            selectedDayBackgroundColor: Colors.lightBlue,
                            todayTextColor: Colors.lightBlue,
                            arrowColor: Colors.lightBlue,
                        }}
                    />
                )}
                <View style={styles.modalButtons}>
                  <CustomButton
                    title={editingHabit?.id.startsWith('new-') ? 'Adicionar Hábito' : 'Salvar'}
                    onPress={handleSaveHabits}
                    backgroundColor={Colors.lightBlue}
                    textColor={Colors.white}
                    width={'95%'}
                    height={55}
                    padding={15}
                    borderColor={Colors.lightBlue2}
                    iconName={isSaving ? 'save-outline' : (editingHabit?.id.startsWith('new-') ? 'add' : 'save-outline')}
                  />
                </View>
                <Text style={styles.deleteHintText}>
                  <Ionicons name="trash-outline" size={14} color={Colors.blue} />
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
            iconName='trash-outline'
            title={selectedHabits.length === 1 ? 'Excluir Hábito' : `Excluir ${selectedHabits.length} Hábitos`}
            onPress={handleDeleteSelected}
            backgroundColor={Colors.red}
            textColor={Colors.white}
            width={326}
          />
        ) : (
          <CustomButton
            iconName='add'
            title="Novo Hábito"
            onPress={onAddHabit}
            backgroundColor={Colors.red}
            textColor={Colors.white}
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
    backgroundColor: Colors.lightestBlue,
    marginHorizontal: '5%',
    borderRadius: 30,
    position: 'absolute',
    bottom: '30%',
    borderWidth: 1,
    borderColor: Colors.lightBlue,
    borderStyle: 'dashed',
    gap: -5,
  },
  accordion: {
    width: '90%',
  },
  modalTitles: {
    fontWeight: '500',
    gap: 10,
    color: Colors.blue,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 5,
    marginHorizontal: 30,
  },
  textInputs: {
    alignItems: 'center',
    marginBottom: 10,
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
  selectField: {
    width: '95%',
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.lightBlue,
    padding: 15,
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
  selectFieldText: {
    color: Colors.blue,
    fontWeight: '500',
    fontSize: 16,
  },
  dropdownList: {
    width: '95%',
    alignSelf: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.lightBlue,
    marginTop: -5,
    marginBottom: 10,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightestBlue,
  },
  dropdownItemText: {
    color: Colors.blue,
    fontSize: 16,
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
    borderColor: Colors.lightBlue,
  },
  weekdayButtonSelected: {
    backgroundColor: Colors.lightBlue,
  },
  weekdayText: {
    color: Colors.lightBlue,
  },
  weekdayTextSelected: {
    color: '#FFFFFF',
  },
  modalButtons: {
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: -10,
    gap: 10,
    color: Colors.blue,
    fontSize: 12,
    marginBottom: 15,
  },
  deleteHintText: {
    fontSize: 12,
    color: Colors.blue,
    marginBottom: 10,
    alignSelf: 'center',
  },
  column: {
    alignSelf: 'center'
  },
  listSection: {
    width: 350,
    marginEnd: 30,
  },
})