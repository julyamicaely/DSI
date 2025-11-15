import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import CustomButton from '../../com/CustomButton';
import CustomTextInput from '../../com/CustomTextInput';

import {
  Goal,
  GoalFormValues,
  addMonths,
  calculateMonthlyProgress,
  dateKey,
  formatDisplayDate,
  getMonthLabel,
  getMonthMatrix,
  startOfMonth,
} from '../../lib/goals';
import {
  addGoal,
  deleteGoal,
  listGoals,
  markGoalAsCompleted,
  updateGoal,
} from './services/goalsServices';
import { listHabits } from './services/habitsServices';
import { migrateLegacyGoals } from '../../lib/migrateGoals';

type HabitOption = {
  id: string;
  name: string;
};

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function GoalsScreen() {
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<HabitOption[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showHabitList, setShowHabitList] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState(new Date());

  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(new Date()));

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const fetchedHabits = (await listHabits()) as HabitOption[];
      setHabits(fetchedHabits);

      await migrateLegacyGoals(fetchedHabits).catch(() => ({ migrated: 0 }));

      const fetchedGoals = await listGoals();
      setGoals(fetchedGoals);
    } catch (error) {
      console.error('Erro ao carregar metas', error);
    } finally {
      setRefreshing(false);
      setInitialLoading(false);
    }
  }, []);

  
  useEffect(() => {
    setInitialLoading(true);
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setEditingGoal(null);
    setSelectedHabitId('');
    setTarget('');
    setDeadline(new Date());
    setShowHabitList(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalVisible(true);
  };


  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setSelectedHabitId(goal.habitId);
    setTarget(goal.target);
    setDeadline(goal.deadline instanceof Date ? goal.deadline : new Date(goal.deadline));
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    resetForm();
  };

  const selectedHabit = useMemo(
    () => habits.find((habit) => habit.id === selectedHabitId) ?? null,
    [habits, selectedHabitId]
  );

  const handleDeadlineChange = (_: DateTimePickerEvent, date?: Date) => {
    if (date) {
      setDeadline(date);
    }
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
  };

  const handleSaveGoal = async () => {

    if (!selectedHabitId) {
      Alert.alert('Selecione um hábito', 'É necessário vincular a meta a um hábito existente.');
      return;
    }

    if (!target.trim()) {
      Alert.alert('Meta inválida', 'Descreva a meta antes de salvar.');
      return;
    }

    const habit = habits.find((item) => item.id === selectedHabitId);
    if (!habit) {
      Alert.alert('Hábito não encontrado', 'Atualize a lista de hábitos e tente novamente.');
      return;
    }

    const payload: GoalFormValues = {
      habitId: habit.id,
      habitName: habit.name,
      target: target.trim(),
      deadline,
    };

    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, payload);
      } else {
        await addGoal(payload);
      }
      closeModal();
      await loadData();
    } catch (error) {
      Alert.alert('Erro ao salvar', 'Não foi possível salvar a meta. Tente novamente.');
    }
  };

  const handleDeleteGoal = (goal: Goal) => {
    Alert.alert(
      'Excluir meta',
      'Tem certeza de que deseja excluir esta meta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(goal.id);
              if (selectedGoal?.id === goal.id) {
                setProgressModalVisible(false);
                setSelectedGoal(null);
              }
              await loadData();
            } catch (error) {
              Alert.alert('Erro ao excluir', 'Não foi possível excluir a meta.');
            }
          },
        },
      ]
    );
  };

  const openProgressModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setCalendarMonth(startOfMonth(new Date()));
    setProgressModalVisible(true);
  };

  const closeProgressModal = () => {
    setProgressModalVisible(false);
    setSelectedGoal(null);
  };

  const handleToggleDay = async (goalId: string, dayKey: string) => {
    try {
      const updated = await markGoalAsCompleted(goalId, dayKey);
      setGoals((prev) =>
        prev.map((item) => (item.id === goalId ? { ...item, progress: updated } : item))
      );
      setSelectedGoal((prev) => (prev && prev.id === goalId ? { ...prev, progress: updated } : prev));
    } catch (error) {
      Alert.alert('Erro ao atualizar progresso', 'Não foi possível marcar o dia selecionado.');
    }
  };

  const renderGoalCard = ({ item }: { item: Goal }) => {
    const progressPercentage = calculateMonthlyProgress(item, new Date());

    return (
      <Pressable style={styles.goalCard} onPress={() => openProgressModal(item)}>
        <Text style={styles.goalTitle}>{item.habitName}</Text>
        <Text style={styles.goalSubtitle}>{item.target}</Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{`${progressPercentage}% concluído`}</Text>
        </View>

        <View style={styles.cardActions}>
          <Pressable
            style={[styles.actionButton, styles.editButton]}
            onPress={(event) => {
              event.stopPropagation();
              openEditModal(item);
            }}
          >
            <Text style={styles.editButtonText}>Editar</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.deleteButton]}
            onPress={(event) => {
              event.stopPropagation();
              handleDeleteGoal(item);
            }}
          >
            <Text style={styles.deleteButtonText}>Excluir</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const monthMatrix = useMemo(() => getMonthMatrix(calendarMonth), [calendarMonth]);
  const todayKey = dateKey(new Date());

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Metas de atividade física</Text>

      <View style={styles.addButtonWrapper}>
        <CustomButton
          title="Adicionar Meta de Atividade"
          onPress={openCreateModal}
          backgroundColor="#E94040"
          textColor="#FFE6E6"
          width={326}
        />
      </View>

      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        numColumns={2}
 
        refreshing={refreshing}
        onRefresh={loadData}
        contentContainerStyle={[styles.grid, goals.length === 0 && styles.emptyListContainer]}
        renderItem={renderGoalCard}
        ListEmptyComponent={
          !initialLoading ? (
            <Text style={styles.emptyText}>
              Crie uma meta para acompanhar seu progresso junto aos hábitos.
            </Text>
          ) : null
        }
      />


      <Modal animationType="slide" transparent visible={isModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingGoal ? 'Editar meta vinculada' : 'Nova meta vinculada'}
              </Text>

              <Text style={styles.modalLabel}>Hábito</Text>
              <Pressable
                style={styles.selectField}
                onPress={() => setShowHabitList((prev) => !prev)}
              >
                <Text style={styles.selectFieldText}>
                  {selectedHabit ? selectedHabit.name : 'Selecione um hábito'}
                </Text>
              </Pressable>

              {showHabitList && (
                <View style={styles.dropdownList}>
                  {habits.length === 0 ? (
                    <Text style={styles.dropdownEmpty}>Cadastre hábitos para vincular metas.</Text>
                  ) : (
                    <ScrollView>
                      {habits.map((habit) => (
                        <Pressable
                          key={habit.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedHabitId(habit.id);
                            setShowHabitList(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{habit.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}

              <Text style={styles.modalLabel}>Meta</Text>
              <CustomTextInput
                placeholder="Descreva sua meta (ex: 30 minutos)"
                value={target}
                onChangeText={setTarget}
              />

              <Text style={styles.modalLabel}>Prazo</Text>
              <Pressable style={styles.selectField} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.selectFieldText}>{formatDisplayDate(deadline)}</Text>
              </Pressable>

              {showDatePicker && (
                <DateTimePicker
                  value={deadline}
                  mode="date"
                  display="spinner"
                  onChange={handleDeadlineChange}
                  minimumDate={new Date()}
                />
              )}

              <View style={styles.modalActions}>
                <CustomButton
                  title="Cancelar"
                  onPress={closeModal}
                  backgroundColor="#5B79FF"
                  textColor="#FFFFFF"
                  width={147}
                />
                <CustomButton
                  title={editingGoal ? 'Salvar Meta' : 'Criar Meta'}
                  onPress={handleSaveGoal}
                  backgroundColor="#5B79FF"
                  textColor="#FFFFFF"
                  width={147}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={progressModalVisible}>
        <View style={styles.progressOverlay}>
          <View style={styles.progressContainer}>
            {selectedGoal && (
              <>
                <Text style={styles.progressTitle}>{selectedGoal.habitName}</Text>
                <Text style={styles.progressSubtitle}>{selectedGoal.target}</Text>
                <Text style={styles.progressDeadline}>
                  Prazo: {formatDisplayDate(selectedGoal.deadline)}
                </Text>

                <View style={styles.calendarHeader}>
                  <Pressable onPress={() => setCalendarMonth(addMonths(calendarMonth, -1))}>
                    <Text style={styles.calendarNavigation}>◀</Text>
                  </Pressable>
                  <Text style={styles.calendarTitle}>{getMonthLabel(calendarMonth)}</Text>
                  <Pressable onPress={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
                    <Text style={styles.calendarNavigation}>▶</Text>
                  </Pressable>
                </View>

                <View style={styles.weekHeader}>
                  {WEEKDAY_LABELS.map((label) => (
                    <Text key={label} style={styles.weekHeaderText}>
                      {label}
                    </Text>
                  ))}
                </View>

                {monthMatrix.map((week) => (
                  <View key={week.map(dateKey).join('-')} style={styles.weekRow}>
                    {week.map((day) => {
                      const key = dateKey(day);
                      const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
                      const isCompleted = selectedGoal.progress.includes(key);
                      const isToday = key === todayKey;
                      const afterDeadline = day > selectedGoal.deadline;

                      return (
                        <Pressable
                          key={key}
                          style={[
                            styles.dayCell,
                            !isCurrentMonth && styles.dayCellMuted,
                            isCompleted && styles.dayCellCompleted,
                            afterDeadline && styles.dayCellDisabled,
                            isToday && styles.dayCellToday,
                          ]}
                          disabled={!isCurrentMonth || afterDeadline}
                          onPress={() => handleToggleDay(selectedGoal.id, key)}
                        >
                          <Text
                            style={[
                              styles.dayCellText,
                              (!isCurrentMonth || afterDeadline) && styles.dayCellTextMuted,
                              isCompleted && styles.dayCellTextCompleted,
                            ]}
                          >
                            {day.getDate()}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}

                <Text style={styles.calendarHint}>Toque nos dias para marcar ou desmarcar o progresso.</Text>

                <CustomButton
                  title="Fechar"
                  onPress={closeProgressModal}
                  backgroundColor="#5B79FF"
                  textColor="#FFFFFF"
                  width={326}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  
  addButtonWrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  grid: {
    paddingBottom: 120,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#5B79FF',
    fontWeight: '500',
    fontSize: 16,
    paddingHorizontal: 24,
  },
  goalCard: {
    flex: 1,
    backgroundColor: '#F8F9FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E1E6FF',
    margin: 6,
    padding: 14,
    justifyContent: 'space-between',
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    color: '#333',
    marginBottom: 6,
  },
  goalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#5B79FF',
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E1E6FF',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#5B79FF',
    borderRadius: 6,
  },
  progressLabel: {
    marginTop: 6,
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  editButton: {
    borderColor: '#5B79FF',
  },
  deleteButton: {
    borderColor: '#E94040',
  },
  editButtonText: {
    fontWeight: '700',
    color: '#5B79FF',
  },
  deleteButtonText: {
    fontWeight: '700',
    color: '#E94040',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#F8F9FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1E6FF',
    overflow: 'hidden',
  },
  modalContent: {
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5B79FF',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalLabel: {
    color: '#333',
    fontWeight: '600',
    marginTop: 8,
  },
  selectField: {
    borderWidth: 1,
    borderColor: '#A6B6FF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 6,
  },
  selectFieldText: {
    color: '#333',
    fontSize: 14,
  },
  dropdownList: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: '#E1E6FF',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  dropdownEmpty: {
    padding: 12,
    textAlign: 'center',
    color: '#5B79FF',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2FF',
  },
  dropdownItemText: {
    color: '#333',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  progressOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#F8F9FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1E6FF',
    padding: 20,
    gap: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#5B79FF',
    textAlign: 'center',
  },
  progressDeadline: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  calendarNavigation: {
    fontSize: 18,
    color: '#5B79FF',
    paddingHorizontal: 12,
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  weekHeaderText: {
    width: 36,
    textAlign: 'center',
    fontWeight: '600',
    color: '#5B79FF',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  dayCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  dayCellMuted: {
    backgroundColor: '#F0F2FF',
  },
  dayCellCompleted: {
    backgroundColor: '#5B79FF',
  },
  dayCellDisabled: {
    backgroundColor: '#E1E6FF',
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: '#5B79FF',
  },
  dayCellText: {
    color: '#333',
    fontWeight: '600',
  },
  dayCellTextMuted: {
    color: '#A6B6FF',
  },
  dayCellTextCompleted: {
    color: '#FFFFFF',
  },
  calendarHint: {
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
    marginTop: 12,
  },
});