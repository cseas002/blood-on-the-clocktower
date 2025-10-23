import { StyleSheet, View, ScrollView, TouchableOpacity, Text, TextInput, Modal, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { useGame } from "../context/GameContext";
import { Player } from "../types/game";
import { Colors, TEAM_COLORS } from "../constants/Colors";

export default function PlayerAssignmentScreen() {
    const router = useRouter();
    const { gameState, addPlayer, removePlayer, assignCharacter } = useGame();
    const [isAddPlayerModalVisible, setIsAddPlayerModalVisible] = useState(false);
    const [newPlayerName, setNewPlayerName] = useState("");
    const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
    const [isAssignPlayerModalVisible, setIsAssignPlayerModalVisible] = useState(false);

    const unassignedPlayers = useMemo(() => {
        return gameState.players.filter(player => !player.character);
    }, [gameState.players]);

    const handleAddPlayer = () => {
        if (newPlayerName.trim()) {
            addPlayer(newPlayerName.trim());
            setNewPlayerName("");
            setIsAddPlayerModalVisible(false);
        }
    };

    const handleAssignPlayer = (player: Player) => {
        setSelectedCharacter(player);
        setIsAssignPlayerModalVisible(true);
    };

    const handleCharacterAssignment = (character: any) => {
        if (selectedCharacter) {
            assignCharacter(selectedCharacter.id, character);
            setIsAssignPlayerModalVisible(false);
            setSelectedCharacter(null);
        }
    };

    const handleRemovePlayer = (playerId: string) => {
        removePlayer(playerId);
    };

    const handleStartGame = () => {
        if (gameState.players.length >= gameState.selectedCharacters.length) {
            router.push("/(tabs)");
        }
    };

    const getCharactersByTeam = (team: string) => {
        return gameState.selectedCharacters.filter(char => char.team === team);
    };

    const isComplete = gameState.players.length >= gameState.selectedCharacters.length;

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Assign Players</Text>
            </View>

            {/* Progress */}
            <View style={styles.progressSection}>
                <Text style={styles.progressText}>
                    Players: {gameState.players.length}/{gameState.selectedCharacters.length}
                </Text>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            {
                                width: `${Math.min((gameState.players.length / gameState.selectedCharacters.length) * 100, 100)}%`,
                                backgroundColor: isComplete ? Colors.success : Colors.primary,
                            }
                        ]}
                    />
                </View>
            </View>

            {/* Selected Characters by Team */}
            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {(['townsfolk', 'outsider', 'minion', 'demon'] as const).map(team => {
                    const teamCharacters = getCharactersByTeam(team);
                    if (teamCharacters.length === 0) return null;

                    return (
                        <View key={team} style={styles.teamSection}>
                            <Text style={[styles.teamTitle, { color: TEAM_COLORS[team] }]}>
                                {team.charAt(0).toUpperCase() + team.slice(1)} ({teamCharacters.length})
                            </Text>

                            <View style={styles.characterGrid}>
                                {teamCharacters.map(character => {
                                    const assignedPlayer = gameState.players.find(p => p.character?.id === character.id);
                                    return (
                                        <TouchableOpacity
                                            key={character.id}
                                            style={[
                                                styles.characterSlot,
                                                { borderColor: TEAM_COLORS[team] },
                                                assignedPlayer && styles.characterSlotAssigned
                                            ]}
                                            onPress={() => !assignedPlayer && unassignedPlayers.length > 0 && handleAssignPlayer({
                                                id: character.id,
                                                name: character.name,
                                                playerNumber: 0, // This will be properly assigned when the player is created
                                                character,
                                                isDead: false,
                                                deathType: null,
                                                isVoteless: false,
                                                hasUsedDeadVote: false,
                                                reminders: [],
                                                reminderTokens: [],
                                                notes: '',
                                            })}
                                        >
                                            <Text style={[styles.characterSlotName, { color: TEAM_COLORS[team] }]}>
                                                {character.name}
                                            </Text>
                                            {assignedPlayer ? (
                                                <View style={styles.assignedPlayer}>
                                                    <Text style={styles.assignedPlayerName}>{assignedPlayer.name}</Text>
                                                    <TouchableOpacity
                                                        style={styles.removePlayerButton}
                                                        onPress={() => handleRemovePlayer(assignedPlayer.id)}
                                                    >
                                                        <Text style={styles.removePlayerButtonText}>×</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ) : (
                                                <Text style={styles.characterSlotEmpty}>Tap to assign player</Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            {/* Add Player Button */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsAddPlayerModalVisible(true)}
            >
                <Text style={styles.addButtonText}>+ Add Player</Text>
            </TouchableOpacity>

            {/* Start Game Button */}
            {isComplete && (
                <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
                    <Text style={styles.startButtonText}>Start Game</Text>
                </TouchableOpacity>
            )}

            {/* Add Player Modal */}
            <Modal
                visible={isAddPlayerModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsAddPlayerModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setIsAddPlayerModalVisible(false)}
                >
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <Text style={styles.modalTitle}>Add Player</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Player name"
                            placeholderTextColor={Colors.textMuted}
                            value={newPlayerName}
                            onChangeText={setNewPlayerName}
                            autoFocus
                            onSubmitEditing={handleAddPlayer}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => setIsAddPlayerModalVisible(false)}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.addButtonModal]}
                                onPress={handleAddPlayer}
                            >
                                <Text style={styles.buttonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Assign Player Modal */}
            <Modal
                visible={isAssignPlayerModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsAssignPlayerModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setIsAssignPlayerModalVisible(false)}
                >
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <Text style={styles.modalTitle}>Assign Player</Text>
                        <Text style={styles.modalSubtitle}>Select a player to assign:</Text>

                        <ScrollView style={styles.playerList}>
                            {unassignedPlayers.map(player => (
                                <TouchableOpacity
                                    key={player.id}
                                    style={styles.playerOption}
                                    onPress={() => handleCharacterAssignment(player.character || gameState.selectedCharacters.find(c => c.id === selectedCharacter?.id))}
                                >
                                    <Text style={styles.playerOptionText}>{player.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={() => setIsAssignPlayerModalVisible(false)}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: Colors.surface,
        borderBottomWidth: 2,
        borderBottomColor: Colors.primary,
    },
    backButton: {
        marginRight: 15,
    },
    backButtonText: {
        fontSize: 32,
        color: Colors.accent,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.accent,
    },
    progressSection: {
        padding: 20,
        backgroundColor: Colors.surfaceDark,
    },
    progressText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 10,
    },
    progressBar: {
        height: 8,
        backgroundColor: Colors.surface,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 100,
    },
    teamSection: {
        marginBottom: 25,
    },
    teamTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    characterGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
    },
    characterSlot: {
        width: '48%',
        backgroundColor: Colors.surface,
        borderRadius: 10,
        padding: 15,
        borderWidth: 2,
        alignItems: 'center',
        minHeight: 120,
    },
    characterSlotAssigned: {
        backgroundColor: Colors.surfaceLight,
    },
    characterSlotName: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    characterSlotEmpty: {
        fontSize: 12,
        color: Colors.textMuted,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    assignedPlayer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    assignedPlayerName: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '600',
    },
    removePlayerButton: {
        backgroundColor: Colors.danger,
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removePlayerButtonText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    addButton: {
        backgroundColor: Colors.primary,
        borderRadius: 15,
        padding: 15,
        margin: 20,
        alignItems: 'center',
    },
    addButtonText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    startButton: {
        backgroundColor: Colors.success,
        borderRadius: 15,
        padding: 15,
        margin: 20,
        marginTop: 0,
        alignItems: 'center',
    },
    startButtonText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: Colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 30,
        width: '80%',
        maxWidth: 400,
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 20,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 16,
        color: Colors.text,
        marginBottom: 15,
        textAlign: 'center',
    },
    input: {
        backgroundColor: Colors.surfaceLight,
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        color: Colors.text,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    button: {
        flex: 1,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: Colors.border,
    },
    addButtonModal: {
        backgroundColor: Colors.primary,
    },
    buttonText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    playerList: {
        maxHeight: 200,
        marginBottom: 20,
    },
    playerOption: {
        backgroundColor: Colors.surfaceLight,
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
    },
    playerOptionText: {
        color: Colors.text,
        fontSize: 16,
        textAlign: 'center',
    },
});
