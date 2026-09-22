import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { TEAM_MEMBER_DETAIL_HINT } from '../constants/teamMembersCopy';
import { presentTeamMember } from '../utils/teamMemberDisplay';
import { TeamMemberAvatar } from './TeamMemberAvatar';

/**
 * Team list row: name, email, chevron. Details / remove live in the member sheet.
 * Row layout lives on inner Views (Pressable + flex on Text stacks on RN).
 */
export function TeamMemberCard({ member, onPress }) {
  const { colors } = useTheme();
  const { title, subtitle, initial } = presentTeamMember(member);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          paddingHorizontal: 14,
          paddingVertical: 14,
          width: '100%',
        },
        pressed: {
          opacity: 0.72,
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        avatarWrap: {
          marginRight: 12,
        },
        textCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        name: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          letterSpacing: -0.2,
        },
        email: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          marginTop: 3,
        },
        chevronCol: {
          alignItems: 'center',
          height: 22,
          justifyContent: 'center',
          marginLeft: 10,
          width: 22,
        },
      }),
    [colors],
  );

  return (
    <SurfaceCard outlined padding="none" style={styles.card}>
      <Pressable
        accessibilityHint={TEAM_MEMBER_DETAIL_HINT}
        accessibilityLabel={title}
        accessibilityRole="button"
        onPress={() => onPress?.(member)}
      >
        {({ pressed }) => (
          <View style={[styles.row, pressed && styles.pressed]}>
            <View style={styles.avatarWrap}>
              <TeamMemberAvatar initial={initial} />
            </View>
            <View style={styles.textCol}>
              <AppText numberOfLines={1} style={styles.name}>
                {title}
              </AppText>
              {subtitle ? (
                <AppText numberOfLines={1} style={styles.email}>
                  {subtitle}
                </AppText>
              ) : null}
            </View>
            <View style={styles.chevronCol}>
              <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
            </View>
          </View>
        )}
      </Pressable>
    </SurfaceCard>
  );
}
