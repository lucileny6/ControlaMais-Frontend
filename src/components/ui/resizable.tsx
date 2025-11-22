import { GripVerticalIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';

// Utility function for className
const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

interface ResizablePanelGroupProps {
  className?: string;
  direction?: 'horizontal' | 'vertical';
  children: React.ReactNode;
  style?: ViewStyle;
}

function ResizablePanelGroup({ className, direction = 'horizontal', children, style, ...props }: ResizablePanelGroupProps) {
  return (
    <View
      style={[
        styles.group,
        direction === 'vertical' ? styles.vertical : styles.horizontal,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

interface ResizablePanelProps {
  children: React.ReactNode;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  style?: ViewStyle;
}

function ResizablePanel({ children, defaultSize = 1, minSize = 0, maxSize = 100, style, ...props }: ResizablePanelProps) {
  return (
    <View style={[styles.panel, { flex: defaultSize }, style]} {...props}>
      {children}
    </View>
  );
}

interface ResizableHandleProps {
  withHandle?: boolean;
  className?: string;
  onResize?: (delta: number) => void;
  direction?: 'horizontal' | 'vertical';
  style?: ViewStyle;
}

function ResizableHandle({ withHandle, className, onResize, direction = 'horizontal', style, ...props }: ResizableHandleProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (direction === 'horizontal') {
        translateX.value = startX.value + event.translationX;
        if (onResize) {
          runOnJS(onResize)(event.translationX);
        }
      } else {
        translateY.value = startY.value + event.translationY;
        if (onResize) {
          runOnJS(onResize)(event.translationY);
        }
      }
    })
    .onEnd(() => {
      // Optional: snap or reset logic here
      // Reset translation if needed:
      // translateX.value = 0;
      // translateY.value = 0;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.handle,
          direction === 'vertical' ? styles.verticalHandle : styles.horizontalHandle,
          animatedStyle,
          style,
        ]}
        {...props}
      >
        {withHandle && (
          <View style={styles.handleIcon}>
            <GripVerticalIcon size={10} />
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  group: {
    flex: 1,
  },
  horizontal: {
    flexDirection: 'row',
  },
  vertical: {
    flexDirection: 'column',
  },
  panel: {
    // Flex is set dynamically
  },
  handle: {
    backgroundColor: '#e5e7eb',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  horizontalHandle: {
    width: 1,
    height: '100%',
  },
  verticalHandle: {
    height: 1,
    width: '100%',
  },
  handleIcon: {
    backgroundColor: '#e5e7eb',
    zIndex: 10,
    height: 16,
    width: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
});

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
