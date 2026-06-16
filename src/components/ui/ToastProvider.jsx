import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { resolveToastAutoDismissMs } from './toastAutoDismiss';
import { ToastView } from './Toast';

/**
 * Centralized toast notifications.
 *
 * Mount {@link ToastProvider} once near the app root (inside the theme + safe-area providers),
 * then call {@link useToast} anywhere to show a single, consistent toast.
 *
 * @typedef {import('./Toast').ToastType} ToastType
 *
 * @typedef {'default' | 'sms' | 'email'} ToastVariant
 *
 * @typedef {object} ToastOptions
 * @property {string} [id] Reuse an existing toast id to update it in place (e.g. loading → success).
 * @property {string | null} [title] Optional bold first line.
 * @property {ToastVariant} [variant] `sms` / `email` = white confirmation card with extended auto-dismiss; swipe up to dismiss sooner.
 * @property {number | null} [duration] Auto-dismiss ms. `null` keeps it until dismissed/updated. Omit to use the default for the toast type.
 * @property {() => void} [onPress] Tap handler. When omitted, tapping dismisses the toast.
 */

const ToastContext = createContext(null);

let counter = 0;
function nextId() {
  counter += 1;
  return `toast-${counter}`;
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [dismissing, setDismissing] = useState(false);
  const currentRef = useRef(null);
  const timerRef = useRef(null);

  const setCurrent = useCallback((next) => {
    currentRef.current = next;
    setToast(next);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dismiss = useCallback(
    (id) => {
      const cur = currentRef.current;
      if (!cur) {
        return;
      }
      if (id && cur.id !== id) {
        return;
      }
      clearTimer();
      setDismissing(true);
    },
    [clearTimer],
  );

  const scheduleAuto = useCallback(
    (id, duration) => {
      clearTimer();
      if (duration == null) {
        return;
      }
      timerRef.current = setTimeout(() => dismiss(id), duration);
    },
    [clearTimer, dismiss],
  );

  const finalizeHide = useCallback(() => {
    currentRef.current = null;
    clearTimer();
    setDismissing(false);
    setToast(null);
  }, [clearTimer]);

  /**
   * @param {ToastOptions & { type?: ToastType; message: string }} opts
   * @returns {string} the toast id (pass back in to update it later)
   */
  const show = useCallback(
    (opts) => {
      const id = opts.id ?? nextId();
      const type = opts.type ?? 'info';
      const variant = opts.variant ?? 'default';
      const duration = resolveToastAutoDismissMs(type, variant, opts.duration);
      setDismissing(false);
      setCurrent({
        id,
        type,
        variant,
        title: opts.title ?? null,
        message: opts.message ?? '',
        onPress: opts.onPress ?? null,
      });
      scheduleAuto(id, duration);
      return id;
    },
    [scheduleAuto, setCurrent],
  );

  const update = useCallback(
    (id, patch) => {
      const cur = currentRef.current;
      if (!cur || cur.id !== id) {
        return;
      }
      const type = patch.type ?? cur.type;
      const variant = patch.variant ?? cur.variant ?? 'default';
      const duration = resolveToastAutoDismissMs(type, variant, patch.duration);
      setDismissing(false);
      setCurrent({ ...cur, ...patch, type, variant });
      scheduleAuto(id, duration);
    },
    [scheduleAuto, setCurrent],
  );

  /** Show a new toast, or morph the current one in place when `opts.id` matches it. */
  const notify = useCallback(
    (type, message, opts = {}) => {
      const cur = currentRef.current;
      if (opts.id && cur && cur.id === opts.id) {
        update(opts.id, {
          type,
          message,
          title: opts.title ?? null,
          onPress: opts.onPress ?? null,
          duration: opts.duration,
          variant: opts.variant,
        });
        return opts.id;
      }
      return show({ ...opts, type, message });
    },
    [show, update],
  );

  const value = useMemo(
    () => ({
      show,
      update,
      dismiss,
      success: (message, opts) => notify('success', message, opts),
      error: (message, opts) => notify('error', message, opts),
      loading: (message, opts) => notify('loading', message, opts),
      info: (message, opts) => notify('info', message, opts),
      /** SMS confirmation card — auto-dismisses after a readable pause; swipe up or tap to dismiss sooner. */
      sms: (message, opts = {}) =>
        notify(opts.type ?? 'success', message, { ...opts, variant: 'sms' }),
      /** Email confirmation card — auto-dismisses after a readable pause; swipe up or tap to dismiss sooner. */
      email: (message, opts = {}) =>
        notify(opts.type ?? 'success', message, { ...opts, variant: 'email' }),
    }),
    [show, update, dismiss, notify],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <ToastView
          key={toast.id}
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
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (ctx === null) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
