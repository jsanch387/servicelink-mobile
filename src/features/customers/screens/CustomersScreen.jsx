import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppText,
  Button,
  FilterPills,
  InlineCardError,
  LoadMoreLink,
  SkeletonBox,
  SurfaceCard,
} from '../../../components/ui';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { AddCustomerFab } from '../components/AddCustomerFab';
import { AddCustomerSheet } from '../components/AddCustomerSheet';
import { CustomerCard } from '../components/CustomerCard';
import { CustomersSearchBar } from '../components/CustomersSearchBar';
import {
  CUSTOMER_FILTER_ALL,
  CUSTOMER_FILTER_OPTIONS,
  CUSTOMERS_LIST_PAGE_SIZE,
} from '../constants';
import { useCustomersList } from '../hooks/useCustomersList';

function CustomersListSkeleton() {
  return (
    <View style={skeletonStyles.column}>
      {[0, 1, 2].map((k) => (
        <SurfaceCard key={k} style={skeletonStyles.card}>
          <SkeletonBox borderRadius={8} height={18} pulse width="60%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 12 }} width="45%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 14 }} width="72%" />
        </SurfaceCard>
      ))}
    </View>
  );
}

/** Matches {@link ../../home/screens/HomeScreen} `FloatingCreateMenu` `bottom` prop. */
const HOME_FAB_BOTTOM = 30;

