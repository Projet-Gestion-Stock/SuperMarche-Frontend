import { useTheme } from '../contexts/ThemeContext';

export function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Basculer en mode ${theme === 'light' ? 'sombre' : 'clair'}`}
      className="theme-switcher"
    >
      {theme === 'light' ? (
        <span className="icon">🌙</span>
      ) : (
        <span className="icon">☀️</span>
      )}
    </button>
  );
}
