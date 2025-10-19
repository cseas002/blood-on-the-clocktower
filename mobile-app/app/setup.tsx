import { StyleSheet, View, ScrollView, TouchableOpacity, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Colors } from "../constants/Colors";
import Slider from '@react-native-community/slider';

// Character distribution based on player count (Trouble Brewing)
const CHARACTER_DISTRIBUTION: Record<number, { townsfolk: number; outsider: number; minion: number; demon: number }> = {
  5: { townsfolk: 3, outsider: 0, minion: 1, demon: 1 },
  6: { townsfolk: 3, outsider: 1, minion: 1, demon: 1 },
  7: { townsfolk: 5, outsider: 0, minion: 1, demon: 1 },
  8: { townsfolk: 5, outsider: 1, minion: 1, demon: 1 },
  9: { townsfolk: 5, outsider: 2, minion: 1, demon: 1 },
  10: { townsfolk: 7, outsider: 0, minion: 2, demon: 1 },
  11: { townsfolk: 7, outsider: 1, minion: 2, demon: 1 },
  12: { townsfolk: 7, outsider: 2, minion: 2, demon: 1 },
  13: { townsfolk: 9, outsider: 0, minion: 3, demon: 1 },
  14: { townsfolk: 9, outsider: 1, minion: 3, demon: 1 },
  15: { townsfolk: 9, outsider: 2, minion: 3, demon: 1 },
};

export default function SetupScreen() {
  const router = useRouter();
  const [playerCount, setPlayerCount] = useState(7);

  const distribution = CHARACTER_DISTRIBUTION[playerCount] || CHARACTER_DISTRIBUTION[7];

  const handleStartGame = () => {
    // Navigate to tabs (grimoire) and the grimoire will use this player count
    router.push({
      pathname: "/(tabs)",
      params: { playerCount: playerCount.toString() }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Game Setup</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Character Distribution Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Character Distribution</Text>
          <View style={styles.distributionTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.tableHeaderLabel]}>Players</Text>
              {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(count => (
                <Text
                  key={count}
                  style={[
                    styles.tableHeaderText,
                    playerCount === count && styles.tableHeaderTextActive
                  ]}
                >
                  {count}
                </Text>
              ))}
            </View>

            {/* Townsfolk Row */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableCellLabel, { color: Colors.townsfolk }]}>
                Townsfolk
              </Text>
              {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(count => (
                <Text
                  key={count}
                  style={[
                    styles.tableCell,
                    { color: Colors.townsfolk },
                    playerCount === count && styles.tableCellActive
                  ]}
                >
                  {CHARACTER_DISTRIBUTION[count].townsfolk}
                </Text>
              ))}
            </View>

            {/* Outsiders Row */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableCellLabel, { color: Colors.outsider }]}>
                Outsiders
              </Text>
              {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(count => (
                <Text
                  key={count}
                  style={[
                    styles.tableCell,
                    { color: Colors.outsider },
                    playerCount === count && styles.tableCellActive
                  ]}
                >
                  {CHARACTER_DISTRIBUTION[count].outsider}
                </Text>
              ))}
            </View>

            {/* Minions Row */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableCellLabel, { color: Colors.minion }]}>
                Minions
              </Text>
              {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(count => (
                <Text
                  key={count}
                  style={[
                    styles.tableCell,
                    { color: Colors.minion },
                    playerCount === count && styles.tableCellActive
                  ]}
                >
                  {CHARACTER_DISTRIBUTION[count].minion}
                </Text>
              ))}
            </View>

            {/* Demons Row */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableCellLabel, { color: Colors.demon }]}>
                Demons
              </Text>
              {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(count => (
                <Text
                  key={count}
                  style={[
                    styles.tableCell,
                    { color: Colors.demon },
                    playerCount === count && styles.tableCellActive
                  ]}
                >
                  {CHARACTER_DISTRIBUTION[count].demon}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* Player Count Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Number of Players</Text>
          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={5}
              maximumValue={15}
              step={1}
              value={playerCount}
              onValueChange={setPlayerCount}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.accent}
            />
            <Text style={styles.playerCountText}>{playerCount}</Text>
          </View>

          {/* Distribution Summary */}
          <View style={styles.distributionSummary}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: Colors.townsfolk }]}>Townsfolk</Text>
              <Text style={[styles.summaryValue, { color: Colors.townsfolk }]}>{distribution.townsfolk}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: Colors.outsider }]}>Outsiders</Text>
              <Text style={[styles.summaryValue, { color: Colors.outsider }]}>{distribution.outsider}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: Colors.minion }]}>Minions</Text>
              <Text style={[styles.summaryValue, { color: Colors.minion }]}>{distribution.minion}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: Colors.demon }]}>Demons</Text>
              <Text style={[styles.summaryValue, { color: Colors.demon }]}>{distribution.demon}</Text>
            </View>
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.accent,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.accent,
    marginBottom: 15,
  },
  distributionTable: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    paddingBottom: 10,
    marginBottom: 10,
  },
  tableHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  tableHeaderLabel: {
    flex: 1.2,
    textAlign: 'left',
    color: Colors.text,
  },
  tableHeaderTextActive: {
    color: Colors.accent,
    fontSize: 15,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceDark,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  tableCellLabel: {
    flex: 1.2,
    textAlign: 'left',
    fontSize: 15,
    fontWeight: 'bold',
  },
  tableCellActive: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sliderContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  playerCountText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.accent,
    textAlign: 'center',
    marginTop: 10,
  },
  distributionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    marginBottom: 5,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  startButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.accent,
  },
});
