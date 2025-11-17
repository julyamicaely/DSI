import * as React from 'react';
const { useCallback, useEffect, useMemo, useState } = React;
import { Alert, FlatList, Modal, Platform, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import CustomButton from '../../com/CustomButton';
import CustomTextInput from '../../com/CustomTextInput';

import {
  DailyProgressEntry,
  Goal,
  GoalFormValues,
  Habit,
  addMonths,
  calculateMonthlyProgress,
  dateKey,
  formatDisplayDate,
  getMonthLabel,
  getMonthMatrix,
  isValidDayForHabit,
  parseDateKey,
  startOfMonth,
} from '../../lib/goals';
import {
  addGoal,
  deleteGoal,
  listGoals,
  updateGoal,
} from '../../services/goalsServices';
import { listHabits } from '../../services/habitsServices';
import { migrateLegacyGoals } from '../../lib/migrateGoals';
import {
  getTodayProgress,
  mergeDailyProgressIntoGoal,
  suggestDailyTarget,
} from '../../services/goalProgressServices';
import * as goalProgressServices from '../../services/goalProgressServices';

type HabitOption = Habit;

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function GoalsScreen() {
  
  console.log('🚀 GoalsScreen: Componente montado - VERSÃO COMPLETA');
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<HabitOption[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  // REMOVIDO: useGoalsSync - estava travando o componente

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showHabitList, setShowHabitList] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState('');
  const [target, setTarget] = useState('');
  const [dailyTarget, setDailyTarget] = useState('1');
  const [deadline, setDeadline] = useState(new Date());

  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(new Date()));

  const normalizeGoalForUI = useCallback(
    (goal: Goal, fallbackTarget?: number) =>
      mergeDailyProgressIntoGoal(goal, new Date(), fallbackTarget ?? suggestDailyTarget(goal.target)),
    []
  );


  const [dailyProgressModalVisible, setDailyProgressModalVisible] = useState(false);
  const [progressDateKey, setProgressDateKey] = useState<string | null>(null);
  const [dailyValue, setDailyValue] = useState('');
  const [dailyProgressTarget, setDailyProgressTarget] = useState('');
  const [dailyPickerVisible, setDailyPickerVisible] = useState(false);
  const [dailyTime, setDailyTime] = useState(new Date());

  const loadData = useCallback(async () => {
    console.log('🔄 loadData: Iniciando...');
    setRefreshing(true);
    try {
      console.log('📋 Buscando hábitos...');
      const fetchedHabits = (await listHabits()) as HabitOption[];
      console.log('✅ Hábitos carregados:', fetchedHabits.length);
      setHabits(fetchedHabits);

      console.log('🔧 Migrando metas antigas...');
      await migrateLegacyGoals(fetchedHabits).catch(() => ({ migrated: 0 }));

      console.log('🎯 Buscando metas...');
      const fetchedGoals = await listGoals();
      console.log('✅ Metas carregadas:', fetchedGoals.length);
      setGoals(fetchedGoals.map((goal) => normalizeGoalForUI(goal)));
    } catch (error) {
      console.error('❌ Erro ao carregar metas:', error);
    } finally {
      setRefreshing(false);
      setInitialLoading(false);
      console.log('✅ loadData: Finalizado');
    }
  }, [normalizeGoalForUI]);

  
  useEffect(() => {
    setInitialLoading(true);
    loadData();
  }, [loadData]);

  // REMOVIDO: useEffect do useGoalsSync - estava travando o componente

  const resetForm = () => {
    setEditingGoal(null);
    setSelectedHabitId('');
    setTarget('');
    setDailyTarget('1');
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
    setDailyTarget(String(goal.dailyTarget ?? suggestDailyTarget(goal.target, 1)));
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

  const normalizedDailyTarget = useMemo(
    () => Math.max(1, Number(dailyTarget) || 1),
    [dailyTarget]
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

    if (!isValidDayForHabit(habit, deadline)) {
      Alert.alert('Não é possível criar meta para dias sem hábito');
      return;
    }

    const payload: GoalFormValues = {
      habitId: habit.id,
      habitName: habit.name,
      target: target.trim(),
      deadline,
      dailyTarget: normalizedDailyTarget,
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
    setSelectedGoal(normalizeGoalForUI(goal, goal.dailyTarget ?? 1));
    setCalendarMonth(startOfMonth(new Date()));
    setProgressModalVisible(true);
  };

  const closeProgressModal = () => {
    setProgressModalVisible(false);
    setSelectedGoal(null);
  };
  
  const handleToggleDay = async (goalId: string, dayKey: string) => {
    try {
      const updated = await (goalProgressServices as any).markGoalAsCompleted(goalId, dayKey);
      setGoals((prev) =>
        prev.map((item) =>
          item.id === goalId
            ? normalizeGoalForUI({ ...item, progress: updated }, item.dailyTarget)
            : item
        )
      );
    } catch (error) {
      Alert.alert('Erro ao atualizar progresso', 'Não foi possível atualizar o status do dia.');
    }
  };

  const handleOpenDayProgress = (goal: Goal, day: Date) => {
    const habit = habits.find((h) => h.id === goal.habitId) ?? null;
    if (!isValidDayForHabit(habit, day)) {
      Alert.alert('Não é possível criar meta para dias sem hábito');
      return;
    }

    if (day > goal.deadline) {
      Alert.alert('Data inválida', 'O dia selecionado está além do prazo da meta.');
      return;
    }

    const key = dateKey(day);
    const existingEntry = goal.dailyProgress?.[key];
    setProgressDateKey(key);
    setDailyValue(existingEntry ? String(existingEntry.value) : '');
    setDailyProgressTarget(existingEntry ? String(existingEntry.target) : '');
    setDailyTime(existingEntry ? new Date(0, 0, 0, Math.floor(existingEntry.value / 60), existingEntry.value % 60) : new Date());
    setSelectedGoal(goal);
    setDailyProgressModalVisible(true);
  };
  const handleDailyTimeChange = (_: DateTimePickerEvent, selectedTime?: Date) => {
    if (selectedTime) {
      setDailyTime(selectedTime);
      const minutes = selectedTime.getHours() * 60 + selectedTime.getMinutes();
      setDailyValue(String(minutes));
    }
    if (Platform.OS !== 'ios') {
      setDailyPickerVisible(false);
    }
  };

  const handleSaveDailyProgress = async () => {
    if (!selectedGoal || !progressDateKey) return;

    const numericValue = Number(dailyValue);
    const numericTarget = Number(dailyProgressTarget);

    if (!numericTarget || numericTarget <= 0) {
      Alert.alert('Meta diária inválida', 'Informe um alvo diário maior que zero.');
      return;
    }

    if (numericValue < 0) {
      Alert.alert('Valor inválido', 'O valor atual não pode ser negativo.');
      return;
    }

    const percentage = Math.min(100, Math.round((numericValue / numericTarget) * 100));
    const entry: DailyProgressEntry = { value: numericValue, target: numericTarget, percentage };

    try {
      // build updated dailyProgress locally (persist via updateGoal)
      const currentDaily = selectedGoal.dailyProgress ? { ...selectedGoal.dailyProgress } : {};
      const updatedDailyProgress = { ...currentDaily, [progressDateKey]: entry };

      const updatedProgress = [...(selectedGoal.progress ?? [])];
      const currentIndex = updatedProgress.indexOf(progressDateKey);

      if (percentage >= 100 && currentIndex === -1) {
        updatedProgress.push(progressDateKey);
      } else if (percentage < 100 && currentIndex >= 0) {
        updatedProgress.splice(currentIndex, 1);
      }

      await updateGoal(selectedGoal.id, {
        habitId: selectedGoal.habitId,
        habitName: selectedGoal.habitName,
        target: selectedGoal.target,
        deadline: selectedGoal.deadline,
        progress: updatedProgress,
        dailyProgress: updatedDailyProgress,
      });

      setGoals((prev) =>
        prev.map((goal) =>
          goal.id === selectedGoal.id
            ? { ...goal, progress: updatedProgress, dailyProgress: updatedDailyProgress }
            : goal
        )
      );

      setSelectedGoal((prev) =>
        prev && prev.id === selectedGoal.id
          ? { ...prev, progress: updatedProgress, dailyProgress: updatedDailyProgress }
          : prev
      );

      setDailyProgressModalVisible(false);
    } catch (error) {
      Alert.alert('Erro ao salvar progresso', 'Não foi possível registrar o progresso diário.');
    }
  };

  const handleRemoveDailyProgress = async () => {
    if (!selectedGoal || !progressDateKey) return;

    try {
      // load current stored daily progress, remove the specific day locally
      // hydrateDailyProgress expects the Goal object and returns an object that includes `snapshot`
      // which contains the map of stored daily entries.
      const hydrateResult = await goalProgressServices.hydrateDailyProgress(
        selectedGoal,
        new Date(),
        selectedGoal.dailyTarget ?? 1
      );
      const stored = (hydrateResult && (hydrateResult.snapshot ?? {})) as Record<string, DailyProgressEntry>;
      const updatedDailyProgress = { ...stored };
      delete updatedDailyProgress[progressDateKey];

      const updatedProgress = (selectedGoal.progress ?? []).filter((day) => day !== progressDateKey);

      await updateGoal(selectedGoal.id, {
        habitId: selectedGoal.habitId,
        habitName: selectedGoal.habitName,
        target: selectedGoal.target,
        deadline: selectedGoal.deadline,
        progress: updatedProgress,
        dailyProgress: updatedDailyProgress,
      });

      setGoals((prev) =>
        prev.map((goal) =>
          goal.id === selectedGoal.id
            ? { ...goal, progress: updatedProgress, dailyProgress: updatedDailyProgress }
            : goal
        )
      );
      setSelectedGoal((prev) =>
        prev && prev.id === selectedGoal.id
          ? { ...prev, progress: updatedProgress, dailyProgress: updatedDailyProgress }
          : prev
      );
      setDailyProgressModalVisible(false);
    } catch (error) {
      Alert.alert('Erro ao excluir', 'Não foi possível remover o progresso diário.');
    }
  };

  const renderGoalCard = ({ item }: { item: Goal }) => {
    try {
      console.log('🎴 Renderizando card da meta:', item.id, item.habitName);
      const habit = habits.find((h) => h.id === item.habitId) ?? null;
      const todayProgress = getTodayProgress(item, new Date(), item.dailyTarget ?? 1);
      const progressPercentage = calculateMonthlyProgress(
        item,
        new Date(),
        habit?.weekdays,
        item.deadline
      );

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

          <View style={styles.dailyProgressContainer}>
            <Text style={styles.dailyProgressLabel}>Progresso de hoje</Text>
            <View style={styles.dailyProgressBar}>
              <View style={[styles.dailyProgressFill, { width: `${todayProgress.percentage}%` }]} />
            </View>
            <Text style={styles.dailyProgressText}>
              {todayProgress.percentage}% ({todayProgress.value}/{todayProgress.target})
            </Text>
          </View>

          <Text style={styles.cardHint}>Toque para detalhar o progresso.</Text>
        </Pressable>
      );
    } catch (error) {
      console.error('❌ Erro ao renderizar card:', error);
      return <Text style={{ color: 'red', padding: 10 }}>Erro ao renderizar meta</Text>;
    }
  };

  // Simplificado - removido useMemo que estava travando
  const monthMatrix = getMonthMatrix(calendarMonth);
  const todayKey = dateKey(new Date());

  console.log('🎨 Renderizando tela - goals:', goals.length, 'habits:', habits.length, 'initialLoading:', initialLoading);

  try {
    if (initialLoading) {
      console.log('⏳ Exibindo tela de loading...');
      return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontSize: 18, color: '#666' }}>Carregando metas...</Text>
        </View>
      );
    }

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
             <View style={styles.modalContent}>
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
                  <FlatList
                    data={habits}
                    keyExtractor={(habit) => habit.id}
                    scrollEnabled={habits.length > 6}
                    renderItem={({ item: habit }) => (
                      <Pressable
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedHabitId(habit.id);
                          setShowHabitList(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{habit.name}</Text>
                      </Pressable>
                    )}
                    ListEmptyComponent={
                      <Text style={styles.dropdownEmpty}>Cadastre hábitos para vincular metas.</Text>
                    }
                  />
                </View>
              )}

              <Text style={styles.modalLabel}>Meta</Text>
              <CustomTextInput
                placeholder="Descreva sua meta (ex: 30 minutos)"
                value={target}
                onChangeText={setTarget}
              />
              <Text style={styles.modalLabel}>Meta diária</Text>
              <CustomTextInput
                placeholder="Ex: 1 vez por dia (sugerido)"
                value={dailyTarget}
                onChangeText={setDailyTarget}
                keyboardType="numeric"
              />
              <Text style={styles.modalHelper}>
                A porcentagem diária é calculada automaticamente. Marque o dia no calendário ou
                registre o progresso para ver o avanço de hoje.
              </Text>

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
             </View>
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
                  {WEEKDAY_LABELS.map((label, index) => (
                    <Text key={`${label}-${index}`} style={styles.weekHeaderText}>
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
                      const habit = habits.find((h) => h.id === selectedGoal.habitId) ?? null;
                      const allowedDay = isValidDayForHabit(habit, day);

                      return (
                        <Pressable
                          key={key}
                          style={[
                            styles.dayCell,
                            !isCurrentMonth && styles.dayCellMuted,
                            isCompleted && styles.dayCellCompleted,
                            afterDeadline && styles.dayCellDisabled,
                            isToday && styles.dayCellToday,
                            !allowedDay && styles.dayCellDisabled,
                          ]}
                          disabled={!isCurrentMonth || afterDeadline || !allowedDay}
                          onPress={() => handleOpenDayProgress(selectedGoal, day)}
                        >
                          <Text
                            style={[
                              styles.dayCellText,
                              (!isCurrentMonth || afterDeadline || !allowedDay) && styles.dayCellTextMuted,
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

                <Text style={styles.calendarHint}>Toque nos dias para registrar o progresso diário.</Text>

                <View style={styles.dailySummaryBox}>
                  <Text style={styles.dailySummaryTitle}>Progresso de hoje</Text>
                  <Text style={styles.dailySummaryText}>
                    {selectedGoal.dailyProgress?.[todayKey]
                      ? `${selectedGoal.dailyProgress[todayKey].percentage}% (${selectedGoal.dailyProgress[todayKey].value}/${selectedGoal.dailyProgress[todayKey].target})`
                      : 'Nenhum progresso registrado hoje'}
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <CustomButton
                    title="Editar meta"
                    onPress={() => {
                      openEditModal(selectedGoal);
                      setProgressModalVisible(false);
                    }}
                    backgroundColor="#5B79FF"
                    textColor="#FFFFFF"
                    width={147}
                  />
                  <CustomButton
                    title="Excluir"
                    onPress={() => handleDeleteGoal(selectedGoal)}
                    backgroundColor="#E94040"
                    textColor="#FFFFFF"
                    width={147}
                  />
                </View>

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

      
      <Modal animationType="slide" transparent visible={dailyProgressModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.modalTitle}>Progresso diário</Text>
              <Text style={styles.modalLabel}>
                {progressDateKey ? `Dia ${formatDisplayDate(parseDateKey(progressDateKey))}` : ''}
              </Text>

              <Text style={styles.modalLabel}>Valor atual</Text>
              <CustomTextInput
                keyboardType="numeric"
                value={dailyValue}
                onChangeText={setDailyValue}
                placeholder="Ex: 1 (km) ou minutos"
              />

              <Text style={styles.modalLabel}>Meta diária</Text>
              <CustomTextInput
                keyboardType="numeric"
                value={dailyProgressTarget}
                onChangeText={setDailyProgressTarget}
                placeholder="Ex: 2 (km) ou minutos"
              />

              <Pressable style={styles.selectField} onPress={() => setDailyPickerVisible(true)}>
                <Text style={styles.selectFieldText}>Registrar por tempo</Text>
              </Pressable>

              {dailyPickerVisible && (
                <DateTimePicker
                  value={dailyTime}
                  mode="time"
                  display="spinner"
                  onChange={handleDailyTimeChange}
                />
              )}

              <View style={styles.modalActions}>
                <CustomButton
                  title="Cancelar"
                  onPress={() => setDailyProgressModalVisible(false)}
                  backgroundColor="#5B79FF"
                  textColor="#FFFFFF"
                  width={147}
                />
                <CustomButton
                  title="Salvar"
                  onPress={handleSaveDailyProgress}
                  backgroundColor="#5B79FF"
                  textColor="#FFFFFF"
                  width={147}
                />
              </View>

              {progressDateKey && selectedGoal?.dailyProgress?.[progressDateKey] && (
                <View style={styles.deleteRow}>
                  <CustomButton
                    title="Remover registro"
                    onPress={handleRemoveDailyProgress}
                    backgroundColor="#E94040"
                    textColor="#FFFFFF"
                    width={326}
                  />
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
  } catch (error) {
    console.error('💥 Erro fatal ao renderizar GoalsScreen:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, color: 'red', textAlign: 'center' }}>
          Erro ao carregar a tela de metas
        </Text>
        <Text style={{ fontSize: 14, color: '#666', marginTop: 10, textAlign: 'center' }}>
          {String(error)}
        </Text>
      </View>
    );
  }
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
  cardHint: {
    textAlign: 'center',
    color: '#5B79FF',
    fontSize: 12,
    marginTop: 8,
  },
  dailyProgressContainer: {
    marginTop: 10,
    gap: 6,
  },
  dailyProgressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  dailyProgressBar: {
    height: 8,
    backgroundColor: '#E1E6FF',
    borderRadius: 6,
    overflow: 'hidden',
  },
  dailyProgressFill: {
    height: '100%',
    backgroundColor: '#5B79FF',
  },
  dailyProgressText: {
    fontSize: 12,
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
  modalHelper: {
    color: '#5B79FF',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
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
  dropdownFlatList: {
    maxHeight: 160,
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
  deleteRow: {
    marginTop: 12,
    alignItems: 'center',
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
  dailySummaryBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#E1E6FF',
  },
  dailySummaryTitle: {
    fontWeight: '700',
    color: '#333',
  },
  dailySummaryText: {
    marginTop: 4,
    color: '#5B79FF',
  },
});