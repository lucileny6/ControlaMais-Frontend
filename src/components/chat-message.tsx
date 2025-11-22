import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
}

export function ChatMessage({ message, isUser, timestamp }: ChatMessageProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.aiContainer
    ]}>
      {/* Avatar */}
      <View style={[
        styles.avatar,
        isUser ? styles.userAvatar : styles.aiAvatar
      ]}>
        <Text style={styles.avatarText}>
          {isUser ? 'U' : 'IA'}
        </Text>
      </View>

      {/* Mensagem e timestamp */}
      <View style={[
        styles.messageContent,
        isUser ? styles.userContent : styles.aiContent
      ]}>
        <View style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.aiBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.aiMessageText
          ]}>
            {message}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {formatTime(timestamp)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  userContainer: {
    flexDirection: 'row-reverse',
  },
  aiContainer: {
    flexDirection: 'row',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userAvatar: {
    backgroundColor: '#000000', // bg-primary
  },
  aiAvatar: {
    backgroundColor: '#f5f5f5', // bg-secondary
  },
  avatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff', // text-primary-foreground para user
  },
  messageContent: {
    flexDirection: 'column',
    maxWidth: '80%',
    gap: 4,
  },
  userContent: {
    alignItems: 'flex-end',
  },
  aiContent: {
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: '#000000', // bg-primary
  },
  aiBubble: {
    backgroundColor: '#f5f5f5', // bg-muted
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#ffffff', // text-primary-foreground
  },
  aiMessageText: {
    color: '#666666', // text-muted-foreground
  },
  timestamp: {
    fontSize: 12,
    color: '#999999', // text-muted-foreground
  },
});