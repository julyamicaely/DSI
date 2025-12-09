/**
 * @file components/HospitalFilters.tsx
 * @description Componente de filtros para hospitais (abertos agora, avaliação mínima)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FILTER_OPTIONS } from '../config/constants';
import Colors from './Colors';

export interface HospitalFiltersState {
  openNow: boolean;
  minRating: number;
}

interface HospitalFiltersProps {
  filters: HospitalFiltersState;
  onFiltersChange: (filters: HospitalFiltersState) => void;
  resultCount?: number;
}

export default function HospitalFilters({
  filters,
  onFiltersChange,
  resultCount,
}: HospitalFiltersProps) {
  
  const toggleOpenNow = () => {
    onFiltersChange({ ...filters, openNow: !filters.openNow });
  };

  const setMinRating = (rating: number) => {
    onFiltersChange({ ...filters, minRating: rating });
  };

  const hasActiveFilters = filters.openNow || filters.minRating > 0;

  const clearFilters = () => {
    onFiltersChange({ openNow: false, minRating: 0 });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="filter" size={20} color={Colors.red} />
          <Text style={styles.headerTitle}>Filtros</Text>
          {resultCount !== undefined && (
            <Text style={styles.resultCount}>({resultCount} resultados)</Text>
          )}
        </View>

        {hasActiveFilters && (
          <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Limpar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtro: Abertos Agora */}
      <View style={styles.filterSection}>
        <TouchableOpacity
          style={[
            styles.toggleFilter,
            filters.openNow && styles.toggleFilterActive,
          ]}
          onPress={toggleOpenNow}
          activeOpacity={0.7}
        >
          <Ionicons
            name={filters.openNow ? 'time' : 'time-outline'}
            size={20}
            color={filters.openNow ? COLORS.white : COLORS.gray}
          />
          <Text
            style={[
              styles.toggleFilterText,
              filters.openNow && styles.toggleFilterTextActive,
            ]}
          >
            Abertos Agora
          </Text>
          {filters.openNow && (
            <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>

      {/* Filtro: Avaliação Mínima */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Avaliação Mínima</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ratingContainer}
        >
          {FILTER_OPTIONS.MIN_RATING.map((rating) => {
            const isSelected = filters.minRating === rating;
            return (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.ratingChip,
                  isSelected && styles.ratingChipActive,
                ]}
                onPress={() => setMinRating(rating)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isSelected ? 'star' : 'star-outline'}
                  size={16}
                  color={isSelected ? COLORS.white : COLORS.warning}
                />
                <Text
                  style={[
                    styles.ratingChipText,
                    isSelected && styles.ratingChipTextActive,
                  ]}
                >
                  {rating === 0 ? 'Todas' : `${rating}+`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '30',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  resultCount: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 4,
  },
  clearButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray + '30',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.red,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  toggleFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  toggleFilterActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  toggleFilterText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray,
  },
  toggleFilterTextActive: {
    color: COLORS.white,
  },
  ratingContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  ratingChipActive: {
    backgroundColor: COLORS.warning,
    borderColor: COLORS.warning,
  },
  ratingChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  ratingChipTextActive: {
    color: COLORS.white,
  },
});
