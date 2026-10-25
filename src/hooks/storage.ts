import { useEffect, useRef, useState } from "react";
export function stored<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
export function useLocalStorage<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => value is T,
) {
  const [value, setValue] = useState<T>(() => {
    const saved = stored<unknown>(key, null);
    return validate(saved) ? saved : fallback;
  });
  const [storageError, setStorageError] = useState(false);
  const validateRef = useRef(validate),
    fallbackRef = useRef(fallback);
  validateRef.current = validate;
  fallbackRef.current = fallback;
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (
        event.storageArea !== localStorage ||
        (event.key !== null && event.key !== key)
      )
        return;
      try {
        const next =
          event.newValue === null ? null : JSON.parse(event.newValue);
        setValue(validateRef.current(next) ? next : fallbackRef.current);
      } catch {
        setStorageError(true);
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [key]);
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [key, value]);
  return { value, setValue, storageError };
}
