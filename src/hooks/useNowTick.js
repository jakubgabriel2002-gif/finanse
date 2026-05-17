import { useEffect, useState } from 'react';

export function useNowTick() {
  const [nowTick, setNowTick] = useState(() => Date.now() / 1000);

  useEffect(() => {
    const id = setInterval(() => {
      setNowTick(Date.now() / 1000);
    }, 1000);

    return () => clearInterval(id);
  }, []);

  return nowTick;
}