import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { Button, InfoSection, InlineCardError, SurfaceCard } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { MaintenanceDetailBody } from '../components/MaintenanceDetailBody';
import { MAINTENANCE_DETAIL_NOT_FOUND_USER_MESSAGE } from '../constants';
import { useMaintenanceDetail } from '../hooks/useMaintenanceDetail';
import { MAINTENANCE_QUERY_ROOT } from '../queryKeys';

export function MaintenanceDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const customerId = String(route.params?.customerId ?? '').trim() || undefined;
  const enrollmentId = String(route.params?.enrollmentId ?? '').trim() || undefined;
  const [linkCopyFeedback, setLinkCopyFeedback] = useState(false);

  const { model, isLoading, detailError, businessError, notFound, refetch, isFetching } =
    useMaintenanceDetail(customerId, enrollmentId);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: model?.customerName ? model.customerName : 'Maintenance detail',
    });
  }, [model?.customerName, navigation]);

  const handleBackToList = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: MAINTENANCE_QUERY_ROOT });
    navigation.goBack();
  }, [navigation, queryClient]);

  const handleViewCustomer = useCallback(() => {
    if (!customerId) return;
    navigation.navigate(ROUTES.CUSTOMERS, {
      screen: ROUTES.CUSTOMER_DETAILS,
      params: { customerId },
    });
  }, [customerId, navigation]);

  const handleCopyInviteLink = useCallback(async () => {
    const link = String(model?.inviteLink ?? '').trim();
    if (!link) return;
    await Clipboard.setStringAsync(link);
    void Haptics.selectionAsync().catch(() => {});
    setLinkCopyFeedback(true);
    setTimeout(() => setLinkCopyFeedback(false), 2000);
  }, [model?.inviteLink]);

  const refreshControl = useMemo(
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

  const customerRows = useMemo(() => {
    if (!model) return [];
    const rows = [
      {
        key: 'name',
        icon: 'person-outline',
        value: model.customerName,
        emphasize: true,
        onPress: handleViewCustomer,
      },
    ];
    const email = String(model.customerEmail ?? '').trim();
    if (email) {
      rows.push({
        key: 'email',
        icon: 'mail-outline',
        value: email,
        interactionStyle: 'none',
      });
    }
    return rows;
  }, [handleViewCustomer, model]);

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

  if (!customerId || !enrollmentId) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <View style={[styles.content, { paddingTop: 20 }]}>
          <SurfaceCard padding="md">
            <InlineCardError message="We could not load this maintenance offer. Go back and try again." />
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
          refreshControl={refreshControl}
          style={styles.scroll}
        >
          <SurfaceCard padding="md">
            <InlineCardError message={businessError} />
            <Button
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
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <View style={styles.bootWrap}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (detailError || notFound || !model) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: 20 }]}
          refreshControl={refreshControl}
          style={styles.scroll}
        >
          <SurfaceCard padding="md">
            <InlineCardError message={detailError ?? MAINTENANCE_DETAIL_NOT_FOUND_USER_MESSAGE} />
            <Button
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
              title="Back to maintenance"
              variant="secondary"
              onPress={handleBackToList}
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
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <MaintenanceDetailBody model={model} />
        <InfoSection rowGap={14} rows={customerRows} title="Customer" />

        <View style={styles.actions}>
          <Button
            disabled={!model.canCopyLink}
            fullWidth
            iconName={linkCopyFeedback ? 'checkmark-circle' : 'link-outline'}
            title={linkCopyFeedback ? 'Link copied' : 'Copy offer link'}
            variant="secondary"
            onPress={() => void handleCopyInviteLink()}
          />
          <Button
            fullWidth
            title="View customer"
            variant="secondary"
            onPress={handleViewCustomer}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
