/**
 * @file components/MapSkeleton.tsx
 * @description Skeleton loader para o mapa durante carregamento
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../config/constants';

interface MapSkeletonProps {
  height?: number;
  expanded?: boolean;
}

export default function MapSkeleton({ height = 400, expanded = false }: MapSkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animação de shimmer contínua
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[styles.container, { height: expanded ? 700 : height }]}>
      {/* Background base */}
      <View style={styles.mapBase} />

      {/* Shimmer overlay */}
      <Animated.View style={[styles.shimmer, { opacity }]} />

      {/* Elementos decorativos (simulam pins) */}
      <View style={[styles.pin, styles.pin1]} />
      <View style={[styles.pin, styles.pin2]} />
      <View style={[styles.pin, styles.pin3]} />

      {/* Botão de centralizar */}
      <View style={styles.centerButtonSkeleton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: COLORS.lightGray + '20',
    borderRadius: 0,
  },
  mapBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E8E8E8',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F5F5',
  },
  pin: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.lightGray,
  },
  pin1: {
    top: '30%',
    left: '40%',
  },
  pin2: {
    top: '50%',
    right: '35%',
  },
  pin3: {
    bottom: '35%',
    left: '60%',
  },
  centerButtonSkeleton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
  },
});
