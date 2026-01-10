import { useState, useCallback, useEffect } from 'react';

export function useAsyncData(fetchFn, options = {}) {
    const { 
        immediate = true,
        initialData = null,
        onSuccess = null,
        onError = null
    } = options;

    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState(null);

    const execute = useCallback(async (...args) => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchFn(...args);
            setData(result);
            if (onSuccess) onSuccess(result);
            return result;
        } catch (err) {
            const errorMessage = err?.message || 'An error occurred';
            setError(errorMessage);
            if (onError) onError(err);
            return null;
        } finally {
            setLoading(false);
        }
    }, [fetchFn, onSuccess, onError]);

    const reset = useCallback(() => {
        setData(initialData);
        setLoading(false);
        setError(null);
    }, [initialData]);

    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, []);

    return { 
        data, 
        loading, 
        error, 
        execute, 
        reset,
        setData 
    };
}

export function useAsyncDataMultiple(fetchFunctions = {}) {
    const [state, setState] = useState(() => {
        const initial = {};
        for (const key of Object.keys(fetchFunctions)) {
            initial[key] = { data: null, loading: true, error: null };
        }
        return initial;
    });

    const executeAll = useCallback(async () => {
        const keys = Object.keys(fetchFunctions);
        
        setState(prev => {
            const next = { ...prev };
            for (const key of keys) {
                next[key] = { ...next[key], loading: true, error: null };
            }
            return next;
        });

        const results = await Promise.allSettled(
            keys.map(key => fetchFunctions[key]())
        );

        setState(prev => {
            const next = { ...prev };
            results.forEach((result, index) => {
                const key = keys[index];
                if (result.status === 'fulfilled') {
                    next[key] = { data: result.value, loading: false, error: null };
                } else {
                    next[key] = { data: null, loading: false, error: result.reason?.message || 'Error' };
                }
            });
            return next;
        });
    }, [fetchFunctions]);

    useEffect(() => {
        executeAll();
    }, []);

    return { state, executeAll };
}

export default useAsyncData;
