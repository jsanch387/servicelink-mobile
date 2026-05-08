import * as WebBrowser from 'expo-web-browser';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useCallback, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, Button, InlineCardError, SurfaceCard } from '../../../components/ui';
import { useAuth } from '../../auth';
import { ROUTES } from '../../../routes/routes';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { AccountBookingLinkCard } from '../components/AccountBookingLinkCard';
import { AccountSettingsScreenSkeleton } from '../components/AccountSettingsScreenSkeleton';
import { AccountSubscriptionCard } from '../components/AccountSubscriptionCard';
import { ChangeBusinessSlugSheet } from '../components/ChangeBusinessSlugSheet';
import { DeleteAccountConfirmSheet } from '../components/DeleteAccountConfirmSheet';
import { useAccountSettings } from '../hooks/useAccountSettings';
import { STRIPE_BILLING_PORTAL_AUTH_RETURN_URL } from '../constants/stripeBillingPortalReturnUrl';
import { refetchAccountAfterPortal } from '../utils/refetchAccountAfterPortal';
import {
  buildBookingLinkCardModel,
  buildSubscriptionCardModel,
} from '../utils/accountSettingsModel';
import { SCREEN_GUTTER } from '../../../constants/layout';

export function AccountSettingsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { user, session, signOut } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollBottomPad = 28 + Math.max(tabBarHeight, 72);
  const [slugSheetVisible, setSlugSheetVisible] = useState(false);
  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);
  const [deleteEmailConfirmed, setDeleteEmailConfirmed] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const {
    ownerProfile,
    business,
    isLoading,
    loadError,
    refetch,
    updateSlug,
    isSavingSlug,
    saveSlugError,
    resetSaveSlugError,
    deleteAccount,
    isDeletingAccount,
    deleteAccountError,
    resetDeleteAccountError,
    createBillingPortalSession,
    isCreatingBillingPortalSession,
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
          paddingHorizontal: SCREEN_GUTTER,
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
        deleteHint: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          marginTop: -4,
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

  const handleManageSubscription = useCallback(async () => {
    const token = session?.access_token ?? null;
    const userId = user?.id ?? null;
    if (!token || !userId) {
      Alert.alert('Sign in required', 'Please sign in again to continue.');
      return;
    }

    const created = await createBillingPortalSession();
    if ('error' in created) {
      Alert.alert(
        'Could not open billing portal',
        safeUserFacingMessage(created.error, { fallback: 'Something went wrong. Try again.' }),
      );
      return;
    }

    try {
      await WebBrowser.openAuthSessionAsync(created.url, STRIPE_BILLING_PORTAL_AUTH_RETURN_URL);
    } finally {
      await refetchAccountAfterPortal({ userId });
    }
  }, [createBillingPortalSession, session?.access_token, user?.id]);

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        colors={[colors.accent]}
        onRefresh={async () => {
          setIsManualRefreshing(true);
          try {
            await refetch();
          } finally {
            setIsManualRefreshing(false);
          }
        }}
        refreshing={isManualRefreshing}
        tintColor={colors.accent}
      />
    ),
    [colors.accent, isManualRefreshing, refetch],
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
        {isManualRefreshing ? <AppText style={styles.updatingHint}>Updating…</AppText> : null}
        <View style={styles.signedInBlock}>
          <AppText style={styles.signedInLabel}>Signed in as</AppText>
          <AppText selectable style={styles.signedInEmail}>
            {signedInEmail}
          </AppText>
        </View>

        <AccountSubscriptionCard
          {...subscriptionModel}
          manageSubscriptionLoading={isCreatingBillingPortalSession}
          onManageSubscriptionPress={() => void handleManageSubscription()}
        />

        <AccountBookingLinkCard
          canEditSlug={canEditSlug}
          displayLink={linkModel.displayLink}
          hasSlug={linkModel.hasSlug}
          httpsUrl={linkModel.httpsUrl}
          onChangeLink={() => setSlugSheetVisible(true)}
        />

        <Button
          fullWidth
          labelColor={colors.danger}
          outlineBgPressed="rgba(220, 38, 38, 0.08)"
          outlineColor={colors.danger}
          title="Delete account"
          variant="outline"
          onPress={() => {
            setDeleteSheetVisible(true);
            setDeleteEmailConfirmed(false);
          }}
        />
        {deleteEmailConfirmed ? (
          <AppText style={styles.deleteHint}>
            Email confirmed. Deletion request is not connected yet.
          </AppText>
        ) : null}
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
      <DeleteAccountConfirmSheet
        deleteError={deleteAccountError}
        expectedEmail={signedInEmail === '—' ? '' : signedInEmail}
        isDeleting={isDeletingAccount}
        visible={deleteSheetVisible}
        onClearDeleteError={resetDeleteAccountError}
        onConfirm={async (confirmEmail) => {
          try {
            await deleteAccount({ confirmEmail });
            const { error } = await signOut();
            if (error) {
              Alert.alert('Sign out failed', safeUserFacingMessage(error));
              return;
            }
            setDeleteEmailConfirmed(true);
            setDeleteSheetVisible(false);
          } catch {
            /* surfaced via deleteAccountError */
          }
        }}
        onRequestClose={() => {
          resetDeleteAccountError();
          setDeleteSheetVisible(false);
        }}
      />
    </View>
  );
}
