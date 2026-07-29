import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, HelpCircle } from 'lucide-react';

// ─── Composant visuel ────────────────────────────────────────────────────────

function ConfirmDialog({ title, message, danger, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const Icon = danger ? AlertTriangle : HelpCircle;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-100' : 'bg-blue-100'}`}>
          <Icon className={`w-6 h-6 ${danger ? 'text-red-500' : 'text-blue-500'}`} />
        </div>

        <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">{title}</h2>
        {message && (
          <p className="text-sm text-gray-500 text-center leading-relaxed">{message}</p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm text-white transition-colors ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const confirm = useCallback(({
    title,
    message      = '',
    danger       = false,
    confirmLabel = 'Confirmer',
    cancelLabel  = 'Annuler'
  }) => new Promise((resolve) => {
    setDialog({ title, message, danger, confirmLabel, cancelLabel, resolve });
  }), []);

  const handleConfirm = () => { dialog.resolve(true);  setDialog(null); };
  const handleCancel  = () => { dialog.resolve(false); setDialog(null); };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog && (
        <ConfirmDialog
          title={dialog.title}
          message={dialog.message}
          danger={dialog.danger}
          confirmLabel={dialog.confirmLabel}
          cancelLabel={dialog.cancelLabel}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
