import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, InlineCardError, SkeletonBox, SurfaceCard } from '../../../components/ui';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { AddCustomerFab } from '../components/AddCustomerFab';
import { AddCustomerSheet } from '../components/AddCustomerSheet';
import { CustomerCard } from '../components/CustomerCard';
import { CustomerFilterPills } from '../components/CustomerFilterPills';
import { CustomersSearchBar } from '../components/CustomersSearchBar';
import { CUSTOMER_FILTER_ALL, CUSTOMER_FILTER_OPTIONS } from '../constants';
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

  /** Same tab-bar clearance as Home scroll content — hook can be 0 with custom `tabBar`. */
  const scrollBottomPad = 28 + Math.max(tabBarHeight, 72);

  const visibleCustomers = useMemo(() => {
    const searchLower = searchText.trim().toLowerCase();
    return customersList.customers.filter((customer) => {
      const matchesFilter =
        selectedFilter === CUSTOMER_FILTER_ALL || customer.status === selectedFilter;
      const matchesSearch =
        searchLower.length === 0 || customer.fullName.toLowerCase().includes(searchLower);
      return matchesFilter && matchesSearch;
    });
  }, [customersList.customers, searchText, selectedFilter]);

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.shell }]}>
      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPad }]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              colors={[colors.accent]}
              onRefresh={customersList.refetch}
              refreshing={customersList.isFetching && !customersList.isLoading}
              tintColor={colors.accent}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.controlsSection}>
            <CustomersSearchBar onChangeText={setSearchText} value={searchText} />
            <CustomerFilterPills
              onSelect={setSelectedFilter}
              options={CUSTOMER_FILTER_OPTIONS}
              selectedKey={selectedFilter}
            />
          </View>

          {customersList.businessError ? (
            <View style={styles.errorBlock}>
              <SurfaceCard>
                <InlineCardError message={customersList.businessError} />
              </SurfaceCard>
            </View>
          ) : null}
          {customersList.listError ? (
            <View style={styles.errorBlock}>
              <SurfaceCard>
                <InlineCardError message={customersList.listError} />
              </SurfaceCard>
            </View>
          ) : null}

          {customersList.isLoading ? (
            <CustomersListSkeleton />
          ) : customersList.business?.id && customersList.customers.length === 0 ? (
            <View style={styles.emptyWrap}>
              <AppText style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                No customers yet
              </AppText>
              <AppText style={[styles.emptyBody, { color: colors.textMuted }]}>
                When someone schedules an appointment, a customer profile is created automatically
                from their booking details.
              </AppText>
            </View>
          ) : (
            <>
              <AppText style={[styles.resultsText, { color: colors.textMuted }]}>
                Showing {visibleCustomers.length} of {customersList.customers.length} customers
              </AppText>

              {customersList.customers.length > 0 && visibleCustomers.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <AppText style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                    No matching customers
                  </AppText>
                  <AppText style={[styles.emptyBody, { color: colors.textMuted }]}>
                    Try adjusting your search or filter.
                  </AppText>
                </View>
              ) : (
                <View style={styles.list}>
                  {visibleCustomers.map((customer) => (
                    <CustomerCard
                      customer={customer}
                      key={customer.id}
                      onPress={() =>
                        navigation.navigate(ROUTES.CUSTOMER_DETAILS, {
                          customerId: customer.id,
                          customerName: customer.fullName,
                          customerSegment: customer.segment,
                        })
                      }
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
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
  list: {
    paddingBottom: 24,
  },
  errorBlock: {
    marginBottom: 16,
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
