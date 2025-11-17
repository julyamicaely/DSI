import { StyleSheet, Text, View, Image, TouchableOpacity, Alert, ScrollView, Button } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../../../firebaseConfig';
import { useState, useEffect } from 'react';
import NotificationCard from '../../components/NotificationCard';
import ImpactCard from '../../components/ImpactCard';
import colors from '../../components/Colors';
import { getUserData } from '../../services/firebase.service';
import { useAuth } from '../../context/AuthContext';
import { listHabits } from '../../services/habitsServices';
import { listGoals, Goal } from '../../services/goalsServices';
import { listarConsultas } from '../../services/consultasService';
import { useFavoritesStore } from '../../store/favoritesStore';
import * as Location from 'expo-location';
import { Coordinates } from '../../types/hospital.types';
import googlePlacesService from '../../services/googlePlaces.service';

type Habit = {
  id: string;
  name: string;
  time: any;
  reminders?: Date[];
  weekdays?: number[];
};

// --- Componente Reutilizável para Itens de Ação ---

interface ActionItemProps {
  iconName: string;
  title: string;
  subtitle: string;
}

const ActionItem = ({ iconName, title, subtitle }: ActionItemProps) => (
  <TouchableOpacity style={styles.actionItem} onPress={() => Alert.alert('Ação', `Abrir ${title}`)}>
    <View style={styles.actionTextContainer}>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

// --- Componente Principal da Tela ---

export default function HomeScreen() {

  const [userName, setUserName] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const { dataUpdateTrigger } = useAuth();
  const [nextHabit, setNextHabit] = useState<string>('');
  const [nextGoal, setNextGoal] = useState<string>('');
  const [lastClinicalData, setLastClinicalData] = useState<string>('');
  const [closestFavoriteHospital, setClosestFavoriteHospital] = useState<string>('');
  const { favorites, initialize: initializeFavorites } = useFavoritesStore();
  
  const loadUserData = async () => {
    const user = auth.currentUser;
    if (user) {
      // Recarregar dados do Firebase Auth
      await user.reload();
      setUserName(user.displayName || '');
      
      // Buscar dados do Firestore
      try {
        const userData = await getUserData(user.uid);
        if (userData?.photoUrl) {
          setPhotoURL(userData.photoUrl);
        } else {
          setPhotoURL(user.photoURL);
        }
      } catch (error) {
        console.log('Erro ao carregar dados:', error);
        setPhotoURL(user.photoURL);
      }
    }
  };
  
  useEffect(() => {
    loadUserData();
    loadNextHabit();
    loadNextGoal();
    loadLastClinicalData();
    initializeFavorites().then(() => {
      loadClosestFavoriteHospital();
    });
  }, [dataUpdateTrigger]); // Recarrega quando dataUpdateTrigger muda

  useEffect(() => {
    if (favorites.length > 0) {
      loadClosestFavoriteHospital();
    }
  }, [favorites]);

  type Reminder = {
    habitName: string;
    time: Date;
  };

  const calculateNextReminder = (habit: Habit, now: Date): Date | null => {
    if (!habit.reminders || !habit.weekdays) {
      return null;
    }

    let closestReminder: Date | null = null;

    for (const reminder of habit.reminders) {
      const reminderTime = (reminder as any).seconds
        ? new Date((reminder as any).seconds * 1000)
        : new Date(reminder);

      if (isNaN(reminderTime.getTime())) continue;

      for (const weekday of habit.weekdays) {
        let nextOccurrence = new Date(now);
        nextOccurrence.setHours(reminderTime.getHours(), reminderTime.getMinutes(), 0, 0);

        const currentDay = now.getDay();
        let daysToAdd = (weekday - currentDay + 7) % 7;

        if (daysToAdd === 0 && nextOccurrence < now) {
          daysToAdd = 7;
        }
        
        nextOccurrence.setDate(now.getDate() + daysToAdd);

        if (!closestReminder || nextOccurrence < closestReminder) {
          closestReminder = nextOccurrence;
        }
      }
    }
    return closestReminder;
  };

  const loadNextHabit = async () => {
    try {
      const habits = await listHabits() as Habit[];
      if (!habits || habits.length === 0) {
        setNextHabit('Nenhum hábito cadastrado');
        return;
      }

      const now = new Date();
      let closestHabitReminder: { habitName: string; time: Date } | null = null;

      for (const habit of habits) {
        const nextReminderTime = calculateNextReminder(habit, now);
        if (nextReminderTime) {
          if (!closestHabitReminder || nextReminderTime < closestHabitReminder.time) {
            closestHabitReminder = { habitName: habit.name, time: nextReminderTime };
          }
        }
      }

      if (closestHabitReminder) {
        const timeString = closestHabitReminder.time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const dayOfWeek = closestHabitReminder.time.toLocaleDateString('pt-BR', { weekday: 'short' });
        setNextHabit(`${closestHabitReminder.habitName} - ${dayOfWeek}, ${timeString}`);
      } else {
        setNextHabit('Nenhum próximo hábito');
      }
    } catch (error) {
      console.error("Failed to load next habit:", error);
      setNextHabit('Erro ao carregar');
    }
  };

  const loadNextGoal = async () => {
    try {
      const goals = await listGoals();
      const habits = await listHabits() as Habit[];

      if (!goals || goals.length === 0) {
        setNextGoal('Nenhuma meta cadastrada');
        return;
      }

      const now = new Date();
      const goalsWithReminders: { goalName: string; nextReminder: Date }[] = [];

      goals.forEach(goal => {
        const habit = habits.find(h => h.id === goal.habitId);
        if (habit) {
          const nextReminderTime = calculateNextReminder(habit, now);
          if (nextReminderTime) {
            goalsWithReminders.push({
              goalName: goal.habitName,
              nextReminder: nextReminderTime
            });
          }
        }
      });

      if (goalsWithReminders.length > 0) {
        goalsWithReminders.sort((a, b) => a.nextReminder.getTime() - b.nextReminder.getTime());
        const nextGoalInfo = goalsWithReminders[0];
        const timeString = nextGoalInfo.nextReminder.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const dayString = nextGoalInfo.nextReminder.toLocaleDateString('pt-BR', { weekday: 'short' });
        setNextGoal(`${nextGoalInfo.goalName} - ${dayString}, ${timeString}`);
      } else {
        const goalWithMostProgress = goals.reduce((max, goal) => (goal.progress.length > max.progress.length ? goal : max), goals[0]);
        setNextGoal(`${goalWithMostProgress.habitName}`);
      }
    } catch (error) {
      console.error("Failed to load next goal:", error);
      setNextGoal('Erro ao carregar');
    }
  };

  const loadLastClinicalData = async () => {
    try {
      const consultas = await listarConsultas();
      if (consultas && consultas.length > 0) {
        // Assuming the list is sorted by date, get the most recent one
        const lastConsulta = consultas[0]; 
        // You might need to add a date to your consulta object to sort properly
        // For now, just showing a generic message
        setLastClinicalData(`Registrado em ${new Date().toLocaleDateString()}`);
      } else {
        setLastClinicalData('Adicione dados de sua consulta');
      }
    } catch (error) {
      console.error("Failed to load clinical data:", error);
      setLastClinicalData('Erro ao carregar');
    }
  };

  const loadClosestFavoriteHospital = async () => {
    if (favorites.length === 0) {
      setClosestFavoriteHospital('Adicione hospitais favoritos');
      return;
    }

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setClosestFavoriteHospital('Permissão de localização negada');
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({});
      const userLocation: Coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      let closestHospital: any = null;
      let minDistance = Infinity;

      for (const hospital of favorites) {
        const hospitalCoords: Coordinates = {
          latitude: hospital.latitude,
          longitude: hospital.longitude,
        };
        const distance = googlePlacesService.calculateDistance(userLocation, hospitalCoords);

        if (distance < minDistance) {
          minDistance = distance;
          closestHospital = hospital;
        }
      }

      if (closestHospital) {
        setClosestFavoriteHospital(closestHospital.name);
      } else {
        setClosestFavoriteHospital('Nenhum hospital favorito encontrado');
      }
    } catch (error) {
      console.error("Failed to load closest favorite hospital:", error);
      setClosestFavoriteHospital('Erro ao carregar');
    }
  };

  const routerButton = useRouter();

  return (
      <View style={styles.container}>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.welcomeContainer}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.profileCircle} />
          ) : (
            <View style={styles.profileCircle} />
          )}
          <View>
            <Text style={styles.welcomeText}>{userName}</Text>
          </View>
        </View>
        
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <NotificationCard
              onPress={() => routerButton.push('/goals')}
              title="Metas de Atividade Física"
              subtitle="Próxima atividade"
              dateOrValue={nextGoal}
              cardColor={colors.lightestBlue}
            />
            <NotificationCard
              onPress={() => routerButton.push('/habits')}
              title="Hábitos Inteligentes"
              subtitle="Próximo lembrete"
              dateOrValue={nextHabit}
              cardColor={colors.lightestBlue}
            />
          </View>
          <View style={styles.gridRow}>
            <NotificationCard
              onPress={() => routerButton.push('/clinicalData')}
              title="Dados Clínicos"
              subtitle="Último registro"
              dateOrValue={lastClinicalData}
              cardColor={colors.lightestBlue}
            />
            <NotificationCard
              onPress={() => routerButton.push('/hospitais-proximos')}
              title="Hospitais Próximos"
              subtitle="Hospital mais próximo"
              dateOrValue={closestFavoriteHospital}
              cardColor={colors.lightestBlue}
            />
          </View>
        </View>

        <View style={styles.impactoHeader}>
          <Text style={styles.impactoHabitosTitle}>Impacto de Hábitos</Text>
          <Text style={styles.impactoHabitosSubtitle}>Veja como você melhorou!</Text>
        </View>
        <View style={styles.impactCardsRow}>
          <ImpactCard
            title="Atividades Físicas"
            value={25}
            change="+5 em relação a ago."
          />
          <ImpactCard
            title="Hábito X"
            value="50 dias"
            change="+10 em relação a ago."
          />
        </View>

        <View style={styles.outrasAcoesHeader}>
          <Text style={styles.outrasAcoesTitle}>Outras Ações</Text>
        </View>
        <View style={styles.actionsList}>
          <ActionItem
            iconName="hand-left-outline" 
            title="Feedback"
            subtitle="Compartilhe o que está achando do LifeBeat!"
          />
          <View style={styles.separator} /> 
          <ActionItem
            iconName="share-social-outline" 
            title="Compartilhar"
            subtitle="Envie atividades, lista de hábitos e muito mais aos..."
          />
        </View>
        
        </ScrollView>
    </View>
  );
}

