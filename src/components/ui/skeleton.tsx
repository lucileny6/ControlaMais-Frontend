import React from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

// Tipos
interface SkeletonProps {
  className?: string;
  style?: any;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
  children?: React.ReactNode;
}

function Skeleton({
  className,
  style,
  width = '100%',
  height = 20,
  borderRadius = 4,
  variant = 'text',
  animation = 'pulse',
  children,
  ...props
}: SkeletonProps) {
  const pulseAnim = React.useRef(new Animated.Value(0.5)).current;
  const waveAnim = React.useRef(new Animated.Value(0)).current;

  // Animação de pulse
  React.useEffect(() => {
    if (animation === 'pulse') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    }
  }, [animation, pulseAnim]);

  // Animação de wave
  React.useEffect(() => {
    if (animation === 'wave') {
      const waveAnimation = Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      waveAnimation.start();

      return () => waveAnimation.stop();
    }
  }, [animation, waveAnim]);

  // Estilo base baseado na variante
  const getBaseStyle = () => {
    const baseStyle = {
      width,
      height,
      borderRadius,
      backgroundColor: '#E5E7EB',
    };

    switch (variant) {
      case 'circular':
        return {
          ...baseStyle,
          borderRadius: typeof height === 'number' ? height / 2 : 9999,
        };
      case 'rectangular':
        return baseStyle;
      case 'text':
      default:
        return {
          ...baseStyle,
          borderRadius: 4,
        };
    }
  };

  // Estilo de animação
  const getAnimationStyle = () => {
    switch (animation) {
      case 'pulse':
        return {
          opacity: pulseAnim,
        };
      case 'wave':
        const translateX = waveAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-100, 100],
        });
        return {
          overflow: 'hidden',
          position: 'relative' as const,
        };
      case 'none':
      default:
        return {};
    }
  };

  // Componente de onda para a animação wave
  const WaveOverlay = () => {
    if (animation !== 'wave') return null;

    return (
      <Animated.View
        style={[
          styles.waveOverlay,
          {
            transform: [
              {
                translateX: waveAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 100],
                }),
              },
            ],
          },
        ]}
      />
    );
  };

  if (children) {
    return (
      <View style={[getBaseStyle(), style]} {...props}>
        {animation === 'wave' && <WaveOverlay />}
        {children}
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        getBaseStyle(),
        getAnimationStyle(),
        style,
      ]}
      {...props}
    >
      {animation === 'wave' && <WaveOverlay />}
    </Animated.View>
  );
}

// Componente Skeleton para casos de uso comuns

// Skeleton de texto
interface TextSkeletonProps extends Omit<SkeletonProps, 'variant' | 'height'> {
  lines?: number;
  lineHeight?: number;
  spacing?: number;
}

function TextSkeleton({
  lines = 1,
  lineHeight = 16,
  spacing = 8,
  style,
  ...props
}: TextSkeletonProps) {
  if (lines === 1) {
    return (
      <Skeleton
        variant="text"
        height={lineHeight}
        style={style}
        {...props}
      />
    );
  }

  return (
    <View style={[{ gap: spacing }, style]}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          variant="text"
          height={lineHeight}
          // A última linha pode ser mais curta (opcional)
          width={index === lines - 1 ? '60%' : '100%'}
          {...props}
        />
      ))}
    </View>
  );
}

// Skeleton de avatar
function AvatarSkeleton({
  size = 40,
  style,
  ...props
}: Omit<SkeletonProps, 'variant' | 'width' | 'height'> & { size?: number }) {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      style={style}
      {...props}
    />
  );
}

// Skeleton de card
function CardSkeleton({
  style,
  ...props
}: Omit<SkeletonProps, 'variant' | 'height'>) {
  return (
    <View style={[styles.card, style]}>
      <Skeleton variant="rectangular" height={200} {...props} />
      <View style={styles.cardContent}>
        <TextSkeleton lines={2} spacing={6} />
        <View style={styles.cardFooter}>
          <Skeleton variant="text" width={80} height={12} />
          <Skeleton variant="text" width={60} height={12} />
        </View>
      </View>
    </View>
  );
}

// Skeleton de lista
function ListSkeleton({
  items = 3,
  style,
  ...props
}: Omit<SkeletonProps, 'variant'> & { items?: number }) {
  return (
    <View style={[styles.list, style]}>
      {Array.from({ length: items }, (_, index) => (
        <View key={index} style={styles.listItem}>
          <AvatarSkeleton size={48} {...props} />
          <View style={styles.listContent}>
            <TextSkeleton lines={2} spacing={6} {...props} />
          </View>
        </View>
      ))}
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  waveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  card: {
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
    gap: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  list: {
    gap: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  listContent: {
    flex: 1,
    gap: 6,
  },
});

// Hook para controle de loading states
function useSkeleton(loading: boolean, content: React.ReactNode, skeleton: React.ReactNode) {
  return loading ? skeleton : content;
}

// Exportações
export {
  AvatarSkeleton,
  CardSkeleton,
  ListSkeleton, Skeleton,
  TextSkeleton, useSkeleton
};

