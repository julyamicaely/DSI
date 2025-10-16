import { Text, View, StyleSheet } from 'react-native';
import { useState } from 'react';

export default function GoalsScreen() {
  return (
    <View >
      <Text style={styles.title}>Metas de atividade física</Text>
    </View>
  );
}

const styles = StyleSheet.create ({
  container: {
    flex: 1,
  },
    scrollContent: {
    paddingBottom: 70,
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 20,
  },
})