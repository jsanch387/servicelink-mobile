import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../../../routes/routes';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { AvailabilityScreen } from '../../availability/screens/AvailabilityScreen';
import { BookingLinkScreen } from '../../bookingLink/screens/BookingLinkScreen';
import { PaymentsScreen } from '../../payments/screens/PaymentsScreen';
import { QrCodeScreen } from '../../qrCode';
import { QuoteDetailScreen } from '../../quotes/screens/QuoteDetailScreen';
import { QuotesScreen } from '../../quotes/screens/QuotesScreen';
import { CustomerDetailsScreen } from '../../customers/screens/CustomerDetailsScreen';
import { MaintenanceDetailScreen } from '../../maintenance/screens/MaintenanceDetailScreen';
import { MaintenanceScreen } from '../../maintenance/screens/MaintenanceScreen';
import { ServicesScreen } from '../../services';
import { ServiceEditScreen } from '../../services/screens/ServiceEditScreen';
import { AccountSettingsScreen } from '../screens/AccountSettingsScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { SupportScreen } from '../../contact';
import { HelpScreen } from '../../help';
import { CONTACT_US_SCREEN_TITLE, HELP_SCREEN_TITLE } from '../../help/constants/helpCopy';
import { LegalScreen } from '../screens/LegalScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import {
  MarketingCampaignsProvider,
  MarketingScreen,
  PromoCodeDetailScreen,
  SaleDetailScreen,
} from '../../marketing';
import { ReviewsScreen } from '../../reviews';

const Stack = createNativeStackNavigator();

export function MoreNavigator() {
  const { colors } = useTheme();

  return (
    <MarketingCampaignsProvider>
      <Stack.Navigator
        screenOptions={{
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.shell },
          headerTitleStyle: {
            fontFamily: FONT_FAMILIES.semibold,
          },
        }}
      >
        <Stack.Screen
          component={MoreScreen}
          name={ROUTES.MORE_HOME}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          component={AccountSettingsScreen}
          name={ROUTES.ACCOUNT_SETTINGS}
          options={{
            title: 'Account',
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          component={NotificationSettingsScreen}
          name={ROUTES.NOTIFICATIONS}
          options={{
            title: 'Notification settings',
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          component={HelpScreen}
          name={ROUTES.HELP}
          options={{
            title: HELP_SCREEN_TITLE,
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          component={SupportScreen}
          name={ROUTES.SUPPORT}
          options={{
            title: CONTACT_US_SCREEN_TITLE,
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          component={LegalScreen}
          name={ROUTES.LEGAL}
          options={{
            title: 'Privacy & terms',
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          component={ServicesScreen}
          name={ROUTES.SERVICES_LIST}
          options={{
            title: 'Services',
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          component={ServiceEditScreen}
          name={ROUTES.SERVICES_EDIT}
          options={{
            title: 'Edit service',
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          component={AvailabilityScreen}
          name={ROUTES.AVAILABILITY}
          options={{
            title: 'Availability',
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          component={QuotesScreen}
          name={ROUTES.QUOTES}
          options={{
            title: 'Quotes',
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          component={ReviewsScreen}
          name={ROUTES.REVIEWS}
          options={{
            title: 'Reviews',
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          component={MaintenanceScreen}
          name={ROUTES.MAINTENANCE}
          options={{
            title: 'Maintenance details',
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          component={MaintenanceDetailScreen}
          name={ROUTES.MAINTENANCE_DETAIL}
          options={{
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          component={CustomerDetailsScreen}
          name={ROUTES.CUSTOMER_DETAILS}
          options={{
            title: 'Customer details',
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          component={QuoteDetailScreen}
          name={ROUTES.QUOTE_DETAIL}
          options={{
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          component={BookingLinkScreen}
          name={ROUTES.BOOKING_LINK}
          options={{
            title: 'Booking link',
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          component={QrCodeScreen}
          name={ROUTES.QR_CODE}
          options={{
            title: 'QR code',
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          component={MarketingScreen}
          name={ROUTES.MARKETING}
          options={{
            title: 'Marketing',
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          component={PromoCodeDetailScreen}
          name={ROUTES.MARKETING_PROMO_DETAIL}
          options={{
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          component={SaleDetailScreen}
          name={ROUTES.MARKETING_SALE_DETAIL}
          options={{
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          component={PaymentsScreen}
          name={ROUTES.MORE_PAYMENTS}
          options={{
            title: 'Payments',
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitleVisible: false,
          }}
        />
      </Stack.Navigator>
    </MarketingCampaignsProvider>
  );
}
