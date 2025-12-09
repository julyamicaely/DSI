import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Modal, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAchievementStats, AchievementStats, MILESTONES, removeGoalFromHistory } from '../../../services/achievementsService';
import Colors from '../../../components/Colors';
import ConfirmationModal from '../../../components/ConfirmationModal';
import CustomButton from '../../../components/CustomButton';
import { useAuth } from '../../../context/AuthContext';

export default function AchievementsScreen() {
    const [stats, setStats] = useState<AchievementStats | null>(null);
    const { user } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedAchievement, setSelectedAchievement] = useState<{ title: string, description: string, type: 'standard' | 'perfect' } | null>(null);
    const [selectedHistory, setSelectedHistory] = useState<any[]>([]);

    // Confirmation Modal State
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [confirmModalTitle, setConfirmModalTitle] = useState('');
    const [confirmModalMessage, setConfirmModalMessage] = useState('');
    const [confirmModalActions, setConfirmModalActions] = useState<React.ReactNode>(null);

    useEffect(() => {
        loadStats();
    }, [user]);

    const loadStats = async () => {
        if (user) {
            const data = await getAchievementStats();
            setStats(data);
        }
    };

    const handlePressAchievement = (milestone: number, type: 'standard' | 'perfect', unlocked: boolean) => {
        if (!unlocked || !stats) return;

        const title = type === 'standard' ? `Conquistador Nível ${milestone}` : `Perfeccionista Nível ${milestone}`;
        const description = type === 'standard' ? `Completou ${milestone} metas!` : `Completou ${milestone} metas perfeitas!`;

        // Filter history
        let history = stats.history || [];
        if (type === 'perfect') {
            history = history.filter(h => h.isPerfect);
        }

        // Sorting by date descending
        history.sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

        setSelectedAchievement({ title, description, type });
        setSelectedHistory(history);
        setModalVisible(true);
    };



    const openConfirmModal = (title: string, message: string, actions: React.ReactNode) => {
        setConfirmModalTitle(title);
        setConfirmModalMessage(message);
        setConfirmModalActions(actions);
        setConfirmModalVisible(true);
    };

    const closeConfirmModal = () => {
        setConfirmModalVisible(false);
        setConfirmModalActions(null);
    };

    const showPerfectHelp = () => {
        openConfirmModal(
            "Como conquistar uma Meta Perfeita?",
            "Uma meta é considerada 'Perfeita' quando é completa com eficiência total, sem metas diárias não atingidas ou atrasos.",
            <CustomButton
                title="Entendi"
                onPress={closeConfirmModal}
                backgroundColor={Colors.blue}
                textColor={Colors.white}
                width={'50%'}
            />
        );
    };

    const handleDeleteHistory = async (entryId: string) => {
        openConfirmModal(
            "Reverter Conquista",
            "Tem certeza? Isso removerá esta meta do seu histórico e pode bloquear a conquista novamente se você ficar abaixo da meta.",
            <>
                <CustomButton
                    title="Cancelar"
                    onPress={closeConfirmModal}
                    backgroundColor={Colors.gray}
                    textColor={Colors.white}
                    width={'40%'}
                />
                <CustomButton
                    title="Remover"
                    onPress={async () => {
                        await removeGoalFromHistory(entryId);
                        // Refresh stats and modal list
                        const newStats = await getAchievementStats();
                        setStats(newStats);

                        // Update local history list
                        setSelectedHistory(prev => prev.filter(h => h.id !== entryId));
                        closeConfirmModal();
                    }}
                    backgroundColor={Colors.red}
                    textColor={Colors.white}
                    width={'40%'}
                />
            </>
        );
    };

    const AchievementIcon = ({ unlocked, milestone, isPerfect }: { unlocked: boolean, milestone: number, isPerfect: boolean }) => {
        // Animation logic can be added here
        const iconColor = unlocked ? (isPerfect ? '#FFD700' : Colors.blue) : '#CCC'; // Gold for perfect, Blue for standard
        const iconName = isPerfect ? (unlocked ? 'star' : 'star-outline') : (unlocked ? 'trophy' : 'trophy-outline');

        return (
            <TouchableOpacity
                activeOpacity={unlocked ? 0.7 : 1}
                onPress={() => handlePressAchievement(milestone, isPerfect ? 'perfect' : 'standard', unlocked)}
                style={[styles.iconContainer, unlocked && styles.unlockedContainer, isPerfect && unlocked && styles.perfectContainer]}
            >
                <Ionicons name={iconName} size={32} color={iconColor} />
                <Text style={[styles.milestoneText, { color: unlocked ? '#333' : '#999' }]}>{milestone}</Text>
                {isPerfect && unlocked && <View style={styles.shineEffect} />}
            </TouchableOpacity>
        );
    };

    if (!stats) return <View style={styles.container}><Text>Carregando...</Text></View>;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.headerTitle}>Sala de Troféus</Text>
            <Text style={styles.headerSubtitle}>Suas conquistas e marcos importantes</Text>

            <View style={styles.statsCard}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.totalGoalsCompleted}</Text>
                    <Text style={styles.statLabel}>Metas Concluídas</Text>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#FFD700' }]}>{stats.perfectGoalsCompleted}</Text>
                    <Text style={styles.statLabel}>Perfeitas</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Conquistador</Text>
            <Text style={styles.sectionDescription}>Complete metas para desbloquear!</Text>
            <View style={styles.grid}>
                {MILESTONES.map(m => (
                    <AchievementIcon
                        key={`std-${m}`}
                        milestone={m}
                        unlocked={stats.totalGoalsCompleted >= m}
                        isPerfect={false}
                    />
                ))}
            </View>

            <View style={styles.sectionHeaderContainer}>
                <Text style={styles.sectionTitle}>Perfeccionista</Text>
                <TouchableOpacity onPress={showPerfectHelp} style={styles.helpButton}>
                    <Ionicons name="help-circle-outline" size={22} color={Colors.gray} />
                </TouchableOpacity>
            </View>
            <Text style={styles.sectionDescription}>Complete metas sem falhar nenhum dia!</Text>
            <View style={styles.grid}>
                {MILESTONES.map(m => (
                    <AchievementIcon
                        key={`prf-${m}`}
                        milestone={m}
                        unlocked={stats.perfectGoalsCompleted >= m}
                        isPerfect={true}
                    />
                ))}
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{selectedAchievement?.title}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>{selectedAchievement?.description}</Text>

                        <Text style={styles.historyTitle}>Metas que contribuíram:</Text>

                        {selectedHistory.length === 0 ? (
                            <Text style={styles.emptyHistory}>Nenhuma meta registrada para esta conquista.</Text>
                        ) : (
                            <FlatList
                                data={selectedHistory}
                                keyExtractor={(item, index) => `${item.name}-${index}`}
                                renderItem={({ item }) => (
                                    <View style={styles.historyItem}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                            <Ionicons
                                                name={item.isPerfect ? "star" : "checkmark-circle"}
                                                size={18}
                                                color={item.isPerfect ? "#FFD700" : Colors.blue}
                                                style={{ marginRight: 8 }}
                                            />
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.historyName}>{item.name}</Text>
                                                <Text style={styles.historyDate}>
                                                    {new Date(item.completedAt).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </View>
                                        <TouchableOpacity onPress={() => handleDeleteHistory(item.id)} style={{ padding: 5 }}>
                                            <Ionicons name="trash-outline" size={20} color={Colors.red} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                                style={styles.historyList}
                            />
                        )}
                    </View>
                </View>
            </Modal>

            <ConfirmationModal
                visible={confirmModalVisible}
                title={confirmModalTitle}
                message={confirmModalMessage}
                onClose={closeConfirmModal}
            >
                {confirmModalActions}
            </ConfirmationModal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    content: { padding: 20, paddingBottom: 50 },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 5 },
    headerSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },

    statsCard: {
        flexDirection: 'row',
        backgroundColor: '#F8F9FA',
        borderRadius: 15,
        padding: 20,
        marginBottom: 30,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        justifyContent: 'space-around',
        alignItems: 'center'
    },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 32, fontWeight: 'bold', color: Colors.blue },
    statLabel: { fontSize: 14, color: '#666', marginTop: 5 },
    verticalDivider: { width: 1, height: '80%', backgroundColor: '#DDD' },

    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 5 },
    sectionHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 5,
        gap: 8
    },
    helpButton: {
        marginTop: 2
    },
    sectionDescription: { fontSize: 14, color: '#666', marginBottom: 15 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 30 },

    iconContainer: {
        width: 70,
        height: 90, // Taller to fit text
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#EEE'
    },
    unlockedContainer: {
        backgroundColor: '#F0F8FF',
        borderColor: Colors.lightBlue,
        elevation: 3
    },
    perfectContainer: {
        backgroundColor: '#FFFBE6', // Light gold bg
        borderColor: '#FFD700',
        transform: [{ scale: 1.05 }] // Slightly bigger
    },
    milestoneText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 5
    },
    shineEffect: {
        position: 'absolute',
        top: 5, right: 5,
        width: 6, height: 6,
        borderRadius: 3,
        backgroundColor: 'white',
        opacity: 0.8
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        maxHeight: '80%',
        elevation: 5
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333'
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20
    },
    historyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10
    },
    emptyHistory: {
        textAlign: 'center',
        color: '#999',
        fontStyle: 'italic',
        marginTop: 20
    },
    historyList: {
        maxHeight: 300
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE'
    },
    historyName: {
        flex: 1,
        fontSize: 16,
        color: '#333'
    },
    historyDate: {
        fontSize: 12,
        color: '#999'
    }
});
