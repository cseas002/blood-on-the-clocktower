import { StyleSheet, View, ScrollView, TouchableOpacity, Text, TextInput, Image } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState, useMemo } from "react";
import { troubleBrewingCharacters } from "../../data/characters";
import { Character, Team } from "../../types/game";
import { Colors, TEAM_COLORS } from "../../constants/Colors";

export default function CharactersScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<Team | 'all'>('all');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

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
    setSelectedCharacter(selectedCharacter?.id === character.id ? null : character);
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
      <StatusBar style="light" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Characters</Text>
        <Text style={styles.subtitle}>Trouble Brewing Edition</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search characters..."
          placeholderTextColor="#888"
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
            { borderColor: '#888' }
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
              { borderLeftColor: TEAM_COLORS[character.team] },
              selectedCharacter?.id === character.id && styles.characterCardSelected
            ]}
            onPress={() => handleSelectCharacter(character)}
          >
            <View style={styles.characterHeader}>
              <Image source={character.icon} style={styles.characterIcon} />
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
            {selectedCharacter?.id === character.id && (
              <>
                {character.firstNightReminder && (
                  <View style={styles.nightSection}>
                    <Text style={styles.nightTitle}>First Night:</Text>
                    <Text style={styles.reminderText}>{character.firstNightReminder}</Text>
                    {character.firstNightOrder && (
                      <Text style={styles.orderText}>Order: {character.firstNightOrder}</Text>
                    )}
                  </View>
                )}
                {character.otherNightReminder && (
                  <View style={styles.nightSection}>
                    <Text style={styles.nightTitle}>Other Nights:</Text>
                    <Text style={styles.reminderText}>{character.otherNightReminder}</Text>
                    {character.otherNightOrder && (
                      <Text style={styles.orderText}>Order: {character.otherNightOrder}</Text>
                    )}
                  </View>
                )}
                {character.reminders && character.reminders.length > 0 && (
                  <View style={styles.reminderTokensSection}>
                    <Text style={styles.nightTitle}>Reminder Tokens:</Text>
                    <View style={styles.reminderTokensList}>
                      {character.reminders.map((reminder, idx) => (
                        <View key={idx} style={styles.reminderToken}>
                          <Text style={styles.reminderTokenText}>{reminder}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.accent,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 4,
    textAlign: 'center',
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
    maxHeight: 60,
  },
  teamButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 10,
    backgroundColor: Colors.surface,
    height: 40,
    justifyContent: 'center',
  },
  teamButtonActive: {
    backgroundColor: Colors.surfaceLight,
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
    padding: 15,
    paddingBottom: 100,
  },
  characterCard: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
  },
  characterCardSelected: {
    backgroundColor: Colors.surfaceLight,
  },
  characterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  characterIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  characterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  teamBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamBadgeText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  characterAbility: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  nightSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nightTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 5,
  },
  reminderText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  orderText: {
    fontSize: 11,
    color: Colors.accent,
    marginTop: 3,
  },
  reminderTokensSection: {
    marginTop: 12,
  },
  reminderTokensList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 5,
  },
  reminderToken: {
    backgroundColor: Colors.surfaceDark,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  reminderTokenText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '600',
  },
});
