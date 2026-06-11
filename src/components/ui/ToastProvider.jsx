import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ToastView } from './Toast';

/**
 * Centralized toast notifications.
 *
 * Mount {@link ToastProvider} once near the app root (inside the theme + safe-area providers),
 * then call {@link useToast} anywhere to show a single, consistent toast.
 *
 * @typedef {import('./Toast').ToastType} ToastType
 *
 * @typedef {object} ToastOptions
 * @property {string} [id] Reuse an existing toast id to update it in place (e.g. loading → success).
 * @property {string | null} [title] Optional bold first line.
 * @property {number | null} [duration] Auto-dismiss ms. `null` keeps it until dismissed/updated.
 * @property {() => void} [onPress] Tap handler. When omitted, tapping dismisses the toast.
 */

const ToastContext = createContext(null);

let counter = 0;
function nextId() {
  counter += 1;
  return `toast-${counter}`;
}

/** Per-type auto-dismiss. `loading` persists (null) until updated or dismissed. */
const DEFAULT_DURATION = {
  success: 3000,
  error: 4200,
  info: 3000,
  loading: null,
};

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
      const duration = opts.duration !== undefined ? opts.duration : DEFAULT_DURATION[type];
      setDismissing(false);
      setCurrent({
        id,
        type,
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
      const duration = patch.duration !== undefined ? patch.duration : DEFAULT_DURATION[type];
      setDismissing(false);
      setCurrent({ ...cur, ...patch, type });
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
          onHidden={finalizeHide}
          onPress={() => {
            toast.onPress?.();
            dismiss(toast.id);
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
