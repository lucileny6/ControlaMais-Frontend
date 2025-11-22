import { ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { createContext, useContext, useRef, useState } from 'react';
import {
    Animated,
    LayoutAnimation,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';

// Configurar LayoutAnimation para Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// Tipos
interface CollapsibleProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  duration?: number;
  style?: any;
}

interface CollapsibleContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  disabled: boolean;
  contentHeight: Animated.Value;
}

const CollapsibleContext = createContext<CollapsibleContextType | undefined>(undefined);

function useCollapsible() {
  const context = useContext(CollapsibleContext);
  if (context === undefined) {
    throw new Error('useCollapsible must be used within a Collapsible');
  }
  return context;
}

function Collapsible({
  children,
  open,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  duration = 300,
  style,
  ...props
}: CollapsibleProps) {
  const [isOpenInternal, setIsOpenInternal] = useState(defaultOpen);
  const contentHeight = useRef(new Animated.Value(0)).current;
  const isControlled = open !== undefined;

  const isOpen = isControlled ? open : isOpenInternal;

  const setIsOpen = (newOpen: boolean) => {
    if (disabled) return;

    if (!isControlled) {
      setIsOpenInternal(newOpen);
    }

    onOpenChange?.(newOpen);

    // Animação
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      LayoutAnimation.configureNext(
        LayoutAnimation.create(
          duration,
          LayoutAnimation.Types.easeInEaseOut,
          LayoutAnimation.Properties.opacity
        )
      );
    }
  };

  const contextValue: CollapsibleContextType = {
    isOpen,
    setIsOpen,
    disabled,
    contentHeight,
  };

  return (
    <CollapsibleContext.Provider value={contextValue}>
      <View style={[styles.collapsible, style]} {...props}>
        {children}
      </View>
    </CollapsibleContext.Provider>
  );
}

// Trigger Component
interface CollapsibleTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  style?: any;
  showChevron?: boolean;
  chevronPosition?: 'left' | 'right';
}

function CollapsibleTrigger({
  children,
  asChild = false,
  style,
  showChevron = true,
  chevronPosition = 'right',
  ...props
}: CollapsibleTriggerProps) {
  const { isOpen, setIsOpen, disabled } = useCollapsible();

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const ChevronIcon = isOpen ? ChevronUp : ChevronDown;

  const triggerContent = (
    <View style={[styles.trigger, style]}>
      {showChevron && chevronPosition === 'left' && (
        <ChevronIcon 
          size={20} 
          color="#6B7280" 
          style={styles.chevronLeft} 
        />
      )}
      
      <View style={styles.triggerContent}>
        {children}
      </View>

      {showChevron && chevronPosition === 'right' && (
        <ChevronIcon 
          size={20} 
          color="#6B7280" 
          style={styles.chevronRight} 
        />
      )}
    </View>
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onPress: toggleOpen,
      disabled,
      ...props,
    } as any);
  }

  return (
    <TouchableOpacity
      onPress={toggleOpen}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      {triggerContent}
    </TouchableOpacity>
  );
}

// Content Component
interface CollapsibleContentProps {
  children: React.ReactNode;
  style?: any;
  animate?: boolean;
}

function CollapsibleContent({
  children,
  style,
  animate = true,
  ...props
}: CollapsibleContentProps) {
  const { isOpen, contentHeight } = useCollapsible();
  const [contentMeasured, setContentMeasured] = useState(false);
  const contentRef = useRef<View>(null);

  // Animação de altura
  const animatedStyle = animate
    ? {
        height: contentHeight.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1], // Será atualizado após medida
        }),
        opacity: contentHeight,
      }
    : {};

  React.useEffect(() => {
    if (animate) {
      Animated.timing(contentHeight, {
        toValue: isOpen ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [isOpen, animate, contentHeight]);

  const handleLayout = (event: any) => {
    if (!contentMeasured && animate) {
      const { height } = event.nativeEvent.layout;
      // Atualizar a saída da interpolação com a altura real
      contentHeight.setValue(isOpen ? 1 : 0);
      setContentMeasured(true);
    }
  };

  if (!animate) {
    return isOpen ? (
      <View 
        style={[styles.content, style]} 
        ref={contentRef}
        onLayout={handleLayout}
        {...props}
      >
        {children}
      </View>
    ) : null;
  }

  return (
    <Animated.View
      style={[
        styles.content,
        styles.contentAnimated,
        animatedStyle,
        style,
        !isOpen && styles.contentHidden,
      ]}
      ref={contentRef}
      onLayout={handleLayout}
      {...props}
    >
      <View style={styles.contentInner}>
        {children}
      </View>
    </Animated.View>
  );
}

// Estilos
const styles = StyleSheet.create({
  collapsible: {
    width: '100%',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  triggerContent: {
    flex: 1,
  },
  chevronLeft: {
    marginRight: 12,
  },
  chevronRight: {
    marginLeft: 12,
  },
  content: {
    overflow: 'hidden',
  },
  contentAnimated: {
    // Estilos para conteúdo animado
  },
  contentHidden: {
    // Estilos para conteúdo escondido
  },
  contentInner: {
    paddingVertical: 8,
  },
});

// Componente de exemplo com header customizado
interface CollapsibleItemProps {
  title: string;
  children: React.ReactNode;
  initiallyOpen?: boolean;
  headerStyle?: any;
  contentStyle?: any;
}

function CollapsibleItem({
  title,
  children,
  initiallyOpen = false,
  headerStyle,
  contentStyle,
}: CollapsibleItemProps) {
  return (
    <Collapsible defaultOpen={initiallyOpen}>
      <CollapsibleTrigger style={[styles.trigger, headerStyle]}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>{title}</Text>
      </CollapsibleTrigger>
      <CollapsibleContent style={contentStyle}>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export {
    Collapsible, CollapsibleContent,
    CollapsibleItem, CollapsibleTrigger, useCollapsible
};
