/**
 * @file components/HospitalCardSkeleton.tsx
 * @description Skeleton loader para cards de hospital
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../config/constants';

export default function HospitalCardSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
    <View style={styles.container}>
      {/* Imagem */}
      <View style={styles.imageContainer}>
        <View style={styles.imageSkeleton} />
        <Animated.View style={[styles.shimmer, styles.imageShimmer, { opacity }]} />
      </View>

      {/* Conteúdo */}
      <View style={styles.content}>
        {/* Título */}
        <View style={styles.titleContainer}>
          <View style={styles.titleSkeleton} />
          <Animated.View style={[styles.shimmer, styles.titleShimmer, { opacity }]} />
        </View>

        {/* Subtítulo */}
        <View style={styles.subtitleContainer}>
          <View style={styles.subtitleSkeleton} />
          <Animated.View style={[styles.shimmer, styles.subtitleShimmer, { opacity }]} />
        </View>

        {/* Rating + Distância */}
        <View style={styles.metaContainer}>
          <View style={styles.metaSkeleton} />
          <Animated.View style={[styles.shimmer, styles.metaShimmer, { opacity }]} />
        </View>
      </View>

      {/* Botão de favorito */}
      <View style={styles.favoriteButton}>
        <View style={styles.favoriteSkeleton} />
        <Animated.View style={[styles.shimmer, styles.favoriteShimmer, { opacity }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  imageSkeleton: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8E8E8',
  },
  imageShimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleContainer: {
    position: 'relative',
    height: 20,
    marginBottom: 8,
    overflow: 'hidden',
  },
  titleSkeleton: {
    width: '80%',
    height: '100%',
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
  },
  titleShimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  subtitleContainer: {
    position: 'relative',
    height: 16,
    marginBottom: 8,
    overflow: 'hidden',
  },
  subtitleSkeleton: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
  },
  subtitleShimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  metaContainer: {
    position: 'relative',
    height: 16,
    overflow: 'hidden',
  },
  metaSkeleton: {
    width: '50%',
    height: '100%',
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
  },
  metaShimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  favoriteButton: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  favoriteSkeleton: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8E8E8',
  },
  favoriteShimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmer: {
    backgroundColor: '#F5F5F5',
  },
});
