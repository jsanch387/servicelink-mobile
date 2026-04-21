import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';

const INDICATOR_HEIGHT = 3;

/**
 * Default bottom tab bar plus a white top segment aligned to the active tab.
 */
export function MainTabBar(props) {
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const { state } = props;
  const count = state.routes.length;
  const segmentWidth = count > 0 && trackWidth > 0 ? trackWidth / count : 0;
  const indicatorLeft = state.index * segmentWidth;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.shellElevated }]}>
      <View onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)} style={styles.indicatorTrack}>
        {segmentWidth > 0 ? (
          <View
            style={[
              styles.indicator,
              {
                backgroundColor: colors.tabBarActive,
                left: indicatorLeft,
                width: segmentWidth,
              },
            ]}
          />
        ) : null}
      </View>
      <BottomTabBar
        {...props}
        style={[
          props.style,
          styles.tabBarChrome,
          {
            backgroundColor: colors.shellElevated,
            borderTopWidth: 0,
            paddingTop: 6,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  indicatorTrack: {
    backgroundColor: 'transparent',
    height: INDICATOR_HEIGHT,
    width: '100%',
  },
  indicator: {
    height: INDICATOR_HEIGHT,
    position: 'absolute',
    top: 0,
  },
  tabBarChrome: {
    elevation: 0,
  },
});
