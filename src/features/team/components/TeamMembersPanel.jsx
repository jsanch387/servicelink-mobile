import Ionicons from '@expo/vector-icons/Ionicons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, Button, SurfaceCard, useToast } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { isValidEmailFormat, normalizeEmailForDedupe } from '../../../utils/email';
import {
  TEAM_INVITE_DUPLICATE_EMAIL,
  TEAM_INVITE_INVALID_EMAIL,
  TEAM_INVITE_SENT_TOAST,
  TEAM_MEMBERS_ADD_BUTTON,
  TEAM_MEMBERS_EMPTY_BODY,
  TEAM_MEMBERS_EMPTY_TITLE,
  TEAM_MEMBERS_INVITE_A11Y,
  TEAM_MEMBERS_TITLE,
  TEAM_REMOVE_TOAST,
} from '../constants/teamMembersCopy';
import { InviteTeamMemberSheet } from './InviteTeamMemberSheet';
import { RemoveTeamMemberSheet } from './RemoveTeamMemberSheet';
import { TeamMemberRow } from './TeamMemberRow';

function createLocalMemberId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `member-${Date.now()}`;
}

/**
 * Team members tab — UI only (local list). Matches web Settings → Team members.
 */
export function TeamMembersPanel() {
  const { colors } = useTheme();
  const toast = useToast();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollBottomPad = 28 + Math.max(tabBarHeight, 72);
  const [members, setMembers] = useState([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  const openInvite = useCallback(() => setInviteOpen(true), []);

  const handleInvite = useCallback(
    (emailRaw) => {
      const email = normalizeEmailForDedupe(emailRaw);
      if (!email || !isValidEmailFormat(email)) {
        return { ok: false, error: TEAM_INVITE_INVALID_EMAIL };
      }
      if (members.some((row) => row.email === email)) {
        return { ok: false, error: TEAM_INVITE_DUPLICATE_EMAIL };
      }
      setMembers((current) => [
        ...current,
        {
          id: createLocalMemberId(),
          email,
          status: 'invited',
          source: 'invite',
        },
      ]);
      toast.success(TEAM_INVITE_SENT_TOAST);
      setInviteOpen(false);
      return { ok: true };
    },
    [members, toast],
  );

  const handleRemove = useCallback(
    (member) => {
      setMembers((current) => current.filter((row) => row.id !== member.id));
      setMemberToRemove(null);
      toast.success(TEAM_REMOVE_TOAST);
    },
    [toast],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
        },
        content: {
          paddingBottom: scrollBottomPad,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 4,
        },
        toolbar: {
          alignItems: 'center',
          flexDirection: 'row',
          marginBottom: 8,
          minHeight: 32,
          width: '100%',
        },
        titleCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        title: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
          letterSpacing: -0.2,
        },
        inviteCol: {
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
        },
        inviteHit: {
          alignItems: 'center',
          height: 36,
          justifyContent: 'center',
          width: 36,
        },
        invitePressed: {
          opacity: 0.7,
        },
        emptyCard: {
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 36,
        },
        emptyIcon: {
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 24,
          borderWidth: 1,
          height: 48,
          justifyContent: 'center',
          marginBottom: 12,
          width: 48,
        },
        emptyTitle: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          letterSpacing: -0.2,
          textAlign: 'center',
        },
        emptyBody: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          lineHeight: 18,
          marginTop: 6,
          maxWidth: 260,
          textAlign: 'center',
        },
        emptyCta: {
          marginTop: 16,
        },
        listCard: {
          overflow: 'hidden',
        },
      }),
    [colors, scrollBottomPad],
  );

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.toolbar}>
          <View style={styles.titleCol}>
            <AppText style={styles.title}>{TEAM_MEMBERS_TITLE}</AppText>
          </View>
          <View style={styles.inviteCol}>
            <Pressable
              accessibilityHint="Opens the invite form"
              accessibilityLabel={TEAM_MEMBERS_INVITE_A11Y}
              accessibilityRole="button"
              hitSlop={8}
              onPress={openInvite}
            >
              {({ pressed }) => (
                <View style={[styles.inviteHit, pressed && styles.invitePressed]}>
                  <Ionicons color={colors.text} name="add" size={26} />
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {members.length === 0 ? (
          <SurfaceCard padding="none">
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons color={colors.textMuted} name="people-outline" size={22} />
              </View>
              <AppText style={styles.emptyTitle}>{TEAM_MEMBERS_EMPTY_TITLE}</AppText>
              <AppText style={styles.emptyBody}>{TEAM_MEMBERS_EMPTY_BODY}</AppText>
              <Button
                accessibilityLabel={TEAM_MEMBERS_ADD_BUTTON}
                iconName="add"
                style={styles.emptyCta}
                title={TEAM_MEMBERS_ADD_BUTTON}
                variant="surfaceLight"
                onPress={openInvite}
              />
            </View>
          </SurfaceCard>
        ) : (
          <SurfaceCard padding="none" style={styles.listCard}>
            {members.map((member, index) => (
              <TeamMemberRow
                key={member.id}
                member={member}
                showDividerBelow={index < members.length - 1}
                onRemove={setMemberToRemove}
              />
            ))}
          </SurfaceCard>
        )}
      </ScrollView>

      <InviteTeamMemberSheet
        visible={inviteOpen}
        onInvite={handleInvite}
        onRequestClose={() => setInviteOpen(false)}
      />
      <RemoveTeamMemberSheet
        member={memberToRemove}
        onConfirm={handleRemove}
        onRequestClose={() => setMemberToRemove(null)}
      />
    </View>
  );
}
