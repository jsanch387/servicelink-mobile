import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Divider, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { TEAM_MEMBER_STATUS_LABEL } from '../constants/teamMembersCopy';
import { presentTeamMember } from '../utils/teamMemberDisplay';
import { TeamMemberAvatar } from './TeamMemberAvatar';

/**
 * Avatar, name, status, email. Sheet chrome says "Team member".
 */
export function TeamMemberContactCard({ member }) {
  const { colors } = useTheme();
  const presented = presentTeamMember(member);
  const storedName = String(member?.name ?? '').trim();
  const displayName = storedName || presented.title;
  const email = String(member?.email ?? '').trim();
  const statusLabel = TEAM_MEMBER_STATUS_LABEL[member?.status] ?? TEAM_MEMBER_STATUS_LABEL.active;
  const isInvited = member?.status === 'invited';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          paddingVertical: 16,
        },
        topRow: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        avatarWrap: {
          marginRight: 12,
        },
        nameCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        name: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 20,
          letterSpacing: -0.4,
          lineHeight: 26,
        },
        pill: {
          backgroundColor: isInvited ? colors.shellElevated : `${colors.textSuccess}22`,
          borderColor: isInvited ? colors.cardBorder : `${colors.textSuccess}44`,
          borderRadius: 999,
          borderWidth: 1,
          flexShrink: 0,
          marginLeft: 10,
          paddingHorizontal: 10,
          paddingVertical: 5,
        },
        pillText: {
          color: isInvited ? colors.textMuted : colors.textSuccess,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 12,
          letterSpacing: -0.05,
        },
        dividerWrap: {
          marginBottom: 10,
          marginTop: 14,
        },
        email: {
          color: colors.textMuted,
          fontSize: 14,
          letterSpacing: -0.05,
          lineHeight: 20,
        },
      }),
    [colors, isInvited],
  );

  return (
    <SurfaceCard padding="md" style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          <TeamMemberAvatar initial={presented.initial} size={48} />
        </View>
        <View style={styles.nameCol}>
          <AppText numberOfLines={2} style={styles.name}>
            {displayName}
          </AppText>
        </View>
        <View style={styles.pill}>
          <AppText style={styles.pillText}>{statusLabel}</AppText>
        </View>
      </View>
      {email ? (
        <>
          <View style={styles.dividerWrap}>
            <Divider />
          </View>
          <AppText numberOfLines={2} style={styles.email}>
            {email}
          </AppText>
        </>
      ) : null}
    </SurfaceCard>
  );
}
