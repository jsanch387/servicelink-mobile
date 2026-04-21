import { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InlineCardError, SkeletonBox, SurfaceCard } from '../../../components/ui';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
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
          <SkeletonBox borderRadius={8} height={18} width="60%" />
          <SkeletonBox borderRadius={8} height={14} style={{ marginTop: 12 }} width="45%" />
          <SkeletonBox borderRadius={8} height={14} style={{ marginTop: 14 }} width="72%" />
        </SurfaceCard>
      ))}
    </View>
  );
}

export function CustomersScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const customersList = useCustomersList();
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState(CUSTOMER_FILTER_ALL);

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
      <ScrollView
        contentContainerStyle={styles.content}
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
        ) : (
          <>
            <Text style={[styles.resultsText, { color: colors.textMuted }]}>
              Showing {visibleCustomers.length} of {customersList.customers.length} customers
            </Text>

            <View style={styles.list}>
              {visibleCustomers.map((customer) => (
                <CustomerCard
                  customer={customer}
                  key={customer.id}
                  onPress={() =>
                    navigation.navigate(ROUTES.CUSTOMER_DETAILS, {
                      customerId: customer.id,
                    })
                  }
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingBottom: 36,
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
