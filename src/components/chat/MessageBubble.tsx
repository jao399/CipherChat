import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { colors, gradients, radii, spacing, typography } from '../../theme';
import type { Message } from '../../types';

type MessageBubbleProps = {
  message: Message;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.sender === 'system') {
    return (
      <View style={styles.notice}>
        <Ionicons name="lock-closed" size={14} color={colors.textSecondary} />
        <Text style={styles.noticeText}>{message.text}</Text>
      </View>
    );
  }

  const mine = message.sender === 'me';
  const bubbleStyle = [styles.bubble, mine ? styles.mine : styles.theirs];

  if (message.kind === 'file') {
    return (
      <View style={[styles.messageRow, mine && styles.mineRow]}>
        <View style={[styles.fileBubble, mine && styles.fileMine]}>
          <View style={styles.fileIcon}>
            <Ionicons name="document-text" size={30} color={colors.textSecondary} />
          </View>
          <View style={styles.fileBody}>
            <Text style={styles.fileName}>{message.fileName}</Text>
            <Text style={styles.fileMeta}>{message.fileSize} | PDF</Text>
          </View>
          <Text style={styles.time}>{message.time}</Text>
        </View>
      </View>
    );
  }

  if (message.kind === 'voice') {
    return (
      <View style={[styles.messageRow, mine && styles.mineRow]}>
        <View style={bubbleStyle}>
          <View style={styles.voiceRow}>
            <Ionicons name="play" size={18} color={mine ? colors.text : colors.primaryBright} />
            <View style={styles.wave}>
              {Array.from({ length: 12 }).map((_, index) => (
                <View key={index} style={[styles.bar, { height: 8 + ((index * 7) % 18) }]} />
              ))}
            </View>
            <Text style={styles.time}>{message.duration}</Text>
          </View>
        </View>
      </View>
    );
  }

  if (message.kind === 'image') {
    return (
      <View style={[styles.messageRow, mine && styles.mineRow]}>
        <LinearGradient colors={gradients.card} style={[styles.imageBubble, mine && styles.mineImage]}>
          <Ionicons name="image" size={32} color={colors.primaryBright} />
          <Text style={styles.imageText}>Encrypted image preview</Text>
          <Text style={styles.time}>{message.time}</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.messageRow, mine && styles.mineRow]}>
      <View style={bubbleStyle}>
        <Text style={[styles.text, mine && styles.mineText]}>{message.text}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.time, mine && styles.mineTime]}>{message.time}</Text>
          {mine ? <Ionicons name="checkmark-done" size={14} color={colors.security} /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    alignSelf: 'center',
    maxWidth: '92%',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(17,17,26,0.86)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  noticeText: {
    ...typography.small,
    color: colors.textSecondary,
    flex: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
  },
  mineRow: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  mine: {
    backgroundColor: colors.primaryDeep,
  },
  theirs: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    ...typography.body,
    color: colors.text,
  },
  mineText: {
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.xs,
  },
  time: {
    ...typography.small,
    fontSize: 11,
  },
  mineTime: {
    color: '#D9CCFF',
  },
  fileBubble: {
    maxWidth: '86%',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(25,217,142,0.32)',
    backgroundColor: 'rgba(18,185,129,0.20)',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  fileMine: {
    backgroundColor: 'rgba(18,185,129,0.28)',
  },
  fileIcon: {
    width: 46,
    height: 46,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileBody: {
    flex: 1,
  },
  fileName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '800',
  },
  fileMeta: {
    ...typography.small,
    color: colors.security,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  wave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  bar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.primaryBright,
  },
  imageBubble: {
    width: 210,
    minHeight: 132,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  mineImage: {
    borderColor: 'rgba(25,217,142,0.20)',
  },
  imageText: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
