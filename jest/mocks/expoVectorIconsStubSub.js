/**
 * Stub for `import Icon from '@expo/vector-icons/…'` — avoids async font load + `act()` noise in Jest.
 */
const React = require('react');
const { Text } = require('react-native');

function IconStub(props) {
  return React.createElement(Text, { accessibilityRole: 'image', ...props });
}

module.exports = IconStub;
