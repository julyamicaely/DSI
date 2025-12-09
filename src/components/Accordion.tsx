import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder, PanResponderGestureState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from './Colors';

type AccordionProps = {
  title?: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onPress: () => void;
  isSelected: boolean;
  onSelect: () => void;
  onLongPress?: () => void;
};

const Accordion = ({ title, children, isExpanded, onPress, isSelected, onSelect, onLongPress }: AccordionProps) => {
  // Swipe Logic
  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderMove: (_, gestureState: PanResponderGestureState) => {
        if (gestureState.dx < 0) {
          // Only allow left swipe
          translateX.setValue(Math.max(gestureState.dx, -80));
        }
      },
      onPanResponderRelease: (_, gestureState: PanResponderGestureState) => {
        if (gestureState.dx < -40) {
          // Swipe detected - expand!
          if (!isExpanded) onPress();

          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        } else {
          // Return to start
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={[
      styles.swipeContainer,
      isSelected && styles.containerSelected
    ]}>
      {/* Edit Action Background */}
      <View style={styles.swipeEditAction}>
        <TouchableOpacity
          style={styles.swipeEditButton}
          onPress={() => {
            if (!isExpanded) onPress();
          }}
        >
          <Ionicons name="create-outline" size={24} color={Colors.white} />
          <Text style={styles.swipeActionText}>Editar</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.container,
          { transform: [{ translateX }] }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onPress}
          onLongPress={onLongPress}
        >
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

            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
            </View>
          </View>

          {isExpanded && (
            <View style={styles.content}>
              {children}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  swipeContainer: {
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.blue,
    position: 'relative',
    width: '100%',
  },
  container: {
    backgroundColor: Colors.lighterBlue,
    borderRadius: 8,
    width: '100%',
    // overflow: 'hidden',
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
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  swipeEditAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  swipeEditButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  swipeActionText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  }
})

export default Accordion;