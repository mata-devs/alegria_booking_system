import { useState, useEffect } from "react";

export function useSessionStorage<T>(key: string, initialValue: T) {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === "undefined") return initialValue;
        try {
            const item = window.sessionStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            window.sessionStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.error(`Error writing to session storage for key "${key}":`, error);
        }
    }, [key, storedValue]);

    const clear = () => {
        window.sessionStorage.removeItem(key);
        setStoredValue(initialValue);
    };

    return [storedValue, setStoredValue, clear] as const;
}
