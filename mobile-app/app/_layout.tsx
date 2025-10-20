import { Stack } from "expo-router";
import { GameProvider } from "../context/GameContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GameProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </GameProvider>
    </GestureHandlerRootView>
  );
}
