import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ChatSuggestionsProps {
  onSelectSuggestion: (suggestion: string) => void;
}

const suggestions = [
  "Como posso economizar mais dinheiro?",
  "Registrar uma nova despesa",
  "Qual meu saldo atual?",
  "Criar uma meta de poupança",
  "Analisar meus gastos do mês",
  "Simular uma compra",
];

export function ChatSuggestions({ onSelectSuggestion }: ChatSuggestionsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sugestões de perguntas:</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionsContainer}
      >
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionButton}
            onPress={() => onSelectSuggestion(suggestion)}
          >
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f8f8', // bg-muted/30
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666', // text-muted-foreground
    marginBottom: 12,
  },
  suggestionsContainer: {
    gap: 8,
  },
  suggestionButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d4d4d4', // border outline
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  suggestionText: {
    fontSize: 12,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 16,
  },
});