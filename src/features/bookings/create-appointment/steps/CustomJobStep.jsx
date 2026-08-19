import { StyleSheet, View } from 'react-native';
import { CustomJobFields, SurfaceCard } from '../../../../components/ui';
import { AppointmentNotesCard } from '../components/AppointmentNotesCard';

export function CustomJobStep({
  serviceName,
  priceUsdText,
  priceErrorText,
  durationHhMm,
  notes,
  showNotes = true,
  membershipVisit = false,
  onServiceNameChange,
  onPriceUsdTextChange,
  onDurationHhMmChange,
  onNotesChange,
}) {
  return (
    <View style={styles.root}>
      <SurfaceCard outlined padding="none" style={styles.card}>
        <CustomJobFields
          durationHhMm={durationHhMm}
          membershipVisit={membershipVisit}
          priceErrorText={priceErrorText}
          priceUsdText={priceUsdText}
          serviceName={serviceName}
          onDurationHhMmChange={onDurationHhMmChange}
          onPriceUsdTextChange={onPriceUsdTextChange}
          onServiceNameChange={onServiceNameChange}
        />
      </SurfaceCard>
      {showNotes ? <AppointmentNotesCard notes={notes} onChangeNotes={onNotesChange} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 18,
  },
  card: {
    paddingBottom: 30,
    paddingHorizontal: 14,
    paddingTop: 30,
  },
});
