import { useState, useEffect, useRef } from 'react'

export function useThrottledValue(value, delay = 60) {
    const [throttledValue, setThrottledValue] = useState(value);
    const lastUpdate = useRef(0);
    const timeoutRef = useRef(null);

    useEffect(() => {
        const now = Date.now();
        const timePassed = now - lastUpdate.current;

        if (timePassed >= delay) {
            setThrottledValue(value);
            lastUpdate.current = now;
        } else {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                setThrottledValue(value);
                lastUpdate.current = Date.now();
            }, delay - timePassed);
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [value, delay]);

    // Force immediate update if value becomes empty (e.g. starting a new response)
    useEffect(() => {
        if (!value) {
            setThrottledValue("");
            lastUpdate.current = 0;
        }
    }, [value]);

    return throttledValue;
}
