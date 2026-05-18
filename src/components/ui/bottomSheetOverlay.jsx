import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

const BottomSheetOverlayContext = createContext(null);

export function BottomSheetOverlayProvider({ children }) {
  const [overlay, setOverlay] = useState(null);
  const show = useCallback((node) => setOverlay(node), []);
  const hide = useCallback(() => setOverlay(null), []);
  const value = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <BottomSheetOverlayContext.Provider value={value}>
      {children}
      {overlay ? (
        <View pointerEvents="box-none" style={styles.host}>
          {overlay}
        </View>
      ) : null}
    </BottomSheetOverlayContext.Provider>
  );
}

export function useBottomSheetOverlay() {
  return useContext(BottomSheetOverlayContext);
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
});
