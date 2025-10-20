import { StyleSheet, View, ScrollView, TouchableOpacity, Text, TextInput, Image, Modal, Switch } from "react-native";
import { StatusBar } from "expo-status-bar";
import React, { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { useGame } from "../context/GameContext";
import { troubleBrewingCharacters } from "../data/characters";
import { Character, Team } from "../types/game";
import { Colors, TEAM_COLORS } from "../constants/Colors";

export default function CharacterSelectionScreen() {
    const router = useRouter();
    const { gameState, setGameState, addSelectedCharacter, removeSelectedCharacter, setDrunkImpersonation } = useGame();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTeam, setSelectedTeam] = useState<Team | 'all'>('all');
    const [isDrunkModalVisible, setIsDrunkModalVisible] = useState(false);
    const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
    const [ignoreDistributionRules, setIgnoreDistributionRules] = useState(false);

    const filteredCharacters = useMemo(() => {
        let chars = troubleBrewingCharacters;

        if (selectedTeam !== 'all') {
            chars = chars.filter(c => c.team === selectedTeam);
        }

        if (searchQuery) {
            chars = chars.filter(c =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return chars;
    }, [selectedTeam, searchQuery]);

    const selectedCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        gameState.selectedCharacters.forEach(char => {
            counts[char.team] = (counts[char.team] || 0) + 1;
        });
        return counts;
    }, [gameState.selectedCharacters]);

    const handleSelectCharacter = (character: Character) => {
        if (character.id === 'drunk') {
            // Add the drunk character immediately
            addSelectedCharacter(character);
            // Show modal to select which townsfolk the drunk will impersonate
            setIsDrunkModalVisible(true);
            return;
        }

        // Check if this townsfolk is being impersonated by a drunk
        const isImpersonated = Object.values(gameState.drunkImpersonations).some(impersonated => impersonated.id === character.id);
        if (isImpersonated) {
            // Don't allow selecting a townsfolk that's already being impersonated
            return;
        }

        addSelectedCharacter(character);
    };

    const handleDrunkImpersonationSelect = (townsfolkCharacter: Character) => {
        setIsDrunkModalVisible(false);

        // Store the impersonation mapping (drunk is already added to selectedCharacters)
        const drunk = troubleBrewingCharacters.find(char => char.id === 'drunk');
        if (drunk) {
            setDrunkImpersonation(drunk.id, townsfolkCharacter);
        }
    };


    const handleRemoveCharacter = (characterId: string) => {
        // If removing the drunk, also remove the impersonated townsfolk and clear the mapping
        if (characterId === 'drunk') {
            const impersonatedCharacter = gameState.drunkImpersonations[characterId];
            if (impersonatedCharacter) {
                removeSelectedCharacter(impersonatedCharacter.id);
            }
            setGameState(prev => ({
                ...prev,
                drunkImpersonations: {},
            }));
        }
        // If removing an impersonated townsfolk, also remove the drunk
        else {
            const isImpersonated = Object.values(gameState.drunkImpersonations).some(char => char.id === characterId);
            if (isImpersonated) {
                const drunkCharacter = troubleBrewingCharacters.find(char => char.id === 'drunk');
                if (drunkCharacter) {
                    removeSelectedCharacter(drunkCharacter.id);
                }
                setGameState(prev => ({
                    ...prev,
                    drunkImpersonations: {},
                }));
            }
        }

        removeSelectedCharacter(characterId);
    };

    const handleStartGame = () => {
        // Always check total character count (even in house rules mode)
        const totalSelected = gameState.selectedCharacters.length;
        const totalRequired = Object.values(adjustedDistribution).reduce((sum, count) => sum + count, 0);

        if (totalSelected < totalRequired) {
            alert(`Please select ${totalRequired - totalSelected} more characters`);
            return;
        }

        if (totalSelected > totalRequired) {
            alert(`Please remove ${totalSelected - totalRequired} characters`);
            return;
        }

        if (!ignoreDistributionRules) {
            // Check distribution correctness
            const isDistributionCorrect = Object.entries(adjustedDistribution).every(([team, required]) => {
                const current = selectedCounts[team as Team] || 0;
                return current === required;
            });

            if (!isDistributionCorrect) {
                alert("Please adjust your character selection to match the required distribution");
                return;
            }
        }

        router.push("/assign-character");
    };


    // Check if baron is selected (affects distribution)
    const baronSelected = gameState.selectedCharacters.some(char => char.id === 'baron');

    // Calculate adjusted distribution based on Baron
    const getAdjustedDistribution = () => {
        const baseDistribution = gameState.characterDistribution;

        if (baronSelected) {
            return {
                townsfolk: Math.max(0, baseDistribution.townsfolk - 2),
                outsider: baseDistribution.outsider + 2,
                minion: baseDistribution.minion,
                demon: baseDistribution.demon,
            };
        }

        return baseDistribution;
    };

    const adjustedDistribution = getAdjustedDistribution();

    // Get available townsfolk for drunk to impersonate (those not already selected or impersonated)
    const availableTownsfolkForDrunk = troubleBrewingCharacters.filter(char => {
        if (char.team !== 'townsfolk') return false;

        // Check if this townsfolk is already selected
        const isSelected = gameState.selectedCharacters.some(selected => selected.id === char.id);
        if (isSelected) return false;

        // Check if this townsfolk is being impersonated by a drunk
        const isImpersonated = Object.values(gameState.drunkImpersonations).some(impersonated => impersonated.id === char.id);

        return !isImpersonated;
    });

    const canSelectMore = (team: Team) => {
        if (ignoreDistributionRules) {
            // In house rules mode, allow selecting more characters regardless of distribution
            return true;
        }

        const currentCount = selectedCounts[team] || 0;
        const requiredCount = adjustedDistribution[team] || 0;
        return currentCount < requiredCount;
    };

    const canSelectCharacter = (character: Character) => {
        // Don't allow selecting a townsfolk that's already being impersonated by a drunk
        if (character.team === 'townsfolk') {
            const isImpersonated = Object.values(gameState.drunkImpersonations).some(impersonated => impersonated.id === character.id);
            if (isImpersonated) return false;
        }

        return canSelectMore(character.team);
    };

    const getTeamProgress = (team: Team) => {
        const current = selectedCounts[team] || 0;

        // Use adjusted distribution as the new required baseline
        const required = adjustedDistribution[team] || 0;

        // For progress calculation, we want to show how we're doing against the adjusted requirements
        let extraInfo = '';
        if (current < required) {
            extraInfo = ` (Need ${required - current} more)`;
        } else if (current > required) {
            extraInfo = ` (${current - required} extra)`;
        }

        return {
            current,
            required,
            extraInfo,
            percentage: required > 0 ? (current / required) * 100 : 0
        };
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Select Characters</Text>
                <TouchableOpacity onPress={() => setIsSettingsModalVisible(true)} style={styles.settingsButton}>
                    <Text style={styles.settingsButtonText}>⚙</Text>
                </TouchableOpacity>
            </View>

            {/* Player Count */}
            <View style={styles.playerCountSection}>
                <Text style={styles.playerCountText}>Players: {gameState.playerCount}</Text>
            </View>

            {/* Team Progress */}
            <View style={styles.teamProgressSection}>
                {(['townsfolk', 'outsider', 'minion', 'demon'] as Team[]).map(team => {
                    const progress = getTeamProgress(team);
                    return (
                        <View key={team} style={styles.teamProgressItem}>
                            <View style={styles.teamProgressHeader}>
                                <Text style={[styles.teamProgressLabel, { color: TEAM_COLORS[team] }]}>
                                    {team.charAt(0).toUpperCase() + team.slice(1)}
                                </Text>
                                <View style={styles.teamProgressCountContainer}>
                                    <Text style={[styles.teamProgressCount, { color: TEAM_COLORS[team] }]}>
                                        {progress.current}/{progress.required}
                                    </Text>
                                    {progress.extraInfo && (
                                        <Text style={[styles.teamProgressExtra, { color: TEAM_COLORS[team] }]}>
                                            {progress.extraInfo}
                                        </Text>
                                    )}
                                </View>
                            </View>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            backgroundColor: TEAM_COLORS[team],
                                            width: `${progress.percentage}%`
                                        }
                                    ]}
                                />
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search characters..."
                    placeholderTextColor={Colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Team Filter */}
            <View style={styles.teamFilter}>
                <TouchableOpacity
                    style={[
                        styles.teamButton,
                        selectedTeam === 'all' && styles.teamButtonActive,
                        { borderColor: Colors.border }
                    ]}
                    onPress={() => setSelectedTeam('all')}
                >
                    <Text style={[styles.teamButtonText, selectedTeam === 'all' && styles.teamButtonTextActive]}>
                        All
                    </Text>
                </TouchableOpacity>
                {(['townsfolk', 'outsider', 'minion', 'demon'] as Team[]).map(team => (
                    <TouchableOpacity
                        key={team}
                        style={[
                            styles.teamButton,
                            selectedTeam === team && styles.teamButtonActive,
                            { borderColor: TEAM_COLORS[team] }
                        ]}
                        onPress={() => setSelectedTeam(team)}
                    >
                        <Text style={[
                            styles.teamButtonText,
                            selectedTeam === team && { color: TEAM_COLORS[team] }
                        ]}>
                            {team.charAt(0).toUpperCase() + team.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Character List */}
            <ScrollView style={styles.characterList} contentContainerStyle={styles.characterListContent}>
                {filteredCharacters.map(character => {
                    const isSelected = gameState.selectedCharacters.some(c => c.id === character.id);

                    // Check if this character is being impersonated by a drunk
                    const isImpersonatedByDrunk = Object.values(gameState.drunkImpersonations).some(impersonated =>
                        impersonated.id === character.id
                    );

                    return (
                        <TouchableOpacity
                            key={character.id}
                            style={[
                                styles.characterCard,
                                { borderLeftColor: TEAM_COLORS[character.team] },
                                isSelected && [
                                    styles.characterCardSelected,
                                    isImpersonatedByDrunk && { borderColor: '#ffa502' } // Orange for selected impersonated townsfolk
                                ]
                            ]}
                            onPress={() => canSelectCharacter(character) && handleSelectCharacter(character)}
                            disabled={isSelected || !canSelectCharacter(character)}
                        >
                            <View style={styles.characterHeader}>
                                <View style={styles.characterInfo}>
                                    <Image source={character.icon} style={styles.characterIcon} />
                                    <View style={styles.characterText}>
                                        <View style={styles.characterNameRow}>
                                            <Text style={[
                                                styles.characterName,
                                                isSelected && styles.characterNameSelected,
                                                isImpersonatedByDrunk && styles.characterNameImpersonated
                                            ]}>
                                                {character.name}
                                                {isImpersonatedByDrunk && <Text style={styles.drunkNote}> as drunk</Text>}
                                            </Text>
                                            {isSelected && !isImpersonatedByDrunk && (
                                                <TouchableOpacity
                                                    style={styles.removeButton}
                                                    onPress={() => handleRemoveCharacter(character.id)}
                                                >
                                                    <Text style={styles.removeButtonText}>Remove</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                        <Text style={[styles.characterAbility, isSelected && styles.characterAbilitySelected]}>
                                            {character.ability}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.teamBadgeContainer}>
                                    <View style={[
                                        styles.teamBadge,
                                        { backgroundColor: TEAM_COLORS[character.team] }
                                    ]}>
                                        <Text style={styles.teamBadgeText}>
                                            {character.team.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Start Game Button */}
            {gameState.selectedCharacters.length > 0 && (
                <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
                    <Text style={styles.startButtonText}>Assign Players</Text>
                </TouchableOpacity>
            )}

            {/* Drunk Selection Modal */}
            <Modal
                visible={isDrunkModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsDrunkModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Choose Drunk&apos;s Identity</Text>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setIsDrunkModalVisible(false)}
                            >
                                <Text style={styles.modalCloseText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            The drunk will think they are this townsfolk character:
                        </Text>

                        <ScrollView style={styles.drunkSelectionList} showsVerticalScrollIndicator={false}>
                            {availableTownsfolkForDrunk.map(townsfolk => (
                                <TouchableOpacity
                                    key={townsfolk.id}
                                    style={styles.drunkOption}
                                    onPress={() => handleDrunkImpersonationSelect(townsfolk)}
                                >
                                    <View style={styles.drunkOptionContent}>
                                        <Image source={townsfolk.icon} style={styles.drunkOptionIcon} />
                                        <View style={styles.drunkOptionText}>
                                            <Text style={styles.drunkOptionName}>{townsfolk.name}</Text>
                                            <Text style={styles.drunkOptionAbility}>{townsfolk.ability}</Text>
                                        </View>
                                        <View style={styles.drunkOptionArrow}>
                                            <Text style={styles.drunkOptionArrowText}>→</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
            {/* Settings Modal */}
            <Modal
                visible={isSettingsModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsSettingsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Settings</Text>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setIsSettingsModalVisible(false)}
                            >
                                <Text style={styles.modalCloseText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.settingsOption}>
                            <Text style={styles.settingsOptionTitle}>House Rules</Text>
                            <View style={styles.toggleContainer}>
                                <Text style={styles.toggleLabel}>Ignore distribution restrictions</Text>
                                <Switch
                                    value={ignoreDistributionRules}
                                    onValueChange={setIgnoreDistributionRules}
                                    trackColor={{ false: Colors.border, true: Colors.primary }}
                                    thumbColor={ignoreDistributionRules ? Colors.text : Colors.textSecondary}
                                />
                            </View>
                            <Text style={styles.settingsOptionDescription}>
                                When enabled, only checks that the correct number of players are selected, not the team distribution.
                            </Text>
                        </View>
                    </View>
                </View>
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
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: 15,
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
        flex: 1,
        textAlign: 'center',
    },
    settingsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsButtonText: {
        fontSize: 20,
        color: Colors.text,
    },
    playerCountSection: {
        padding: 12,
        backgroundColor: Colors.surfaceDark,
        alignItems: 'center',
    },
    playerCountText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    teamProgressSection: {
        padding: 10,
        backgroundColor: Colors.surfaceDark,
    },
    teamProgressItem: {
        marginBottom: 8,
    },
    teamProgressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    teamProgressLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    teamProgressCount: {
        fontSize: 14,
        fontWeight: '600',
    },
    teamProgressCountContainer: {
        alignItems: 'flex-end',
    },
    teamProgressExtra: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },
    progressBar: {
        height: 6,
        backgroundColor: Colors.surface,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    searchContainer: {
        padding: 6,
        backgroundColor: Colors.surfaceDark,
    },
    searchInput: {
        backgroundColor: Colors.surface,
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    teamFilter: {
        backgroundColor: Colors.surfaceDark,
        paddingHorizontal: 15,
        paddingVertical: 6,
        flexDirection: 'row',
    },
    teamButton: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 18,
        borderWidth: 2,
        marginRight: 8,
        backgroundColor: Colors.surface,
        height: 32,
    },
    teamButtonActive: {
        backgroundColor: Colors.surfaceLight,
        height: 32,
    },
    teamButtonText: {
        color: Colors.textMuted,
        fontSize: 13,
        fontWeight: '600',
    },
    teamButtonTextActive: {
        color: Colors.text,
    },
    characterList: {
        flex: 1,
    },
    characterListContent: {
        padding: 10,
    },
    characterCard: {
        backgroundColor: Colors.surface,
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        borderLeftWidth: 4,
    },
    characterCardSelected: {
        backgroundColor: Colors.surfaceLight,
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    characterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    characterInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
        marginRight: 10,
    },
    characterText: {
        flex: 1,
    },
    characterNameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    characterIcon: {
        width: 32,
        height: 32,
        marginRight: 12,
        borderRadius: 16,
    },
    characterName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 2,
        flex: 1,
    },
    characterNameSelected: {
        color: Colors.primary,
    },
    characterNameImpersonated: {
        color: '#ffa502',
    },
    teamBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    teamBadgeText: {
        color: Colors.text,
        fontSize: 12,
        fontWeight: 'bold',
    },
    characterAbility: {
        fontSize: 12,
        color: Colors.textSecondary,
        lineHeight: 16,
    },
    characterAbilitySelected: {
        color: Colors.text,
    },
    teamBadgeContainer: {
        alignItems: 'flex-end',
    },
    removeButton: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        backgroundColor: Colors.danger,
        borderRadius: 10,
        marginLeft: 8,
    },
    removeButtonText: {
        color: Colors.text,
        fontSize: 11,
        fontWeight: '600',
    },
    startButton: {
        backgroundColor: Colors.primary,
        borderRadius: 15,
        padding: 20,
        margin: 20,
        alignItems: 'center',
    },
    startButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    startButtonDisabled: {
        backgroundColor: Colors.border,
    },
    startButtonTextDisabled: {
        color: Colors.textMuted,
    },
    warningContainer: {
        backgroundColor: Colors.warning,
        padding: 12,
        margin: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    warningText: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    drunkSelectionList: {
        maxHeight: 300,
        marginBottom: 20,
    },
    drunkOption: {
        backgroundColor: Colors.surfaceLight,
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
    },
    drunkOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    drunkOptionIcon: {
        width: 32,
        height: 32,
        marginRight: 12,
        borderRadius: 16,
    },
    drunkOptionText: {
        flex: 1,
    },
    drunkOptionName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 4,
    },
    drunkOptionAbility: {
        fontSize: 12,
        color: Colors.textSecondary,
        lineHeight: 16,
    },
    // Improved Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    modalCloseButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
        paddingTop: 15,
    },
    // Settings Modal Styles
    settingsOption: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    settingsOptionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 12,
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    toggleLabel: {
        fontSize: 14,
        color: Colors.text,
        flex: 1,
    },
    settingsOptionDescription: {
        fontSize: 12,
        color: Colors.textMuted,
        lineHeight: 16,
    },
});
