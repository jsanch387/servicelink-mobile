import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AnimatedCheckmark,
  AppText,
  AppTextInput,
  Button,
  useToast,
  SurfaceInputRow,
  SurfacePhoneField,
  SurfaceTextField,
} from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import {
  getSpecialtiesForBusinessType,
  specialtiesAllowedForBusinessType,
} from '../../../constants/businessSpecialties';
import { BUSINESS_TYPE_OPTIONS } from '../../../constants/businessTypes';
import { MAX_BUSINESS_SLUG_LEN } from '../../more/utils/businessSlug';
import { OnboardingWelcomeView } from '../components/OnboardingWelcomeView';
import { resolveBookingSlugAvailability } from '../api/checkBookingSlug';
import {
  finishOnboardingSetup,
  phoneDigitsForOnboarding,
  practiceBookingUrl,
  saveOnboardingIndustry,
} from '../api/onboardingV3Api';
import { MAX_ONBOARDING_BUSINESS_NAME_LENGTH } from '../constants/onboardingInputLimits';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { fireSuccessHaptic } from '../../../utils/feedbackHaptics';

const STEP_INDUSTRY = 'industry';
const STEP_BUSINESS = 'business';
const STEP_LIVE = 'live';

const INDUSTRY_ICONS = {
  'Vehicle Services': 'car-outline',
  'Pet Services': 'paw-outline',
  'Property Services': 'home-outline',
  Other: 'ellipsis-horizontal',
};

const LINK_HOST = 'myservicelink.app/';
const MIN_SLUG_LENGTH = 3;
const SLUG_CHECK_DEBOUNCE_MS = 800;
const LIVE_GREEN_DARK = '#34c759';
const LIVE_GREEN_LIGHT = '#15803d';

const CUSTOMER_PATH = [
  {
    icon: 'pricetag-outline',
    title: 'Choose a service',
    detail: 'Straight from your service menu',
  },
  {
    icon: 'calendar-outline',
    title: 'Pick a date & time',
    detail: "Only times you're open",
  },
  {
    icon: 'checkmark',
    title: 'Booked',
    detail: 'The appointment lands on your calendar',
    done: true,
  },
];

function slugFromBusinessName(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, MAX_BUSINESS_SLUG_LEN);
}

function shopInitial(name) {
  const match = String(name ?? '')
    .trim()
    .match(/[A-Za-z0-9]/);
  return match ? match[0].toUpperCase() : 'S';
}

function sanitizeTypedSlug(raw) {
  return String(raw ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, MAX_BUSINESS_SLUG_LEN);
}

/**
 * Two-step setup. Step 1 saves the industry. Finish claims the booking link.
 * Book a test appointment opens the public page in the phone's browser, then leaves setup.
 */
