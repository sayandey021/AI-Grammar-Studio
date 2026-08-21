import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import appLogo from '../assets/logo.png';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  confirmLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  confirmLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 size={24} className="modal-type-icon danger" />;
      case 'warning':
        return <AlertTriangle size={24} className="modal-type-icon warning" />;
      case 'info':
      default:
        return <Info size={24} className="modal-type-icon info" />;
    }
  };

  return createPortal(
    <div className="modern-modal-overlay" onClick={onClose}>
      <div 
        className="modern-modal-container" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="modern-modal-header">
          <div className="modal-brand">
            <img src={appLogo} alt="AI Grammar Studio" className="modal-brand-logo" />
            <span className="modal-brand-title">AI Grammar Studio</span>
          </div>
          <button 
            className="modal-close-btn" 
            onClick={onClose} 
            title="Close dialog"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modern-modal-body">
          <div className={`modal-icon-wrapper ${type}`}>
            {getIcon()}
          </div>
          <div className="modal-content-area">
            <h3 className="modal-title">{title}</h3>
            <div className="modal-message">{message}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="modern-modal-footer">
          {cancelText && (
            <button 
              type="button" 
              className="modal-btn modal-btn-secondary" 
              onClick={onClose}
              disabled={confirmLoading}
            >
              {cancelText}
            </button>
          )}
          <button 
            type="button" 
            className={`modal-btn modal-btn-primary ${type}`} 
            onClick={onConfirm}
            disabled={confirmLoading}
            autoFocus
          >
            {confirmLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
