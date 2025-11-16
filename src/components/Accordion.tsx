import * as React from 'react';
import { List } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
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
    <List.Accordion
      title={title}
      onLongPress={onSelect}
      left={() => (
        isSelected ? (
          <Ionicons name="close-circle" size={24} color={Colors.blue} />
        ) : (
          <Ionicons name="ellipse" size={24} color="white" />
        )
      )}
      right={() => null}
      expanded={isExpanded}
      onPress={onPress}
      style={styles.accordion}
      titleStyle={styles.title}
      rippleColor={Colors.lightBlue2}
    >
      <View style={styles.content}>{children}</View>
    </List.Accordion>
  );
};

const styles = StyleSheet.create({
    accordion: {
        backgroundColor: Colors.lighterBlue,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: 326,
        paddingHorizontal: 12,
        height: 60,

    },
    title: {
        color: '#000000',
        fontWeight: 'bold',
    },
    content: {
        width: '82%',
        height: 'auto',
        backgroundColor: Colors.white,
        borderColor: Colors.lightBlue,
        gap: -5,
    }
})

export default Accordion;