import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  AppText,
  AppVersionFootnote,
  Button,
  InlineCardError,
  SurfaceCard,
} from '../../../components/ui';
import { useAuth } from '../../auth';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { AccountBookingLinkCard } from '../components/AccountBookingLinkCard';
import { AccountSettingsScreenSkeleton } from '../components/AccountSettingsScreenSkeleton';
import { AccountWebPanelNote } from '../components/AccountWebPanelNote';
import { ChangeBusinessSlugSheet } from '../components/ChangeBusinessSlugSheet';
import { DeleteAccountConfirmSheet } from '../components/DeleteAccountConfirmSheet';
import { useShopAccess } from '../../shop';
import { useAccountSettings } from '../hooks/useAccountSettings';
import { buildBookingLinkCardModel } from '../utils/accountSettingsModel';
import { SCREEN_GUTTER } from '../../../constants/layout';

export function AccountSettingsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollBottomPad = 28 + Math.max(tabBarHeight, 72);
  const [slugSheetVisible, setSlugSheetVisible] = useState(false);
  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);
  const [deleteEmailConfirmed, setDeleteEmailConfirmed] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const {
    business,
    isLoading,
    isFetching,
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
  } = useAccountSettings();
  const { isMember, isShopLoading } = useShopAccess();

  const signedInEmail = user?.email?.trim() || '—';
  const canEditSlug = Boolean(business?.id);
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
          paddingBottom: scrollBottomPad,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
          width: '100%',
        },
        section: {
          alignSelf: 'stretch',
          marginTop: 22,
        },
        sectionFirst: {
          marginTop: 0,
        },
        sectionTitleRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8,
          minHeight: 24,
        },
        sectionTitle: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        sectionTitleInRow: {
          flex: 1,
          marginRight: 8,
        },
        iconHit: {
          alignItems: 'center',
          height: 32,
          justifyContent: 'center',
          marginLeft: 8,
          width: 32,
        },
        iconHitDisabled: {
          opacity: 0.35,
        },
        accountEmail: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.15,
          lineHeight: 21,
        },
        loadErrorRetry: {
          marginTop: 12,
        },
        deleteHint: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          marginTop: 12,
        },
        dangerBody: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.05,
          lineHeight: 20,
        },
        dangerButton: {
          marginTop: 16,
        },
        signOutSection: {
          marginTop: 28,
        },
        signOutButton: {
          marginTop: 0,
        },
        businessBody: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          lineHeight: 22,
        },
        businessCta: {
          marginTop: 16,
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

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    const { error } = await signOut();
    setIsSigningOut(false);
    if (error) {
      Alert.alert('Sign out failed', safeUserFacingMessage(error));
    }
  }, [signOut]);

  const handleOpenBookingPage = useCallback(() => {
    if (!linkModel.httpsUrl) return;
    void Linking.openURL(linkModel.httpsUrl);
  }, [linkModel.httpsUrl]);

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

  const signedInSection = (
    <View style={[styles.section, styles.sectionFirst]}>
      <View style={styles.sectionTitleRow}>
        <AppText style={styles.sectionTitle}>Account</AppText>
      </View>
      <SurfaceCard>
        <AppText selectable style={styles.accountEmail}>
          {signedInEmail}
        </AppText>
      </SurfaceCard>
    </View>
  );

  const signOutSection = (
    <View style={styles.signOutSection}>
      <Button
        accessibilityHint="Signs you out of ServiceLink on this device"
        accessibilityLabel="Log out"
        fullWidth
        loading={isSigningOut}
        style={styles.signOutButton}
        title="Log out"
        variant="secondary"
        onPress={() => void handleSignOut()}
      />
    </View>
  );

  const webPanelNote = <AccountWebPanelNote />;

  let settingsBody;
  if (isLoading || isShopLoading) {
    settingsBody = (
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <AccountSettingsScreenSkeleton />
      </ScrollView>
    );
  } else if (loadError) {
    settingsBody = (
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <InlineCardError message={loadError} />
        <Button
          accessibilityHint="Attempts to load account settings again"
          accessibilityLabel="Try again"
          fullWidth
          loading={Boolean(isFetching && !isLoading)}
          style={styles.loadErrorRetry}
          title="Try again"
          variant="secondary"
          onPress={() => void refetch()}
        />
      </ScrollView>
    );
  } else if (isMember) {
    settingsBody = (
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {signedInSection}
        {signOutSection}
        <AppVersionFootnote />
      </ScrollView>
    );
  } else if (!business?.id) {
    settingsBody = (
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {signedInSection}

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <AppText style={styles.sectionTitle}>Business</AppText>
          </View>
          <SurfaceCard>
            <AppText style={styles.businessBody}>
              Add a business profile to manage your booking link and public page.
            </AppText>
            <Button
              fullWidth
              style={styles.businessCta}
              title="Open booking link"
              variant="secondary"
              onPress={() => navigation.navigate(ROUTES.BOOKING_LINK)}
            />
          </SurfaceCard>
        </View>

        {webPanelNote}
        {signOutSection}
        <AppVersionFootnote />
      </ScrollView>
    );
  } else {
    settingsBody = (
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {signedInSection}

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <AppText style={[styles.sectionTitle, styles.sectionTitleInRow]}>Booking link</AppText>
            <Pressable
              accessibilityLabel="Open public booking page"
              accessibilityRole="button"
              accessibilityState={{ disabled: !linkModel.hasSlug }}
              disabled={!linkModel.hasSlug}
              hitSlop={8}
              style={[styles.iconHit, !linkModel.hasSlug && styles.iconHitDisabled]}
              onPress={handleOpenBookingPage}
            >
              <Ionicons color={colors.textMuted} name="open-outline" size={22} />
            </Pressable>
          </View>
          <AccountBookingLinkCard
            canEditSlug={canEditSlug}
            displayLink={linkModel.displayLink}
            hasSlug={linkModel.hasSlug}
            httpsUrl={linkModel.httpsUrl}
            onChangeLink={() => setSlugSheetVisible(true)}
          />
        </View>

        {webPanelNote}

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <AppText style={styles.sectionTitle}>Danger zone</AppText>
          </View>
          <SurfaceCard>
            <AppText style={styles.dangerBody}>
              This closes your account for good. Your profile and data will be deleted.
            </AppText>
            <Button
              accessibilityLabel="Delete account"
              fullWidth
              style={styles.dangerButton}
              title="Delete account"
              variant="danger"
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
          </SurfaceCard>
        </View>

        {signOutSection}
        <AppVersionFootnote />
      </ScrollView>
    );
  }

  return (
    <View style={styles.root}>
      {settingsBody}

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
