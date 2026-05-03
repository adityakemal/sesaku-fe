
import { useState, useEffect } from 'react';

export function useTheme() {
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) setDarkMode(JSON.parse(saved));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.documentElement.classList.toggle('light', !darkMode);
  }, [darkMode, mounted]);

  const toggle = () => setDarkMode((d) => !d);

  return { mounted, darkMode, toggle };
}