import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SCREEN_GUTTER } from '../../../constants/layout';
import {
  getMinNativeAppVersion,
  isNativeStoreUpdateRequired,
} from '../utils/getNativeStoreUpdateConfig';
import { openNativeStoreUpdate } from '../utils/openNativeStoreUpdate';
import { StoreUpdateBanner } from './StoreUpdateBanner';

/** Top strip when the installed store binary is below the configured minimum version. */
export function NativeStoreUpdateBootstrap() {
  const insets = useSafeAreaInsets();
  const minimumVersion = getMinNativeAppVersion();
  const updateRequired = isNativeStoreUpdateRequired();

  const containerStyle = useMemo(
    () => [styles.container, { paddingTop: insets.top + 6 }],
    [insets.top],
  );

  if (!updateRequired || !minimumVersion) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={containerStyle}>
      <StoreUpdateBanner minimumVersion={minimumVersion} onPressUpdate={openNativeStoreUpdate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    left: 0,
    paddingBottom: 6,
    paddingHorizontal: SCREEN_GUTTER,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 100,
  },
});
