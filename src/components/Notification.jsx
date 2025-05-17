import { useEffect } from 'react';
import '@/styles/Notification.css';

export default function Toast({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose,
  position = 'bottom-right'
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch(type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '';
    }
  };

  return (
    <div className={`toast toast-${type} toast-${position}`}>
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <p className="toast-message">{message}</p>
      </div>
    </div>
  );
}