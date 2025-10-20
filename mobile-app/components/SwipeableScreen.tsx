import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';

interface SwipeableScreenProps {
  children: React.ReactNode;
  currentTab: 'index' | 'characters' | 'night-order' | 'settings';
}

const TAB_ORDER = ['index', 'characters', 'night-order', 'settings'];

export function SwipeableScreen({ children, currentTab }: SwipeableScreenProps) {
  const router = useRouter();

  const getCurrentTabIndex = () => TAB_ORDER.indexOf(currentTab);

  const navigateToTab = (direction: 'left' | 'right') => {
    const currentIndex = getCurrentTabIndex();
    let nextIndex = currentIndex;

    if (direction === 'left' && currentIndex < TAB_ORDER.length - 1) {
      nextIndex = currentIndex + 1;
    } else if (direction === 'right' && currentIndex > 0) {
      nextIndex = currentIndex - 1;
    }

    if (nextIndex !== currentIndex) {
      const nextTab = TAB_ORDER[nextIndex];
      router.push(`/(tabs)/${nextTab === 'index' ? '' : nextTab}`);
    }
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-10, 10])
    .onEnd((event) => {
      const swipeThreshold = 75;
      const velocity = event.velocityX;

      if (Math.abs(event.translationX) > swipeThreshold || Math.abs(velocity) > 500) {
        if (event.translationX > 0) {
          // Swipe right - go to previous tab
          navigateToTab('right');
        } else {
          // Swipe left - go to next tab
          navigateToTab('left');
        }
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        {children}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
