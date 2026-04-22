import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

export function CustomerDetailsScreen({ route }) {
  const { colors } = useTheme();
  const customerId = route?.params?.customerId;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
          padding: 16,
        },
        content: {
          flex: 1,
          justifyContent: 'center',
        },
        title: {
          color: colors.text,
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: -0.25,
        },
        body: {
          color: colors.textMuted,
          fontSize: 15,
          lineHeight: 22,
          marginTop: 10,
        },
      }),
    [colors],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.content}>
        <SurfaceCard>
          <AppText style={styles.title}>Customer details</AppText>
          <AppText style={styles.body}>
            Placeholder screen for customer details.
            {customerId ? ` Customer ID: ${customerId}` : ''}
          </AppText>
        </SurfaceCard>
      </View>
    </SafeAreaView>
  );
}
