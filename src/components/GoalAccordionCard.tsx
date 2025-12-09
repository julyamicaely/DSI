// src/components/GoalAccordionCard.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager, TextInput, Alert } from 'react-native';
import { Goal, Habit, Colors, GoalFormValues, DailyProgressEntry } from '../types'; 
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomButton from './CustomButton';
import HabitSelector from './HabitSelector';
import { dateKey } from '../lib/goals';
import { isDateValidForHabit } from '../utils/habitUtils';

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

  return (
    <TouchableOpacity 
        style={[styles.cardContainer, isSelected && styles.selectedCard]}
        onPress={handlePress} 
        onLongPress={handleLongPress} 
        activeOpacity={1}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.goalTitle} numberOfLines={1}>{goal.name}</Text>
          <View style={styles.progressRow}>
             <Text style={styles.goalDescription}>Geral: {progressPercentage}%</Text>
             <Text style={[styles.goalDescription, { marginLeft: 10 }]}>Hoje: {Math.round(dailyProgressPercentage)}%</Text>
          </View>
        </View>
        
        {isSelected ? (
             <Icon name={'check-circle'} size={24} color={Colors.red} style={styles.selectionIndicator}/>
        ) : (
            <Icon 
              name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
              size={24} 
              color={Colors.blue} 
            />
        )}
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${Math.min(100, progressPercentage)}%` }]} />
      </View>
      
      {isExpanded && (
        <View style={styles.expandedContent} onStartShouldSetResponder={() => true}>
          
          {/* Seção de Registro de Progresso */}
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
                    color={Colors.blue} 
                    width={100} 
                    height={40}
                  />
              </View>
          </View>

          <Text style={styles.sectionTitle}>Editar Detalhes</Text>
          
          <Text style={styles.label}>Nome da Meta</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={text => handleChange('name', text)}
          />

          <Text style={styles.label}>Hábito Associado</Text>
          <View style={styles.pickerContainer}>
            <HabitSelector
                habits={habits}
                selectedHabitId={formData.habitId}
                onSelect={(value) => handleChange('habitId', value)}
            />
          </View>

          <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 5 }}>
                  <Text style={styles.label}>Meta Alvo</Text>
                  <TextInput
                    style={styles.input}
                    value={String(formData.target)}
                    onChangeText={text => handleChange('target', Number(text))}
                    keyboardType="numeric"
                  />
              </View>
              <View style={{ flex: 1, marginLeft: 5 }}>
                  <Text style={styles.label}>Meta Diária</Text>
                  <TextInput
                    style={styles.input}
                    value={String(formData.dailyTarget)}
                    onChangeText={text => handleChange('dailyTarget', Number(text))}
                    keyboardType="numeric"
                  />
              </View>
          </View>

          <Text style={styles.label}>Prazo: {formData.deadline.toLocaleDateString()}</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput}>
             <Text>{formData.deadline.toLocaleDateString()}</Text>
             <Icon name="calendar-today" size={20} color={Colors.blue} />
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
            <CustomButton 
                title={isSaving ? "Salvando..." : "Salvar Alterações"} 
                onPress={handleSavePress} 
                color={Colors.blue}
                width="100%"
            />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  cardContainer: { backgroundColor: Colors.white, borderRadius: 10, marginVertical: 8, marginHorizontal: 16, overflow: 'hidden', borderColor: Colors.lightBlue, borderWidth: 1, elevation: 2 },
  selectedCard: { borderColor: Colors.red, borderWidth: 2, },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, },
  titleContainer: { flex: 1, marginRight: 10, },
  goalTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', },
  goalDescription: { fontSize: 12, color: '#666', },
  progressRow: { flexDirection: 'row', marginTop: 4 },
  progressText: { fontSize: 16, fontWeight: 'bold', color: Colors.blue, marginRight: 10, },
  progressBarContainer: { height: 6, backgroundColor: Colors.lighterBlue, marginHorizontal: 15, borderRadius: 3, marginBottom: 10, },
  progressBar: { height: '100%', backgroundColor: Colors.blue, borderRadius: 3, },
  expandedContent: { padding: 15, paddingTop: 0, borderTopWidth: 1, borderTopColor: Colors.lighterBlue },
  
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, marginTop: 15 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: Colors.lightBlue, borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 16, color: '#333', backgroundColor: Colors.white },
  pickerContainer: { borderWidth: 0, borderRadius: 8, marginBottom: 0 },
  dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: Colors.lightBlue, borderRadius: 8, padding: 10, marginBottom: 15, backgroundColor: Colors.white },
  
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressSection: { backgroundColor: Colors.lighterBlue, padding: 10, borderRadius: 8, marginTop: 10 },
  
  footerButtons: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  
  selectionIndicator: { marginLeft: 10, }
});

export default GoalAccordionCard;