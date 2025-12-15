// src/components/GoalAccordionCard.tsx
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager, TextInput, Alert, Animated, PanResponder, PanResponderGestureState } from 'react-native';
import { Goal, Habit, GoalFormValues, DailyProgressEntry } from '../types';
import colors from './Colors';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomButton from './CustomButton';
import HabitSelector from './HabitSelector';
import { dateKey } from '../lib/goals';
import { isDateValidForHabit } from '../utils/habitUtils';
import { completeGoal } from '../services/goalsServices';
import { toast } from '../utils/toast';

interface GoalAccordionCardProps {
  goal: Goal;
  isExpanded: boolean;
  onToggle: () => void;
  habits: Habit[];
  onSave: (goalId: string, data: GoalFormValues) => Promise<void>;
  onSaveProgress: (goalId: string, dateKey: string, entry: DailyProgressEntry) => Promise<void>;
  onDelete: (goalId: string) => void;
  isSelected: boolean;
  onSelectToggle: (goalId: string) => void;
  readOnly?: boolean;
  disableDeleteAlert?: boolean;
}

const GoalAccordionCard: React.FC<GoalAccordionCardProps> = React.memo(({
  goal,
  isExpanded,
  onToggle,
  onSave,
  onSaveProgress,
  onDelete,
  isSelected,
  onSelectToggle,
  habits,
  readOnly = false,
  disableDeleteAlert = false,
}) => {

  // Form State
  const [formData, setFormData] = useState<GoalFormValues>({
    name: goal.name,
    description: goal.description,
    target: goal.target,
    dailyTarget: goal.dailyTarget,
    deadline: new Date(goal.deadline),
    habitId: goal.habitId,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Progress State
  const todayKey = dateKey(new Date());
  const [todayProgress, setTodayProgress] = useState<string>('');

  // Swipe Logic
  // Swipe Logic
  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !readOnly,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderMove: (_, gestureState: PanResponderGestureState) => {
        if (gestureState.dx < 0) {
          // Only allow left swipe
          translateX.setValue(Math.max(gestureState.dx, -80));
        }
      },
      onPanResponderRelease: (_, gestureState: PanResponderGestureState) => {
        if (gestureState.dx < -40) {
          // Swipe detected - expand!
          if (!isExpanded) toggleAccordion();

          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        } else {
          // Return to start
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    setFormData({
      name: goal.name,
      description: goal.description,
      target: goal.target,
      dailyTarget: goal.dailyTarget,
      deadline: new Date(goal.deadline),
      habitId: goal.habitId,
    });

    // Load today's progress if exists
    const currentDaily = goal.dailyProgress?.[todayKey];
    if (currentDaily) {
      setTodayProgress(String(currentDaily.progress));
    } else {
      setTodayProgress('');
    }
  }, [goal, todayKey]);

  const toggleAccordion = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  }, [onToggle]);

  const handleLongPress = useCallback(() => {
    onSelectToggle(goal.id);
  }, [goal.id, onSelectToggle]);

  const handlePress = useCallback(() => {
    if (isSelected) {
      onSelectToggle(goal.id);
    } else {
      toggleAccordion();
    }
  }, [isSelected, onSelectToggle, goal.id, toggleAccordion]);

  const handleSavePress = async () => {
    setIsSaving(true);
    try {
      await onSave(goal.id, formData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegisterProgress = async () => {
    const progressValue = parseFloat(todayProgress);
    if (isNaN(progressValue)) {
      Alert.alert("Erro", "Insira um valor numérico válido.");
      return;
    }

    const target = goal.dailyTarget || 1;
    const percentage = Math.min(100, (progressValue / target) * 100);

    const entry: DailyProgressEntry = {
      progress: progressValue,
      target: target,
      percentage: percentage
    };

    try {
      await onSaveProgress(goal.id, todayKey, entry);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeletePress = () => {
    if (disableDeleteAlert) {
      onDelete(goal.id);
      return;
    }

    Alert.alert(
      "Excluir Meta",
      "Tem certeza que deseja excluir esta meta?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => onDelete(goal.id) }
      ]
    );
  };

  const handleChange = (field: keyof GoalFormValues, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const progressPercentage = Math.round((goal.progressTotal / goal.target) * 100) || 0;
  const dailyProgressPercentage = goal.dailyProgress?.[todayKey]?.percentage || 0;

  const handleCompleteGoal = async () => {
    try {
      const { newUnlock, achievements } = await completeGoal(goal);
      if (newUnlock) {
        toast.success("Conquista Desbloqueada!", `Você desbloqueou ${achievements.length} nova(s) conquista(s)!`);
      } else {
        toast.info("Meta Concluída", "Sua meta foi registrada. Continue assim!");
      }
      // Optional: Refresh goals list or navigate
    } catch (error) {
      console.error(error);
      toast.error("Erro", "Falha ao completar meta.");
    }
  };

  return (
    <View style={[styles.swipeContainer, isSelected && styles.selectedCard]}>

      {/* Edit Action Background (Same as ClinicalData) */}
      {!readOnly && (
        <View style={styles.swipeEditAction}>
          <TouchableOpacity
            style={styles.swipeEditButton}
            onPress={() => {
              if (!isExpanded) toggleAccordion();
            }}
          >
            <Icon name="edit" size={24} color={colors.white} />
            <Text style={styles.swipeActionText}>Editar</Text>
          </TouchableOpacity>
        </View>
      )}

      <Animated.View
        style={[
          styles.cardContainer,
          { transform: [{ translateX }] }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={handlePress}
          onLongPress={handleLongPress}
          activeOpacity={1}
        >
          <View style={styles.header}>
            {/* Selection Ellipse - Matching Habits/Clinical */}
            <TouchableOpacity
              onPress={() => onSelectToggle(goal.id)}
              style={styles.selectionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isSelected ? (
                <Icon name={'check-circle'} size={24} color={colors.red} />
              ) : (
                <Icon name={'radio-button-unchecked'} size={24} color={colors.lightGray} /> // Ellipse outline
              )}
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={styles.goalTitle} numberOfLines={1}>{goal.name}</Text>
              <View style={styles.progressRow}>
                <Text style={styles.goalDescription}>Geral: {progressPercentage}%</Text>
                <Text style={[styles.goalDescription, { marginLeft: 10 }]}>Hoje: {Math.round(dailyProgressPercentage)}%</Text>
              </View>
            </View>

            {/* Expand/Collapse Icon */}
            <Icon
              name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={24}
              color={colors.blue}
            />
          </View>

          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${Math.min(100, progressPercentage)}%` }]} />
          </View>

          {progressPercentage >= 100 && !readOnly && (
            <View style={{ alignItems: 'center', marginVertical: 10 }}>
              <CustomButton
                title="Concluir Meta"
                onPress={handleCompleteGoal}
                backgroundColor={colors.yellow}
                textColor={colors.white}
                iconName="trophy"
                width="90%"
              />
            </View>
          )}

          {isExpanded && (
            <View style={styles.expandedContent} onStartShouldSetResponder={() => true}>

              {/* Seção de Registro de Progresso */}
              {!readOnly && (
                <View style={styles.progressSection}>
                  <Text style={styles.sectionTitle}>Registrar Progresso de Hoje</Text>
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]}
                      placeholder="Valor (ex: 0.5)"
                      keyboardType="numeric"
                      value={todayProgress}
                      onChangeText={setTodayProgress}
                    />
                    <CustomButton
                      title="Registrar"
                      onPress={handleRegisterProgress}
                      color={colors.blue}
                      iconName="add-circle-outline"
                      width={130}
                      height={40}
                    />
                  </View>
                </View>
              )}

              <Text style={styles.sectionTitle}>Editar Detalhes</Text>

              <Text style={styles.label}>Nome da Meta</Text>
              <TextInput
                style={[styles.input, readOnly && styles.readOnlyInput]}
                value={formData.name}
                onChangeText={text => handleChange('name', text)}
                editable={!readOnly}
              />

              <Text style={styles.label}>Hábito Associado</Text>
              <View style={styles.pickerContainer}>
                <HabitSelector
                  habits={habits}
                  selectedHabitId={formData.habitId}
                  onSelect={(value) => !readOnly && handleChange('habitId', value)}
                />
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 5 }}>
                  <Text style={styles.label}>Meta Alvo</Text>
                  <TextInput
                    style={[styles.input, readOnly && styles.readOnlyInput]}
                    value={String(formData.target)}
                    onChangeText={text => handleChange('target', Number(text))}
                    keyboardType="numeric"
                    editable={!readOnly}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 5 }}>
                  <Text style={styles.label}>Meta Diária</Text>
                  <TextInput
                    style={[styles.input, readOnly && styles.readOnlyInput]}
                    value={String(formData.dailyTarget)}
                    onChangeText={text => handleChange('dailyTarget', Number(text))}
                    keyboardType="numeric"
                    editable={!readOnly}
                  />
                  {formData.dailyTarget !== goal.dailyTarget && (
                    <Text style={{ color: colors.orange, fontSize: 12, fontStyle: 'italic', marginTop: -5, marginBottom: 5 }}>
                      Não esqueça de atualizar seu progresso de hoje!
                    </Text>
                  )}
                </View>
              </View>

              <Text style={styles.label}>Prazo: {formData.deadline.toLocaleDateString()}</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
                <Text>{formData.deadline.toLocaleDateString()}</Text>
                <Icon name="calendar-today" size={20} color={colors.blue} />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.deadline}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (date) {
                      const selectedHabit = habits.find(h => h.id === formData.habitId);
                      if (selectedHabit && !isDateValidForHabit(date, selectedHabit)) {
                        Alert.alert('Data Inválida', 'O prazo deve ser um dia em que o hábito é realizado.');
                        return;
                      }
                      handleChange('deadline', date);
                    }
                  }}
                  minimumDate={new Date()}
                />
              )}

              <View style={styles.footerButtons}>
                {!readOnly ? (
                  <CustomButton
                    title={isSaving ? "Salvando..." : "Salvar Alterações"}
                    onPress={handleSavePress}
                    backgroundColor={colors.blue}
                    textColor={colors.white}
                    iconName="save-outline"
                    width="100%"
                  />
                ) : (
                  <CustomButton
                    title="Excluir Meta"
                    onPress={handleDeletePress}
                    backgroundColor={colors.red}
                    textColor={colors.white}
                    iconName="trash-outline"
                    width="100%"
                  />
                )}
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  swipeContainer: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.blue, // To show behind the swipe
    position: 'relative',
  },
  cardContainer: { backgroundColor: colors.white, borderRadius: 10, overflow: 'hidden', borderColor: colors.lightBlue, borderWidth: 1, elevation: 2 },
  selectedCard: { borderColor: colors.red, borderWidth: 2, },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, },
  titleContainer: { flex: 1, marginRight: 10, },
  goalTitle: { fontSize: 16, fontWeight: 'bold', color: colors.darkGray, },
  goalDescription: { fontSize: 12, color: colors.gray, },
  progressRow: { flexDirection: 'row', marginTop: 4 },
  progressText: { fontSize: 16, fontWeight: 'bold', color: colors.blue, marginRight: 10, },
  progressBarContainer: { height: 6, backgroundColor: colors.lighterBlue, marginHorizontal: 15, borderRadius: 3, marginBottom: 10, },
  progressBar: { height: '100%', backgroundColor: colors.blue, borderRadius: 3, },
  expandedContent: { padding: 15, paddingTop: 0, borderTopWidth: 1, borderTopColor: colors.lighterBlue },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.darkGray, marginBottom: 10, marginTop: 15 },
  label: { fontSize: 14, fontWeight: 'bold', color: colors.gray, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: colors.lightBlue, borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 16, color: colors.darkGray, backgroundColor: colors.white },
  pickerContainer: { borderWidth: 0, borderRadius: 8, marginBottom: 0 },
  dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.lightBlue, borderRadius: 8, padding: 10, marginBottom: 15, backgroundColor: colors.white },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressSection: { backgroundColor: colors.lighterBlue, padding: 10, borderRadius: 8, marginTop: 10 },

  footerButtons: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },

  selectionIndicator: { marginLeft: 10, },
  selectionButton: { marginRight: 10 },

  swipeEditAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  swipeEditButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  swipeActionText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  readOnlyInput: {
    backgroundColor: colors.lightestBlue,
    color: colors.gray,
  }
});

export default GoalAccordionCard;