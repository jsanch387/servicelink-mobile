import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  DurationSelectField,
  SurfaceCard,
  SurfaceTextField,
} from '../../../components/ui';
import {
  formatServiceDurationSelectLabel,
  minutesToServiceDurationHHmm,
  serviceDurationHHmmToMinutes,
} from '../../../components/ui/durationTime';
import { useTheme } from '../../../theme';

function normalizePriceInput(rawText) {
  const input = String(rawText ?? '').replace(/\$/g, '');
  let out = '';
  let dotSeen = false;
  for (const ch of input) {
    if (ch >= '0' && ch <= '9') {
      out += ch;
      continue;
    }
    if (ch === '.' && !dotSeen) {
      out += ch;
      dotSeen = true;
    }
  }
  return out;
}

function createLocalId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `svc-${Date.now()}`;
}

function RequiredLabel({ children, colors }) {
  return (
    <View style={stylesInline.requiredRow}>
      <AppText style={[stylesInline.requiredBase, { color: colors.textMuted }]}>{children}</AppText>
      <AppText style={[stylesInline.requiredBase, { color: colors.danger }]}> *</AppText>
    </View>
  );
}

const stylesInline = StyleSheet.create({
  requiredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requiredBase: {
    fontSize: 14,
    fontWeight: '500',
  },
});

/**
 * @param {{ services: Array<{ id: string; name: string; description: string; priceInput: string; durationMinutes: number }>; onServicesChange: (next: unknown[]) => void }} props
 */
export function OnboardingServicesStep({ services, onServicesChange }) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationHHmm, setDurationHHmm] = useState('01:00');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        cardTitle: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '700',
          marginBottom: 4,
        },
        fieldBlock: {
          marginBottom: 4,
        },
        descriptionToolbar: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 12,
          marginTop: -8,
        },
        charCount: {
          fontSize: 13,
          fontWeight: '500',
        },
        listCard: {
          marginTop: 18,
          paddingBottom: 8,
          paddingHorizontal: 16,
          paddingTop: 14,
        },
        listTitle: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '700',
          marginBottom: 12,
        },
        row: {
          alignItems: 'center',
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 12,
        },
        rowLast: {
          borderBottomWidth: 0,
        },
        rowMain: {
          flex: 1,
          minWidth: 0,
          paddingRight: 10,
        },
        rowTitle: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '700',
        },
        rowMeta: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '600',
          marginTop: 4,
        },
        delHit: {
          alignItems: 'center',
          height: 36,
          justifyContent: 'center',
          width: 36,
        },
      }),
    [colors],
  );

  const canAdd =
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    price.trim().length > 0 &&
    String(durationHHmm ?? '').trim().length > 0;

  function insertBulletPoint() {
    setDescription((current) => {
      const text = String(current ?? '');
      if (text.trim().length === 0) {
        return '• ';
      }
      const needsLineBreak = !text.endsWith('\n');
      return `${text}${needsLineBreak ? '\n' : ''}• `;
    });
  }

  function handleAdd() {
    if (!canAdd) return;
    const durationMinutes = serviceDurationHHmmToMinutes(durationHHmm);
    onServicesChange([
      ...services,
      {
        id: createLocalId(),
        name: name.trim(),
        description: description.trim(),
        priceInput: price.trim(),
        durationMinutes,
      },
    ]);
    setName('');
    setDescription('');
    setPrice('');
    setDurationHHmm('01:00');
  }

  function handleRemove(id) {
    onServicesChange(services.filter((s) => s.id !== id));
  }

  function formatRowMeta(s) {
    const priceLabel = s.priceInput?.trim() ? `$${s.priceInput.trim()}` : '$0';
    const hhmm = minutesToServiceDurationHHmm(s.durationMinutes);
    const dur = formatServiceDurationSelectLabel(hhmm);
    return `${priceLabel} · ${dur}`;
  }

  return (
    <>
      <SurfaceCard>
        <AppText style={styles.cardTitle}>Add a service</AppText>

        <View style={styles.fieldBlock}>
          <RequiredLabel colors={colors}>Service name</RequiredLabel>
          <SurfaceTextField
            label={null}
            placeholder="e.g. Full detail, Lawn mowing"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.fieldBlock}>
          <RequiredLabel colors={colors}>Description</RequiredLabel>
          <SurfaceTextField
            label={null}
            maxLength={800}
            multiline
            placeholder="Tell customers what they get."
            style={{ minHeight: 100 }}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
          <View style={styles.descriptionToolbar}>
            <Pressable
              accessibilityLabel="Insert bullet point"
              accessibilityRole="button"
              hitSlop={8}
              onPress={insertBulletPoint}
            >
              <Ionicons color={colors.textMuted} name="list-outline" size={18} />
            </Pressable>
            <AppText style={[styles.charCount, { color: colors.textMuted }]}>
              {description.length}/800
            </AppText>
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <RequiredLabel colors={colors}>Price</RequiredLabel>
          <SurfaceTextField
            keyboardType="decimal-pad"
            label={null}
            placeholder="$0"
            value={price ? `$${price}` : ''}
            onChangeText={(text) => setPrice(normalizePriceInput(text))}
          />
        </View>

        <DurationSelectField
          containerStyle={{ marginBottom: 16 }}
          label="Duration"
          placeholder="How long does it take?"
          value={durationHHmm}
          onValueChange={setDurationHHmm}
        />

        <Button
          disabled={!canAdd}
          fullWidth
          title="+ Add this service"
          variant="surfaceLight"
          onPress={handleAdd}
        />
      </SurfaceCard>

      {services.length > 0 ? (
        <SurfaceCard style={styles.listCard}>
          <AppText style={styles.listTitle}>Your services ({services.length})</AppText>
          {services.map((s, index) => (
            <View key={s.id} style={[styles.row, index === services.length - 1 && styles.rowLast]}>
              <View style={styles.rowMain}>
                <AppText numberOfLines={1} style={styles.rowTitle}>
                  {s.name}
                </AppText>
                <AppText style={styles.rowMeta}>{formatRowMeta(s)}</AppText>
              </View>
              <Pressable
                accessibilityLabel="Remove service"
                accessibilityRole="button"
                style={styles.delHit}
                onPress={() => handleRemove(s.id)}
              >
                <Ionicons color={colors.textMuted} name="trash-outline" size={22} />
              </Pressable>
            </View>
          ))}
        </SurfaceCard>
      ) : null}
    </>
  );
}
