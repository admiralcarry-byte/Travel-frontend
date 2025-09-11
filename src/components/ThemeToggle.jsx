import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        group relative inline-flex h-10 w-18 items-center rounded-full transition-all duration-500 ease-out
        focus:outline-none focus:ring-4 focus:ring-primary-500/50 focus:ring-offset-2
        ${isDark 
          ? 'bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg shadow-primary-500/25' 
          : 'bg-gradient-to-r from-gray-200 to-gray-300 shadow-lg'
        }
        hover:scale-105 hover:shadow-xl
        ${className}
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span
        className={`
          inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-all duration-500 ease-out
          flex items-center justify-center
          ${isDark ? 'translate-x-9' : 'translate-x-1'}
          group-hover:scale-110
        `}
      >
        <span className="flex h-full w-full items-center justify-center transition-all duration-300">
          {isDark ? (
            // Moon icon for dark mode
            <svg
              className="h-4 w-4 text-primary-600 animate-float"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          ) : (
            // Sun icon for light mode
            <svg
              className="h-4 w-4 text-yellow-500 animate-float"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </span>
      </span>
      
      {/* Background glow effect */}
      <div className={`
        absolute inset-0 rounded-full transition-all duration-500
        ${isDark ? 'bg-primary-500/20' : 'bg-yellow-400/20'}
        opacity-0 group-hover:opacity-100
      `} />
    </button>
  );
};

export default ThemeToggle;