import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  sourceLabel?: string;
}

export function ChatMessage({ message, isUser, timestamp, sourceLabel }: ChatMessageProps) {
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
        <View style={styles.metaRow}>
          {!!sourceLabel && !isUser && (
            <Text style={styles.sourceLabel}>{sourceLabel}</Text>
          )}
          <Text style={styles.timestamp}>
            {formatTime(timestamp)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 12,
  },
  userContainer: {
    flexDirection: 'row-reverse',
  },
  aiContainer: {
    flexDirection: 'row',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userAvatar: {
    backgroundColor: '#10233f',
  },
  aiAvatar: {
    backgroundColor: '#e7eef4',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  messageContent: {
    flexDirection: 'column',
    maxWidth: '78%',
    gap: 4,
  },
  userContent: {
    alignItems: 'flex-end',
  },
  aiContent: {
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
  },
  userBubble: {
    backgroundColor: '#10233f',
    borderColor: 'rgba(16, 35, 63, 0.9)',
  },
  aiBubble: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: 'rgba(197, 210, 223, 0.45)',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  userMessageText: {
    color: '#ffffff',
  },
  aiMessageText: {
    color: '#31445c',
  },
  timestamp: {
    fontSize: 12,
    color: '#7b8b9f',
    paddingHorizontal: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  sourceLabel: {
    fontSize: 11,
    color: '#4f6b8a',
    fontWeight: '600',
  },
});
