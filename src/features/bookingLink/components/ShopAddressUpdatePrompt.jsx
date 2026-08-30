import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button } from '../../../components/ui';
import { useAuth } from '../../auth';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { navigateToPushDestination } from '../../notifications/utils/navigateToPushDestination';
import { fetchShopAddressPromptStatus } from '../api/shopAddressPrompt';
import { BOOKING_LINK_ANNOUNCEMENT_EDIT_PARAMS } from '../constants/bookingLinkRouteParams';
import {
  isShopAddressPromptSkippedThisSession,
  markShopAddressPromptSkippedThisSession,
} from '../constants/shopAddressPrompt';
import { shopAddressPromptQueryKey } from '../queryKeys';

/**
 * Shop / Both owners still on the old street-only shop row.
 * Opens booking-link edit on the Booking tab.
 */
export function ShopAddressUpdatePrompt({ locationPromptVisible = false }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const userId = user?.id ?? null;
  const [visible, setVisible] = useState(false);

  const statusQuery = useQuery({
    queryKey: shopAddressPromptQueryKey(userId),
    queryFn: () => fetchShopAddressPromptStatus(userId),
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
  });

  const businessProfileId = statusQuery.data?.businessProfileId ?? null;
  const needsUpdate = statusQuery.data?.needsUpdate === true;
  const skipped = isShopAddressPromptSkippedThisSession(businessProfileId);

  useEffect(() => {
    if (!needsUpdate || skipped || locationPromptVisible) {
      setVisible(false);
      return undefined;
    }

    const timeout = setTimeout(() => {
      setVisible(true);
    }, 800);
    return () => clearTimeout(timeout);
  }, [locationPromptVisible, needsUpdate, skipped]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
        },
        footer: {
          gap: 10,
          marginTop: 20,
        },
      }),
    [colors],
  );

  const dismiss = () => {
    markShopAddressPromptSkippedThisSession(businessProfileId);
    setVisible(false);
  };

  const openShopAddress = () => {
    markShopAddressPromptSkippedThisSession(businessProfileId);
    setVisible(false);
    navigateToPushDestination(navigation, {
      kind: 'main_app_tab',
      tab: ROUTES.MORE,
      stackScreen: ROUTES.BOOKING_LINK,
      stackParams: BOOKING_LINK_ANNOUNCEMENT_EDIT_PARAMS,
    });
  };

  return (
    <BottomSheetModal
      fitContent
      footer={
        <View style={styles.footer}>
          <Button
            fullWidth
            title="Update shop address"
            variant="primary"
            onPress={openShopAddress}
          />
          <Button fullWidth title="Later" variant="secondary" onPress={dismiss} />
        </View>
      }
      sheetHeightPercent={38}
      title="Update your shop address"
      visible={visible}
      onRequestClose={dismiss}
    >
      <AppText style={styles.body}>
        Add the street address for your shop so customers know where to go.
      </AppText>
    </BottomSheetModal>
  );
}
