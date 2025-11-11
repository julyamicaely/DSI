import * as React from 'react';
import { List } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import Colors from './Colors';
type AccordionProps = {
  title?: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onPress: () => void;
  left?: (props: { color: string }) => React.ReactNode;
};

const Accordion = ({ title, children, isExpanded, onPress, left }: AccordionProps) => {
  return (
    <List.Accordion
      title={title}
      left={left}
      expanded={isExpanded}
      onPress={onPress}
      style={styles.accordion}
      titleStyle={styles.title}
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
        width: '93%',
        height: 'auto',
        backgroundColor: Colors.white,
        borderColor: Colors.lightBlue,
        gap: -5,
    }
})

export default Accordion;