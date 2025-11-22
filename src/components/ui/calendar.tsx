import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Você precisará instalar uma biblioteca de calendário para React Native
// Sugestão: react-native-calendars ou criar um componente personalizado

interface CalendarProps {
  className?: string;
  showOutsideDays?: boolean;
  // Adicione outras props conforme necessário
}

function Calendar({ 
  className, 
  showOutsideDays = true,
  ...props 
}: CalendarProps) {
  // Implementação básica - você precisará de uma biblioteca de calendário
  // ou criar o componente do zero para React Native
  
  return (
    <View style={styles.container}>
      <Text>Calendar Component</Text>
      <Text>Para React Native, recomendo usar react-native-calendars</Text>
    </View>
  );
}

function CalendarDayButton({
  day,
  modifiers,
  onPress,
  ...props
}: any) {
  return (
    <TouchableOpacity
      style={[
        styles.dayButton,
        modifiers.selected && styles.selectedDay,
        modifiers.today && styles.today
      ]}
      onPress={onPress}
      {...props}
    >
      <Text style={[
        styles.dayText,
        modifiers.selected && styles.selectedDayText
      ]}>
        {day.getDate()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
  },
  dayButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  selectedDay: {
    backgroundColor: '#007AFF',
  },
  today: {
    backgroundColor: '#F0F0F0',
  },
  dayText: {
    fontSize: 14,
    color: '#000',
  },
  selectedDayText: {
    color: '#FFF',
  },
});

export { Calendar, CalendarDayButton };
