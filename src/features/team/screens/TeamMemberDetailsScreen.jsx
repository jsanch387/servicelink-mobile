import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, DeleteButton, DetailsSectionCard, InlineCardError } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';
import { TeamMemberContactCard } from '../components/TeamMemberContactCard';
import { TeamNameSheet } from '../components/TeamNameSheet';
import { TeamRoleSheet } from '../components/TeamRoleSheet';
import {
  TEAM_MEMBER_EDIT_NAME,
  TEAM_MEMBER_NOT_FOUND,
  TEAM_MEMBERS_LOADING,
  TEAM_REMOVE_BUTTON,
  TEAM_REMOVE_CONFIRM_BUTTON,
  TEAM_REMOVE_SHEET_BODY,
} from '../constants/teamMembersCopy';
import { storedTeamRole, teamRoleCopy } from '../constants/teamRoles';
import { useTeamMembers } from '../context/TeamMembersContext';
import { presentTeamMember } from '../utils/teamMemberDisplay';

/**
 * Teammate details. Centered identity, then Details, Access, and remove.
 */
export function TeamMemberDetailsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const team = useTeamMembers();
  const {
    clearMemberError,
    handleChangeRole,
    handleRemove,
    handleRename,
    isLoading,
    isRemoving,
    isSavingName,
    isSavingRole,
    memberError,
    members,
  } = team;

  useEffect(() => {
    if (team.teamGateSettled && !team.canManageTeam) {
      navigation.goBack();
    }
  }, [navigation, team.canManageTeam, team.teamGateSettled]);

  const memberId = String(route.params?.memberId ?? '').trim();
  const member = members.find((row) => row.id === memberId) ?? null;
  const presented = presentTeamMember(member);
  const storedName = String(member?.name ?? '').trim();
  const displayName = storedName || presented.title;
  const email = String(member?.email ?? '').trim();
  const [nameSheetOpen, setNameSheetOpen] = useState(false);
  const [roleSheetOpen, setRoleSheetOpen] = useState(false);
  const currentRole = storedTeamRole(member?.role);
  const currentRoleLabel = teamRoleCopy(currentRole).label;

  useEffect(() => {
    clearMemberError();
  }, [clearMemberError, memberId]);

  const busy = isSavingName || isSavingRole || isRemoving;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        scroll: {
          flex: 1,
        },
        content: {
          paddingBottom: 16,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 28,
        },
        removeFooter: {
          paddingBottom: 24,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 8,
        },
        errorWrap: {
          marginTop: 16,
        },
        section: {
          marginTop: 28,
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          minHeight: 56,
          paddingHorizontal: 16,
          width: '100%',
        },
        pressed: {
          backgroundColor: colors.buttonGhostPressed,
        },
        labelCol: {
          justifyContent: 'center',
          marginRight: 12,
        },
        roleLabelCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
          paddingRight: 12,
        },
        label: {
          color: colors.text,
          fontSize: 16,
          letterSpacing: -0.2,
        },
        valueCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        value: {
          alignSelf: 'stretch',
          color: colors.textMuted,
          fontSize: 16,
          letterSpacing: -0.2,
          textAlign: 'right',
        },
        chevronCol: {
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 8,
          width: 18,
        },
        rule: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginLeft: 16,
        },
        notFound: {
          alignItems: 'center',
          paddingTop: 48,
        },
        notFoundText: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
        },
      }),
    [colors],
  );

  const requestRemove = () => {
    if (!member || busy) {
      return;
    }
    Alert.alert(`Remove ${displayName}?`, TEAM_REMOVE_SHEET_BODY, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: TEAM_REMOVE_CONFIRM_BUTTON,
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const result = await handleRemove(member);
            if (result?.ok) {
              navigation.goBack();
            }
          })();
        },
      },
    ]);
  };

  if (!member) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.root}>
        <View style={styles.notFound}>
          <AppText style={styles.notFoundText}>
            {isLoading ? TEAM_MEMBERS_LOADING : TEAM_MEMBER_NOT_FOUND}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <TeamMemberContactCard member={member} />
        {memberError ? (
          <View style={styles.errorWrap}>
            <InlineCardError message={memberError} />
          </View>
        ) : null}

        <View style={styles.section}>
          <DetailsSectionCard flush title="Details">
            <Pressable
              accessibilityLabel={TEAM_MEMBER_EDIT_NAME}
              accessibilityRole="button"
              disabled={busy}
              onPress={() => setNameSheetOpen(true)}
            >
              {({ pressed }) => (
                <View style={[styles.row, pressed && styles.pressed]}>
                  <View style={styles.labelCol}>
                    <AppText style={styles.label}>Name</AppText>
                  </View>
                  <View style={styles.valueCol}>
                    <AppText numberOfLines={1} style={styles.value}>
                      {displayName}
                    </AppText>
                  </View>
                  <View style={styles.chevronCol}>
                    <Ionicons color={colors.textMuted} name="chevron-forward" size={16} />
                  </View>
                </View>
              )}
            </Pressable>
            <View style={styles.rule} />
            <View style={styles.row}>
              <View style={styles.labelCol}>
                <AppText style={styles.label}>Email</AppText>
              </View>
              <View style={styles.valueCol}>
                <AppText numberOfLines={1} style={styles.value}>
                  {email}
                </AppText>
              </View>
            </View>
          </DetailsSectionCard>
        </View>

        <View style={styles.section}>
          <DetailsSectionCard flush title="Access">
            <Pressable
              accessibilityLabel={`Role. Currently ${currentRoleLabel}. Tap to change.`}
              accessibilityRole="button"
              disabled={busy}
              onPress={() => setRoleSheetOpen(true)}
            >
              {({ pressed }) => (
                <View style={[styles.row, pressed && styles.pressed]}>
                  <View style={styles.roleLabelCol}>
                    <AppText numberOfLines={1} style={styles.label}>
                      {currentRoleLabel}
                    </AppText>
                  </View>
                  <View style={styles.chevronCol}>
                    <Ionicons color={colors.textMuted} name="chevron-down" size={16} />
                  </View>
                </View>
              )}
            </Pressable>
          </DetailsSectionCard>
        </View>
      </ScrollView>
      <View style={styles.removeFooter}>
        <DeleteButton
          disabled={busy}
          loading={isRemoving}
          title={TEAM_REMOVE_BUTTON}
          onPress={requestRemove}
        />
      </View>
      <TeamNameSheet
        errorMessage={nameSheetOpen ? memberError : null}
        saving={isSavingName}
        value={displayName}
        visible={nameSheetOpen}
        onRequestClose={() => setNameSheetOpen(false)}
        onSave={(nextName) => {
          void (async () => {
            const result = await handleRename(member, nextName);
            if (result?.ok) {
              setNameSheetOpen(false);
            }
          })();
        }}
      />
      <TeamRoleSheet
        errorMessage={roleSheetOpen ? memberError : null}
        saving={isSavingRole}
        value={currentRole}
        visible={roleSheetOpen}
        onRequestClose={() => setRoleSheetOpen(false)}
        onSave={(nextRole) => {
          void (async () => {
            const result = await handleChangeRole(member, nextRole);
            if (result?.ok) {
              setRoleSheetOpen(false);
            }
          })();
        }}
      />
    </SafeAreaView>
  );
}
