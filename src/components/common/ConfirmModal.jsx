import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal.jsx';
import { LoadingSpinner } from './LoadingSpinner.jsx';

/**
 * Confirmation Modal Component
 * Used for destructive actions or important confirmations
 * 
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Function to call when modal should close
 * @param {function} onConfirm - Function to call when user confirms
 * @param {string} title - Modal title
 * @param {string} message - Warning message
 * @param {string} description - Additional description (optional)
 * @param {string} confirmText - Text for confirm button
 * @param {string} cancelText - Text for cancel button
 * @param {boolean} isLoading - Whether the action is in progress
 * @param {string} type - Type: 'danger' | 'warning' | 'info'
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  type = 'danger'
}) => {
  const typeStyles = {
    danger: {
      icon: 'text-red-600 bg-red-100',
      button: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      icon: 'text-yellow-600 bg-yellow-100',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    },
    info: {
      icon: 'text-blue-600 bg-blue-100',
      button: 'bg-blue-600 hover:bg-blue-700'
    }
  };

  const styles = typeStyles[type];

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={!isLoading}
      footer={
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles.button}`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span>Processing...</span>
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      }
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-full ${styles.icon} flex-shrink-0`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-gray-900 font-medium mb-2">{message}</p>
          {description && (
            <p className="text-gray-600 text-sm">{description}</p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;