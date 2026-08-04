import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';

/** Bright launch pill — e.g. overlay on a CTA border for a new feature. */
export function TryItLabel({ style, testID = 'try-it-label' }) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignItems: 'center',
          alignSelf: 'flex-start',
          backgroundColor: '#c8f542',
          borderColor: '#0a0a0a',
          borderRadius: 999,
          borderWidth: 1,
          justifyContent: 'center',
          paddingHorizontal: 8,
          paddingVertical: 3,
        },
        text: {
          color: '#0a0a0a',
          fontSize: 10,
          fontWeight: '800',
          includeFontPadding: false,
          letterSpacing: 0.35,
          lineHeight: 12,
          textAlign: 'center',
          textTransform: 'uppercase',
        },
      }),
    [],
  );

  return (
    <View pointerEvents="none" style={[styles.root, style]} testID={testID}>
      <AppText style={styles.text}>Try it</AppText>
    </View>
  );
}
