import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

// Tipos
type CarouselProps = {
  data: any[];
  renderItem: (item: any, index: number) => React.ReactElement;
  orientation?: 'horizontal' | 'vertical';
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showsIndicators?: boolean;
  showsNavigation?: boolean;
};

type CarouselContextProps = {
  currentIndex: number;
  scrollToIndex: (index: number) => void;
  scrollNext: () => void;
  scrollPrev: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  data: any[];
} & CarouselProps;

// Context
const CarouselContext = createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = useContext(CarouselContext);
  if (!context) {
    throw new Error('useCarousel must be used within a <Carousel />');
  }
  return context;
}

// Componente Principal
function Carousel({
  data = [],
  renderItem,
  orientation = 'horizontal',
  autoPlay = false,
  autoPlayInterval = 3000,
  showsIndicators = true,
  showsNavigation = true,
  style,
  children,
  ...props
}: CarouselProps & React.ComponentProps<typeof View>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = React.useRef<FlatList>(null);

  const canScrollPrev = currentIndex > 0;
  const canScrollNext = currentIndex < data.length - 1;

  const scrollToIndex = useCallback((index: number) => {
    if (index >= 0 && index < data.length) {
      flatListRef.current?.scrollToIndex({ index, animated: true });
      setCurrentIndex(index);
    }
  }, [data.length]);

  const scrollNext = useCallback(() => {
    if (canScrollNext) {
      scrollToIndex(currentIndex + 1);
    }
  }, [currentIndex, canScrollNext, scrollToIndex]);

  const scrollPrev = useCallback(() => {
    if (canScrollPrev) {
      scrollToIndex(currentIndex - 1);
    }
  }, [currentIndex, canScrollPrev, scrollToIndex]);

  // Auto-play
  useEffect(() => {
    if (!autoPlay || !canScrollNext) return;

    const interval = setInterval(() => {
      scrollNext();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, scrollNext, canScrollNext]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  return (
    <CarouselContext.Provider
      value={{
        currentIndex,
        scrollToIndex,
        scrollNext,
        scrollPrev,
        canScrollPrev,
        canScrollNext,
        data,
        renderItem,
        orientation,
        autoPlay,
        showsIndicators,
        showsNavigation,
      }}
    >
      <View style={[styles.container, style]} {...props}>
        {/* Conteúdo do Carousel */}
        <FlatList
          ref={flatListRef}
          data={data}
          renderItem={({ item, index }) => (
            <CarouselItem index={index}>
              {renderItem(item, index)}
            </CarouselItem>
          )}
          keyExtractor={(_, index) => index.toString()}
          horizontal={orientation === 'horizontal'}
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onMomentumScrollEnd={(event) => {
            const contentOffset = orientation === 'horizontal' 
              ? event.nativeEvent.contentOffset.x 
              : event.nativeEvent.contentOffset.y;
            const viewSize = orientation === 'horizontal'
              ? event.nativeEvent.layoutMeasurement.width
              : event.nativeEvent.layoutMeasurement.height;
            const newIndex = Math.floor(contentOffset / viewSize);
            setCurrentIndex(newIndex);
          }}
        />

        {/* Navegação */}
        {showsNavigation && (
          <>
            <CarouselPrevious />
            <CarouselNext />
          </>
        )}

        {/* Indicadores */}
        {showsIndicators && <CarouselIndicators />}

        {children}
      </View>
    </CarouselContext.Provider>
  );
}

// Componentes do Carousel
function CarouselItem({ 
  children, 
  style,
  index 
}: { 
  children: React.ReactNode; 
  style?: any;
  index: number;
}) {
  const { orientation } = useCarousel();
  
  return (
    <View
      style={[
        styles.item,
        orientation === 'horizontal' 
          ? { width: Dimensions.get('window').width - 32 }
          : { height: Dimensions.get('window').height * 0.6 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function CarouselPrevious({
  style,
  ...props
}: React.ComponentProps<typeof TouchableOpacity>) {
  const { scrollPrev, canScrollPrev, orientation } = useCarousel();

  if (!canScrollPrev) return null;

  return (
    <TouchableOpacity
      style={[
        styles.navButton,
        orientation === 'horizontal'
          ? styles.navButtonHorizontalPrev
          : styles.navButtonVerticalPrev,
        style,
      ]}
      onPress={scrollPrev}
      {...props}
    >
      <ArrowLeft size={24} color="#000" />
    </TouchableOpacity>
  );
}

function CarouselNext({
  style,
  ...props
}: React.ComponentProps<typeof TouchableOpacity>) {
  const { scrollNext, canScrollNext, orientation } = useCarousel();

  if (!canScrollNext) return null;

  return (
    <TouchableOpacity
      style={[
        styles.navButton,
        orientation === 'horizontal'
          ? styles.navButtonHorizontalNext
          : styles.navButtonVerticalNext,
        style,
      ]}
      onPress={scrollNext}
      {...props}
    >
      <ArrowRight size={24} color="#000" />
    </TouchableOpacity>
  );
}

function CarouselIndicators({
  style,
  activeStyle,
  inactiveStyle,
}: {
  style?: any;
  activeStyle?: any;
  inactiveStyle?: any;
}) {
  const { data, currentIndex, scrollToIndex } = useCarousel();

  return (
    <View style={[styles.indicatorsContainer, style]}>
      {data.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.indicator,
            index === currentIndex 
              ? [styles.indicatorActive, activeStyle]
              : [styles.indicatorInactive, inactiveStyle],
          ]}
          onPress={() => scrollToIndex(index)}
        />
      ))}
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  item: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  navButton: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  navButtonHorizontalPrev: {
    left: 10,
    top: '50%',
    transform: [{ translateY: -25 }],
  },
  navButtonHorizontalNext: {
    right: 10,
    top: '50%',
    transform: [{ translateY: -25 }],
  },
  navButtonVerticalPrev: {
    top: 10,
    left: '50%',
    transform: [{ translateX: -25 }],
  },
  navButtonVerticalNext: {
    bottom: 10,
    left: '50%',
    transform: [{ translateX: -25 }],
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  indicatorActive: {
    backgroundColor: '#007AFF',
    width: 20,
  },
  indicatorInactive: {
    backgroundColor: '#CCCCCC',
  },
});

// Exportações
export {
  Carousel, CarouselIndicators, CarouselItem, CarouselNext, CarouselPrevious, useCarousel
};

