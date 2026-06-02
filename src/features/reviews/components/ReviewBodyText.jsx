import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';
import {
  REVIEW_BODY_COLLAPSED_MAX_CHARS,
  REVIEW_SHOW_LESS_LABEL,
  REVIEW_SHOW_MORE_LABEL,
} from '../constants';
import { getCollapsedReviewBody, isReviewBodyTruncatable } from '../utils/reviewBodyPreview';

/**
 * @param {{
 *   body: string;
 *   maxChars?: number;
 *   showTopMargin?: boolean;
 *   bodyStyle?: import('react-native').TextStyle;
 * }} props
 */
export function ReviewBodyText({
  body,
  maxChars = REVIEW_BODY_COLLAPSED_MAX_CHARS,
  showTopMargin = true,
  bodyStyle,
}) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const truncatable = useMemo(() => isReviewBodyTruncatable(body, maxChars), [body, maxChars]);

  useEffect(() => {
    setExpanded(false);
  }, [body]);

  const displayBody = useMemo(() => {
    if (!truncatable || expanded) return body.trim();
    return getCollapsedReviewBody(body, maxChars);
  }, [body, expanded, maxChars, truncatable]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 22,
          marginTop: showTopMargin ? 14 : 0,
        },
        toggle: {
          alignSelf: 'flex-start',
          marginTop: 6,
        },
        toggleText: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '600',
          textDecorationLine: 'underline',
        },
      }),
    [colors, showTopMargin],
  );

  return (
    <View>
      <AppText style={[styles.body, bodyStyle]}>{displayBody}</AppText>
      {truncatable ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          hitSlop={{ top: 6, bottom: 6, left: 4, right: 8 }}
          onPress={() => setExpanded((open) => !open)}
          style={styles.toggle}
        >
          <AppText style={styles.toggleText}>
            {expanded ? REVIEW_SHOW_LESS_LABEL : REVIEW_SHOW_MORE_LABEL}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
