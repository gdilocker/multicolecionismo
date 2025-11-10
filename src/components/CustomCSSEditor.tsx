import { useState, useEffect } from 'react';
import { Code, Save, AlertCircle, Crown, AlertTriangle } from 'lucide-react';
import { validateAndSanitizeCSS } from '../lib/sanitizeCSS';

interface CustomCSSEditorProps {
  currentCSS: string;
  isEliteMember: boolean;
  onSave: (css: string) => Promise<void>;
}

export default function CustomCSSEditor({ currentCSS, isEliteMember, onSave }: CustomCSSEditorProps) {
  const [css, setCSS] = useState(currentCSS || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [sanitizedCSS, setSanitizedCSS] = useState('');
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Validar CSS em tempo real (com debounce)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!css) {
        setSanitizedCSS('');
        setValidationWarnings([]);
        return;
      }

      const result = validateAndSanitizeCSS(css);

      if (!result.valid) {
        setValidationWarnings([result.error || 'CSS inválido']);
        setSanitizedCSS('');
      } else {
        setSanitizedCSS(result.sanitized);

        // Check if CSS was modified during sanitization
        if (result.sanitized !== css.trim()) {
          setValidationWarnings([
            'Algumas regras CSS foram removidas por segurança. Veja o preview abaixo.'
          ]);
        } else {
          setValidationWarnings([]);
        }
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeout);
  }, [css]);

  async function handleSave() {
    if (!isEliteMember) {
      setMessage('Esta funcionalidade é exclusiva para membros Elite/Supreme');
      return;
    }

    // Validate before saving
    const result = validateAndSanitizeCSS(css);

    if (!result.valid) {
      setMessage(result.error || 'CSS inválido');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      // Save the sanitized CSS
      await onSave(result.sanitized);

      // Update local state with sanitized version
      setCSS(result.sanitized);
      setSanitizedCSS(result.sanitized);

      if (result.sanitized !== css.trim()) {
        setMessage('CSS salvo com sucesso! Algumas regras foram removidas por segurança.');
      } else {
        setMessage('CSS salvo com sucesso!');
      }
    } catch (error: any) {
      setMessage('Erro ao salvar CSS: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (!isEliteMember) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <Crown className="w-6 h-6 text-yellow-600" />
          <h4 className="font-bold text-slate-800">CSS Personalizado</h4>
        </div>
        <p className="text-slate-600 mb-4">
          Adicione CSS personalizado à sua página para total controle sobre o design.
        </p>
        <p className="text-sm text-yellow-800 font-medium">
          Disponível apenas para membros Elite/Supreme
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-slate-800">CSS Personalizado</h4>
          <Crown className="w-4 h-4 text-yellow-600" />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Dicas de Segurança:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Use apenas CSS válido</li>
              <li>Evite usar !important em excesso</li>
              <li>Teste suas mudanças no preview</li>
              <li>CSS será sanitizado automaticamente</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Seu CSS Personalizado
        </label>
        <textarea
          value={css}
          onChange={(e) => setCSS(e.target.value)}
          placeholder={`/* Exemplo:\n.profile-container {\n  max-width: 800px;\n}\n\n.profile-link {\n  border-radius: 20px;\n}\n*/`}
          className="w-full h-64 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          spellCheck={false}
        />

        {/* Validation Warnings */}
        {validationWarnings.length > 0 && (
          <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                {validationWarnings.map((warning, index) => (
                  <p key={index} className="text-yellow-800">{warning}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sanitized CSS Preview */}
        {sanitizedCSS && sanitizedCSS !== css.trim() && (
          <div className="mt-4">
            <h5 className="text-sm font-medium text-slate-700 mb-2">
              CSS Sanitizado (Preview do que será salvo):
            </h5>
            <pre className="bg-slate-100 border border-slate-300 rounded-lg p-3 text-xs overflow-auto max-h-48 font-mono">
              {sanitizedCSS}
            </pre>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            saving
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Salvar CSS
            </>
          )}
        </button>

        {message && (
          <div className={`text-sm font-medium ${message.includes('sucesso') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </div>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm text-slate-600">
          <strong>Classes disponíveis:</strong> <code className="bg-slate-200 px-2 py-1 rounded">.profile-container</code>,
          <code className="bg-slate-200 px-2 py-1 rounded ml-1">.profile-link</code>,
          <code className="bg-slate-200 px-2 py-1 rounded ml-1">.profile-avatar</code>,
          <code className="bg-slate-200 px-2 py-1 rounded ml-1">.profile-bio</code>
        </p>
      </div>
    </div>
  );
}
