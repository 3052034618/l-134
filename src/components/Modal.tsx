import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-navy-100">
          <h3 className="text-lg font-semibold text-navy-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-navy-100 rounded transition-colors"
          >
            <X size={20} className="text-navy-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="p-6 border-t border-navy-100 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
