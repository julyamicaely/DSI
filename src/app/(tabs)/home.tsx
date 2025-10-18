import { StyleSheet, Text, View, Image, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import NotificationCard from '../../com/NotificationCard';
import ImpactCard from '../../com/ImpactCard';
// In your home.tsx or any other component
import { auth } from '../../../firebaseConfig'; // Adjust the import path if needed
import { useState, useEffect } from 'react';

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

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserName(user.displayName || ''); // Get the display name
    }
  }, []);

  const routerButton = useRouter();

  return (
      <View style={styles.container}>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.welcomeContainer}>
          <View style={styles.profileCircle}></View>
          <View>
            <Text style={styles.welcomeText}>{userName}</Text>
            <Text style={styles.welcomeSubtext}>Bem vinda ao LifeBeat.</Text>
          </View>
        </View>

        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            <NotificationCard
              onPress={() => routerButton.push('/goals')}
              title="Metas de Atividade Física"
              subtitle="Atividade recente"
              dateOrValue="Set 15, 2025"
              cardColor="#F0F2FF"
            />
            <NotificationCard
              title="Hábitos Inteligentes"
              subtitle="Próximo Item"
              dateOrValue="Caminhada das q..."
              cardColor="#F0F2FF"
            />
          </View>
          <View style={styles.gridRow}>
            <TouchableOpacity onPress={() => routerButton.push('/dados-clinicos')} activeOpacity={0.8}>
  <NotificationCard
    title="Dados Clínicos"
    subtitle="Último registro"
    dateOrValue="Set 15, 2025"
    cardColor="#F0F2FF"
  />
</TouchableOpacity>

            <NotificationCard
              title="Hospitais Próximos"
              subtitle="Endereço atual"
              dateOrValue="Rua Acadêmico H..."
              cardColor="#F0F2FF"
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