import React, { useEffect, useRef, useState } from 'react';
import { Language as LanguageType, useLanguage } from '../../contexts/LanguageContext';
import './LanguageSelector.css';

interface Language {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', nativeName: 'हिंदी' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', name: 'French', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', nativeName: 'العربية' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'de', name: 'German', flag: '🇩🇪', nativeName: 'Deutsch' }
];

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageSelect = (langCode: string) => {
    setLanguage(langCode as LanguageType);
    setIsOpen(false);
  };

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button
        className={`language-selector-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Language"
        aria-expanded={isOpen}
      >
        <span className="flag">{currentLanguage.flag}</span>
        <span className="language-name">{currentLanguage.nativeName}</span>
        <span className={`dropdown-arrow ${isOpen ? 'rotated' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="language-dropdown">
          <div className="dropdown-header">
            <span className="globe-icon">🌍</span>
            <span>Choose Language</span>
          </div>
          <div className="language-list">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`language-option ${language === lang.code ? 'active' : ''}`}
                onClick={() => handleLanguageSelect(lang.code)}
                dir={lang.code === 'ar' ? 'rtl' : 'ltr'}
              >
                <span className="flag">{lang.flag}</span>
                <div className="language-info">
                  <span className="native-name">{lang.nativeName}</span>
                  <span className="english-name">{lang.name}</span>
                </div>
                {language === lang.code && (
                  <span className="check-mark">✓</span>
                )}
              </button>
            ))}
          </div>
          <div className="dropdown-footer">
            <small>🌐 Tourist Safety Platform</small>
          </div>
        </div>
      )}
    </div>
  );
};