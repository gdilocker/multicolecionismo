import React, { useState, useEffect } from 'react';
import { ChevronDown, Phone } from 'lucide-react';

interface Country {
  code: string;
  name: string;
  prefix: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  // Americas
  { code: 'US', name: 'United States', prefix: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', prefix: '+1', flag: '🇨🇦' },
  { code: 'BR', name: 'Brasil', prefix: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'México', prefix: '+52', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', prefix: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', prefix: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', prefix: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Perú', prefix: '+51', flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', prefix: '+58', flag: '🇻🇪' },
  { code: 'EC', name: 'Ecuador', prefix: '+593', flag: '🇪🇨' },
  { code: 'BO', name: 'Bolivia', prefix: '+591', flag: '🇧🇴' },
  { code: 'PY', name: 'Paraguay', prefix: '+595', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguay', prefix: '+598', flag: '🇺🇾' },
  { code: 'CR', name: 'Costa Rica', prefix: '+506', flag: '🇨🇷' },
  { code: 'PA', name: 'Panamá', prefix: '+507', flag: '🇵🇦' },
  { code: 'DO', name: 'República Dominicana', prefix: '+1809', flag: '🇩🇴' },
  { code: 'GT', name: 'Guatemala', prefix: '+502', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', prefix: '+504', flag: '🇭🇳' },
  { code: 'SV', name: 'El Salvador', prefix: '+503', flag: '🇸🇻' },
  { code: 'NI', name: 'Nicaragua', prefix: '+505', flag: '🇳🇮' },
  { code: 'JM', name: 'Jamaica', prefix: '+1876', flag: '🇯🇲' },
  { code: 'TT', name: 'Trinidad and Tobago', prefix: '+1868', flag: '🇹🇹' },
  { code: 'BB', name: 'Barbados', prefix: '+1246', flag: '🇧🇧' },

  // Europe
  { code: 'GB', name: 'United Kingdom', prefix: '+44', flag: '🇬🇧' },
  { code: 'DE', name: 'Deutschland', prefix: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', prefix: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italia', prefix: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'España', prefix: '+34', flag: '🇪🇸' },
  { code: 'PT', name: 'Portugal', prefix: '+351', flag: '🇵🇹' },
  { code: 'NL', name: 'Netherlands', prefix: '+31', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', prefix: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', prefix: '+41', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', prefix: '+43', flag: '🇦🇹' },
  { code: 'SE', name: 'Sweden', prefix: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', prefix: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', prefix: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', prefix: '+358', flag: '🇫🇮' },
  { code: 'PL', name: 'Poland', prefix: '+48', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', prefix: '+420', flag: '🇨🇿' },
  { code: 'GR', name: 'Greece', prefix: '+30', flag: '🇬🇷' },
  { code: 'RO', name: 'Romania', prefix: '+40', flag: '🇷🇴' },
  { code: 'HU', name: 'Hungary', prefix: '+36', flag: '🇭🇺' },
  { code: 'IE', name: 'Ireland', prefix: '+353', flag: '🇮🇪' },
  { code: 'HR', name: 'Croatia', prefix: '+385', flag: '🇭🇷' },
  { code: 'BG', name: 'Bulgaria', prefix: '+359', flag: '🇧🇬' },
  { code: 'SK', name: 'Slovakia', prefix: '+421', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', prefix: '+386', flag: '🇸🇮' },
  { code: 'LT', name: 'Lithuania', prefix: '+370', flag: '🇱🇹' },
  { code: 'LV', name: 'Latvia', prefix: '+371', flag: '🇱🇻' },
  { code: 'EE', name: 'Estonia', prefix: '+372', flag: '🇪🇪' },
  { code: 'IS', name: 'Iceland', prefix: '+354', flag: '🇮🇸' },
  { code: 'LU', name: 'Luxembourg', prefix: '+352', flag: '🇱🇺' },
  { code: 'MT', name: 'Malta', prefix: '+356', flag: '🇲🇹' },
  { code: 'CY', name: 'Cyprus', prefix: '+357', flag: '🇨🇾' },

  // Asia
  { code: 'CN', name: 'China', prefix: '+86', flag: '🇨🇳' },
  { code: 'IN', name: 'India', prefix: '+91', flag: '🇮🇳' },
  { code: 'JP', name: 'Japan', prefix: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', prefix: '+82', flag: '🇰🇷' },
  { code: 'ID', name: 'Indonesia', prefix: '+62', flag: '🇮🇩' },
  { code: 'TH', name: 'Thailand', prefix: '+66', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', prefix: '+84', flag: '🇻🇳' },
  { code: 'PH', name: 'Philippines', prefix: '+63', flag: '🇵🇭' },
  { code: 'MY', name: 'Malaysia', prefix: '+60', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapore', prefix: '+65', flag: '🇸🇬' },
  { code: 'BD', name: 'Bangladesh', prefix: '+880', flag: '🇧🇩' },
  { code: 'PK', name: 'Pakistan', prefix: '+92', flag: '🇵🇰' },
  { code: 'LK', name: 'Sri Lanka', prefix: '+94', flag: '🇱🇰' },
  { code: 'NP', name: 'Nepal', prefix: '+977', flag: '🇳🇵' },
  { code: 'MM', name: 'Myanmar', prefix: '+95', flag: '🇲🇲' },
  { code: 'KH', name: 'Cambodia', prefix: '+855', flag: '🇰🇭' },
  { code: 'LA', name: 'Laos', prefix: '+856', flag: '🇱🇦' },
  { code: 'MN', name: 'Mongolia', prefix: '+976', flag: '🇲🇳' },
  { code: 'TW', name: 'Taiwan', prefix: '+886', flag: '🇹🇼' },
  { code: 'HK', name: 'Hong Kong', prefix: '+852', flag: '🇭🇰' },
  { code: 'MO', name: 'Macau', prefix: '+853', flag: '🇲🇴' },

  // Middle East
  { code: 'AE', name: 'United Arab Emirates', prefix: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', prefix: '+966', flag: '🇸🇦' },
  { code: 'IL', name: 'Israel', prefix: '+972', flag: '🇮🇱' },
  { code: 'TR', name: 'Turkey', prefix: '+90', flag: '🇹🇷' },
  { code: 'QA', name: 'Qatar', prefix: '+974', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', prefix: '+965', flag: '🇰🇼' },
  { code: 'OM', name: 'Oman', prefix: '+968', flag: '🇴🇲' },
  { code: 'BH', name: 'Bahrain', prefix: '+973', flag: '🇧🇭' },
  { code: 'JO', name: 'Jordan', prefix: '+962', flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon', prefix: '+961', flag: '🇱🇧' },

  // Africa
  { code: 'ZA', name: 'South Africa', prefix: '+27', flag: '🇿🇦' },
  { code: 'EG', name: 'Egypt', prefix: '+20', flag: '🇪🇬' },
  { code: 'NG', name: 'Nigeria', prefix: '+234', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', prefix: '+254', flag: '🇰🇪' },
  { code: 'GH', name: 'Ghana', prefix: '+233', flag: '🇬🇭' },
  { code: 'TZ', name: 'Tanzania', prefix: '+255', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', prefix: '+256', flag: '🇺🇬' },
  { code: 'ET', name: 'Ethiopia', prefix: '+251', flag: '🇪🇹' },
  { code: 'MA', name: 'Morocco', prefix: '+212', flag: '🇲🇦' },
  { code: 'DZ', name: 'Algeria', prefix: '+213', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisia', prefix: '+216', flag: '🇹🇳' },
  { code: 'SN', name: 'Senegal', prefix: '+221', flag: '🇸🇳' },
  { code: 'CI', name: 'Côte d\'Ivoire', prefix: '+225', flag: '🇨🇮' },
  { code: 'CM', name: 'Cameroon', prefix: '+237', flag: '🇨🇲' },
  { code: 'ZW', name: 'Zimbabwe', prefix: '+263', flag: '🇿🇼' },
  { code: 'MU', name: 'Mauritius', prefix: '+230', flag: '🇲🇺' },
  { code: 'BW', name: 'Botswana', prefix: '+267', flag: '🇧🇼' },
  { code: 'NA', name: 'Namibia', prefix: '+264', flag: '🇳🇦' },
  { code: 'MZ', name: 'Mozambique', prefix: '+258', flag: '🇲🇿' },
  { code: 'AO', name: 'Angola', prefix: '+244', flag: '🇦🇴' },

  // Oceania
  { code: 'AU', name: 'Australia', prefix: '+61', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', prefix: '+64', flag: '🇳🇿' },
  { code: 'FJ', name: 'Fiji', prefix: '+679', flag: '🇫🇯' },
  { code: 'PG', name: 'Papua New Guinea', prefix: '+675', flag: '🇵🇬' },
].sort((a, b) => a.name.localeCompare(b.name));

interface PhoneInputProps {
  value: string;
  countryCode: string;
  onChange: (phone: string, countryCode: string, prefix: string) => void;
  error?: string;
  required?: boolean;
}

export default function PhoneInput({ value, countryCode, onChange, error, required }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0]
  );
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    detectCountry();
  }, []);

  useEffect(() => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
    }
  }, [countryCode]);

  const detectCountry = async () => {
    // Skip detection if country is already set
    if (countryCode && countryCode !== 'BR') {
      return;
    }
    // Default to Brazil - no external API call needed
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    onChange(value, country.code, country.prefix);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value.replace(/[^\d]/g, '');
    onChange(phone, selectedCountry.code, selectedCountry.prefix);
  };

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.prefix.includes(searchTerm)
  );

  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return '';

    if (selectedCountry.code === 'BR') {
      if (phone.length <= 2) return phone;
      if (phone.length <= 6) return `(${phone.slice(0, 2)}) ${phone.slice(2)}`;
      if (phone.length <= 10) return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
      return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7, 11)}`;
    }

    return phone;
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4" />
          Telefone {required && <span className="text-red-500">*</span>}
        </div>
      </label>

      <div className="flex gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={isDetecting}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors bg-white min-w-[140px] disabled:opacity-50"
          >
            <span className="text-xl">{selectedCountry.flag}</span>
            <span className="text-sm font-medium">{selectedCountry.prefix}</span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => {
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              />
              <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-96 overflow-hidden">
                <div className="p-2 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="Buscar país..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto max-h-80">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                        selectedCountry.code === country.code ? 'bg-blue-50' : ''
                      }`}
                    >
                      <span className="text-xl">{country.flag}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{country.name}</div>
                        <div className="text-xs text-gray-500">{country.prefix}</div>
                      </div>
                    </button>
                  ))}
                  {filteredCountries.length === 0 && (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                      Nenhum país encontrado
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex-1">
          <input
            type="tel"
            value={formatPhoneDisplay(value)}
            onChange={handlePhoneChange}
            placeholder={selectedCountry.code === 'BR' ? '(11) 99999-9999' : 'Phone number'}
            className={`w-full px-4 py-2 border rounded-lg transition-colors focus:outline-none focus:ring-2 ${
              error
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-[#3B82F6]'
            }`}
            maxLength={selectedCountry.code === 'BR' ? 16 : 20}
          />
        </div>
      </div>

      {isDetecting && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Detectando seu país...
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <p className="text-xs text-gray-500">
        Seu telefone completo: {selectedCountry.prefix} {formatPhoneDisplay(value)}
      </p>
    </div>
  );
}
