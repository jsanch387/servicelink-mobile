import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

const LocationSuggestionOverlayContext = createContext(null);

/**
 * Hosts MapTiler suggestions in a screen-level layer so the list is not clipped
 * by cards, later siblings, or the edit-mode save bar.
 */
export function LocationSuggestionOverlayProvider({ children, style }) {
  const hostRef = useRef(null);
  const [overlay, setOverlayState] = useState(null);

  const setOverlay = useCallback((next) => {
    if (!next) {
      setOverlayState(null);
      return;
    }

    const host = hostRef.current;
    if (!host?.measureInWindow) {
      setOverlayState(next);
      return;
    }

    host.measureInWindow((hostX, hostY) => {
      setOverlayState({
        left: next.left - hostX,
        top: next.top - hostY,
        width: next.width,
        node: next.node,
      });
    });
  }, []);

  return (
    <LocationSuggestionOverlayContext.Provider value={setOverlay}>
      <View ref={hostRef} collapsable={false} style={style}>
        {children}
        {overlay ? (
          <View pointerEvents="box-none" style={styles.layer}>
            <View
              pointerEvents="box-none"
              style={[
                styles.anchor,
                { top: overlay.top, left: overlay.left, width: overlay.width },
              ]}
            >
              {overlay.node}
            </View>
          </View>
        ) : null}
      </View>
    </LocationSuggestionOverlayContext.Provider>
  );
}

export function useLocationSuggestionOverlay() {
  return useContext(LocationSuggestionOverlayContext);
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    elevation: 9999,
    zIndex: 9999,
  },
  anchor: {
    elevation: 9999,
    position: 'absolute',
    zIndex: 9999,
  },
});
