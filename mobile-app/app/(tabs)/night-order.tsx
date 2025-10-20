import { StyleSheet, View, ScrollView, TouchableOpacity, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useState, useMemo } from "react";
import { useGame } from "../../context/GameContext";
import { Character } from "../../types/game";

type NightPhase = 'first' | 'other';

export default function NightOrderScreen() {
  const { gameState } = useGame();
  const [nightPhase, setNightPhase] = useState<NightPhase>('first');

  const nightOrder = useMemo(() => {
    const characters: Array<{ character: Character; playerName: string; isDead: boolean }> = [];

    gameState.players.forEach(player => {
      if (player.character) {
        const orderNumber = nightPhase === 'first'
          ? player.character.firstNightOrder
          : player.character.otherNightOrder;

        if (orderNumber !== undefined) {
          characters.push({
            character: player.character,
            playerName: player.name,
            isDead: player.isDead,
          });
        }
      }
    });

    // Sort by night order
    characters.sort((a, b) => {
      const orderA = nightPhase === 'first'
        ? a.character.firstNightOrder || 999
        : a.character.otherNightOrder || 999;
      const orderB = nightPhase === 'first'
        ? b.character.firstNightOrder || 999
        : b.character.otherNightOrder || 999;
      return orderA - orderB;
    });

    return characters;
  }, [gameState.players, nightPhase]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Night Order</Text>
        <Text style={styles.subtitle}>Track night actions</Text>
      </View>

      {/* Phase Toggle */}
      <View style={styles.phaseToggle}>
        <TouchableOpacity
          style={[
            styles.phaseButton,
            nightPhase === 'first' && styles.phaseButtonActive
          ]}
          onPress={() => setNightPhase('first')}
        >
          <Text style={[
            styles.phaseButtonText,
            nightPhase === 'first' && styles.phaseButtonTextActive
          ]}>
            First Night
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.phaseButton,
            nightPhase === 'other' && styles.phaseButtonActive
          ]}
          onPress={() => setNightPhase('other')}
        >
          <Text style={[
            styles.phaseButtonText,
            nightPhase === 'other' && styles.phaseButtonTextActive
          ]}>
            Other Nights
          </Text>
        </TouchableOpacity>
      </View>

      {/* Night Order List */}
      <ScrollView style={styles.orderList} contentContainerStyle={styles.orderListContent}>
        {nightOrder.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No characters with night actions</Text>
            <Text style={styles.emptyStateSubtext}>
              Assign characters to players to see the night order
            </Text>
          </View>
        ) : (
          nightOrder.map((item, index) => (
            <View
              key={`${item.character.id}-${item.playerName}`}
              style={[
                styles.orderItem,
                item.isDead && styles.orderItemDead
              ]}
            >
              <View style={styles.orderNumber}>
                <Text style={styles.orderNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.orderContent}>
                <View style={styles.orderHeader}>
                  <Text style={styles.characterName}>
                    {item.character.name}
                  </Text>
                  <Text style={styles.playerName}>
                    ({item.playerName})
                  </Text>
                  {item.isDead && (
                    <Text style={styles.deadBadge}>☠</Text>
                  )}
                </View>
                <Text style={styles.reminderText}>
                  {nightPhase === 'first'
                    ? item.character.firstNightReminder
                    : item.character.otherNightReminder}
                </Text>
              </View>
            </View>
          ))
        )}
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#16213e',
    borderBottomWidth: 2,
    borderBottomColor: '#e94560',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e94560',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 4,
  },
  phaseToggle: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#0f3460',
    gap: 10,
  },
  phaseButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#667',
  },
  phaseButtonActive: {
    backgroundColor: '#16213e',
    borderColor: '#e94560',
  },
  phaseButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  phaseButtonTextActive: {
    color: '#e94560',
  },
  orderList: {
    flex: 1,
  },
  orderListContent: {
    padding: 15,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    color: '#888',
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#667',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  orderItem: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  orderItemDead: {
    opacity: 0.5,
  },
  orderNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  orderNumberText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  orderContent: {
    flex: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  characterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  playerName: {
    fontSize: 14,
    color: '#4ecca3',
  },
  deadBadge: {
    fontSize: 16,
    marginLeft: 'auto',
  },
  reminderText: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
});
