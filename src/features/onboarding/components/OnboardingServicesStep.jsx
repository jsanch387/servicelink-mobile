import Ionicons from '@expo/vector-icons/Ionicons';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
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
import {
  MAX_ONBOARDING_SERVICE_NAME_LENGTH,
  MAX_ONBOARDING_SERVICE_PRICE_INPUT_LENGTH,
} from '../constants/onboardingInputLimits';
import { buildOnboardingServiceDraft } from '../utils/buildOnboardingServiceDraft';

const FIELD_GAP = 20;

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
  if (out.length > MAX_ONBOARDING_SERVICE_PRICE_INPUT_LENGTH) {
    return out.slice(0, MAX_ONBOARDING_SERVICE_PRICE_INPUT_LENGTH);
  }
  return out;
}

function createLocalId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `svc-${Date.now()}`;
}

/**
 * @param {{
 *   services: Array<{ id: string; name: string; description: string; priceInput: string; durationMinutes: number }>;
 *   onServicesChange: (next: unknown[]) => void;
 *   suggestedName?: string;
 * }} props
 */
export const OnboardingServicesStep = forwardRef(function OnboardingServicesStep(
  { services, onServicesChange, suggestedName = '' },
  ref,
) {
  const { colors } = useTheme();
  const [name, setName] = useState(() => String(suggestedName ?? '').trim());
  const [price, setPrice] = useState('');
  const [durationHHmm, setDurationHHmm] = useState('01:00');

  useEffect(() => {
    if (services.length > 0) {
      return;
    }
    const next = String(suggestedName ?? '').trim();
    if (!next) {
      return;
    }
    setName((prev) => (String(prev ?? '').trim() ? prev : next));
  }, [suggestedName, services.length]);

  useImperativeHandle(
    ref,
    () => ({
      commitDraftIfNeeded() {
        if (services.length > 0) {
          return services;
        }
        const draft = buildOnboardingServiceDraft({
          id: createLocalId(),
          name,
          priceInput: price,
          durationMinutes: serviceDurationHHmmToMinutes(durationHHmm),
        });
        if (!draft) {
          return [];
        }
        const next = [draft];
        onServicesChange(next);
        return next;
      },
    }),
    [durationHHmm, name, onServicesChange, price, services],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: {
          gap: FIELD_GAP,
        },
        flush: {
          marginBottom: 0,
          marginTop: 0,
        },
        listCard: {
          marginTop: services.length > 0 ? 0 : 18,
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
    [colors, services.length],
  );

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
      {services.length === 0 ? (
        <SurfaceCard>
          <View style={styles.stack}>
            <SurfaceTextField
              autoCapitalize="words"
              containerStyle={styles.flush}
              label="Service name"
              maxLength={MAX_ONBOARDING_SERVICE_NAME_LENGTH}
              placeholder="e.g. Full detail"
              value={name}
              onChangeText={setName}
            />
            <SurfaceTextField
              containerStyle={styles.flush}
              keyboardType="decimal-pad"
              label="Price"
              maxLength={MAX_ONBOARDING_SERVICE_PRICE_INPUT_LENGTH + 1}
              placeholder="$0"
              value={price ? `$${price}` : ''}
              onChangeText={(text) => setPrice(normalizePriceInput(text))}
            />
            <DurationSelectField
              compact
              containerStyle={styles.flush}
              label="Duration"
              placeholder="How long does it take?"
              value={durationHHmm}
              onValueChange={setDurationHHmm}
            />
          </View>
        </SurfaceCard>
      ) : (
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
      )}
    </>
  );
});
