/**
 * Stub for `import { Ionicons, … } from '@expo/vector-icons'` — avoids real `createIconSet` in Jest.
 */
const React = require('react');
const { Text } = require('react-native');

function IconStub(props) {
  return React.createElement(Text, { accessibilityRole: 'image', ...props });
}

const NAMES = [
  'AntDesign',
  'Entypo',
  'EvilIcons',
  'Feather',
  'Fontisto',
  'FontAwesome',
  'FontAwesome5',
  'FontAwesome6',
  'Foundation',
  'Ionicons',
  'MaterialCommunityIcons',
  'MaterialIcons',
  'Octicons',
  'SimpleLineIcons',
  'Zocial',
];

const out = {
  __esModule: true,
  default: IconStub,
  createIconSet: () => IconStub,
  createMultiStyleIconSet: () => IconStub,
  createIconSetFromFontello: () => IconStub,
  createIconSetFromIcoMoon: () => IconStub,
};

for (const n of NAMES) {
  out[n] = IconStub;
}

module.exports = out;
