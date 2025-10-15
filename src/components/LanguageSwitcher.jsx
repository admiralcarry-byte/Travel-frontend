import React from 'react';
import { toggleLanguage, getCurrentLanguage, getAvailableLanguages } from '../utils/i18n';

const LanguageSwitcher = ({ className = '', showLabel = true }) => {
  const currentLang = getCurrentLanguage();
  const languages = getAvailableLanguages();
  const currentLangObj = languages.find(lang => lang.code === currentLang);

  const handleLanguageToggle = () => {
    const newLang = toggleLanguage();
    // Force a page reload to apply all translations
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <button
      onClick={handleLanguageToggle}
      className={`
        flex items-center gap-2 px-3 py-2 
        bg-dark-700/50 hover:bg-dark-700 
        border border-white/10 rounded-md 
        text-dark-200 hover:text-white
        transition-all duration-200
        ${className}
      `}
      title={`Switch to ${currentLang === 'en' ? 'Spanish' : 'English'}`}
    >
      <span className="text-lg">{currentLangObj?.flag}</span>
      {showLabel && (
        <span className="text-sm font-medium">
          {currentLangObj?.name}
        </span>
      )}
      <svg 
        className="w-4 h-4 transition-transform duration-200" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
        />
      </svg>
    </button>
  );
};

export default LanguageSwitcher;