// --- Estilos (Styles) ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', 
  },
  
  // Estilo para o conteúdo dentro do ScrollView
  scrollContent: {
    paddingBottom: 70, // ESSENCIAL: Espaço para não esconder o conteúdo atrás do footer fixo
  },

  // 2. BOAS-VINDAS
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ccc',
    marginRight: 15,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#666',
  },

  // 3. CARDS DE NOTIFICAÇÃO (Grid 2x2)
  gridContainer: {
    paddingHorizontal: 10,
    marginTop: 10,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  notificationCard: {
    flex: 1,
    height: 180, 
    marginHorizontal: 5,
    borderRadius: 15,
    padding: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    justifyContent: 'space-between', 
  },
  tag: {
    backgroundColor: '#7F96FF', 
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start', 
    marginBottom: 10,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  cardDate: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000', 
    marginTop: 10,
  },

  // 4. IMPACTO DE HÁBITOS
  impactoHeader: {
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  impactoHabitosTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  impactoHabitosSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  impactCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 20,
  },

  // 5. OUTRAS AÇÕES
  outrasAcoesHeader: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  outrasAcoesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  actionsList: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    // A margem inferior é controlada pelo scrollContent
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  actionIcon: {
    backgroundColor: '#E6E6FA', 
    borderRadius: 15,
    padding: 8,
    marginRight: 15,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginLeft: 50, 
  },

  // 6. FOOTER (Barra de Navegação Inferior)
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    height: 70, 
    position: 'absolute', // FIXO
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10, // Garante que fique acima de outros elementos
  },
  footerTab: {
    alignItems: 'center',
    padding: 5,
  },
  footerText: {
    fontSize: 12,
    color: '#999', 
  },
  footerTextSelected: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#A42020', 
  },
});