import { Image, StyleSheet, View } from 'react-native';

const source = require('../../../../assets/images/servicelink-logo.png');

/** On-screen layout box (dp); raster source ~3× for sharp displays. */
const DISPLAY_WIDTH = 204;
const DISPLAY_HEIGHT = 62;

export function AuthBrandLogo() {
  return (
    <View style={styles.wrap}>
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel="ServiceLink"
        accessibilityRole="image"
        resizeMode="contain"
        source={source}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: 22,
  },
  image: {
    height: DISPLAY_HEIGHT,
    maxWidth: '100%',
    width: DISPLAY_WIDTH,
  },
});
