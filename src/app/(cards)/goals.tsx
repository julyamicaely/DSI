// src/app/(cards)/goals.tsx
import * as React from 'react';
import { Text, View, StyleSheet, Modal, FlatList, TouchableOpacity } from 'react-native';
import CustomButton from '../../com/CustomButton';
import CustomTextInput from '../../com/CustomTextInput';
import { loadGoals, saveGoals, type Goal } from '../../lib/goals';

import { migrateOldGoalsToV2 } from '../../lib/migrateGoals';


function GoalModal({
  isVisible,
  onClose,
  onSave,
  editingGoal,
  goalName,
  setGoalName,
  goalTime,
  setGoalTime,
}: {
  isVisible: boolean;
  onClose: () => void;
  onSave: () => void;
  editingGoal: Goal | null;
  goalName: string;
  setGoalName: (text: string) => void;
  goalTime: string;
  setGoalTime: (text: string) => void;
}) {
  return (
    <Modal animationType="slide" transparent visible={isVisible}>
      <View style={styles.modalContent}>
        <View style={styles.textInputs}>
          <Text style={styles.modalTitles}>Nome da atividade</Text>
          <CustomTextInput
            placeholder="Insira aqui"
            value={goalName}
            onChangeText={setGoalName}
          />
          <Text style={styles.modalTitles}>Meta de tempo</Text>
          <CustomTextInput
            placeholder="Insira aqui"
            value={goalTime}
            onChangeText={setGoalTime}
          />
        </View>
        <View style={styles.modalButtons}>
          <CustomButton
            title="Voltar"
            onPress={onClose}
            backgroundColor="#5B79FF"
            textColor="#FFFFFF"
            width={147}
          />
          <CustomButton
            title={editingGoal ? 'Salvar Meta' : 'Adicionar Meta'}
            onPress={onSave}
            backgroundColor="#5B79FF"
            textColor="#FFFFFF"
            width={147}
          />
        </View>
      </View>
    </Modal>
  );
}

export default function GoalsScreen() {
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [editingGoal, setEditingGoal] = React.useState<Goal | null>(null);
  const [goalName, setGoalName] = React.useState('');
  const [goalTime, setGoalTime] = React.useState('');
  const [isModalVisible, setIsModalVisible] = React.useState(false);

  // ⬇️ coloque o useEffect aqui (depois dos useState)
  React.useEffect(() => {
    (async () => {
      try {
        // comente esta linha se você NÃO criou o migrateGoals.ts
        await migrateOldGoalsToV2();
      } catch {}
      const stored = await loadGoals();
      setGoals(stored);
    })();
  }, []);

  const persistGoals = async (next: Goal[]) => {
    setGoals(next);
    await saveGoals(next);
  };

  const onAddGoal = () => {
    setEditingGoal(null);
    setGoalName('');
    setGoalTime('');
    setIsModalVisible(true);
  };

  const onModalClose = () => {
    setIsModalVisible(false);
    setEditingGoal(null);
  };

  const handleSaveGoal = async () => {
    if (!goalName.trim()) return;
    let updated: Goal[];
    if (editingGoal) {
      updated = goals.map(g =>
        g.id === editingGoal.id ? { ...g, name: goalName, time: goalTime } : g
      );
    } else {
      const newGoal: Goal = {
        id: Date.now().toString(),
        name: goalName,
        time: goalTime,
        targetPerWeek: 3,
        planWeekdays: [],
        reminders: [],
        history: [],
        createdAt: Date.now(),
      };

      updated = [...goals, newGoal];
    }
    await persistGoals(updated);
    setGoalName('');
    setGoalTime('');
    onModalClose();
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setGoalTime(goal.time ?? '');
    setIsModalVisible(true);
  };

  const handleDeleteGoal = async (goalId: string) => {
    const next = goals.filter(g => g.id !== goalId);
    await persistGoals(next);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Metas de atividade física</Text>

      <View style={styles.button}>
        <CustomButton
          title="Adicionar Meta de Atividade"
          onPress={onAddGoal}
          backgroundColor="#E94040"
          textColor="#FFE6E6"
          width={326}
        />
      </View>

      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <View style={styles.goalItem}>
            <Text style={styles.goalText}>{item.name}</Text>
            <Text style={styles.goalText}>{item.time}</Text>
            <View style={styles.goalButtons}>
              <TouchableOpacity onPress={() => handleEditGoal(item)}>
                <Text style={styles.editButton}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteGoal(item.id)}>
                <Text style={styles.deleteButton}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <GoalModal
        isVisible={isModalVisible}
        onClose={onModalClose}
        onSave={handleSaveGoal}
        editingGoal={editingGoal}
        goalName={goalName}
        setGoalName={setGoalName}
        goalTime={goalTime}
        setGoalTime={setGoalTime}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 30, gap: 5 },
  title: {
    marginLeft: 10,
    fontSize: 20,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 20,
    alignSelf: 'center',
  },
  button: { alignSelf: 'center' },
  modalContent: {
    width: '90%',
    height: '35%',
    backgroundColor: '#E5E8FF',
    marginHorizontal: '5%',
    borderRadius: 30,
    position: 'absolute',
    bottom: '30%',
  },
  modalTitles: {
    top: 5,
    color: '#5B79FF',
    alignSelf: 'flex-start',
    marginHorizontal: 30,
  },
  textInputs: { alignItems: 'center' },
  modalButtons: { justifyContent: 'center', flexDirection: 'row', padding: 15, gap: 15 },
  goalItem: {
    flex: 1,
    backgroundColor: '#F8F9FF',
    margin: 6,
    padding: 10,
    borderRadius: 10,
    borderColor: '#E1E6FF',
    borderWidth: 1,
  },
  goalText: { fontSize: 14, fontWeight: '500', color: '#333' },
  goalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  editButton: { color: '#5B79FF', fontWeight: '600' },
  deleteButton: { color: '#E94040', fontWeight: '600' },
  grid: { paddingBottom: 100 },
});
