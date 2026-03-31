import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ChatSuggestionsProps {
  onSelectSuggestion: (suggestion: string) => void;
  disabled?: boolean;
}

const suggestions = [
  "Qual meu saldo?",
  "Quanto gastei esse mes?",
  "Quanto recebi esse mes?",
  "Registrar uma nova despesa",
  "Como posso economizar mais dinheiro?",
  "Simular uma compra",
];

export function ChatSuggestions({ onSelectSuggestion, disabled = false }: ChatSuggestionsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sugestoes de perguntas:</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionsContainer}
      >
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={`${suggestion}-${index}`}
            style={[styles.suggestionButton, disabled && styles.suggestionButtonDisabled]}
            onPress={() => onSelectSuggestion(suggestion)}
            disabled={disabled}
          >
            <Text style={[styles.suggestionText, disabled && styles.suggestionTextDisabled]}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 6,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5f7087",
    marginBottom: 12,
  },
  suggestionsContainer: {
    gap: 8,
    paddingRight: 12,
  },
  suggestionButton: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(197, 210, 223, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  suggestionButtonDisabled: {
    opacity: 0.55,
  },
  suggestionText: {
    fontSize: 12,
    color: "#10233f",
    textAlign: "center",
    lineHeight: 16,
    fontWeight: "500",
  },
  suggestionTextDisabled: {
    color: "#73859a",
  },
});
