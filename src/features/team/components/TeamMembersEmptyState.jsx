import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  TEAM_MEMBERS_ADD_BUTTON,
  TEAM_MEMBERS_EMPTY_BODY,
  TEAM_MEMBERS_EMPTY_TITLE,
} from '../constants/teamMembersCopy';
import { TeamHowItWorks } from './TeamHowItWorks';

/**
 * Empty card at the top of Team when the shop has no hires yet.
 */
export function TeamMembersEmptyState({ onAdd }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignItems: 'center',
          alignSelf: 'stretch',
        },
        card: {
          alignItems: 'center',
          paddingHorizontal: 28,
          paddingVertical: 36,
          width: '100%',
        },
        iconRing: {
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 999,
          borderWidth: 1,
          height: 72,
          justifyContent: 'center',
          marginBottom: 20,
          width: 72,
        },
        title: {
          alignSelf: 'stretch',
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 20,
          letterSpacing: -0.3,
          textAlign: 'center',
        },
        body: {
          alignSelf: 'stretch',
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 20,
          marginTop: 6,
          opacity: 0.9,
          textAlign: 'center',
        },
        action: {
          alignSelf: 'stretch',
          marginTop: 24,
          width: '100%',
        },
        howItWorks: {
          marginTop: 14,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <SurfaceCard outlined padding="none" style={styles.card}>
        <View style={styles.iconRing}>
          <MaterialCommunityIcons
            color={colors.textSecondary}
            name="account-group-outline"
            size={30}
          />
        </View>
        <AppText style={styles.title}>{TEAM_MEMBERS_EMPTY_TITLE}</AppText>
        <AppText style={styles.body}>{TEAM_MEMBERS_EMPTY_BODY}</AppText>
        {onAdd ? (
          <View style={styles.action}>
            <Button
              accessibilityLabel={TEAM_MEMBERS_ADD_BUTTON}
              fullWidth
              title={TEAM_MEMBERS_ADD_BUTTON}
              variant="surfaceLight"
              onPress={onAdd}
            />
          </View>
        ) : null}
        <View style={styles.howItWorks}>
          <TeamHowItWorks />
        </View>
      </SurfaceCard>
    </View>
  );
}
