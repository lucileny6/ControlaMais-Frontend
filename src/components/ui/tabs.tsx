import React, { createContext, useContext, useState } from 'react';
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Tipos
interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  style?: any;
  orientation?: 'horizontal' | 'vertical';
}

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
  orientation: 'horizontal' | 'vertical';
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function useTabs() {
  const context = useContext(TabsContext);
  if (context === undefined) {
    throw new Error('useTabs must be used within a Tabs component');
  }
  return context;
}

// Componente Principal
function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  style,
  orientation = 'horizontal',
  ...props
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue || '');
  const isControlled = controlledValue !== undefined;
  const activeTab = isControlled ? controlledValue : uncontrolledValue;

  const setActiveTab = (newValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(newValue);
    }
    onValueChange?.(newValue);
  };

  const contextValue: TabsContextType = {
    activeTab,
    setActiveTab,
    orientation,
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <View
        style={[
          styles.tabs,
          orientation === 'vertical' && styles.tabsVertical,
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    </TabsContext.Provider>
  );
}

// List Component
function TabsList({
  children,
  style,
  scrollable = false,
  ...props
}: {
  children: React.ReactNode;
  style?: any;
  scrollable?: boolean;
}) {
  const { orientation } = useTabs();

  const content = (
    <View
      style={[
        styles.list,
        orientation === 'vertical' && styles.listVertical,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal={orientation === 'horizontal'}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
}

// Trigger Component
interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

function TabsTrigger({
  value,
  children,
  disabled = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  ...props
}: TabsTriggerProps) {
  const { activeTab, setActiveTab, orientation } = useTabs();
  const isActive = activeTab === value;

  const handlePress = () => {
    if (!disabled) {
      setActiveTab(value);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.trigger,
        orientation === 'vertical' && styles.triggerVertical,
        isActive && styles.triggerActive,
        disabled && styles.triggerDisabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      {...props}
    >
      <View style={[
        styles.triggerContent,
        iconPosition === 'right' && styles.triggerContentReverse,
      ]}>
        {icon && iconPosition === 'left' && (
          <View style={styles.icon}>{icon}</View>
        )}
        <Text style={[
          styles.triggerText,
          isActive && styles.triggerTextActive,
          disabled && styles.triggerTextDisabled,
          textStyle,
        ]}>
          {children}
        </Text>
        {icon && iconPosition === 'right' && (
          <View style={styles.icon}>{icon}</View>
        )}
      </View>
      
      {/* Indicador ativo */}
      {isActive && (
        <Animated.View style={[
          styles.activeIndicator,
          orientation === 'horizontal' 
            ? styles.activeIndicatorHorizontal 
            : styles.activeIndicatorVertical,
        ]} />
      )}
    </TouchableOpacity>
  );
}

// Content Component
interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  style?: any;
}

function TabsContent({
  value,
  children,
  style,
  ...props
}: TabsContentProps) {
  const { activeTab } = useTabs();

  if (activeTab !== value) {
    return null;
  }

  return (
    <View style={[styles.content, style]} {...props}>
      {children}
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  tabs: {
    flex: 1,
  },
  tabsVertical: {
    flexDirection: 'row',
  },
  list: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  listVertical: {
    flexDirection: 'column',
    width: 140,
  },
  trigger: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    position: 'relative',
  },
  triggerVertical: {
    flex: 0,
    minHeight: 44,
  },
  triggerActive: {
    backgroundColor: '#FFFFFF',
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  triggerContentReverse: {
    flexDirection: 'row-reverse',
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  triggerTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  triggerTextDisabled: {
    color: '#9CA3AF',
  },
  icon: {
    // Estilo para ícones
  },
  activeIndicator: {
    position: 'absolute',
    backgroundColor: '#007AFF',
  },
  activeIndicatorHorizontal: {
    bottom: -4,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 1,
  },
  activeIndicatorVertical: {
    top: 8,
    bottom: 8,
    left: -4,
    width: 2,
    borderRadius: 1,
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
});

// Componentes especializados

// Tabs com ícones
interface IconTabsProps {
  tabs: Array<{
    value: string;
    label: string;
    icon: React.ReactNode;
    iconPosition?: 'left' | 'right';
  }>;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

function IconTabs({ tabs, defaultValue, onValueChange }: IconTabsProps) {
  return (
    <Tabs defaultValue={defaultValue} onValueChange={onValueChange}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            icon={tab.icon}
            iconPosition={tab.iconPosition}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

// Tabs scrolláveis para muitas abas
function ScrollableTabs({ tabs }: { tabs: Array<{ value: string; label: string }> }) {
  return (
    <Tabs>
      <TabsList scrollable={true}>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

// Tabs verticais (sidebar)
function VerticalTabs({ 
  tabs,
  content,
}: {
  tabs: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  content: Record<string, React.ReactNode>;
}) {
  return (
    <Tabs orientation="vertical" style={verticalStyles.container}>
      <TabsList style={verticalStyles.list}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            icon={tab.icon}
            style={verticalStyles.trigger}
            textStyle={verticalStyles.triggerText}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      
      <View style={verticalStyles.contentArea}>
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} style={verticalStyles.content}>
            {content[tab.value]}
          </TabsContent>
        ))}
      </View>
    </Tabs>
  );
}

// Estilos para tabs verticais
const verticalStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flex: 1,
  },
  list: {
    width: 200,
    marginRight: 16,
  },
  trigger: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
  },
  triggerText: {
    textAlign: 'left',
  },
  contentArea: {
    flex: 1,
  },
  content: {
    marginTop: 0,
  },
});

// Hook para controle de tabs
function useTabsState(defaultValue = '') {
  const [value, setValue] = useState(defaultValue);

  return {
    value,
    setValue,
  };
}

// Exportações
export {
    IconTabs,
    ScrollableTabs, Tabs, TabsContent, TabsList,
    TabsTrigger, useTabs, useTabsState, VerticalTabs
};
