import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { ToastView } from './Toast';
import { useToast } from './ToastProvider';

/**
 * Mount inside a full-screen {@link Modal} so app toasts render above that sheet.
 * While mounted, the root {@link ToastProvider} layer is suppressed.
 */
export function ToastModalHost() {
  const { registerModalHost, toastPresentation } = useToast();

  useEffect(() => registerModalHost(), [registerModalHost]);

  if (!toastPresentation) {
    return null;
  }

  const { toast, dismissing, dismiss, finalizeHide } = toastPresentation;

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <ToastView
        dismissing={dismissing}
        message={toast.message}
        variant={toast.variant ?? 'default'}
        onDismiss={() => dismiss(toast.id)}
        onHidden={finalizeHide}
        onPress={() => {
          toast.onPress?.();
        }}
        title={toast.title}
        type={toast.type}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
  },
});
