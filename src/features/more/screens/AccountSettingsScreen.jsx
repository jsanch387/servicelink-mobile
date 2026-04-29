import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, Button, InlineCardError, SurfaceCard } from '../../../components/ui';
import { useAuth } from '../../auth';
import { ROUTES } from '../../../routes/routes';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { AccountBookingLinkCard } from '../components/AccountBookingLinkCard';
import { AccountSubscriptionCard } from '../components/AccountSubscriptionCard';
import { ChangeBusinessSlugSheet } from '../components/ChangeBusinessSlugSheet';
import { useAccountSettings } from '../hooks/useAccountSettings';
import {
  buildBookingLinkCardModel,
  buildSubscriptionCardModel,
} from '../utils/accountSettingsModel';

export function AccountSettingsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollBottomPad = 28 + Math.max(tabBarHeight, 72);
  const [slugSheetVisible, setSlugSheetVisible] = useState(false);

  const {
    ownerProfile,
    business,
    isLoading,
    loadError,
    updateSlug,
    isSavingSlug,
    saveSlugError,
    resetSaveSlugError,
  } = useAccountSettings();

  const signedInEmail = user?.email?.trim() || '—';
  const canEditSlug = Boolean(business?.id);
  const subscriptionModel = useMemo(() => buildSubscriptionCardModel(ownerProfile), [ownerProfile]);
  const linkModel = useMemo(
    () => buildBookingLinkCardModel(business?.business_slug),
    [business?.business_slug],
  );

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
          alignItems: 'stretch',
          gap: 16,
          paddingBottom: scrollBottomPad,
          paddingHorizontal: 20,
          paddingTop: 16,
          width: '100%',
        },
        boot: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
        },
        signedInBlock: {
          gap: 4,
        },
        signedInLabel: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 12,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        },
        signedInEmail: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
      }),
    [colors, scrollBottomPad],
  );

  const handleSaveSlug = useCallback(
    async (slugRaw) => {
      try {
        resetSaveSlugError();
        await updateSlug({ slugRaw });
        setSlugSheetVisible(false);
      } catch {
        /* surfaced via saveSlugError */
      }
    },
    [resetSaveSlugError, updateSlug],
  );

  if (isLoading) {
    return (
      <View style={[styles.root, styles.boot]}>
        <ActivityIndicator
          accessibilityLabel="Loading account"
          color={colors.accent}
          size="large"
        />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.root, { paddingHorizontal: 20, paddingTop: 16 }]}>
        <InlineCardError message={loadError} />
      </View>
    );
  }

  if (!business?.id) {
    return (
      <View style={[styles.root, { paddingHorizontal: 20, paddingTop: 16 }]}>
        <View style={styles.signedInBlock}>
          <AppText style={styles.signedInLabel}>Signed in as</AppText>
          <AppText selectable style={styles.signedInEmail}>
            {signedInEmail}
          </AppText>
        </View>
        <SurfaceCard style={{ marginTop: 16 }}>
          <AppText style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>
            Add a business profile to manage your booking link and subscription.
          </AppText>
          <Button
            fullWidth
            style={{ marginTop: 16 }}
            title="Open booking link"
            variant="secondary"
            onPress={() => navigation.navigate(ROUTES.BOOKING_LINK)}
          />
        </SurfaceCard>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.signedInBlock}>
          <AppText style={styles.signedInLabel}>Signed in as</AppText>
          <AppText selectable style={styles.signedInEmail}>
            {signedInEmail}
          </AppText>
        </View>

        <AccountSubscriptionCard {...subscriptionModel} />

        <AccountBookingLinkCard
          canEditSlug={canEditSlug}
          displayLink={linkModel.displayLink}
          hasSlug={linkModel.hasSlug}
          httpsUrl={linkModel.httpsUrl}
          onChangeLink={() => setSlugSheetVisible(true)}
        />
      </ScrollView>

      <ChangeBusinessSlugSheet
        initialSlug={linkModel.slug}
        isSaving={isSavingSlug}
        saveError={saveSlugError}
        visible={slugSheetVisible}
        onClearSaveError={resetSaveSlugError}
        onRequestClose={() => {
          resetSaveSlugError();
          setSlugSheetVisible(false);
        }}
        onSave={handleSaveSlug}
      />
    </View>
  );
}
