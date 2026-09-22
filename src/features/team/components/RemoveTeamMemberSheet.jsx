import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button, InlineCardError } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  TEAM_REMOVE_CONFIRM_BUTTON,
  TEAM_REMOVE_SHEET_BODY,
  TEAM_REMOVE_SHEET_TITLE,
} from '../constants/teamMembersCopy';

/**
 * Confirm remove — same copy as web. Caller owns the server action.
 */
export function RemoveTeamMemberSheet({
  member,
  isRemoving = false,
  errorMessage = null,
  onRequestClose,
  onConfirm,
}) {
  const { colors } = useTheme();
  const visible = Boolean(member);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        copy: {
          gap: 16,
          paddingBottom: 8,
        },
        body: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 22,
        },
        email: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
          letterSpacing: -0.2,
        },
        footer: {
          minHeight: 52,
          paddingTop: 8,
        },
        row: {
          flexDirection: 'row',
          gap: 10,
        },
        rowGrow: {
          flex: 1,
        },
      }),
    [colors],
  );

  return (
    <BottomSheetModal
      fitContent
      footer={
        <View style={styles.footer}>
          <View style={styles.row}>
            <View style={styles.rowGrow}>
              <Button
                disabled={isRemoving}
                fullWidth
                title="Cancel"
                variant="secondary"
                onPress={onRequestClose}
              />
            </View>
            <View style={styles.rowGrow}>
              <Button
                accessibilityHint={`Removes ${member?.email ?? 'this team member'}`}
                accessibilityLabel={TEAM_REMOVE_CONFIRM_BUTTON}
                disabled={isRemoving}
                fullWidth
                loading={isRemoving}
                title={TEAM_REMOVE_CONFIRM_BUTTON}
                variant="danger"
                onPress={() => {
                  if (member && !isRemoving) onConfirm?.(member);
                }}
              />
            </View>
          </View>
        </View>
      }
      allowBackdropClose={!isRemoving}
      title={TEAM_REMOVE_SHEET_TITLE}
      visible={visible}
      onRequestClose={isRemoving ? () => {} : onRequestClose}
    >
      <View style={styles.copy}>
        {errorMessage ? <InlineCardError message={errorMessage} /> : null}
        <AppText style={styles.body}>{TEAM_REMOVE_SHEET_BODY}</AppText>
        {member?.email ? (
          <AppText numberOfLines={1} style={styles.email}>
            {member.email}
          </AppText>
        ) : null}
      </View>
    </BottomSheetModal>
  );
}
