import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, Button, InlineCardError, SurfaceCard } from '../../../components/ui';
import { useAuth } from '../../auth';
import { ROUTES } from '../../../routes/routes';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { AccountBookingLinkCard } from '../components/AccountBookingLinkCard';
import { AccountSettingsScreenSkeleton } from '../components/AccountSettingsScreenSkeleton';
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
    isFetching,
    loadError,
    refetch,
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
        updatingHint: {
          color: colors.textMuted,
          fontSize: 13,
          marginBottom: -8,
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

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        colors={[colors.accent]}
        onRefresh={refetch}
        refreshing={Boolean(isFetching && !isLoading)}
        tintColor={colors.accent}
      />
    ),
    [colors.accent, isFetching, isLoading, refetch],
  );

  if (isLoading) {
    return (
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <AccountSettingsScreenSkeleton />
        </ScrollView>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <InlineCardError message={loadError} />
        </ScrollView>
      </View>
    );
  }

  if (!business?.id) {
    return (
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <View style={styles.signedInBlock}>
            <AppText style={styles.signedInLabel}>Signed in as</AppText>
            <AppText selectable style={styles.signedInEmail}>
              {signedInEmail}
            </AppText>
          </View>
          <SurfaceCard>
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
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {isFetching && !isLoading ? <AppText style={styles.updatingHint}>Updating…</AppText> : null}
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

        <Button fullWidth title="Delete account" variant="danger" onPress={() => {}} />
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
