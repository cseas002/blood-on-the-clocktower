import { StyleSheet, View, ScrollView, TouchableOpacity, Text, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import { troubleBrewingCharacters } from "../data/characters";
import { Team } from "../types/game";

const TEAM_COLORS: Record<Team, string> = {
  townsfolk: '#4ecca3',
  outsider: '#45aaf2',
  minion: '#e94560',
  demon: '#8b0000',
  traveler: '#ffa502',
};

export default function ReferenceScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<Team | 'all'>('all');
  const [expandedCharacter, setExpandedCharacter] = useState<string | null>(null);

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
          <Text style={styles.title}>Character Reference</Text>
          <Text style={styles.subtitle}>Trouble Brewing</Text>
        </View>
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
              expandedCharacter === character.id && styles.characterCardExpanded
            ]}
            onPress={() => setExpandedCharacter(
              expandedCharacter === character.id ? null : character.id
            )}
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

            {expandedCharacter === character.id && (
              <View style={styles.expandedContent}>
                {character.firstNightReminder && (
                  <View style={styles.nightReminderSection}>
                    <Text style={styles.nightReminderTitle}>First Night:</Text>
                    <Text style={styles.nightReminderText}>
                      {character.firstNightReminder}
                    </Text>
                    {character.firstNightOrder && (
                      <Text style={styles.nightOrderText}>
                        Order: {character.firstNightOrder}
                      </Text>
                    )}
                  </View>
                )}
                {character.otherNightReminder && (
                  <View style={styles.nightReminderSection}>
                    <Text style={styles.nightReminderTitle}>Other Nights:</Text>
                    <Text style={styles.nightReminderText}>
                      {character.otherNightReminder}
                    </Text>
                    {character.otherNightOrder && (
                      <Text style={styles.nightOrderText}>
                        Order: {character.otherNightOrder}
                      </Text>
                    )}
                  </View>
                )}
                {character.reminders && character.reminders.length > 0 && (
                  <View style={styles.remindersListSection}>
                    <Text style={styles.remindersListTitle}>Reminder Tokens:</Text>
                    <View style={styles.remindersList}>
                      {character.reminders.map((reminder, index) => (
                        <View key={index} style={styles.reminderToken}>
                          <Text style={styles.reminderTokenText}>{reminder}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {character.setup && (
                  <View style={styles.setupBadgeContainer}>
                    <View style={styles.setupBadge}>
                      <Text style={styles.setupBadgeText}>Setup Character</Text>
                    </View>
                  </View>
                )}
              </View>
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
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#16213e',
    borderBottomWidth: 2,
    borderBottomColor: '#e94560',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 32,
    color: '#e94560',
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e94560',
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 4,
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#0f3460',
  },
  searchInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#ffffff',
  },
  teamFilter: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  teamButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 10,
    backgroundColor: '#1a1a2e',
  },
  teamButtonActive: {
    backgroundColor: '#16213e',
  },
  teamButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  teamButtonTextActive: {
    color: '#ffffff',
  },
  characterList: {
    flex: 1,
  },
  characterListContent: {
    padding: 15,
  },
  characterCard: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
  },
  characterCardExpanded: {
    backgroundColor: '#1a2840',
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
    color: '#ffffff',
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
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  characterAbility: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
  expandedContent: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
  },
  nightReminderSection: {
    marginBottom: 15,
  },
  nightReminderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4ecca3',
    marginBottom: 5,
  },
  nightReminderText: {
    fontSize: 13,
    color: '#aaaaaa',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  nightOrderText: {
    fontSize: 12,
    color: '#ffa502',
    marginTop: 3,
  },
  remindersListSection: {
    marginTop: 10,
  },
  remindersListTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffa502',
    marginBottom: 8,
  },
  remindersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reminderToken: {
    backgroundColor: '#0f3460',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ffa502',
  },
  reminderTokenText: {
    color: '#ffa502',
    fontSize: 12,
    fontWeight: '600',
  },
  setupBadgeContainer: {
    marginTop: 10,
    alignItems: 'flex-start',
  },
  setupBadge: {
    backgroundColor: '#e94560',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  setupBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
