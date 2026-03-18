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
      nativeEvent.preventDefault?.();
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
        onKeyPress={handleKeyPress}
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
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: 'rgba(255,255,255,0.34)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.16)',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(197, 210, 223, 0.5)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#10233f',
    maxHeight: 100,
    textAlignVertical: 'center',
  },
  inputDisabled: {
    backgroundColor: '#eef3f7',
    color: '#7b8b9f',
  },
  button: {
    backgroundColor: '#10233f',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    minWidth: 78,
  },
  buttonDisabled: {
    backgroundColor: '#b6c2cf',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
