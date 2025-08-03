import React from 'react';
import { useSeating } from './SeatingContext';
import { useTranslations } from './useTranslations';
import { useGroups } from './useGroups';

const TableSelectionIndicator = () => {
  const { state, dispatch, actions } = useSeating();
  const { t } = useTranslations();
  const { getGroupColor } = useGroups();
  
  // Добавляем стили для анимации
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: translateX(-50%) scale(1); }
        50% { transform: translateX(-50%) scale(1.05); }
        100% { transform: translateX(-50%) scale(1); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  const {
    isTableSelectionMode,
    selectedGroupForSeating
  } = state;

  if (!isTableSelectionMode || !selectedGroupForSeating) return null;

  const group = state.groups.find(g => g.id === selectedGroupForSeating);
  if (!group) return null;

  const handleCancel = () => {
    dispatch({ type: actions.SET_TABLE_SELECTION_MODE, payload: false });
    dispatch({ type: actions.SET_SELECTED_GROUP_FOR_SEATING, payload: null });
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#2ecc71',
      color: 'white',
      padding: '15px 25px',
      borderRadius: '30px',
      boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      fontSize: '16px',
      fontWeight: 'bold',
      border: '3px solid #27ae60',
      animation: 'pulse 2s infinite'
    }}>
      <div style={{
        backgroundColor: getGroupColor(group.id),
        color: 'white',
        padding: '6px 12px',
        borderRadius: '15px',
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        {group.name}
      </div>
      <span>🎯 {t('clickTableToSeatGroup')}</span>
      <button
        onClick={handleCancel}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '18px',
          cursor: 'pointer',
          padding: '0',
          marginLeft: '8px'
        }}
      >
        ×
      </button>
    </div>
  );
};

export default TableSelectionIndicator; 