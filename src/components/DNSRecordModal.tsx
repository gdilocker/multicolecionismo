import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DNSRecord {
  id?: string;
  type: string;
  name: string;
  value: string;
  ttl?: number;
  priority?: number;
}

interface DNSRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: DNSRecord) => Promise<void>;
  record?: DNSRecord | null;
  mode: 'add' | 'edit';
}

const DNSRecordModal: React.FC<DNSRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  record,
  mode
}) => {
  const [formData, setFormData] = useState<DNSRecord>({
    type: 'A',
    name: '@',
    value: '',
    ttl: 3600,
    priority: undefined
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record && mode === 'edit') {
      setFormData(record);
    } else {
      setFormData({
        type: 'A',
        name: '@',
        value: '',
        ttl: 3600,
        priority: undefined
      });
    }
    setErrors({});
  }, [record, mode, isOpen]);

  const dnsTypes = [
    { value: 'A', label: 'A - Endereço IPv4', needsPriority: false },
    { value: 'AAAA', label: 'AAAA - Endereço IPv6', needsPriority: false },
    { value: 'CNAME', label: 'CNAME - Alias', needsPriority: false },
    { value: 'MX', label: 'MX - Servidor de Email', needsPriority: true },
    { value: 'TXT', label: 'TXT - Texto', needsPriority: false },
    { value: 'NS', label: 'NS - Nameserver', needsPriority: false },
    { value: 'SRV', label: 'SRV - Serviço', needsPriority: true },
    { value: 'CAA', label: 'CAA - Autorização de CA', needsPriority: false }
  ];

  const selectedType = dnsTypes.find(t => t.value === formData.type);
  const needsPriority = selectedType?.needsPriority || false;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.value.trim()) {
      newErrors.value = 'Valor é obrigatório';
    }

    if (formData.type === 'A' && !formData.value.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
      newErrors.value = 'Endereço IPv4 inválido';
    }

    if (formData.type === 'MX' && (!formData.priority || formData.priority < 0)) {
      newErrors.priority = 'Prioridade é obrigatória para registros MX';
    }

    if (formData.ttl && (formData.ttl < 60 || formData.ttl > 86400)) {
      newErrors.ttl = 'TTL deve estar entre 60 e 86400 segundos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      setErrors({ submit: 'Erro ao salvar registro. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{
                duration: 0.3,
                ease: [0.34, 1.56, 0.64, 1],
                scale: { type: 'spring', stiffness: 300, damping: 25 }
              }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200/50 pointer-events-auto"
            >
              <div className="sticky top-0 bg-gradient-to-br from-white to-slate-50/50 border-b border-slate-200/60 px-7 py-5 flex items-center justify-between rounded-t-3xl backdrop-blur-sm">
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl font-bold text-slate-900 tracking-tight"
                >
                  {mode === 'add' ? 'Adicionar Registro DNS' : 'Editar Registro DNS'}
                </motion.h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors group"
                >
                  <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} className="p-7 space-y-6">
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Registro
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {dnsTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="@ para domínio raiz, ou www, mail, etc."
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Use @ para o domínio raiz, ou especifique como "www" ou "mail"
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor
              </label>
              <input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={
                  formData.type === 'A' ? '192.0.2.1' :
                  formData.type === 'AAAA' ? '2001:0db8::1' :
                  formData.type === 'CNAME' ? 'exemplo.com' :
                  formData.type === 'MX' ? 'mail.exemplo.com' :
                  'Valor do registro'
                }
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.value ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.value && (
                <p className="mt-1 text-sm text-red-600">{errors.value}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {needsPriority && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridade
                  </label>
                  <input
                    type="number"
                    value={formData.priority || ''}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || undefined })}
                    placeholder="10"
                    min="0"
                    max="65535"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.priority ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.priority && (
                    <p className="mt-1 text-sm text-red-600">{errors.priority}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TTL (segundos)
                </label>
                <select
                  value={formData.ttl}
                  onChange={(e) => setFormData({ ...formData, ttl: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="60">1 minuto</option>
                  <option value="300">5 minutos</option>
                  <option value="1800">30 minutos</option>
                  <option value="3600">1 hora</option>
                  <option value="14400">4 horas</option>
                  <option value="43200">12 horas</option>
                  <option value="86400">24 horas</option>
                </select>
              </div>
            </div>

                <div className="flex gap-3 pt-6 bg-gradient-to-br from-slate-50 to-slate-100/50 -mx-7 -mb-7 px-7 py-5 border-t border-slate-200/60 rounded-b-3xl">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-white hover:border-slate-300 transition-all shadow-sm hover:shadow"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: saving ? 1 : 1.02, y: saving ? 0 : -1 }}
                    whileTap={{ scale: saving ? 1 : 0.98 }}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Salvando...' : mode === 'add' ? 'Adicionar' : 'Salvar'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DNSRecordModal;
