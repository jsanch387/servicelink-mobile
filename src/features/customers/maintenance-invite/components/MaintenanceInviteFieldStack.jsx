import { View } from 'react-native';
import { MAINTENANCE_INVITE_FIELD_GAP } from '../constants';

/** Consistent vertical spacing between maintenance invite wizard inputs. */
export function MaintenanceInviteFieldStack({ children }) {
  return <View style={{ gap: MAINTENANCE_INVITE_FIELD_GAP }}>{children}</View>;
}
