import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBox } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';

function Field({ labelWidth }) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <SkeletonBox backgroundColor={colors.border} height={14} pulse width={labelWidth} />
      <SkeletonBox
        backgroundColor={colors.border}
        borderRadius={16}
        height={52}
        pulse
        style={styles.input}
        width="100%"
      />
    </View>
  );
}

/** First step of the draft editor, shown while a draft is still loading. */
export function InvoiceDraftEditorSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        body: {
          flex: 1,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 20,
        },
        header: {
          alignItems: 'center',
          flexDirection: 'row',
          paddingBottom: 32,
          paddingTop: 8,
          width: '100%',
        },
        titleCol: {
          flex: 1,
          minWidth: 0,
        },
        footer: {
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          gap: 12,
          paddingBottom: 12,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        footerBtn: {
          flex: 1,
          minWidth: 0,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.titleCol}>
            <SkeletonBox backgroundColor={colors.border} height={28} pulse width={148} />
          </View>
          <SkeletonBox backgroundColor={colors.border} height={14} pulse width={44} />
        </View>
        <Field labelWidth={112} />
        <Field labelWidth={48} />
        <Field labelWidth={44} />
      </View>
      <View style={styles.footer}>
        <View style={styles.footerBtn}>
          <SkeletonBox
            backgroundColor={colors.border}
            borderRadius={14}
            height={52}
            pulse
            width="100%"
          />
        </View>
        <View style={styles.footerBtn}>
          <SkeletonBox
            backgroundColor={colors.border}
            borderRadius={14}
            height={52}
            pulse
            width="100%"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 20,
  },
  input: {
    marginTop: 8,
  },
});