export function CustomersScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  const customersList = useCustomersList();
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(CUSTOMER_FILTER_ALL);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(CUSTOMERS_LIST_PAGE_SIZE);

  /** Same tab-bar clearance as Home scroll content — hook can be 0 with custom `tabBar`. */
  const scrollBottomPad = 28 + Math.max(tabBarHeight, 72);

  const visibleCustomers = useMemo(() => {
    const searchLower = searchText.trim().toLowerCase();
    const searchDigits = searchLower.replace(/\D/g, '');
    return customersList.customers.filter((customer) => {
      const matchesFilter =
        selectedFilter === CUSTOMER_FILTER_ALL || customer.status === selectedFilter;
      const matchesSearch =
        searchLower.length === 0 ||
        customer.fullName.toLowerCase().includes(searchLower) ||
        (customer.email ?? '').toLowerCase().includes(searchLower) ||
        (searchDigits.length > 0 &&
          (customer.phone ?? '').replace(/\D/g, '').includes(searchDigits));
      return matchesFilter && matchesSearch;
    });
  }, [customersList.customers, searchText, selectedFilter]);

  // Reset the window whenever search/filter changes so we don't leave a huge slice open.
  useEffect(() => {
    setVisibleCount(CUSTOMERS_LIST_PAGE_SIZE);
  }, [searchText, selectedFilter]);

  const pagedCustomers = useMemo(
    () => visibleCustomers.slice(0, visibleCount),
    [visibleCustomers, visibleCount],
  );
  const hasMoreVisible = visibleCount < visibleCustomers.length;

  const handleLoadMore = useCallback(() => {
    if (!hasMoreVisible) return;
    setVisibleCount((prev) => prev + CUSTOMERS_LIST_PAGE_SIZE);
  }, [hasMoreVisible]);

  const handleOpenCustomer = useCallback(
    (customer) => {
      navigation.navigate(ROUTES.CUSTOMER_DETAILS, {
        customerId: customer.id,
        customerName: customer.fullName,
        customerSegment: customer.segment,
      });
    },
    [navigation],
  );

  const renderCustomer = useCallback(
    ({ item }) => <CustomerCard customer={item} onPress={() => handleOpenCustomer(item)} />,
    [handleOpenCustomer],
  );

  const keyExtractor = useCallback((item) => item.id, []);

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        colors={[colors.accent]}
        onRefresh={customersList.refetch}
        refreshing={customersList.isFetching && !customersList.isLoading}
        tintColor={colors.accent}
      />
    ),
    [colors.accent, customersList.isFetching, customersList.isLoading, customersList.refetch],
  );

  const listHeader = useMemo(() => {
    const hasBusiness = Boolean(customersList.business?.id);
    const totalCount = customersList.customers.length;
    const matchCount = visibleCustomers.length;
    const shownCount = pagedCustomers.length;

    return (
      <View>
        <View style={styles.controlsSection}>
          <CustomersSearchBar onChangeText={setSearchText} value={searchText} />
          <FilterPills
            onSelect={setSelectedFilter}
            options={CUSTOMER_FILTER_OPTIONS}
            selectedKey={selectedFilter}
          />
        </View>

        {customersList.businessError ? (
          <View style={styles.errorBlock}>
            <SurfaceCard>
              <InlineCardError message={customersList.businessError} />
              <Button
                accessibilityHint="Attempts to load customers again"
                accessibilityLabel="Try again"
                fullWidth
                loading={Boolean(customersList.isFetching && !customersList.isLoading)}
                style={styles.errorRetry}
                title="Try again"
                variant="secondary"
                onPress={() => void customersList.refetch()}
              />
            </SurfaceCard>
          </View>
        ) : null}
        {customersList.listError ? (
          <View style={styles.errorBlock}>
            <SurfaceCard>
              <InlineCardError message={customersList.listError} />
              <Button
                accessibilityHint="Attempts to load customers again"
                accessibilityLabel="Try again"
                fullWidth
                loading={Boolean(customersList.isFetching && !customersList.isLoading)}
                style={styles.errorRetry}
                title="Try again"
                variant="secondary"
                onPress={() => void customersList.refetch()}
              />
            </SurfaceCard>
          </View>
        ) : null}

        {customersList.isLoading ? (
          <CustomersListSkeleton />
        ) : hasBusiness && totalCount === 0 ? (
          <View style={styles.emptyWrap}>
            <AppText style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              No customers yet
            </AppText>
            <AppText style={[styles.emptyBody, { color: colors.textMuted }]}>
              When someone schedules an appointment, a customer profile is created automatically
              from their booking details.
            </AppText>
          </View>
        ) : totalCount > 0 ? (
          <>
            <AppText style={[styles.resultsText, { color: colors.textMuted }]}>
              Showing {shownCount} of {matchCount} customers
              {matchCount !== totalCount ? ` (${totalCount} total)` : ''}
            </AppText>
            {matchCount === 0 ? (
              <View style={styles.emptyWrap}>
                <AppText style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                  No matching customers
                </AppText>
                <AppText style={[styles.emptyBody, { color: colors.textMuted }]}>
                  Try adjusting your search or filter.
                </AppText>
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    );
  }, [
    colors.textMuted,
    colors.textSecondary,
    customersList,
    pagedCustomers.length,
    searchText,
    selectedFilter,
    visibleCustomers.length,
  ]);

  const listFooter = useMemo(() => {
    if (customersList.isLoading || visibleCustomers.length === 0 || !hasMoreVisible) {
      return null;
    }
    return (
      <LoadMoreLink
        accessibilityHint="Shows more customers in the list"
        label="Show more"
        onPress={handleLoadMore}
      />
    );
  }, [customersList.isLoading, handleLoadMore, hasMoreVisible, visibleCustomers.length]);

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.shell }]}>
      <View style={styles.body}>
        <FlatList
          contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPad }]}
          data={
            customersList.isLoading || customersList.customers.length === 0 ? [] : pagedCustomers
          }
          keyExtractor={keyExtractor}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={listFooter}
          ListHeaderComponent={listHeader}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={refreshControl}
          renderItem={renderCustomer}
          showsVerticalScrollIndicator={false}
        />
        <AddCustomerFab bottom={HOME_FAB_BOTTOM} onPress={() => setAddCustomerOpen(true)} />
        <AddCustomerSheet
          businessId={customersList.business?.id}
          visible={addCustomerOpen}
          onRequestClose={() => setAddCustomerOpen(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
    position: 'relative',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  /** Search + filters — separated from the list below */
  controlsSection: {
    marginBottom: 24,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
    marginBottom: 14,
  },
  errorBlock: {
    marginBottom: 16,
  },
  errorRetry: {
    marginTop: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 28,
    paddingHorizontal: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
    marginTop: 8,
    textAlign: 'center',
  },
});

const skeletonStyles = StyleSheet.create({
  column: {
    gap: 12,
    marginTop: 0,
  },
  card: {
    marginBottom: 0,
  },
});
