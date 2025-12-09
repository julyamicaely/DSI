import { Pressable, StyleSheet, Text, View } from 'react-native';
import colors from './Colors';


interface NotificationCardProps {
  onPress?: () => void;
  title: string;
  subtitle: string;
  dateOrValue?: string;
  children?: React.ReactNode;
  cardColor?: string;
}

const NotificationCard = ({ onPress, title, subtitle, dateOrValue, children, cardColor }: NotificationCardProps) => (
  <View style={[styles.notificationCard, { backgroundColor: cardColor }]}>
    <Pressable onPress={onPress}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
      {dateOrValue && <Text style={styles.cardDate} numberOfLines={3} ellipsizeMode='tail'>{dateOrValue}</Text>}
      {children}
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
    justifyContent: 'space-evenly',
  },
  cardTitle: {
    backgroundColor: colors.lightBlue,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 30,
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.white,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    alignSelf: 'flex-start',
  },
  cardDate: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.blue,
    marginTop: 10,
    alignSelf: 'center',
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