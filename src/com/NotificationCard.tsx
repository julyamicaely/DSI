import { Pressable, StyleSheet, Text, View } from 'react-native';


interface NotificationCardProps {
  onPress?: () => void;
  title: string;
  subtitle: string;
  dateOrValue: string;
  cardColor: string;
}

const NotificationCard = ({ onPress, title, subtitle, dateOrValue, cardColor }: NotificationCardProps) => ( 
  <View style={[styles.notificationCard, { backgroundColor: cardColor }]}>
    <Pressable onPress={onPress}>
    <View style={styles.tag}>
      <Text style={styles.tagText}>Notificação</Text>
    </View>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardSubtitle}>{subtitle}</Text>
    <Text style={styles.cardDate}>{dateOrValue}</Text>
    </Pressable>
  </View>
);

export default NotificationCard;

const styles = StyleSheet.create({
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
});