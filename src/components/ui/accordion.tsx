import React, { createContext, useContext } from "react";
import { Text, TextStyle, TouchableOpacity, TouchableOpacityProps, View, ViewProps, ViewStyle } from "react-native";

interface AccordionContextType {
  openItem: string | null;
  toggleItem: (value: string) => void;
  variant?: 'default' | 'bordered' | 'filled';
  size?:  'sm' | 'md' | 'lg';
}

const AccordionContext = createContext<AccordionContextType | undefined>(
  undefined
);

// Hook para usar o contexto
function useAccordion() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("useAccordion must be used within Accordion");
  }
  return context;
}

// Tipos para as props
interface AccordionProps extends ViewProps{
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  children: React.ReactNode;
  variant?: 'default' | 'bordered' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

interface AccordionItemProps extends ViewProps{
  value: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

interface AccordionTriggerProps extends TouchableOpacityProps {
  children: string;
  value: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

interface AccordionContentProps extends ViewProps {
  children: React.ReactNode;
  value: string;
}

// Componente Accordion principal
function Accordion({
  type = "single",
  defaultValue,
  children,
  style,
  ...props
}: AccordionProps) {
  
  const getInitialValue = (): string | null => {
    if (!defaultValue) return null;
    
    if (typeof defaultValue === 'string') {
      return defaultValue;
    }
    
    if (Array.isArray(defaultValue) && defaultValue.length > 0) {
      return type === 'single' ? defaultValue[0] : null;
    }

    return null;
  }
}

function AccordionItem({
  value,
  children,
  style,
  ...props
}: AccordionItemProps) {
  const { openItem } = useAccordion();
  const isOpen = openItem === value;

  const itemStyle = {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  };

  return (
    <View style={[itemStyle, style]} {...props}>
      {children}
    </View>
  );
}

function AccordionTrigger({
  children,
  value,
  style,
  ...props
}: AccordionTriggerProps) {
  const { openItem, toggleItem } = useAccordion();
  const isOpen = openItem === value;

  const triggerStyle = {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
    paddingVertical: 16,
    paddingHorizontal: 0,
  };

  const textStyle = {
    fontSize: 14,
    fontWeight: "500" as const,
    flex: 1,
    marginRight: 16,
  };

  const iconStyle = {
    fontSize: 16,
    color: "#6b7280",
    transform: [{ rotate: isOpen ? "180deg" : "0deg" }],
    marginTop: 2,
  };

  return (
    <TouchableOpacity
      style={[triggerStyle, style]}
      onPress={() => toggleItem(value)}
      {...props}
    >
      <Text style={textStyle}>{children}</Text>
      <Text style={iconStyle}>▼</Text>
    </TouchableOpacity>
  );
}

// Componente AccordionContent
function AccordionContent({
  children,
  style,
  ...props
}: AccordionContentProps) {
  const { openItem } = useAccordion();
  const isOpen = openItem === props.value;

  if (!isOpen) return null;

  const contentStyle = {
    paddingBottom: 16,
    paddingHorizontal: 0,
  };

  return (
    <View style={[contentStyle, style]} {...props}>
      <Text style={{ fontSize: 14, color: "#6b7280", lineHeight: 20 }}>
        {children}
      </Text>
    </View>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
