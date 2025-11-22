import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = ({ nativeEvent }: any) => {
    if (nativeEvent.key === 'Enter' && !nativeEvent.shiftKey) {
      nativeEvent.preventDefault();
      handleSubmit();
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          disabled && styles.inputDisabled
        ]}
        value={message}
        onChangeText={setMessage}
        placeholder="Digite sua pergunta sobre finanças..."
        placeholderTextColor="#999999"
        editable={!disabled}
        multiline
        maxLength={500}
        onSubmitEditing={handleSubmit}
        blurOnSubmit={false}
      />
      <TouchableOpacity
        style={[
          styles.button,
          (disabled || !message.trim()) && styles.buttonDisabled
        ]}
        onPress={handleSubmit}
        disabled={disabled || !message.trim()}
      >
        <Text style={styles.buttonText}>Enviar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    maxHeight: 100,
    textAlignVertical: 'center',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999999',
  },
  button: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 70,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});