/**
 * Simple Internationalization (i18n) utility for the Travel Management System
 * This handles language switching and text translation
 */

// Language detection
const getBrowserLanguage = () => {
  const lang = navigator.language || navigator.languages?.[0] || 'en';
  return lang.startsWith('es') ? 'es' : 'en';
};

// Current language state
let currentLanguage = localStorage.getItem('travel-app-language') || getBrowserLanguage();

// Translation dictionaries
const translations = {
  en: {
    // Common terms
    all: 'All',
    allStatuses: 'All Statuses',
    allProviders: 'All Providers',
    allCurrencies: 'All Currencies',
    allSalespeople: 'All Salespeople',
    allPassengers: 'All Passengers (with and without sales)',
    onlyPassengersWithSales: 'Only Passengers with Sales',
    
    // Status options
    open: 'Open',
    closed: 'Closed',
    cancelled: 'Cancelled',
    
    // Filter labels
    status: 'Status',
    currency: 'Currency',
    provider: 'Provider',
    salesperson: 'Salesperson',
    minProfit: 'Min Profit',
    maxProfit: 'Max Profit',
    startDate: 'Start Date',
    endDate: 'End Date',
    searchPassengers: 'Search Passengers',
    showPassengers: 'Show Passengers',
    
    // Currency options
    usd: 'U$',
    ars: 'AR$',
    
    // Placeholders
    searchPlaceholder: 'Search by name, DNI/CUIT, email, or passport...',
    
    // Sales Filters
    salesFilters: 'Sales Filters',
    passengerFilters: 'Passenger Filters',
    clearFilters: 'Clear Filters'
  },
  
  es: {
    // Common terms
    all: 'Todos',
    allStatuses: 'Todos los Estados',
    allProviders: 'Todos los Proveedores',
    allCurrencies: 'Todas las Divisas',
    allSalespeople: 'Todos los Vendedores',
    allPassengers: 'Todos los Pasajeros (con y sin ventas)',
    onlyPassengersWithSales: 'Solo Pasajeros con Ventas',
    
    // Status options
    open: 'Abierto',
    closed: 'Cerrado',
    cancelled: 'Cancelado',
    
    // Filter labels
    status: 'Estado',
    currency: 'Divisa',
    provider: 'Proveedor',
    salesperson: 'Vendedor',
    minProfit: 'Beneficio mínimo',
    maxProfit: 'Máxima ganancia',
    startDate: 'Fecha de inicio',
    endDate: 'Fecha de finalización',
    searchPassengers: 'Buscar pasajeros',
    showPassengers: 'Mostrar pasajeros',
    
    // Currency options
    usd: 'USD - Dólar Estadounidense',
    ars: 'ARS - Peso Argentino',
    
    // Placeholders
    searchPlaceholder: 'Buscar por nombre, DNI/CUIT, email, pasaporte...',
    
    // Sales Filters
    salesFilters: 'Filtros de ventas',
    passengerFilters: 'Filtros de pasajeros',
    clearFilters: 'Limpiar Filtros'
  }
};

/**
 * Get translation for a key in the current language
 * @param {string} key - Translation key
 * @param {string} fallback - Fallback text if key not found
 * @returns {string} Translated text
 */
export const t = (key, fallback = key) => {
  const translation = translations[currentLanguage]?.[key];
  return translation || translations.en[key] || fallback;
};

/**
 * Get current language
 * @returns {string} Current language code ('en' or 'es')
 */
export const getCurrentLanguage = () => currentLanguage;

/**
 * Set current language
 * @param {string} lang - Language code ('en' or 'es')
 */
export const setLanguage = (lang) => {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('travel-app-language', lang);
    
    // Trigger a custom event for components to listen to
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: lang } 
    }));
  }
};

/**
 * Toggle between English and Spanish
 */
export const toggleLanguage = () => {
  const newLang = currentLanguage === 'en' ? 'es' : 'en';
  setLanguage(newLang);
  return newLang;
};

/**
 * Check if current language is Spanish
 * @returns {boolean}
 */
export const isSpanish = () => currentLanguage === 'es';

/**
 * Check if current language is English
 * @returns {boolean}
 */
export const isEnglish = () => currentLanguage === 'en';

/**
 * Get all available languages
 * @returns {Array} Array of language objects
 */
export const getAvailableLanguages = () => [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' }
];

/**
 * Get language-specific options for dropdowns
 */
export const getDropdownOptions = {
  status: () => [
    { value: '', label: t('allStatuses') },
    { value: 'open', label: t('open') },
    { value: 'closed', label: t('closed') },
    { value: 'cancelled', label: t('cancelled') }
  ],
  
  currency: () => [
    { value: '', label: t('allCurrencies') },
    { value: 'USD', label: t('usd') },
    { value: 'ARS', label: t('ars') }
  ],
  
  provider: () => [
    { value: '', label: t('allProviders') }
  ],
  
  salesperson: () => [
    { value: '', label: t('allSalespeople') }
  ],
  
  passengers: () => [
    { value: 'true', label: t('allPassengers') },
    { value: 'false', label: t('onlyPassengersWithSales') }
  ]
};

// Initialize language on module load
setLanguage(currentLanguage);

export default {
  t,
  getCurrentLanguage,
  setLanguage,
  toggleLanguage,
  isSpanish,
  isEnglish,
  getAvailableLanguages,
  getDropdownOptions
};
