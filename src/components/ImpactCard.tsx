import { StyleSheet, Text, View, Image, TouchableOpacity, Alert, ScrollView } from 'react-native';

interface ImpactCardProps {
  title: string;
  value: string | number;
  change: string;
}

const ImpactCard = ({ title, value, change }: ImpactCardProps) => (
  <View style={styles.impactCard}>
    <Text style={styles.impactTitle}>{title}</Text>
    <Text style={styles.impactValue}>{value}</Text>
    <Text style={styles.impactChange}>{change}</Text>
  </View>
);

export default ImpactCard;

const styles = StyleSheet.create({
    impactCard: {
    flex: 1,
    backgroundColor: '#F5F5F5', 
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  impactTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  impactValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#A42020',
    marginBottom: 5,
  },
  impactChange: {
    fontSize: 14,
    color: '#6B8E23', 
    fontWeight: '600',
  },
});