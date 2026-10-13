import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

const BottomSheetOverlayContext = createContext(null);

export function BottomSheetOverlayProvider({ children }) {
  const [overlay, setOverlay] = useState(null);
  const show = useCallback((node) => setOverlay(node), []);
  const hide = useCallback(() => setOverlay(null), []);
  const actions = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <BottomSheetOverlayContext.Provider value={actions}>
      {children}
      {overlay ? (
        <View collapsable={false} pointerEvents="box-none" style={styles.host}>
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
