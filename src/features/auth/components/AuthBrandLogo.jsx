import { Image, StyleSheet, View } from 'react-native';

const source = require('../../../../assets/images/servicelink-logo.png');

/** On-screen mark size (dp); raster source is 1024px for sharp displays. */
const DEFAULT_MARK_SIZE = 62;

/**
 * Chain-link mark. `markSize` is the square the glyph is drawn into.
 * @param {{ markSize?: number; spaced?: boolean }} [props]
 */
export function AuthBrandLogo({ markSize = DEFAULT_MARK_SIZE, spaced = false }) {
  return (
    <View style={[styles.wrap, spaced && styles.wrapSpaced]}>
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel="ServiceLink"
        accessibilityRole="image"
        resizeMode="contain"
        source={source}
        style={{ height: markSize, width: markSize }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: 5,
  },
  wrapSpaced: {
    marginBottom: 22,
  },
});