export function OnboardingPreviewScreen({ onLeave, startWithWelcome = true }) {
  const navigation = useNavigation();
  const toast = useToast();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [showWelcome, setShowWelcome] = useState(startWithWelcome);
  const [step, setStep] = useState(STEP_INDUSTRY);
  const [industry, setIndustry] = useState('');
  const [trades, setTrades] = useState([]);
  const [businessName, setBusinessName] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [customSlug, setCustomSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [slugAvailability, setSlugAvailability] = useState({ status: 'idle', slug: '' });
  const [saving, setSaving] = useState(false);
  const [claimedSlug, setClaimedSlug] = useState('');

  const slug = slugEdited ? customSlug : slugFromBusinessName(businessName);
  const tradeOptions = industry ? getSpecialtiesForBusinessType(industry) : [];
  const canContinue = industry.trim().length > 0 && trades.length > 0;
  const slugTooShort = slug.length > 0 && slug.length < MIN_SLUG_LENGTH;
  const suggestedSlug =
    slugAvailability.status === 'taken' && slugAvailability.suggestion
      ? slugAvailability.suggestion
      : '';
  const resolvedSlug = suggestedSlug || slug;
  const slugIsTaken = slugAvailability.status === 'taken' && !suggestedSlug;
  const phoneDigits = phoneDigitsForOnboarding(phone);
  const phoneOk = phoneDigits.length === 0 || phoneDigits.length === 10;
  const canFinish =
    businessName.trim().length > 0 &&
    !slugTooShort &&
    !slugIsTaken &&
    phoneOk &&
    resolvedSlug.length >= MIN_SLUG_LENGTH;

  const saveIndustry = async () => {
    if (!canContinue || saving) return;
    setSaving(true);
    const result = await saveOnboardingIndustry({ industry, trades });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setStep(STEP_BUSINESS);
  };

  const finishSetup = async () => {
    if (!canFinish || saving) return;
    setSaving(true);
    const result = await finishOnboardingSetup({
      businessName: businessName.trim(),
      slug: resolvedSlug,
      phone,
      industry,
      trades,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setClaimedSlug(result.slug);
    setStep(STEP_LIVE);
  };

  const bookTestAppointment = () => {
    const liveSlug = claimedSlug || resolvedSlug;
    if (!liveSlug) return;
    void Linking.openURL(practiceBookingUrl(liveSlug));
    exit();
  };

  useEffect(() => {
    if (slug.length < MIN_SLUG_LENGTH) {
      setSlugAvailability({ status: 'idle', slug });
      return undefined;
    }
    setSlugAvailability({ status: 'checking', slug });
    let cancelled = false;
    const timer = setTimeout(() => {
      void resolveBookingSlugAvailability(slug).then((result) => {
        if (!cancelled) setSlugAvailability(result);
      });
    }, SLUG_CHECK_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug]);

  const exit = () => {
    if (onLeave) {
      void onLeave();
      return;
    }
    navigation.goBack();
  };

  const selectIndustry = (value) => {
    setIndustry(value);
    setTrades(specialtiesAllowedForBusinessType(value, trades));
  };

  const toggleTrade = (slugValue) => {
    setTrades((current) => {
      if (current.includes(slugValue)) {
        return current.filter((item) => item !== slugValue);
      }
      return [...current, slugValue];
    });
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        flex: {
          flex: 1,
        },
        topBar: {
          alignItems: 'center',
          flexDirection: 'row',
          minHeight: 44,
          paddingHorizontal: SCREEN_GUTTER,
          zIndex: 1,
        },
        topBarEnd: {
          justifyContent: 'flex-end',
        },
        liveGlowSlot: {
          height: 0,
          left: 0,
          overflow: 'visible',
          position: 'absolute',
          right: 0,
          top: 0,
          zIndex: 0,
        },
        liveGlow: {
          height: 280,
        },
        scrollContent: {
          paddingBottom: 24,
          paddingHorizontal: SCREEN_GUTTER,
        },
        formScroll: {
          paddingTop: 36,
        },
        screenTitle: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 28,
          letterSpacing: -0.6,
          lineHeight: 34,
          marginBottom: 12,
        },
        industryTitle: {
          fontSize: 22,
          letterSpacing: -0.4,
          lineHeight: 28,
        },
        industryGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginHorizontal: -6,
        },
        industrySlot: {
          padding: 6,
          width: '50%',
        },
        industryHit: {
          width: '100%',
        },
        industrySquare: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 16,
          borderWidth: 1,
          height: 116,
          justifyContent: 'center',
          paddingHorizontal: 12,
          width: '100%',
        },
        industrySquareSelected: {
          backgroundColor: colors.text,
          borderColor: colors.text,
        },
        pressed: {
          opacity: 0.85,
        },
        industryLabel: {
          color: colors.text,
          fontSize: 14,
          fontWeight: '600',
          lineHeight: 18,
          marginTop: 10,
          textAlign: 'center',
        },
        industryLabelSelected: {
          color: colors.shell,
        },
        tradesLabel: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          marginBottom: 12,
          marginTop: 24,
        },
        chips: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        chip: {
          backgroundColor: colors.cardSurface,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
        },
        chipSelected: {
          backgroundColor: colors.text,
        },
        chipPressed: {
          opacity: 0.85,
        },
        chipLabel: {
          color: colors.text,
          fontSize: 14,
          fontWeight: '600',
        },
        chipLabelSelected: {
          color: colors.shell,
        },
        linkField: {
          marginBottom: 12,
        },
        phoneField: {
          marginBottom: 0,
        },
        phoneLabelRow: {
          alignItems: 'baseline',
          flexDirection: 'row',
          gap: 4,
        },
        fieldLabel: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
        },
        optionalLabel: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
        },
        footer: {
          paddingBottom: Math.max(insets.bottom, 12),
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 8,
        },
        footerRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
        },
        footerHalf: {
          flex: 1,
        },
        linkSection: {
          marginTop: 8,
        },
        linkLabel: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          marginBottom: 8,
        },
        linkPathCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        linkPathDisplay: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
        },
        linkActionHit: {
          justifyContent: 'center',
          minHeight: 44,
          paddingLeft: 4,
        },
        linkAction: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
        },
        linkHost: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
        },
        linkPath: {
          color: colors.text,
          flex: 1,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          height: 22,
          margin: 0,
          padding: 0,
          paddingLeft: 2,
        },
        linkStatus: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 6,
          marginTop: 6,
        },
        linkStatusText: {
          color: colors.textSuccess,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 16,
        },
        linkError: {
          color: colors.danger,
          fontSize: 12,
          fontWeight: '500',
          lineHeight: 16,
          marginTop: 6,
        },
        liveHero: {
          alignItems: 'center',
          paddingTop: 36,
        },
        liveTitle: {
          color: colors.text,
          fontSize: 26,
          fontWeight: '700',
          letterSpacing: -0.4,
          lineHeight: 32,
          marginTop: 18,
          textAlign: 'center',
        },
        liveBody: {
          alignSelf: 'stretch',
          color: colors.textMuted,
          fontSize: 16,
          fontWeight: '500',
          lineHeight: 22,
          marginTop: 8,
          textAlign: 'center',
        },
        skipHit: {
          justifyContent: 'center',
          minHeight: 44,
          paddingLeft: 12,
        },
        skipLabel: {
          color: colors.textMuted,
          fontSize: 16,
          fontWeight: '500',
        },
        livePageCard: {
          alignSelf: 'stretch',
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 20,
          borderWidth: 1,
          marginTop: 28,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        identityRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
        },
        avatar: {
          alignItems: 'center',
          backgroundColor: colors.text,
          borderRadius: 14,
          height: 48,
          justifyContent: 'center',
          width: 48,
        },
        avatarLetter: {
          color: colors.shell,
          fontSize: 20,
          fontWeight: '700',
        },
        identityCopy: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        liveShop: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '700',
        },
        liveUrl: {
          color: colors.textMuted,
          fontSize: 13,
          marginTop: 2,
        },
        copyHit: {
          alignItems: 'center',
          height: 44,
          justifyContent: 'center',
          width: 44,
        },
        seeTitle: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: -0.3,
          marginBottom: 12,
          marginTop: 28,
          textAlign: 'left',
        },
        pathCard: {
          alignSelf: 'stretch',
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 20,
          borderWidth: 1,
          paddingHorizontal: 18,
          paddingVertical: 22,
        },
        pathRow: {
          flexDirection: 'row',
        },
        pathRail: {
          alignItems: 'center',
          width: 36,
        },
        pathIcon: {
          alignItems: 'center',
          backgroundColor: colors.shell,
          borderRadius: 18,
          height: 36,
          justifyContent: 'center',
          width: 36,
        },
        pathIconDone: {
          backgroundColor: isDark ? LIVE_GREEN_DARK : LIVE_GREEN_LIGHT,
        },
        pathIconGlyph: {
          color: colors.text,
        },
        pathLine: {
          backgroundColor: colors.border,
          flex: 1,
          minHeight: 28,
          width: 2,
        },
        pathLineDone: {
          backgroundColor: isDark ? LIVE_GREEN_DARK : LIVE_GREEN_LIGHT,
        },
        pathCopy: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
          paddingBottom: 28,
          paddingLeft: 12,
        },
        pathCopyLast: {
          paddingBottom: 0,
        },
        pathTitle: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
        },
        pathDetail: {
          color: colors.textMuted,
          fontSize: 13,
          lineHeight: 18,
          marginTop: 2,
        },
        bookAction: {
          marginTop: 16,
        },
      }),
    [colors, insets.bottom, isDark],
  );

  if (showWelcome) {
    return <OnboardingWelcomeView onGetStarted={() => setShowWelcome(false)} />;
  }

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      {step === STEP_LIVE ? (
        <View pointerEvents="none" style={[styles.liveGlowSlot, { top: -insets.top }]}>
          <LinearGradient
            colors={
              isDark
                ? ['rgba(52, 199, 89, 0.34)', 'rgba(52, 199, 89, 0.08)', 'rgba(10, 10, 10, 0)']
                : ['rgba(21, 128, 61, 0.18)', 'rgba(21, 128, 61, 0.05)', 'rgba(245, 245, 245, 0)']
            }
            locations={[0, 0.42, 1]}
            style={styles.liveGlow}
          />
        </View>
      ) : null}
      {step === STEP_LIVE ? (
        <View style={[styles.topBar, styles.topBarEnd]}>
          <Pressable accessibilityLabel="Skip for now" accessibilityRole="button" onPress={exit}>
            {({ pressed }) => (
              <View style={[styles.skipHit, pressed && styles.pressed]}>
                <AppText style={styles.skipLabel}>Skip for now</AppText>
              </View>
            )}
          </Pressable>
        </View>
      ) : null}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            step === STEP_LIVE
              ? { paddingBottom: Math.max(insets.bottom, 16) + 8 }
              : styles.formScroll,
          ]}
          keyboardShouldPersistTaps="handled"
          style={styles.flex}
        >
          {step === STEP_LIVE ? (
            <LiveStep
              businessName={businessName}
              slug={claimedSlug || resolvedSlug}
              styles={styles}
              onBookTest={bookTestAppointment}
            />
          ) : (
            <>
              <AppText
                accessibilityRole="header"
                style={[styles.screenTitle, step === STEP_INDUSTRY && styles.industryTitle]}
              >
                {step === STEP_INDUSTRY ? 'What kind of work do you do?' : 'Business details'}
              </AppText>
              {step === STEP_INDUSTRY ? (
                <IndustryStep
                  industry={industry}
                  styles={styles}
                  trades={trades}
                  tradeOptions={tradeOptions}
                  onSelectIndustry={selectIndustry}
                  onToggleTrade={toggleTrade}
                />
              ) : (
                <BusinessStep
                  availability={slugAvailability}
                  businessName={businessName}
                  colors={colors}
                  displaySlug={resolvedSlug}
                  phone={phone}
                  phoneError={
                    phone.length > 0 && !phoneOk
                      ? 'Enter a 10-digit phone number, or leave it blank.'
                      : ''
                  }
                  slug={slug}
                  slugTooShort={slugTooShort}
                  styles={styles}
                  onBusinessName={setBusinessName}
                  onPhone={setPhone}
                  onSlug={(next) => {
                    setSlugEdited(true);
                    setCustomSlug(sanitizeTypedSlug(next));
                  }}
                />
              )}
            </>
          )}
        </ScrollView>
        {step === STEP_LIVE ? null : (
          <View style={styles.footer}>
            {step === STEP_INDUSTRY ? (
              <Button
                disabled={!canContinue || saving}
                fullWidth
                loading={saving}
                title="Continue"
                onPress={() => {
                  void saveIndustry();
                }}
              />
            ) : null}
            {step === STEP_BUSINESS ? (
              <View style={styles.footerRow}>
                <View style={styles.footerHalf}>
                  <Button
                    disabled={saving}
                    fullWidth
                    title="Back"
                    variant="secondary"
                    onPress={() => {
                      setStep(STEP_INDUSTRY);
                    }}
                  />
                </View>
                <View style={styles.footerHalf}>
                  <Button
                    disabled={!canFinish || saving}
                    fullWidth
                    loading={saving}
                    title="Finish setup"
                    onPress={() => {
                      void finishSetup();
                    }}
                  />
                </View>
              </View>
            ) : null}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function IndustryStep({ industry, tradeOptions, trades, styles, onSelectIndustry, onToggleTrade }) {
  return (
    <View>
      <View style={styles.industryGrid}>
        {BUSINESS_TYPE_OPTIONS.map((option) => {
          const selected = industry === option.value;
          const iconName = INDUSTRY_ICONS[option.value] ?? 'ellipsis-horizontal';
          return (
            <View key={option.value} style={styles.industrySlot}>
              <Pressable
                accessibilityLabel={option.label}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={styles.industryHit}
                onPress={() => onSelectIndustry(option.value)}
              >
                {({ pressed }) => (
                  <View
                    style={[
                      styles.industrySquare,
                      selected && styles.industrySquareSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      color={
                        selected ? styles.industryLabelSelected.color : styles.industryLabel.color
                      }
                      name={iconName}
                      size={26}
                    />
                    <AppText
                      numberOfLines={2}
                      style={[styles.industryLabel, selected && styles.industryLabelSelected]}
                    >
                      {option.label}
                    </AppText>
                  </View>
                )}
              </Pressable>
            </View>
          );
        })}
      </View>
      {tradeOptions.length > 0 ? (
        <View>
          <AppText style={styles.tradesLabel}>Select your trades</AppText>
          <View style={styles.chips}>
            {tradeOptions.map((option) => {
              const selected = trades.includes(option.slug);
              return (
                <Pressable
                  key={option.slug}
                  accessibilityLabel={option.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => onToggleTrade(option.slug)}
                >
                  {({ pressed }) => (
                    <View
                      style={[
                        styles.chip,
                        selected && styles.chipSelected,
                        pressed && styles.chipPressed,
                      ]}
                    >
                      <AppText style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                        {option.label}
                      </AppText>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function BusinessStep({
  availability,
  businessName,
  colors,
  displaySlug,
  slug,
  slugTooShort,
  phone,
  phoneError,
  styles,
  onBusinessName,
  onSlug,
  onPhone,
}) {
  const [editingLink, setEditingLink] = useState(false);
  const linkIsAvailable =
    availability.status === 'free' ||
    (availability.status === 'taken' && Boolean(availability.suggestion));

  return (
    <View>
      <SurfaceTextField
        autoCapitalize="words"
        compact
        label="Business name"
        maxLength={MAX_ONBOARDING_BUSINESS_NAME_LENGTH}
        placeholder="e.g. Mike's Detailing"
        value={businessName}
        onChangeText={onBusinessName}
      />
      <SurfacePhoneField
        accessibilityLabel="Business phone"
        compact
        label={
          <View style={styles.phoneLabelRow}>
            <AppText style={styles.fieldLabel}>Phone</AppText>
            <AppText style={styles.optionalLabel}>(optional)</AppText>
          </View>
        }
        errorText={phoneError}
        placeholder="(555) 234-5678"
        prefixText="+1"
        value={phone}
        onChangeText={onPhone}
      />
      <View style={styles.linkSection}>
        <AppText style={styles.linkLabel}>Your booking link</AppText>
        <SurfaceInputRow>
          <AppText numberOfLines={1} style={styles.linkHost}>
            {LINK_HOST}
          </AppText>
          {editingLink ? (
            <AppTextInput
              accessibilityLabel="Booking link"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              maxLength={MAX_BUSINESS_SLUG_LEN}
              style={styles.linkPath}
              value={slug}
              onChangeText={onSlug}
            />
          ) : (
            <View style={styles.linkPathCol}>
              <AppText numberOfLines={1} style={styles.linkPathDisplay}>
                {displaySlug || 'your-link'}
              </AppText>
            </View>
          )}
          <Pressable
            accessibilityLabel={editingLink ? 'Done editing booking link' : 'Edit booking link'}
            accessibilityRole="button"
            onPress={() => setEditingLink((current) => !current)}
          >
            {({ pressed }) => (
              <View style={[styles.linkActionHit, pressed && styles.pressed]}>
                <AppText style={styles.linkAction}>{editingLink ? 'Done' : 'Edit'}</AppText>
              </View>
            )}
          </Pressable>
        </SurfaceInputRow>
        {linkIsAvailable ? (
          <View accessibilityLabel="Available" accessible style={styles.linkStatus}>
            <Ionicons color={colors.textSuccess} name="checkmark" size={16} />
            <AppText style={styles.linkStatusText}>Available</AppText>
          </View>
        ) : null}
        {slugTooShort ? <AppText style={styles.linkError}>Pick a longer link name</AppText> : null}
        {!slugTooShort && availability.status === 'taken' ? (
          <AppText style={styles.linkError}>{slug} is taken.</AppText>
        ) : null}
        {!slugTooShort && availability.status === 'error' ? (
          <AppText style={styles.linkError}>{"Couldn't check that link. Try again."}</AppText>
        ) : null}
      </View>
    </View>
  );
}

function useLiveEntrance(count) {
  const pieces = useRef(
    Array.from({ length: count }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(14),
    })),
  ).current;

  useEffect(() => {
    let mounted = true;
    let entrance = null;

    const play = (reduced) => {
      if (!mounted) return;
      if (reduced) {
        pieces.forEach((piece) => {
          piece.opacity.setValue(1);
          piece.translateY.setValue(0);
        });
        return;
      }

      entrance = Animated.sequence([
        Animated.delay(140),
        Animated.stagger(
          80,
          pieces.map((piece) =>
            Animated.parallel([
              Animated.timing(piece.opacity, {
                toValue: 1,
                duration: 340,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(piece.translateY, {
                toValue: 0,
                duration: 340,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ]),
          ),
        ),
      ]);
      entrance.start();
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => play(Boolean(enabled)))
      .catch(() => play(false));

    return () => {
      mounted = false;
      entrance?.stop();
    };
  }, [pieces]);

  return pieces;
}

function liveEntranceStyle(piece) {
  return {
    alignSelf: 'stretch',
    opacity: piece.opacity,
    transform: [{ translateY: piece.translateY }],
  };
}

function LiveStep({ businessName, slug, styles, onBookTest }) {
  const [copied, setCopied] = useState(false);
  const entrance = useLiveEntrance(5);
  const shopName = businessName.trim();
  const link = slug ? `${LINK_HOST}${slug}` : LINK_HOST;
  const httpsUrl = slug ? `https://${link}` : '';

  useEffect(() => {
    fireSuccessHaptic();
  }, []);

  const copyLink = async () => {
    if (!httpsUrl) return;
    await Clipboard.setStringAsync(httpsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View>
      <View style={styles.liveHero}>
        <AnimatedCheckmark accessibilityLabel="Success" size={72} />
        <Animated.View style={liveEntranceStyle(entrance[0])}>
          <AppText accessibilityRole="header" style={styles.liveTitle}>
            {"You're all set"}
          </AppText>
          <AppText style={styles.liveBody}>
            Your booking page is live and ready for customers.
          </AppText>
        </Animated.View>
      </View>
      <Animated.View style={liveEntranceStyle(entrance[1])}>
        <View style={styles.livePageCard}>
          <View style={styles.identityRow}>
            <View style={styles.avatar}>
              <AppText style={styles.avatarLetter}>{shopInitial(shopName)}</AppText>
            </View>
            <View style={styles.identityCopy}>
              <AppText numberOfLines={1} style={styles.liveShop}>
                {shopName || 'Your business'}
              </AppText>
              <AppText numberOfLines={1} style={styles.liveUrl}>
                {link}
              </AppText>
            </View>
            <Pressable
              accessibilityLabel={copied ? 'Link copied' : 'Copy link'}
              accessibilityRole="button"
              onPress={() => {
                void copyLink();
              }}
            >
              {({ pressed }) => (
                <View style={[styles.copyHit, pressed && styles.pressed]}>
                  <Ionicons
                    color={styles.liveUrl.color}
                    name={copied ? 'checkmark' : 'copy-outline'}
                    size={20}
                  />
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </Animated.View>
      <Animated.View style={liveEntranceStyle(entrance[2])}>
        <AppText style={styles.seeTitle}>See exactly what your customers see</AppText>
      </Animated.View>
      <Animated.View style={liveEntranceStyle(entrance[3])}>
        <View style={styles.pathCard}>
          {CUSTOMER_PATH.map((item, index) => {
            const last = index === CUSTOMER_PATH.length - 1;
            return (
              <View key={item.title} style={styles.pathRow}>
                <View style={styles.pathRail}>
                  <View style={[styles.pathIcon, item.done && styles.pathIconDone]}>
                    <Ionicons
                      color={item.done ? '#ffffff' : styles.pathIconGlyph.color}
                      name={item.icon}
                      size={16}
                    />
                  </View>
                  {last ? null : (
                    <View style={[styles.pathLine, index === 1 && styles.pathLineDone]} />
                  )}
                </View>
                <View style={[styles.pathCopy, last && styles.pathCopyLast]}>
                  <AppText style={styles.pathTitle}>{item.title}</AppText>
                  <AppText style={styles.pathDetail}>{item.detail}</AppText>
                </View>
              </View>
            );
          })}
        </View>
      </Animated.View>
      <Animated.View style={liveEntranceStyle(entrance[4])}>
        <View style={styles.bookAction}>
          <Button
            fullWidth
            iconName="calendar-outline"
            title="Book a test appointment"
            onPress={onBookTest}
          />
        </View>
      </Animated.View>
    </View>
  );
}
