import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BottomSheetModal, Button } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { useMarketingShareBusiness } from '../hooks/useMarketingShareBusiness';
import {
  captureMarketingShareStory,
  saveMarketingShareStoryToLibrary,
  shareMarketingShareStory,
} from '../utils/captureMarketingShareStory';
import { MarketingShareStoryCard } from './MarketingShareStoryCard';

/**
 * Preview + share/save a marketing offer graphic.
 * Uses the shared {@link BottomSheetModal} (native page sheet on iOS).
 *
 * @param {object} props
 * @param {boolean} props.visible
 * @param {() => void} props.onRequestClose
 * @param {import('../utils/marketingCampaignModel').MarketingCampaign | null} props.campaign
 */
export function MarketingShareStorySheet({ visible, onRequestClose, campaign }) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const { businessName, bookingLinkDisplay } = useMarketingShareBusiness();
  const shotRef = useRef(null);
  const [busy, setBusy] = useState(/** @type {null | 'share' | 'save'} */ (null));

  const previewWidth = Math.min(windowWidth - 56, 300);
  const show = visible && campaign != null;

  useEffect(() => {
    if (show) setBusy(null);
  }, [show]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        previewWrap: {
          alignItems: 'center',
        },
        previewFrame: {
          borderColor: colors.border,
          borderRadius: 16,
          borderWidth: 1,
          elevation: 8,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.28,
          shadowRadius: 18,
        },
        footer: {
          gap: 10,
        },
      }),
    [colors],
  );

  const runCapture = useCallback(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    return captureMarketingShareStory(shotRef);
  }, []);

  const handleShare = useCallback(async () => {
    if (!campaign || busy) return;
    setBusy('share');
    try {
      const uri = await runCapture();
      await shareMarketingShareStory(uri);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err) {
      Alert.alert('Could not share', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }, [busy, campaign, runCapture]);

  const handleSave = useCallback(async () => {
    if (!campaign || busy) return;
    setBusy('save');
    try {
      const uri = await runCapture();
      await saveMarketingShareStoryToLibrary(uri);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('Saved', 'Image saved to your photo library.');
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }, [busy, campaign, runCapture]);

  return (
    <BottomSheetModal
      centerContent
      footer={
        <View style={styles.footer}>
          <Button
            disabled={!campaign || busy != null}
            fullWidth
            iconName="share-social-outline"
            loading={busy === 'share'}
            title="Share"
            variant="primary"
            onPress={() => {
              void handleShare();
            }}
          />
          <Button
            disabled={!campaign || busy != null}
            fullWidth
            iconName="download-outline"
            loading={busy === 'save'}
            title="Save to Photos"
            variant="secondary"
            onPress={() => {
              void handleSave();
            }}
          />
        </View>
      }
      stickyFooter
      subtitle="Share this offer by text, social, or anywhere."
      title="Share"
      visible={show}
      onRequestClose={busy ? () => {} : onRequestClose}
    >
      {campaign ? (
        <View style={styles.previewWrap}>
          <View style={styles.previewFrame}>
            <MarketingShareStoryCard
              ref={shotRef}
              bookingLinkDisplay={bookingLinkDisplay}
              businessName={businessName}
              campaign={campaign}
              width={previewWidth}
            />
          </View>
        </View>
      ) : null}
    </BottomSheetModal>
  );
}
