import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

interface UseLocalStorageOptions<T> {
  sanitize?: (value: unknown) => T;
}

function resolveInitialValue<T>(initialValue: T | (() => T)) {
  return initialValue instanceof Function ? initialValue() : initialValue;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options: UseLocalStorageOptions<T> = {},
) {
  const sanitize = options.sanitize ?? ((value: unknown) => value as T);

  const [storedValue, setStoredValue] = useState<T>(() => {
    const fallbackValue = sanitize(resolveInitialValue(initialValue));

    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        return sanitize(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Не удалось прочитать localStorage по ключу ${key}`, error);
    }

    return fallbackValue;
  });

  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    setStoredValue((currentValue) => {
      const nextValue = value instanceof Function ? value(currentValue) : value;
      return sanitize(nextValue);
    });
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Не удалось записать localStorage по ключу ${key}`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}
