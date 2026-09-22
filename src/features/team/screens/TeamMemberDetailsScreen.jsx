import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppText,
  Button,
  DeleteButton,
  InlineCardError,
  SettingsNavRow,
  SettingsSection,
  SurfaceTextField,
} from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';
import { TeamMemberContactCard } from '../components/TeamMemberContactCard';
import {
  TEAM_INVITE_INVALID_NAME,
  TEAM_INVITE_NAME_PLACEHOLDER,
  TEAM_MEMBER_EDIT_NAME,
  TEAM_MEMBER_NOT_FOUND,
  TEAM_MEMBERS_LOADING,
  TEAM_MEMBER_SAVE_NAME,
  TEAM_REMOVE_BUTTON,
  TEAM_REMOVE_CONFIRM_BUTTON,
  TEAM_REMOVE_SHEET_BODY,
} from '../constants/teamMembersCopy';
import { useTeamMembers } from '../context/TeamMembersContext';
import { presentTeamMember } from '../utils/teamMemberDisplay';

/**
 * Full-screen teammate details. Room to add visits / stats later.
 */
export function TeamMemberDetailsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const tabBarHeight = useBottomTabBarHeight();
  const team = useTeamMembers();
  const {
    clearMemberError,
    handleRemove,
    handleRename,
    isLoading,
    isRemoving,
    isSavingName,
    memberError,
    members,
  } = team;

  useEffect(() => {
    if (!team.showTeamRow) {
      navigation.goBack();
    }
  }, [navigation, team.showTeamRow]);
  const memberId = String(route.params?.memberId ?? '').trim();
  const member = members.find((row) => row.id === memberId) ?? null;
  const presented = presentTeamMember(member);
  const storedName = String(member?.name ?? '').trim();
  const displayName = storedName || presented.title;
  const [name, setName] = useState(displayName);
  const [nameError, setNameError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    clearMemberError();
  }, [clearMemberError, memberId]);

  useEffect(() => {
    setName(String(member?.name ?? '').trim() || presentTeamMember(member).title);
    setNameError(null);
    setIsEditing(false);
  }, [member]);

  const trimmedName = name.trim();
  const nameDirty = trimmedName !== storedName && trimmedName !== displayName;
  const busy = isSavingName || isRemoving;

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
          paddingBottom: 24,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        errorWrap: {
          marginTop: 14,
        },
        nameField: {
          marginTop: 22,
        },
        save: {
          marginTop: 22,
        },
        cancel: {
          marginTop: 10,
        },
        footer: {
          paddingBottom: Math.max(tabBarHeight - 48, 4),
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 8,
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
    [colors, tabBarHeight],
  );

  const handleSave = async () => {
    if (!member) {
      return;
    }
    if (!trimmedName) {
      setNameError(TEAM_INVITE_INVALID_NAME);
      return;
    }
    if (busy) {
      return;
    }
    if (!nameDirty && trimmedName === storedName) {
      setIsEditing(false);
      return;
    }
    const result = await handleRename(member, trimmedName);
    if (result?.ok !== false) {
      setIsEditing(false);
    }
  };

  const cancelEdit = () => {
    if (busy) {
      return;
    }
    setName(displayName);
    setNameError(null);
    setIsEditing(false);
  };

  const startEdit = () => {
    if (busy) {
      return;
    }
    setName(displayName);
    setNameError(null);
    setIsEditing(true);
  };

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
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <TeamMemberContactCard member={member} />
        {memberError ? (
          <View style={styles.errorWrap}>
            <InlineCardError message={memberError} />
          </View>
        ) : null}
        {isEditing ? (
          <>
            <View style={styles.nameField}>
              <SurfaceTextField
                autoCapitalize="words"
                autoCorrect={false}
                autoFocus
                compact
                errorText={nameError ?? undefined}
                label="Name"
                maxLength={80}
                placeholder={TEAM_INVITE_NAME_PLACEHOLDER}
                value={name}
                onChangeText={(next) => {
                  setName(next);
                  if (nameError) setNameError(null);
                }}
              />
            </View>
            <View style={styles.save}>
              <Button
                disabled={busy || !trimmedName}
                fullWidth
                loading={isSavingName}
                title={TEAM_MEMBER_SAVE_NAME}
                onPress={() => {
                  void handleSave();
                }}
              />
            </View>
            <View style={styles.cancel}>
              <Button
                disabled={busy}
                fullWidth
                title="Cancel"
                variant="secondary"
                onPress={cancelEdit}
              />
            </View>
          </>
        ) : (
          <SettingsSection title="Actions">
            <SettingsNavRow
              disabled={busy}
              icon="create-outline"
              label={TEAM_MEMBER_EDIT_NAME}
              showDividerBelow={false}
              onPress={startEdit}
            />
          </SettingsSection>
        )}
      </ScrollView>
      {isEditing ? null : (
        <View style={styles.footer}>
          <DeleteButton
            disabled={busy}
            loading={isRemoving}
            title={TEAM_REMOVE_BUTTON}
            onPress={requestRemove}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
