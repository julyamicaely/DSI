// src/components/DailyProgressModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Button, TextInput, StyleSheet, Alert } from 'react-native';
import { Goal, DailyProgressEntry, Colors } from '../types'; 
import { getDailyProgressDateKey } from '../utils/goalUtils';

interface DailyProgressModalProps {
  isVisible: boolean;
  onClose: () => void;
  goal: Goal | null;
  date: Date | null;
  onSave: (goalId: string, dateKey: string, entry: DailyProgressEntry) => Promise<void>;
}

const DailyProgressModal: React.FC<DailyProgressModalProps> = ({
  isVisible,
  onClose,
  goal,
  date,
  onSave,
}) => {
  const [progressValue, setProgressValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (goal && date) {
      const dateKey = getDailyProgressDateKey(date);
      const currentEntry = goal.dailyProgress?.[dateKey];
      setProgressValue(String(currentEntry?.progress || 0));
    }
  }, [goal, date, isVisible]);

  const handleSave = async () => {
    if (!goal || !date) return;
    
    const progress = Number(progressValue);
    const target = goal.dailyTarget || 1;
    const dateKey = getDailyProgressDateKey(date);

    if (isNaN(progress) || progress < 0) {
      Alert.alert('Erro', 'Insira um valor de progresso válido.');
      return;
    }

    const percentage = Math.min(100, Math.round((progress / target) * 100));

    const newEntry: DailyProgressEntry = {
      progress,
      target,
      percentage,
    };

    setIsLoading(true);
    try {
      await onSave(goal.id, dateKey, newEntry);
      onClose();
    } catch (error) {
      // O toast de erro é tratado no goals.tsx
    } finally {
      setIsLoading(false);
    }
  };

  const formattedDate = date ? date.toLocaleDateString() : 'N/A';
  const goalName = goal?.name || 'N/A';

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Progresso Diário</Text>
          <Text style={styles.dateText}>Meta: **{goalName}**</Text>
          <Text style={styles.dateText}>Data: **{formattedDate}** (Alvo Diário: {goal?.dailyTarget || 1})</Text>

          <TextInput
            style={styles.input}
            onChangeText={setProgressValue}
            value={progressValue}
            keyboardType="numeric"
            placeholder="Progresso alcançado (valor numérico)"
          />

          <View style={styles.buttonContainer}>
            <Button title="Cancelar" onPress={onClose} color={Colors.red} disabled={isLoading} />
            <Button title={isLoading ? "Salvando..." : "Salvar Progresso"} onPress={handleSave} color={Colors.blue} disabled={isLoading} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Estilos
const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', },
  modalView: { margin: 20, backgroundColor: Colors.white, borderRadius: 20, padding: 35, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '85%', },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, },
  dateText: { marginBottom: 10, fontSize: 14, },
  input: { height: 40, width: '100%', borderColor: Colors.lightBlue, borderWidth: 1, borderRadius: 5, marginBottom: 20, paddingHorizontal: 10, backgroundColor: Colors.lightestBlue, },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', },
});

export default DailyProgressModal;