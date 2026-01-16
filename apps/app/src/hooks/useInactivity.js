import { useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/auth/login/actions';

const EVENTS = [
    'mousemove',
    'keydown',
    'click',
    'scroll',
    'touchstart'
];

// Default timeout: 30 minutes (in milliseconds)
const DEFAULT_TIMEOUT = 30 * 60 * 1000;

const useInactivity = (timeout = DEFAULT_TIMEOUT) => {
    const dispatch = useDispatch();
    const timerRef = useRef(null);

    const handleLogout = useCallback(() => {
        // console.log("User inactive. Logging out...");
        dispatch(logoutUser(window.history));
    }, [dispatch]);

    const resetTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(handleLogout, timeout);
    }, [handleLogout, timeout]);

    useEffect(() => {
        // Initial setup
        resetTimer();

        // Event listeners
        EVENTS.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        return () => {
            // Cleanup
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            EVENTS.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [resetTimer]);

    return null; // This hook doesn't return any value
};

export default useInactivity;
