import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';

const STEPS = [
  { key: 'turn_on', label: 'Turn on', icon: 'flash-outline' },
  { key: 'plan', label: 'Create plan', icon: 'pricetag-outline' },
  { key: 'share', label: 'Share link', icon: 'link-outline' },
];

/**
 * Tiny 3-step setup rail for subscriptions onboarding.
 * @param {object} props
 * @param {'turn_on' | 'plan' | 'share'} props.activeKey
 * @param {Iterable<string>} [props.completedKeys]
 */
export function SubscriptionsSetupProgress({ activeKey, completedKeys = [] }) {
  const { colors } = useTheme();
  const done = useMemo(() => new Set(completedKeys), [completedKeys]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginBottom: 18,
        },
        row: {
          alignItems: 'flex-start',
          flexDirection: 'row',
        },
        step: {
          alignItems: 'center',
          width: 64,
        },
        iconWrap: {
          alignItems: 'center',
          borderRadius: 14,
          borderWidth: 1.5,
          height: 44,
          justifyContent: 'center',
          width: 44,
        },
        label: {
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 11,
          letterSpacing: -0.1,
          marginTop: 8,
          textAlign: 'center',
          width: 64,
        },
        connectorSlot: {
          flex: 1,
          height: 44,
          justifyContent: 'center',
          paddingHorizontal: 4,
        },
        connector: {
          borderRadius: 1,
          height: 2,
          width: '100%',
        },
      }),
    [],
  );

  return (
    <View accessibilityRole="progressbar" style={styles.wrap}>
      <View style={styles.row}>
        {STEPS.map((step, index) => {
          const isDone = done.has(step.key);
          const isActive = step.key === activeKey;
          const iconName = isDone ? 'checkmark' : step.icon;
          const iconColor = isDone || isActive ? colors.shell : colors.textMuted;
          const wrapBg = isDone ? '#22c55e' : isActive ? colors.accent : colors.cardSurface;
          const wrapBorder = isDone ? '#22c55e' : isActive ? colors.accent : colors.border;
          const connectorOn = done.has(step.key);

          return (
            <View
              key={step.key}
              style={{ flexDirection: 'row', flex: index < STEPS.length - 1 ? 1 : 0 }}
            >
              <View style={styles.step}>
                <View
                  style={[styles.iconWrap, { backgroundColor: wrapBg, borderColor: wrapBorder }]}
                >
                  <Ionicons color={iconColor} name={iconName} size={isDone ? 22 : 20} />
                </View>
                <AppText
                  style={[
                    styles.label,
                    { color: isDone || isActive ? colors.text : colors.textMuted },
                  ]}
                >
                  {step.label}
                </AppText>
              </View>
              {index < STEPS.length - 1 ? (
                <View style={styles.connectorSlot}>
                  <View
                    style={[
                      styles.connector,
                      { backgroundColor: connectorOn ? '#22c55e' : colors.border },
                    ]}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}
