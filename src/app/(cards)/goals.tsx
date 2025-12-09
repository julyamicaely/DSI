// src/app/(cards)/goals.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, StyleSheet, LayoutAnimation, Platform, UIManager, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GoalAccordionCard from '../../components/GoalAccordionCard';
import CreateGoalModal from '../../components/CreateGoalModal';
import CustomButton from '../../components/CustomButton';
import ComponentColors from '../../components/Colors';
import { listGoals, deleteGoal, updateDailyProgress, updateGoal } from '../../services/goalsServices';
import { listHabits } from '../../services/habitsServices'; // Do seu colega
import { updateGoalProgress, rollbackGoalProgress } from '../../utils/goalUtils';
import { Goal, Habit, DailyProgressEntry, Colors, GoalFormValues } from '../../types';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { toast } from '../../utils/toast';

const GoalsScreen: React.FC = () => {
  const navigation = useNavigation();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);

  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);

  const isSelectionMode = useMemo(() => selectedGoalIds.length > 0, [selectedGoalIds]);

  const fetchGoalsAndHabits = useCallback(async () => {
    try {
      const fetchedGoals = await listGoals();

      // 🚨 CORREÇÃO DE TIPAGEM: Garante que o objeto retornado de listHabits tenha 'name' e 'userId'
      const fetchedHabits: Partial<Habit>[] = (await listHabits()) || [];

      setGoals(fetchedGoals);

      setHabits(
        fetchedHabits.map(habit => ({
          id: habit.id,
          name: habit.name || `Hábito sem nome (${habit.id})`,
          userId: habit.userId || '',
        })) as Habit[]
      );

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar metas.');
    }
  }, []);

  useEffect(() => {
    fetchGoalsAndHabits();
  }, [fetchGoalsAndHabits]);

  const handleSaveGoal = async (goalId: string, data: GoalFormValues) => {
    try {
      await updateGoal(goalId, data);
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, ...data } : g));
      toast.success('Meta atualizada!');
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      toast.error('Erro ao atualizar meta.');
    }
  };

  const handleSaveDailyProgress = async (
    goalId: string,
    dateKey: string,
    entry: DailyProgressEntry
  ) => {
    try {
      // 1. Atualização Otimista
      setGoals(prev => updateGoalProgress(prev, goalId, dateKey, entry));

      // 2. Persistência no Firestore
      await updateDailyProgress(goalId, dateKey, entry);
      toast.success('Progresso salvo!');

    } catch (error) {
      console.error('Erro ao salvar progresso:', error);

      // 3. Rollback
      setGoals(prev => rollbackGoalProgress(prev, goalId, dateKey));
      toast.error('Erro ao salvar progresso. Rollback feito.');
      throw error;
    }
  };

  const handleSelectToggle = useCallback((goalId: string) => {
    // ... (Lógica de seleção)
    setSelectedGoalIds(prev => {
      if (prev.includes(goalId)) {
        const newSelection = prev.filter(id => id !== goalId);
        if (newSelection.length === 0) setExpandedGoalId(null);
        return newSelection;
      } else {
        setExpandedGoalId(null);
        return [...prev, goalId];
      }
    });
  }, []);

  const toggleAccordion = useCallback((goalId: string) => {
    if (isSelectionMode) {
      handleSelectToggle(goalId);
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedGoalId(prev => prev === goalId ? null : goalId);
  }, [isSelectionMode, handleSelectToggle]);

  const handleDeleteSelectedGoals = async () => {
    if (selectedGoalIds.length === 0) return;

    try {
      await Promise.all(selectedGoalIds.map(id => deleteGoal(id)));
      setGoals(prev => prev.filter(g => !selectedGoalIds.includes(g.id)));
      setSelectedGoalIds([]);
      toast.success(`${selectedGoalIds.length} meta(s) excluída(s).`);
    } catch (error) {
      toast.error('Erro ao excluir metas.');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal(goalId);
      setGoals(prev => prev.filter(g => g.id !== goalId));
      toast.success('Meta excluída.');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir meta.');
    }
  };

  const openCreateModal = () => {
    setIsGoalModalVisible(true);
  };

  const closeGoalModal = (didUpdate: boolean = false) => {
    setIsGoalModalVisible(false);
    if (didUpdate) fetchGoalsAndHabits();
  };

  // Header configuration removed as requested
  /*
  useEffect(() => {
    navigation.setOptions({
        headerRight: () => (
            <View style={styles.headerRightContainer}>
                {isSelectionMode ? (
                    <>
                        <Text style={{ color: Colors.blue, fontSize: 16, marginRight: 15 }}>
                            {selectedGoalIds.length} selecionada(s)
                        </Text>
                        <TouchableOpacity onPress={() => setSelectedGoalIds([])} style={{ marginRight: 15 }}>
                            <Text style={{ color: Colors.red, fontSize: 16 }}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleDeleteSelectedGoals}>
                            <Icon name="delete" size={24} color={Colors.red} />
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity onPress={openCreateModal} style={styles.addGoalButton}> 
                        <Text style={styles.addGoalButtonText}>+ Adicionar Meta</Text>
                    </TouchableOpacity>
                )}
            </View>
        ),
    });
  }, [navigation, isSelectionMode, selectedGoalIds.length, handleDeleteSelectedGoals]);
  */

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        {isSelectionMode ? (
          <CustomButton
            iconName='trash-outline'
            title={selectedGoalIds.length === 1 ? 'Excluir Meta' : `Excluir ${selectedGoalIds.length} Metas`}
            onPress={handleDeleteSelectedGoals}
            backgroundColor={ComponentColors.red}
            textColor={ComponentColors.white}
            width={326}
          />
        ) : (
          <CustomButton
            iconName='add'
            title="Nova Meta"
            onPress={openCreateModal}
            backgroundColor={ComponentColors.blue}
            textColor={ComponentColors.white}
            width={326}
          />
        )}
      </View>

      <FlatList
        data={goals}
        keyExtractor={item => item.id}
        renderItem={({ item: goal }) => (
          <GoalAccordionCard
            goal={goal}
            isExpanded={expandedGoalId === goal.id && !isSelectionMode}
            onToggle={() => toggleAccordion(goal.id)}
            habits={habits}
            onSave={handleSaveGoal}
            onSaveProgress={handleSaveDailyProgress}
            onDelete={handleDeleteGoal}
            onSelectToggle={handleSelectToggle}
            isSelected={selectedGoalIds.includes(goal.id)}
          />
        )}
        ListHeaderComponent={() => isSelectionMode ? (
          <Text style={styles.selectionModeText}>Pressione a meta novamente para cancelar a seleção ou use o ícone de lixeira para excluir.</Text>
        ) : null}
        style={styles.list}
      />

      <CreateGoalModal
        isVisible={isGoalModalVisible}
        onClose={closeGoalModal}
        goalToEdit={null}
        habits={habits}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white, paddingTop: 20 },
  list: { paddingTop: 10, },
  buttonContainer: { alignItems: 'center', marginBottom: 10 },
  selectionModeText: { textAlign: 'center', marginVertical: 10, color: Colors.red, fontWeight: 'bold', width: '90%', alignSelf: 'center' },
});


export default GoalsScreen;