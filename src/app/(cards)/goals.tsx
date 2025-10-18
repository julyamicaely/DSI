import { Text, View, StyleSheet, Modal, FlatList, TouchableOpacity } from 'react-native';
import CustomButton from '../../com/CustomButton';
import CustomTextInput from '../../com/CustomTextInput';
import { useState } from 'react';

type Props = {
    isVisible: boolean;
    onClose: () => void;
};

type Goal = {
  id: string;
  name: string;
  time: string;
};

export default function GoalsScreen() {

  const [goals, setGoals] = useState<Goal[]>([]);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalName, setGoalName] = useState('');
  const [goalTime, setGoalTime] = useState('');
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const onAddGoal = () => {
    setEditingGoal(null);
    setGoalName('');
    setGoalTime('');
    setIsModalVisible(true);
  }

  const onModalClose = () => {
    setIsModalVisible(false);
    setEditingGoal(null);
  };

  const handleSaveGoal = () => {
    if (editingGoal) {
      // Update existing goal
      setGoals(goals.map(g => g.id === editingGoal.id ? { ...g, name: goalName, time: goalTime } : g));
    } else {
      // Add new goal
      const newGoal: Goal = {
        id: Date.now().toString(),
        name: goalName,
        time: goalTime,
      };
      setGoals([...goals, newGoal]);
    }
    setGoalName('');
    setGoalTime('');
    onModalClose();
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setGoalTime(goal.time);
    setIsModalVisible(true);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(goals.filter(g => g.id !== goalId));
  };

  function GoalModal ({ isVisible, onClose } : Props) {
    return (
      <View>
        <Modal animationType='slide' transparent={true} visible={isVisible}>
          <View style={styles.modalContent}>
            <View style={styles.textInputs}>
              <Text style={styles.modalTitles} >Nome da atividade</Text>
              <CustomTextInput
                placeholder='Insira aqui'
                secureTextEntry
                value={goalName}
                onChangeText={setGoalName}
              />
              <Text style={styles.modalTitles} >Meta de tempo</Text>
              <CustomTextInput
                 placeholder='Insira aqui'
                 secureTextEntry
                 value={goalTime}
                 onChangeText={setGoalTime}
              />
            </View>
            <View style={styles.modalButtons}>
              <CustomButton
                title='Voltar'
                onPress = {onClose}
                backgroundColor="#5B79FF"
                textColor="#FFFFFF"
                width={147}
              />
              <CustomButton
                title={editingGoal ? 'Salvar Meta' : 'Adicionar Meta'}
                onPress={handleSaveGoal}
                backgroundColor="#5B79FF"
                textColor="#FFFFFF"
                width={147}
              />
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Metas de atividade física</Text>
      <View style={styles.button}>
        <CustomButton
          title='Adicionar Meta de Atividade'
          onPress={onAddGoal}
          backgroundColor="#E94040"
          textColor="#FFE6E6"
          width={326}
          />
        </View>

      <FlatList
        data={goals}
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
        keyExtractor={item => item.id}
        numColumns={2}
        style={styles.grid}
      />

      <GoalModal isVisible={isModalVisible} onClose={onModalClose}>
      </GoalModal>

    
    </View>
  );  
}


const styles = StyleSheet.create ({
  container: {
    flex: 1,
    paddingTop: 30,
    gap: 5,
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
  },
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
  textInputs: {
    alignItems: 'center'
  },
  modalButtons: {
    justifyContent: 'center',
    flexDirection: 'row',
    padding: 15,
    gap: 15
  }
})