import { useMemo } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText, SurfaceCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

const GALLERY_COLUMNS = 3;
const GALLERY_GAP = 10;

export function GalleryTabContent({ images }) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();

  const tilePx = useMemo(() => {
    const horizontalPad = 16 * 2;
    const contentWidth = Math.max(0, windowWidth - horizontalPad);
    const totalGaps = GALLERY_GAP * (GALLERY_COLUMNS - 1);
    return Math.max(88, Math.floor((contentWidth - totalGaps) / GALLERY_COLUMNS));
  }, [windowWidth]);

  const tileStyle = useMemo(() => ({ width: tilePx, height: tilePx }), [tilePx]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          paddingBottom: 28,
          paddingHorizontal: 16,
          paddingTop: 16,
        },
        galleryGrid: {
          alignContent: 'flex-start',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: GALLERY_GAP,
          justifyContent: 'flex-start',
        },
        galleryTile: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          flexGrow: 0,
          flexShrink: 0,
          overflow: 'hidden',
        },
        galleryTileImage: {
          height: '100%',
          width: '100%',
        },
        card: {
          borderColor: colors.border,
          borderRadius: 18,
          borderWidth: 1,
          marginBottom: 12,
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        emptyStateText: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      {images.length ? (
        <View style={styles.galleryGrid}>
          {images.map((image) => (
            <View
              key={String(image.id ?? image.storage_path)}
              style={[styles.galleryTile, tileStyle]}
            >
              <Image source={{ uri: image.preview_url }} style={styles.galleryTileImage} />
            </View>
          ))}
        </View>
      ) : (
        <SurfaceCard style={styles.card} padding="none">
          <AppText style={styles.emptyStateText}>No gallery images yet.</AppText>
        </SurfaceCard>
      )}
    </View>
  );
}
