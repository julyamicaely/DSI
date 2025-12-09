/**
 * @file components/FavoritesSection.tsx
 * @description Seção de favoritos com gerenciamento de notas
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { FavoriteHospital } from '../types/hospital.types';
import { COLORS } from '../config/constants';
import googlePlacesService from '../services/googlePlaces.service';
import TemporaryMessage from './TemporaryMessage';
import ConfirmationModal from './ConfirmationModal';
import CustomButton from './CustomButton';
import Colors from './Colors';

interface FavoritesSectionProps {
  favorites: FavoriteHospital[];
  onRemove: (placeId: string) => void;
  onUpdateNote: (placeId: string, note: string) => void;
  onPress: (favorite: FavoriteHospital) => void;
}

const MAX_NOTE_LENGTH = 280;

export const FavoritesSection: React.FC<FavoritesSectionProps> = ({
  favorites,
  onRemove,
  onUpdateNote,
  onPress,
}) => {
  const [editingFavorite, setEditingFavorite] = useState<FavoriteHospital | null>(null);
  const [noteText, setNoteText] = useState('');
  const [tempMessage, setTempMessage] = useState<string>('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalActions, setModalActions] = useState<React.ReactNode | null>(null);
  const [favoriteToRemove, setFavoriteToRemove] = useState<FavoriteHospital | null>(null);

  const openModal = (title: string, message: string, actions: React.ReactNode) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalActions(actions);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalActions(null);
    setFavoriteToRemove(null);
  };

  const handleOpenNoteModal = (favorite: FavoriteHospital) => {
    setEditingFavorite(favorite);
    setNoteText(favorite.notes || '');
  };

  const handleSaveNote = () => {
    if (!editingFavorite) return;

    const trimmedNote = noteText.trim();
    onUpdateNote(editingFavorite.placeId, trimmedNote);
    setEditingFavorite(null);
    setNoteText('');
  };

  const handleRemove = (favorite: FavoriteHospital) => {
    setFavoriteToRemove(favorite);
    openModal(
      'Remover Favorito',
      `Deseja remover "${favorite.name}" dos favoritos?`,
      <>
        <CustomButton title="Cancelar" onPress={closeModal} backgroundColor={Colors.lightGray} textColor={Colors.black} width={'45%'} />
        <CustomButton
          title="Remover"
          onPress={() => {
            if (favoriteToRemove) {
              onRemove(favoriteToRemove.placeId);
              setTempMessage(`Favorito "${favoriteToRemove.name}" removido.`);
            }
            closeModal();
          }}
          backgroundColor={Colors.red}
          textColor={Colors.white}
          width={'45%'}
        />
      </>
    );
  };

  const renderFavoriteCard = ({ item }: { item: FavoriteHospital }) => {
    const photoUrl = item.photoReference
      ? googlePlacesService.getPhotoUrl(item.photoReference, 120)
      : null;

    return (
      <TouchableOpacity
        style={styles.favoriteCard}
        onPress={() => onPress(item)}
        activeOpacity={0.7}
      >
        {/* Imagem */}
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.favoriteImage} />
        ) : (
          <View style={[styles.favoriteImage, styles.placeholderImage]}>
            <Ionicons name="medical" size={24} color={COLORS.lightGray} />
          </View>
        )}

        {/* Conteúdo */}
        <View style={styles.favoriteContent}>
          <View style={styles.favoriteHeader}>
            <Ionicons name="heart" size={16} color={Colors.red} />
            <Text style={styles.favoriteName} numberOfLines={1}>
              {item.name}
            </Text>
          </View>

          <Text style={styles.favoriteAddress} numberOfLines={1}>
            {item.address}
          </Text>

          {item.notes && (
            <View style={styles.noteContainer}>
              <Ionicons name="document-text" size={12} color={COLORS.gray} />
              <Text style={styles.noteText} numberOfLines={2}>
                {item.notes}
              </Text>
            </View>
          )}

          {item.rating && (
            <View style={styles.favoriteRating}>
              <Ionicons name="star" size={12} color="#FFB800" />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* Ações */}
        <View style={styles.favoriteActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleOpenNoteModal(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="pencil" size={18} color={COLORS.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRemove(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (favorites.length === 0) {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="heart" size={20} color={Colors.red} />
          <Text style={styles.title}>Meus Favoritos</Text>
          <Text style={styles.count}>({favorites.length})</Text>
        </View>

        <FlatList
          data={favorites}
          keyExtractor={(item) => item.placeId}
          renderItem={renderFavoriteCard}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>

      {/* Modal de edição de nota */}
      <Modal
        visible={!!editingFavorite}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingFavorite(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setEditingFavorite(null)}
          />

          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Nota</Text>
              <TouchableOpacity
                onPress={() => setEditingFavorite(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            {editingFavorite && (
              <Text style={styles.modalSubtitle} numberOfLines={1}>
                {editingFavorite.name}
              </Text>
            )}

            <TextInput
              style={styles.noteInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Adicione uma nota pessoal..."
              placeholderTextColor={COLORS.lightGray}
              multiline
              maxLength={MAX_NOTE_LENGTH}
              textAlignVertical="top"
              autoFocus
            />

            <Text style={styles.charCount}>
              {noteText.length}/{MAX_NOTE_LENGTH}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditingFavorite(null)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveNote}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <ConfirmationModal
        visible={isModalVisible}
        title={modalTitle}
        message={modalMessage}
        onClose={closeModal}
      >
        {modalActions}
      </ConfirmationModal>
      <TemporaryMessage message={tempMessage} onHide={() => setTempMessage('')} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.lightGray + '10',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  count: {
    fontSize: 14,
    color: COLORS.gray,
  },
  favoriteCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  favoriteImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    backgroundColor: COLORS.lightGray + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  favoriteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  favoriteName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  favoriteAddress: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray + '30',
  },
  noteText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  favoriteRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.black,
  },
  favoriteActions: {
    justifyContent: 'center',
    gap: 12,
    paddingLeft: 8,
  },
  actionButton: {
    padding: 4,
  },
  separator: {
    height: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 16,
  },
  noteInput: {
    backgroundColor: COLORS.lightGray + '20',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.black,
    minHeight: 100,
    maxHeight: 200,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'right',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray + '30',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  saveButton: {
    backgroundColor: Colors.red,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
});
