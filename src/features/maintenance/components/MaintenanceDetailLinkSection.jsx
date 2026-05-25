import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, DetailsSectionCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  MAINTENANCE_DETAIL_COPY_LINK_BUTTON,
  MAINTENANCE_DETAIL_LINK_READY_COPY,
  MAINTENANCE_DETAIL_LINK_UNAVAILABLE_COPY,
} from '../constants';

/**
 * @param {object} props
 * @param {boolean} props.canCopyLink
 * @param {boolean} props.linkCopied
 * @param {() => void} props.onCopyLink
 */
export function MaintenanceDetailLinkSection({ canCopyLink, linkCopied, onCopyLink }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        inner: {
          gap: 14,
        },
        helper: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 21,
        },
      }),
    [colors],
  );

  return (
    <DetailsSectionCard bodyPadding="roomy" title="Link">
      <View style={styles.inner}>
        <AppText style={styles.helper}>
          {canCopyLink
            ? MAINTENANCE_DETAIL_LINK_READY_COPY
            : MAINTENANCE_DETAIL_LINK_UNAVAILABLE_COPY}
        </AppText>
        {canCopyLink ? (
          <Button
            fullWidth
            iconName={linkCopied ? 'checkmark-circle' : 'link-outline'}
            title={linkCopied ? 'Link copied' : MAINTENANCE_DETAIL_COPY_LINK_BUTTON}
            variant="secondary"
            onPress={onCopyLink}
          />
        ) : null}
      </View>
    </DetailsSectionCard>
  );
}
