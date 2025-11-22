import React, { useRef } from 'react';
import { Dimensions, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';

// Utility function for className (if using NativeWind, otherwise ignore or map manually)
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

const { height, width } = Dimensions.get('window');

interface ScrollAreaProps {
  className?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

function ScrollArea({ className, children, style, ...props }: ScrollAreaProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <View style={[styles.scrollArea, style]} {...props}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.viewport}
      >
        {children}
      </ScrollView>
      <ScrollBar orientation="vertical" scrollViewRef={scrollViewRef} />
    </View>
  );
}

interface ScrollBarProps {
  className?: string;
  orientation?: 'vertical' | 'horizontal';
  scrollViewRef?: React.RefObject<ScrollView | null>;
  style?: ViewStyle;
}

function ScrollBar({ className, orientation = 'vertical', scrollViewRef, style, ...props }: ScrollBarProps) {
  const thumbPosition = useSharedValue(0);
  const thumbSize = useSharedValue(50);
  const isScrolling = useSharedValue(false);

  // Função para fazer o scroll
  const scrollTo = (position: number) => {
    if (scrollViewRef?.current) {
      if (orientation === 'vertical') {
        scrollViewRef.current.scrollTo({ y: position, animated: false });
      } else {
        scrollViewRef.current.scrollTo({ x: position, animated: false });
      }
    }
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isScrolling.value = true;
    })
    .onUpdate((event) => {
      if (orientation === 'vertical') {
        // Atualiza a posição do thumb com limites
        const newPosition = thumbPosition.value + event.translationY;
        thumbPosition.value = Math.max(0, newPosition);
        
        // Calcula a posição do scroll (ajuste o multiplicador conforme necessário)
        const scrollPosition = thumbPosition.value * 10;
        runOnJS(scrollTo)(scrollPosition);
      } else {
        const newPosition = thumbPosition.value + event.translationX;
        thumbPosition.value = Math.max(0, newPosition);
        
        const scrollPosition = thumbPosition.value * 10;
        runOnJS(scrollTo)(scrollPosition);
      }
    })
    .onEnd(() => {
      isScrolling.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      orientation === 'vertical'
        ? { translateY: thumbPosition.value }
        : { translateX: thumbPosition.value },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.scrollbar,
          orientation === 'vertical' ? styles.verticalScrollbar : styles.horizontalScrollbar,
          style,
        ]}
        {...props}
      >
        <Animated.View
          style={[
            styles.thumb,
            orientation === 'vertical' ? 
              { height: thumbSize.value } : 
              { width: thumbSize.value },
            animatedStyle,
          ]}
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  scrollArea: {
    position: 'relative',
    flex: 1,
  },
  viewport: {
    flexGrow: 1,
    borderRadius: 4,
  },
  scrollbar: {
    position: 'absolute',
    backgroundColor: 'transparent',
    padding: 1,
  },
  verticalScrollbar: {
    right: 0,
    top: 0,
    bottom: 0,
    width: 10,
    borderLeftWidth: 1,
    borderLeftColor: 'transparent',
  },
  horizontalScrollbar: {
    bottom: 0,
    left: 0,
    right: 0,
    height: 10,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
    flexDirection: 'row',
  },
  thumb: {
    backgroundColor: '#e5e7eb',
    borderRadius: 9999,
    flex: 1,
  },
});

export { ScrollArea, ScrollBar };
