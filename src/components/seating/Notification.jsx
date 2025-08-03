import React, { useEffect } from 'react';
import { useSeating } from './SeatingContext';

const Notification = () => {
  const { state, dispatch, actions } = useSeating();
  const { notification } = state;

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        dispatch({ type: actions.CLEAR_NOTIFICATION });
      }, 3000); // Уведомление исчезает через 3 секунды

      return () => clearTimeout(timer);
    }
  }, [notification, dispatch, actions]);

  if (!notification) return null;

  const getNotificationStyle = (type = 'success') => {
    const baseStyle = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '15px 20px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '14px',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      animation: 'slideInRight 0.3s ease-out',
      maxWidth: '300px',
      wordWrap: 'break-word'
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyle,
          backgroundColor: '#2ecc71',
          border: '1px solid #27ae60'
        };
      case 'error':
        return {
          ...baseStyle,
          backgroundColor: '#e74c3c',
          border: '1px solid #c0392b'
        };
      case 'warning':
        return {
          ...baseStyle,
          backgroundColor: '#f39c12',
          border: '1px solid #d35400'
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: '#3498db',
          border: '1px solid #2980b9'
        };
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes slideOutRight {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
        `}
      </style>
      <div style={getNotificationStyle(notification.type)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {notification.type === 'success' && <span>✅</span>}
          {notification.type === 'error' && <span>❌</span>}
          {notification.type === 'warning' && <span>⚠️</span>}
          <span>{notification.message}</span>
        </div>
      </div>
    </>
  );
};

export default Notification; 