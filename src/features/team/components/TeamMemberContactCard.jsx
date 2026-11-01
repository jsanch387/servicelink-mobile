import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { TEAM_MEMBER_STATUS_LABEL } from '../constants/teamMembersCopy';
import { presentTeamMember } from '../utils/teamMemberDisplay';
import { TeamMemberAvatar } from './TeamMemberAvatar';

/**
 * Identity card: avatar, name, email, and status on one row.
 */
export function TeamMemberContactCard({ member }) {
  const { colors } = useTheme();
  const presented = presentTeamMember(member);
  const storedName = String(member?.name ?? '').trim();
  const displayName = storedName || presented.title;
  const email = String(member?.email ?? '').trim();
  const status = member?.status === 'invited' ? 'invited' : 'active';
  const statusLabel = TEAM_MEMBER_STATUS_LABEL[status];
  const active = status === 'active';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 18,
          width: '100%',
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        avatarWrap: {
          marginRight: 14,
        },
        textCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        nameRow: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        nameCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
          paddingRight: 10,
        },
        name: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 17,
          letterSpacing: -0.3,
        },
        email: {
          color: colors.textMuted,
          fontSize: 13,
          lineHeight: 18,
          marginTop: 4,
        },
        pill: {
          alignItems: 'center',
          backgroundColor: active ? 'rgba(52, 199, 89, 0.16)' : colors.buttonGhostPressed,
          borderRadius: 999,
          flexDirection: 'row',
          paddingHorizontal: 8,
          paddingVertical: 3,
        },
        dot: {
          backgroundColor: active ? colors.moneyPositive : colors.textMuted,
          borderRadius: 3,
          height: 6,
          marginRight: 5,
          width: 6,
        },
        pillLabel: {
          color: active ? colors.moneyPositive : colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 12,
          letterSpacing: -0.1,
        },
      }),
    [active, colors],
  );

  return (
    <SurfaceCard outlined padding="none" style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatarWrap}>
          <TeamMemberAvatar initial={presented.initial} size={48} />
        </View>
        <View style={styles.textCol}>
          <View style={styles.nameRow}>
            <View style={styles.nameCol}>
              <AppText numberOfLines={1} style={styles.name}>
                {displayName}
              </AppText>
            </View>
            <View style={styles.pill}>
              <View style={styles.dot} />
              <AppText style={styles.pillLabel}>{statusLabel}</AppText>
            </View>
          </View>
          {email ? (
            <AppText numberOfLines={1} style={styles.email}>
              {email}
            </AppText>
          ) : null}
        </View>
      </View>
    </SurfaceCard>
  );
}
