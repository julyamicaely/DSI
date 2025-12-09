// src/components/CreateGoalModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomButton from './CustomButton';
import HabitSelector from './HabitSelector';
import { Goal, GoalFormValues, Habit, Colors } from '../types';
import { createGoal, updateGoal } from '../services/goalsServices';
import { isDateValidForHabit } from '../utils/habitUtils';

// ... (Interface CreateGoalModalProps)

const initialFormState: GoalFormValues = {
  name: '',
  description: '',
  target: 100, 
  dailyTarget: 1, 
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  habitId: '', 
};

const CreateGoalModal: React.FC<any> = ({ isVisible, onClose, goalToEdit, habits }) => {
  const [formData, setFormData] = useState<GoalFormValues>(initialFormState);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!goalToEdit;

  useEffect(() => {
    if (isEditing && goalToEdit) {
      setFormData({
        name: goalToEdit.name,
        description: goalToEdit.description || '',
        target: goalToEdit.target,
        dailyTarget: goalToEdit.dailyTarget,
        deadline: goalToEdit.deadline,
        habitId: goalToEdit.habitId || '',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [goalToEdit, isEditing, isVisible]);

  const handleChange = (field: keyof GoalFormValues, value: string | number | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? value : value,
    }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const selectedHabit = habits.find((h: Habit) => h.id === formData.habitId);
      if (selectedHabit && !isDateValidForHabit(selectedDate, selectedHabit)) {
        Alert.alert('Data Inválida', 'O prazo deve ser um dia em que o hábito é realizado.');
        return;
      }
      handleChange('deadline', selectedDate);
    }
  };
  
  const handleSave = async () => {
    if (!formData.name || !formData.habitId || formData.target <= 0 || formData.dailyTarget <= 0) {
        Alert.alert('Erro', 'Preencha todos os campos obrigatórios (Nome, Hábito, Metas).');
        return;
    }

    setIsLoading(true);
    try {
      if (isEditing && goalToEdit) {
        await updateGoal(goalToEdit.id, formData);
      } else {
        await createGoal(formData);
      }
      onClose(true); 
    } catch (error: any) {
      console.error('Erro ao salvar meta:', error);
      Alert.alert('Erro', `Falha ao salvar meta: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={() => onClose(false)}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{isEditing ? 'Editar Meta Geral' : 'Criar Nova Meta'}</Text>

          {/* Campos do Formulário */}
          <TextInput
            style={styles.input}
            placeholder="Nome da Meta"
            value={formData.name}
            onChangeText={text => handleChange('name', text)}
          />

          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Descrição (Opcional)"
            value={formData.description}
            onChangeText={text => handleChange('description', text)}
            multiline
          />
          
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Hábito Associado:</Text>
            <HabitSelector
              habits={habits}
              selectedHabitId={formData.habitId}
              onSelect={(value) => handleChange('habitId', value)}
            />
          </View>
          
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Meta Total"
              keyboardType="numeric"
              value={String(formData.target)}
              onChangeText={text => handleChange('target', Number(text))}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Meta Diária"
              keyboardType="numeric"
              value={String(formData.dailyTarget)}
              onChangeText={text => handleChange('dailyTarget', Number(text))}
            />
          </View>
          
          <View style={styles.row}>
            <Text style={styles.dateLabel}>Prazo:</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateDisplay}>
                <Text>{formData.deadline.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>
          
          {showDatePicker && (
            <DateTimePicker
              value={formData.deadline}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          <View style={styles.buttonContainer}>
            <CustomButton title="Cancelar" onPress={() => onClose(false)} color={Colors.red} width="45%" />
            <CustomButton title={isLoading ? "Salvando..." : "Salvar Meta"} onPress={handleSave} color={Colors.blue} width="45%" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Estilos
const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', },
  modalView: { margin: 20, backgroundColor: Colors.white, borderRadius: 20, padding: 25, alignItems: 'stretch', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '90%', },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', },
  input: { height: 40, borderColor: Colors.lightBlue, borderWidth: 1, borderRadius: 5, marginBottom: 10, paddingHorizontal: 10, backgroundColor: Colors.lightestBlue, },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, },
  halfInput: { flex: 1, marginHorizontal: 5, },
  dateLabel: { fontSize: 16, color: '#333', marginRight: 10, },
  dateDisplay: { flex: 1, padding: 10, borderColor: Colors.lightBlue, borderWidth: 1, borderRadius: 5, backgroundColor: Colors.lightestBlue, },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, },
  pickerContainer: { marginBottom: 10, },
  pickerLabel: { fontSize: 14, marginBottom: 5, color: '#666', }
});

export default CreateGoalModal;