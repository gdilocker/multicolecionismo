import { useState, useEffect } from 'react';
import { Type, Check, ChevronDown, ChevronUp } from 'lucide-react';

const POPULAR_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Raleway',
  'Nunito',
  'Ubuntu',
  'Playfair Display',
  'Merriweather',
  'PT Sans',
  'Oswald',
  'Source Sans Pro',
  'Quicksand',
  'Rubik',
  'Work Sans',
  'DM Sans',
  'Manrope',
  'Space Grotesk'
];

interface GoogleFontSelectorProps {
  currentFont: string;
  onFontChange: (font: string) => void;
}

export default function GoogleFontSelector({ currentFont, onFontChange }: GoogleFontSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadFont(currentFont);
  }, [currentFont]);

  function loadFont(fontName: string) {
    if (loadedFonts.has(fontName)) return;

    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    setLoadedFonts(prev => new Set([...prev, fontName]));
  }

  const filteredFonts = POPULAR_FONTS.filter(font =>
    font.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handleFontSelect(font: string) {
    loadFont(font);
    onFontChange(font);
    setIsOpen(false);
  }

  return (
    <div className="space-y-3">
      {/* Selected Font Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white border-2 border-slate-200 rounded-lg hover:border-slate-300 transition-all"
      >
        <div className="flex items-center gap-3">
          <Type className="w-5 h-5 text-slate-600" />
          <div className="text-left">
            <div className="text-sm font-medium text-slate-700">Fonte Selecionada</div>
            <div className="text-base font-semibold text-slate-900" style={{ fontFamily: currentFont }}>
              {currentFont}
            </div>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-600" />
        )}
      </button>

      {/* Collapsible Font List */}
      {isOpen && (
        <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar fonte..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {filteredFonts.map(font => (
              <button
                key={font}
                onClick={() => handleFontSelect(font)}
                onMouseEnter={() => loadFont(font)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  currentFont === font
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">{font}</span>
                  {currentFont === font && (
                    <Check className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div
                  style={{ fontFamily: font }}
                  className="text-lg text-slate-900"
                >
                  The quick brown fox
                </div>
              </button>
            ))}
          </div>

          {filteredFonts.length === 0 && (
            <div className="text-center py-8">
              <Type className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">Nenhuma fonte encontrada</p>
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Preview:</strong> Passe o mouse sobre as fontes para carregar o preview. A fonte selecionada será aplicada automaticamente à sua página.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
