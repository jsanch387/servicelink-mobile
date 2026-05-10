import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { AppText, Button, InfoSection, InlineCardError, SurfaceCard } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { canonicalNanpDigits, formatPhoneForDisplay } from '../../../utils/phone';
import { showUserFacingErrorAlert } from '../../../utils/safeUserFacingMessage';
import { deleteQuoteForBusiness } from '../api/quotes';
import {
  QuoteRequestActivitySection,
  QuoteRequestDetailBody,
} from '../components/QuoteRequestDetailBody';
import { SentQuoteDetailBody } from '../components/SentQuoteDetailBody';
import { QUOTE_DETAIL_KIND_REQUEST } from '../constants';
import { useQuoteDetail } from '../hooks/useQuoteDetail';
import { QUOTES_QUERY_ROOT, quoteDetailQueryKey, quotesListQueryKey } from '../queryKeys';

const EMAIL_COPIED_GREEN = '#22c55e';

export function QuoteDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const quoteIdParam = route.params?.quoteId;
  const quoteId =
    quoteIdParam === undefined || quoteIdParam === null
      ? undefined
      : String(quoteIdParam).trim() || undefined;
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);
  const [emailCopyFeedback, setEmailCopyFeedback] = useState(false);

  useEffect(() => {
    if (!emailCopyFeedback) return undefined;
    const t = setTimeout(() => setEmailCopyFeedback(false), 2000);
    return () => clearTimeout(t);
  }, [emailCopyFeedback]);

  const { businessId, kind, model, isLoading, detailError, businessError, refetch, isFetching } =
    useQuoteDetail(quoteId);
  const isRequest = kind === QUOTE_DETAIL_KIND_REQUEST;

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isRequest ? 'Quote request' : 'Sent quote',
    });
  }, [navigation, isRequest]);

  const handleCreateQuote = useCallback(() => {
    if (!model) return;
    navigation.navigate(ROUTES.CREATE_QUOTE, {
      quoteRequestId: quoteId,
      customerName: model.customerName,
      customerEmail: String(model.email ?? '').trim(),
      customerPhone: String(model.phone ?? '').trim(),
      vehicleYear: String(model.vehicleYear ?? '').trim(),
      vehicleMake: String(model.vehicleMake ?? '').trim(),
      vehicleModel: String(model.vehicleModel ?? '').trim(),
      serviceName: String(model.serviceName ?? '').trim(),
      customerRequestNotes: String(model.message ?? '').trim(),
      scheduledDateYyyyMmDd: String(model.scheduledDateYyyyMmDd ?? '').trim(),
      scheduledStartTime12h: String(model.scheduledStartTime12h ?? '').trim(),
    });
  }, [model, navigation, quoteId]);

  const handleDeleteQuote = useCallback(() => {
    if (!quoteId || !businessId || deleting) return;

    const removingRequest = isRequest;
    Alert.alert(
      removingRequest ? 'Remove this quote request?' : 'Delete this quote?',
      removingRequest
        ? 'This permanently removes the request from your inbox. You can still get new quote requests from customers.'
        : 'This permanently removes the quote from your inbox. If you sent your customer a link to view or accept it, that link will stop working.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: removingRequest ? 'Remove' : 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setDeleting(true);
              try {
                const { deleted, error } = await deleteQuoteForBusiness(businessId, quoteId);
                if (error || !deleted) {
                  showUserFacingErrorAlert('Could not delete', error, {
                    fallback: 'Try again in a moment.',
                  });
                  return;
                }
                const detailKey = quoteDetailQueryKey(businessId, quoteId);
                await queryClient.cancelQueries({ queryKey: detailKey });
                queryClient.removeQueries({ queryKey: detailKey });
                await queryClient.invalidateQueries({
                  queryKey: quotesListQueryKey(businessId),
                });
                navigation.goBack();
              } finally {
                setDeleting(false);
              }
            })();
          },
        },
      ],
    );
  }, [businessId, deleting, isRequest, navigation, queryClient, quoteId]);

  const handleBackToQuotes = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_ROOT });
    navigation.goBack();
  }, [navigation, queryClient]);

  const quoteDetailRefreshControl = useMemo(
    () => (
      <RefreshControl
        colors={[colors.accent]}
        onRefresh={() => void refetch()}
        refreshing={Boolean(isFetching && !isLoading)}
        tintColor={colors.accent}
      />
    ),
    [colors.accent, isFetching, isLoading, refetch],
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
          gap: 22,
          paddingBottom: 36,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        actions: {
          gap: 12,
          marginTop: 4,
        },
        bootWrap: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: SCREEN_GUTTER,
        },
        errorRetry: {
          marginTop: 12,
        },
        errorFooter: {
          gap: 14,
          marginTop: 8,
        },
      }),
    [colors],
  );

  const customerRows = useMemo(() => {
    if (!model) return [];
    const rows = [
      {
        key: 'name',
        icon: 'person-outline',
        value: model.customerName,
        emphasize: true,
      },
    ];
    const phoneDisplay = String(formatPhoneForDisplay(model.phone) ?? '').trim();
    const phoneDigits = canonicalNanpDigits(model.phone);
    if (phoneDisplay.length > 0) {
      const row = {
        key: 'phone',
        icon: 'call-outline',
        value: phoneDisplay,
      };
      if (phoneDigits.length === 10) {
        Object.assign(row, {
          accessibilityLabel: `Call ${phoneDisplay}`,
          onPress: () => {
            void Linking.openURL(`tel:+1${phoneDigits}`);
          },
        });
      }
      rows.push(row);
    }

    const emailDisplay = String(model.email ?? '').trim();
    if (emailDisplay.length > 0) {
      rows.push({
        key: 'email',
        icon: 'mail-outline',
        value: emailDisplay,
        interactionStyle: 'none',
        accessibilityLabel: `Copy email ${emailDisplay}`,
        trailing: emailCopyFeedback ? (
          <>
            <Ionicons color={EMAIL_COPIED_GREEN} name="checkmark-circle" size={18} />
            <AppText style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>
              Copied
            </AppText>
          </>
        ) : (
          <Ionicons color={colors.textMuted} name="copy-outline" size={18} />
        ),
        onPress: () => {
          void (async () => {
            await Clipboard.setStringAsync(emailDisplay);
            void Haptics.selectionAsync().catch(() => {});
            setEmailCopyFeedback(true);
          })();
        },
      });
    }
    return rows;
  }, [colors.textMuted, emailCopyFeedback, model]);

  if (!quoteId) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <View style={[styles.content, { paddingTop: 20 }]}>
          <SurfaceCard padding="md">
            <InlineCardError message="We could not load this quote. Go back and try again." />
          </SurfaceCard>
        </View>
      </SafeAreaView>
    );
  }

  if (businessError) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: 20 }]}
          keyboardShouldPersistTaps="handled"
          refreshControl={quoteDetailRefreshControl}
          style={styles.scroll}
        >
          <SurfaceCard padding="md">
            <InlineCardError message={businessError} />
            <Button
              accessibilityHint="Attempts to load this quote again"
              accessibilityLabel="Try again"
              fullWidth
              loading={Boolean(isFetching && !isLoading)}
              style={styles.errorRetry}
              title="Try again"
              variant="secondary"
              onPress={() => void refetch()}
            />
          </SurfaceCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isLoading && !model) {
    return (
      <SafeAreaView
        accessibilityLabel="Loading quote"
        edges={['left', 'right', 'bottom']}
        style={styles.root}
      >
        <View style={styles.bootWrap}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (detailError || !model || !kind) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: 20 }]}
          keyboardShouldPersistTaps="handled"
          refreshControl={quoteDetailRefreshControl}
          style={styles.scroll}
        >
          <SurfaceCard padding="md">
            <InlineCardError
              message={
                detailError ?? 'We could not load this quote. Go back to Quotes and try again.'
              }
            />
            <Button
              accessibilityHint="Attempts to load this quote again"
              accessibilityLabel="Try again"
              fullWidth
              loading={Boolean(isFetching && !isLoading)}
              style={styles.errorRetry}
              title="Try again"
              variant="secondary"
              onPress={() => void refetch()}
            />
          </SurfaceCard>
          <View style={styles.errorFooter}>
            <Button
              fullWidth
              title="Back to quotes"
              variant="secondary"
              onPress={handleBackToQuotes}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            colors={[colors.accent]}
            onRefresh={refetch}
            refreshing={isFetching && !isLoading}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {isRequest ? (
          <QuoteRequestDetailBody model={model} />
        ) : (
          <SentQuoteDetailBody
            betweenProposalAndActivity={
              <InfoSection rowGap={14} rows={customerRows} title="Customer" />
            }
            model={model}
          />
        )}
        {isRequest ? <InfoSection rowGap={14} rows={customerRows} title="Customer" /> : null}
        {isRequest ? <QuoteRequestActivitySection model={model} /> : null}

        <View style={styles.actions}>
          {isRequest ? (
            <Button fullWidth title="Create quote" variant="primary" onPress={handleCreateQuote} />
          ) : null}
          <Button
            disabled={!businessId || deleting}
            fullWidth
            iconColor={colors.danger}
            iconName="trash-outline"
            labelColor={colors.danger}
            loading={deleting}
            outlineBgPressed="rgba(220, 38, 38, 0.08)"
            outlineColor={colors.danger}
            title={isRequest ? 'Remove request' : 'Delete quote'}
            variant="outline"
            onPress={handleDeleteQuote}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
