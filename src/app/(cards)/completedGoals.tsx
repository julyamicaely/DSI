import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, LayoutAnimation } from 'react-native';
import GoalAccordionCard from '../../components/GoalAccordionCard';
import { listGoals, deleteGoal } from '../../services/goalsServices';
import { listHabits } from '../../services/habitsServices';
import { Goal, Habit } from '../../types';
import Colors from '../../components/Colors';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { toast } from '../../utils/toast';
import { useRouter } from 'expo-router';
import ConfirmationModal from '../../components/ConfirmationModal';
import CustomButton from '../../components/CustomButton';

const CompletedGoalsScreen: React.FC = () => {
    const router = useRouter();
    const [completedGoals, setCompletedGoals] = useState<Goal[]>([]);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const allGoals = await listGoals();
            const completed = allGoals.filter(g => g.status === 'completed');
            setCompletedGoals(completed);

            const fetchedHabits: Partial<Habit>[] = (await listHabits()) || [];
            setHabits(
                fetchedHabits.map(habit => ({
                    id: habit.id,
                    name: habit.name || `Hábito sem nome (${habit.id})`,
                    userId: habit.userId || '',
                })) as Habit[]
            );
        } catch (error) {
            console.error('Erro ao carregar metas concluídas:', error);
            toast.error('Erro ao carregar metas.');
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);



    const handleDeleteGoal = useCallback((goalId: string) => {
        setSelectedGoalId(goalId);
        setModalVisible(true);
    }, []);

    const executeDelete = async () => {
        if (!selectedGoalId) return;
        try {
            await deleteGoal(selectedGoalId);
            setCompletedGoals(prev => prev.filter(g => g.id !== selectedGoalId));
            toast.success('Meta excluída permanentemente.');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao excluir meta.');
        } finally {
            setModalVisible(false);
            setSelectedGoalId(null);
        }
    };

    const toggleAccordion = useCallback((goalId: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedGoalId(prev => prev === goalId ? null : goalId);
    }, []);

    return (
        <View style={styles.container}>
            {completedGoals.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Nenhuma meta concluída ainda.</Text>
                </View>
            ) : (
                <FlatList
                    data={completedGoals}
                    keyExtractor={item => item.id}
                    renderItem={({ item: goal }) => (
                        <GoalAccordionCard
                            goal={goal}
                            isExpanded={expandedGoalId === goal.id}
                            onToggle={() => toggleAccordion(goal.id)}
                            habits={habits}
                            onSave={async () => { }} // No-op
                            onSaveProgress={async () => { }} // No-op
                            onDelete={handleDeleteGoal}
                            onSelectToggle={() => { }} // No selection in read-only list for now, deletion is via card button
                            isSelected={false}
                            readOnly={true}
                            disableDeleteAlert={true}
                        />

                    )}
                    contentContainerStyle={styles.listContent}
                />
            )}
            <ConfirmationModal
                visible={modalVisible}
                title="Excluir Meta"
                message="Tem certeza que deseja excluir esta meta permanentemente?"
                onClose={() => setModalVisible(false)}
            >
                <CustomButton
                    title="Cancelar"
                    onPress={() => setModalVisible(false)}
                    backgroundColor={Colors.lightGray}
                    textColor={Colors.black}
                    width="45%"
                />
                <CustomButton
                    title="Excluir"
                    onPress={executeDelete}
                    backgroundColor={Colors.red}
                    textColor={Colors.white}
                    width="45%"
                />
            </ConfirmationModal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.white },
    listContent: { paddingVertical: 20 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16, color: Colors.gray },
});

export default CompletedGoalsScreen;
