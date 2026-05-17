import { useCallback, useRef, useState } from 'react';

export function useNotifications(timeoutMs = 3500) {
  const [notifs, setNotifs] = useState([]);
  const nextIdRef = useRef(0);

  const notif = useCallback((msg, type = 'ok') => {
    const id = ++nextIdRef.current;

    setNotifs(items => [...items, { id, msg, type }]);

    setTimeout(() => {
      setNotifs(items => items.filter(item => item.id !== id));
    }, timeoutMs);
  }, [timeoutMs]);

  return {
    notifs,
    notif,
  };
}