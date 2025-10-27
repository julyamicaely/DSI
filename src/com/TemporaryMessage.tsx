import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface TemporaryMessageProps {
  message: string;
  duration?: number; // Duration in milliseconds
  onHide?: () => void;
}

const TemporaryMessage: React.FC<TemporaryMessageProps> = ({ message, duration = 3000, onHide }) => {
  const [isVisible, setIsVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0]; // Initial value for opacity: 0

  useEffect(() => {
    if (message) {
      // Show the message
      setIsVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Set a timer to hide it
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setIsVisible(false);
          if (onHide) {
            onHide();
          }
        }); // Hide after fade out
      }, duration);

      // Cleanup function to clear the timer if the component unmounts
      return () => clearTimeout(timer);
    }
  }, [message, duration, fadeAnim, onHide]); // Re-run when the message changes

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

export default TemporaryMessage;

const styles = StyleSheet.create({
  container: {
    // Position fixed at the bottom (or top)
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  text: {
    color: 'white',
    textAlign: 'center',
  },
});