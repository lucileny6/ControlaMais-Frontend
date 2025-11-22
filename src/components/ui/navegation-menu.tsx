import { ChevronDown, ChevronRight } from 'lucide-react-native';
import React, { createContext, useContext, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Tipos
interface NavigationMenuProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
}

interface NavigationMenuContextType {
  activeItem: string | null;
  setActiveItem: (item: string | null) => void;
  viewportOpen: boolean;
  setViewportOpen: (open: boolean) => void;
}

const NavigationMenuContext = createContext<NavigationMenuContextType | undefined>(undefined);

function useNavigationMenu() {
  const context = useContext(NavigationMenuContext);
  if (context === undefined) {
    throw new Error('useNavigationMenu must be used within a NavigationMenu');
  }
  return context;
}

// Componente Principal
function NavigationMenu({
  children,
  style,
  ...props
}: NavigationMenuProps) {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [viewportOpen, setViewportOpen] = useState(false);

  const contextValue: NavigationMenuContextType = {
    activeItem,
    setActiveItem,
    viewportOpen,
    setViewportOpen,
  };

  return (
    <NavigationMenuContext.Provider value={contextValue}>
      <View style={[styles.navigationMenu, style]} {...props}>
        {children}
      </View>
    </NavigationMenuContext.Provider>
  );
}

// List Component
function NavigationMenuList({
  children,
  style,
  ...props
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View style={[styles.list, style]} {...props}>
      {children}
    </View>
  );
}

// Item Component
function NavigationMenuItem({
  children,
  style,
  ...props
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View style={[styles.item, style]} {...props}>
      {children}
    </View>
  );
}

// Trigger Component
interface NavigationMenuTriggerProps {
  children: React.ReactNode;
  itemId: string;
  style?: any;
  textStyle?: any;
}

function NavigationMenuTrigger({
  children,
  itemId,
  style,
  textStyle,
  ...props
}: NavigationMenuTriggerProps) {
  const { activeItem, setActiveItem, setViewportOpen } = useNavigationMenu();
  const isActive = activeItem === itemId;

  const handlePress = () => {
    if (isActive) {
      setActiveItem(null);
      setViewportOpen(false);
    } else {
      setActiveItem(itemId);
      setViewportOpen(true);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.trigger,
        isActive && styles.triggerActive,
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      {...props}
    >
      <Text style={[styles.triggerText, textStyle]}>
        {children}
      </Text>
      <ChevronDown 
        size={16} 
        color="#6B7280" 
        style={[
          styles.chevron,
          isActive && styles.chevronActive
        ]} 
      />
    </TouchableOpacity>
  );
}

// Content Component
interface NavigationMenuContentProps {
  children: React.ReactNode;
  itemId: string;
  style?: any;
}

function NavigationMenuContent({
  children,
  itemId,
  style,
  ...props
}: NavigationMenuContentProps) {
  const { activeItem, viewportOpen } = useNavigationMenu();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (activeItem === itemId && viewportOpen) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
        Animated.spring(fadeAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
      ]).start();
    } else {
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [activeItem, itemId, viewportOpen, slideAnim, fadeAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  if (activeItem !== itemId || !viewportOpen) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.content,
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

// Link Component
interface NavigationMenuLinkProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  textStyle?: any;
  showChevron?: boolean;
}

function NavigationMenuLink({
  children,
  onPress,
  style,
  textStyle,
  showChevron = false,
  ...props
}: NavigationMenuLinkProps) {
  const { setActiveItem, setViewportOpen } = useNavigationMenu();

  const handlePress = () => {
    onPress?.();
    setActiveItem(null);
    setViewportOpen(false);
  };

  return (
    <TouchableOpacity
      style={[styles.link, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      {...props}
    >
      <Text style={[styles.linkText, textStyle]}>
        {children}
      </Text>
      {showChevron && (
        <ChevronRight size={16} color="#6B7280" />
      )}
    </TouchableOpacity>
  );
}

// Viewport Component
function NavigationMenuViewport({
  children,
  style,
  ...props
}: {
  children: React.ReactNode;
  style?: any;
}) {
  const { viewportOpen } = useNavigationMenu();
  const slideAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (viewportOpen) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [viewportOpen, slideAnim]);

  const scale = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });

  if (!viewportOpen) return null;

  return (
    <Animated.View
      style={[
        styles.viewport,
        style,
        {
          transform: [{ scale }],
        },
      ]}
      {...props}
    >
      <ScrollView 
        style={styles.viewportScroll}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </Animated.View>
  );
}

// Indicator Component (simplificado para mobile)
function NavigationMenuIndicator({
  style,
  ...props
}: {
  style?: any;
}) {
  const { activeItem } = useNavigationMenu();

  if (!activeItem) return null;

  return (
    <View style={[styles.indicator, style]} {...props} />
  );
}

// Estilos
const styles = StyleSheet.create({
  navigationMenu: {
    position: 'relative',
  },
  list: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  item: {
    position: 'relative',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  triggerActive: {
    backgroundColor: '#F3F4F6',
  },
  triggerText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  chevron: {
    marginLeft: 4,
    transform: [{ rotate: '0deg' }],
  },
  chevronActive: {
    transform: [{ rotate: '180deg' }],
  },
  content: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    zIndex: 50,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  linkText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  viewport: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    zIndex: 50,
    maxHeight: 400,
  },
  viewportScroll: {
    padding: 16,
  },
  indicator: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    width: 8,
    height: 8,
    backgroundColor: '#007AFF',
    borderRadius: 4,
    transform: [{ translateX: -4 }],
  },
});

// Componente de exemplo para itens de menu
interface NavigationMenuItemData {
  id: string;
  title: string;
  items: Array<{
    title: string;
    description?: string;
    onPress?: () => void;
  }>;
}

interface NavigationMenuSectionProps {
  data: NavigationMenuItemData;
}

function NavigationMenuSection({ data }: NavigationMenuSectionProps) {
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger itemId={data.id}>
        {data.title}
      </NavigationMenuTrigger>
      <NavigationMenuContent itemId={data.id}>
        <View style={{ gap: 8 }}>
          {data.items.map((item, index) => (
            <NavigationMenuLink
              key={index}
              onPress={item.onPress}
              style={{ paddingVertical: 12 }}
            >
              <View>
                <Text style={{ fontWeight: '600', fontSize: 16 }}>
                  {item.title}
                </Text>
                {item.description && (
                  <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>
                    {item.description}
                  </Text>
                )}
              </View>
            </NavigationMenuLink>
          ))}
        </View>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}

// Hook para controle do menu
function useNavigationMenuControl() {
  const { activeItem, setActiveItem, viewportOpen, setViewportOpen } = useNavigationMenu();

  const openItem = (itemId: string) => {
    setActiveItem(itemId);
    setViewportOpen(true);
  };

  const closeMenu = () => {
    setActiveItem(null);
    setViewportOpen(false);
  };

  const toggleItem = (itemId: string) => {
    if (activeItem === itemId) {
      closeMenu();
    } else {
      openItem(itemId);
    }
  };

  return {
    activeItem,
    viewportOpen,
    openItem,
    closeMenu,
    toggleItem,
  };
}

// Exportações
export {
  NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuSection, NavigationMenuTrigger, NavigationMenuViewport, useNavigationMenu,
  useNavigationMenuControl
};

