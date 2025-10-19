import { StyleSheet, View, ScrollView, TouchableOpacity, Text, TextInput } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useMemo } from "react";
import { troubleBrewingCharacters } from "../data/characters";
import { Character, Team } from "../types/game";
import { useGame } from "../context/GameContext";
import { Colors, TEAM_COLORS } from "../constants/Colors";

export default function AssignCharacterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const playerId = params.playerId as string;
  const { assignCharacter, gameState } = useGame();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<Team | 'all'>('all');

  const player = gameState.players.find(p => p.id === playerId);

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

  const handleSelectCharacter = (character: Character) => {
    if (playerId) {
      assignCharacter(playerId, character);
      router.back();
    }
  };

  const teamCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: troubleBrewingCharacters.length,
    };

    troubleBrewingCharacters.forEach(char => {
      counts[char.team] = (counts[char.team] || 0) + 1;
    });

    return counts;
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Select Character</Text>
          {player && <Text style={styles.subtitle}>for {player.name}</Text>}
        </View>
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamFilter}>
        <TouchableOpacity
          style={[
            styles.teamButton,
            selectedTeam === 'all' && styles.teamButtonActive,
            { borderColor: Colors.border }
          ]}
          onPress={() => setSelectedTeam('all')}
        >
          <Text style={[styles.teamButtonText, selectedTeam === 'all' && styles.teamButtonTextActive]}>
            All ({teamCounts.all})
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
              {team.charAt(0).toUpperCase() + team.slice(1)} ({teamCounts[team] || 0})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Character List */}
      <ScrollView style={styles.characterList} contentContainerStyle={styles.characterListContent}>
        {filteredCharacters.map(character => (
          <TouchableOpacity
            key={character.id}
            style={[
              styles.characterCard,
              { borderLeftColor: TEAM_COLORS[character.team] }
            ]}
            onPress={() => handleSelectCharacter(character)}
          >
            <View style={styles.characterHeader}>
              <Text style={styles.characterName}>{character.name}</Text>
              <View style={[
                styles.teamBadge,
                { backgroundColor: TEAM_COLORS[character.team] }
              ]}>
                <Text style={styles.teamBadgeText}>
                  {character.team.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.characterAbility}>{character.ability}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.accent,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 4,
  },
  searchContainer: {
    padding: 15,
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
    paddingBottom: 15,
  },
  teamButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 10,
    backgroundColor: Colors.surface,
  },
  teamButtonActive: {
    backgroundColor: Colors.surfaceLight,
  },
  teamButtonText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  teamButtonTextActive: {
    color: Colors.text,
  },
  characterList: {
    flex: 1,
  },
  characterListContent: {
    padding: 15,
  },
  characterCard: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
  },
  characterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  characterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  teamBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamBadgeText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  characterAbility: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
