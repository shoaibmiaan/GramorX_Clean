import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type ToastIntent = 'success' | 'error' | 'warning' | 'info';

export type ToastOptions = {
  description?: string;
  duration?: number;
};

export type ToastInput = {
  title: string;
  description?: string;
  intent?: ToastIntent;
  duration?: number;
};

type ToastItem = ToastInput & { id: string };

type ToastDetail = string | ToastOptions;

type ToastApi = {
  push: (input: ToastInput) => void;
  success: (title: string, detail?: ToastDetail) => void;
  error: (title: string, detail?: ToastDetail) => void;
  warn: (title: string, detail?: ToastDetail) => void;
  info: (title: string, detail?: ToastDetail) => void;
};

const DEFAULT_DURATION = 3500;

const randomId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const normalizeDetail = (title: string, detail?: ToastDetail): ToastInput => {
  if (!detail) return { title };
  if (typeof detail === 'string') {
    return { title, description: detail };
  }
  return {
    title,
    description: detail.description,
    duration: detail.duration,
  };
};

const logMissingProvider = (input: ToastInput) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[toast] Missing <ToastProvider>', input);
  }
};

const createToastApi = (dispatch: (toast: ToastInput) => void): ToastApi => ({
  push: (input) => dispatch(input),
  success: (title, detail) => dispatch({ ...normalizeDetail(title, detail), intent: 'success' }),
  error: (title, detail) => dispatch({ ...normalizeDetail(title, detail), intent: 'error' }),
  warn: (title, detail) => dispatch({ ...normalizeDetail(title, detail), intent: 'warning' }),
  info: (title, detail) => dispatch({ ...normalizeDetail(title, detail), intent: 'info' }),
});

const fallbackApi = createToastApi(logMissingProvider);
let activeApi: ToastApi = fallbackApi;

export const toast: ToastApi = {
  push: (input) => activeApi.push(input),
  success: (title, detail) => activeApi.success(title, detail),
  error: (title, detail) => activeApi.error(title, detail),
  warn: (title, detail) => activeApi.warn(title, detail),
  info: (title, detail) => activeApi.info(title, detail),
};

const ToastCtx = createContext<ToastApi>(fallbackApi);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (input: ToastInput) => {
      const id = randomId();
      const duration = typeof input.duration === 'number' ? input.duration : DEFAULT_DURATION;
      setItems((list) => [...list, { ...input, id, duration }]);
      if (duration > 0) {
        setTimeout(() => remove(id), duration);
      }
    },
    [remove],
  );

  const api = useMemo(() => createToastApi(push), [push]);

  useEffect(() => {
    activeApi = api;
    return () => {
      activeApi = fallbackApi;
    };
  }, [api]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed z-[1000] bottom-5 right-5 flex flex-col gap-2 w-[min(92vw,360px)]">
        {items.map((toastItem) => (
          <div
            key={toastItem.id}
            className={`rounded-ds-2xl p-4 shadow-lg border transition-colors duration-200
              ${toastItem.intent === 'success'
                ? 'bg-success/10 border-success/20 text-success'
                : toastItem.intent === 'error'
                  ? 'bg-sunsetRed/10 border-sunsetRed/20 text-sunsetRed'
                  : toastItem.intent === 'warning'
                    ? 'bg-goldenYellow/10 border-goldenYellow/20 text-goldenYellow'
                    : 'bg-dark/80 border-border text-foreground'
              }`}
          >
            <div className="font-semibold">{toastItem.title}</div>
            {toastItem.description ? (
              <div className="text-small opacity-90 mt-1">{toastItem.description}</div>
            ) : null}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function Toaster({ children }: { children?: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

export function useToast() {
  return useContext(ToastCtx);
}

export type ToastHandle = ToastApi;
