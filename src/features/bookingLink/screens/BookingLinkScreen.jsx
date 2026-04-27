import { useMemo, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { AppText, Button, SurfaceTextField } from '../../../components/ui';
import { useTheme } from '../../../theme';

export function BookingLinkScreen() {
  const { colors } = useTheme();
  const [isEditing, setIsEditing] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
          padding: 20,
        },
        header: {
          color: colors.text,
          fontSize: 24,
          fontWeight: '700',
          marginBottom: 8,
        },
        subheader: {
          color: colors.textMuted,
          fontSize: 14,
          marginBottom: 20,
        },
        profileCard: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          padding: 14,
        },
        rowLabel: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '700',
          marginBottom: 6,
          marginTop: 12,
          textTransform: 'uppercase',
        },
        rowValue: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
        },
        badge: {
          alignSelf: 'flex-start',
          backgroundColor: colors.shell,
          borderColor: colors.border,
          borderRadius: 999,
          borderWidth: 1,
          marginBottom: 12,
          paddingHorizontal: 10,
          paddingVertical: 4,
        },
        badgeText: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '700',
        },
        editCta: {
          marginTop: 16,
        },
        modalBackdrop: {
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.35)',
          flex: 1,
          justifyContent: 'center',
          padding: 20,
        },
        modalCard: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.borderStrong,
          borderRadius: 16,
          borderWidth: 1,
          padding: 16,
          width: '100%',
        },
        modalTitle: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '700',
          marginBottom: 8,
        },
        modalBody: {
          color: colors.textMuted,
          fontSize: 14,
          lineHeight: 20,
          marginBottom: 14,
        },
        modalActions: {
          flexDirection: 'row',
          gap: 10,
        },
        modalAction: {
          flex: 1,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <AppText style={styles.header}>Business profile</AppText>
      <AppText style={styles.subheader}>
        This is what customers see before they book your service.
      </AppText>

      <View style={styles.profileCard}>
        <View style={styles.badge}>
          <AppText style={styles.badgeText}>{isEditing ? 'Edit mode' : 'View mode'}</AppText>
        </View>

        {isEditing ? (
          <>
            <SurfaceTextField
              label="Business name"
              placeholder="Enter your business name"
              value="ServiceLink Studio"
              onChangeText={() => {}}
            />
            <SurfaceTextField
              label="Tagline"
              placeholder="Your short one-line intro"
              value="Premium home services with fast response"
              onChangeText={() => {}}
            />
          </>
        ) : (
          <>
            <AppText style={styles.rowLabel}>Business name</AppText>
            <AppText style={styles.rowValue}>ServiceLink Studio</AppText>

            <AppText style={styles.rowLabel}>Tagline</AppText>
            <AppText style={styles.rowValue}>Premium home services with fast response</AppText>
          </>
        )}

        <View style={styles.editCta}>
          <Button
            title={isEditing ? 'Done editing' : 'Edit profile'}
            variant={isEditing ? 'surfaceLight' : 'outline'}
            onPress={() => setIsEditing((v) => !v)}
          />
        </View>
      </View>

      <Modal animationType="fade" transparent visible>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText style={styles.modalTitle}>Your public booking profile</AppText>
            <AppText style={styles.modalBody}>
              This is your public booking profile. Add a logo and a cover photo to look more
              professional, then edit your business info so customers trust you right away.
            </AppText>
            <View style={styles.modalActions}>
              <View style={styles.modalAction}>
                <Button title="Later" variant="outline" onPress={() => {}} />
              </View>
              <View style={styles.modalAction}>
                <Button
                  title="Edit profile"
                  variant="surfaceLight"
                  onPress={() => setIsEditing(true)}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
