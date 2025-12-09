import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from './Colors';

type AccordionProps = {
  title?: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onPress: () => void;
  isSelected: boolean;
  onSelect: () => void;
};

const Accordion = ({ title, children, isExpanded, onPress, isSelected, onSelect }: AccordionProps) => {
  return (
    <View style={[
      styles.container,
      isSelected && styles.containerSelected
    ]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onSelect}
          style={styles.iconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isSelected ? (
            <Ionicons name="close-circle" size={24} color={Colors.blue} />
          ) : (
            <Ionicons name="ellipse" size={24} color={Colors.white} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.titleContainer}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Text style={styles.title}>{title}</Text>
        </TouchableOpacity>
      </View>

      {isExpanded && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.lighterBlue,
    borderRadius: 8,
    width: 326,
    // overflow: 'hidden', // Removed to prevent clipping potential issues
  },
  containerSelected: {
    borderColor: Colors.red,
    borderWidth: 2,
    backgroundColor: Colors.lightRed,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 60,
  },
  iconButton: {
    padding: 4,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  title: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    width: '100%',
    backgroundColor: Colors.white,
    borderColor: Colors.lightBlue,
    borderTopWidth: 1,
    padding: 10,
  }
})

export default Accordion;