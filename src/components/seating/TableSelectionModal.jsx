import React from 'react';
import { useSeating, isFemaleGender } from './SeatingContext';
import { useTranslations } from './useTranslations';
import { useTables } from './useTables';
import { useGroups } from './useGroups';

const TableSelectionModal = () => {
  const { state, dispatch, actions } = useSeating();
  const { t } = useTranslations();
  const { seatGroupAtTable } = useTables();
  const { getGroupColor } = useGroups();
  
  const {
    showSeatingModal,
    selectedGroupForSeating,
    windowWidth
  } = state;

  if (!showSeatingModal || !selectedGroupForSeating) return null;

  const group = state.groups.find(g => g.id === selectedGroupForSeating);
  if (!group) return null;

  const handleClose = () => {
    dispatch({ type: actions.SET_SHOW_SEATING_MODAL, payload: false });
    dispatch({ type: actions.SET_SELECTED_GROUP_FOR_SEATING, payload: null });
  };

  const handleTableClick = (table) => {
    // Проверяем, есть ли свободные места за столом
    const occupiedSeats = table.people?.filter(person => person).length || 0;
    const availableSeats = table.chairCount - occupiedSeats;
    
    if (availableSeats === 0) {
      alert(t('tableFullyOccupied'));
      return;
    }

    if (availableSeats < group.members.length) {
      alert(t('notEnoughSeats'));
      return;
    }

    // Автоматически рассаживаем всю группу за выбранный стол
    seatGroupAtTable(selectedGroupForSeating, table.id, group.members);
    handleClose();
  };

  const isMobile = windowWidth <= 768;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: isMobile ? '10px' : '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: isMobile ? '15px' : '20px',
        width: '100%',
        maxWidth: isMobile ? '100%' : '800px',
        maxHeight: isMobile ? '90vh' : '80vh',
        overflow: 'auto',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #eee',
          paddingBottom: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>
              🪑 {t('selectTableForGroup')}
            </h3>
            <div style={{
              backgroundColor: getGroupColor(group.id),
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {group.name}
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {/* Group Info */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '8px',
          border: `2px solid ${getGroupColor(group.id)}`
        }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>{t('groupMembers')}:</strong> {group.members.length} {t('people')}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {group.members.map(member => {
              const memberName = typeof member === 'string' ? member : member.name;
              return memberName;
            }).join(', ')}
          </div>
        </div>

        {/* Instructions */}
        <div style={{
          backgroundColor: '#e8f5e8',
          padding: '10px 15px',
          marginBottom: '20px',
          borderRadius: '6px',
          border: '1px solid #4caf50'
        }}>
          <div style={{ color: '#2e7d32', fontSize: '14px', textAlign: 'center' }}>
            💡 {t('tapTableToSeatGroup')}
          </div>
        </div>

        {/* Tables Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          {state.hallData?.tables?.map((table) => {
            const occupiedSeats = table.people?.filter(person => person).length || 0;
            const availableSeats = table.chairCount - occupiedSeats;
            const canSeatGroup = availableSeats >= group.members.length;
            const isEnabled = table.enabled !== false;

            return (
              <div
                key={table.id}
                onClick={() => isEnabled && canSeatGroup && handleTableClick(table)}
                style={{
                  backgroundColor: isEnabled ? (canSeatGroup ? '#2ecc71' : '#e74c3c') : '#95a5a6',
                  color: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  cursor: isEnabled && canSeatGroup ? 'pointer' : 'not-allowed',
                  border: '2px solid',
                  borderColor: isEnabled ? (canSeatGroup ? '#27ae60' : '#c0392b') : '#7f8c8d',
                  transition: 'all 0.2s ease',
                  opacity: isEnabled ? 1 : 0.6,
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (isEnabled && canSeatGroup) {
                    e.target.style.transform = 'scale(1.02)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isEnabled && canSeatGroup) {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                    {table.name || `${t('table')} ${table.id}`}
                  </h4>
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {occupiedSeats}/{table.chairCount}
                  </div>
                </div>

                <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                  {canSeatGroup ? (
                    <span style={{ color: '#2ecc71' }}>
                      ✅ {t('canSeatGroup')} ({availableSeats} {t('freeSeats')})
                    </span>
                  ) : (
                    <span style={{ color: '#e74c3c' }}>
                      ❌ {t('cannotSeatGroup')} ({availableSeats} {t('freeSeats')})
                    </span>
                  )}
                </div>

                {!isEnabled && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: '#95a5a6',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    {t('disabled')}
                  </div>
                )}

                {/* Occupied seats info */}
                {occupiedSeats > 0 && (
                  <div style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.8)',
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: '6px'
                  }}>
                    <strong>{t('seatedGuests')}:</strong>
                    <div style={{ marginTop: '4px' }}>
                      {table.people?.filter(person => person).map((person, index) => (
                        <span key={index} style={{
                          display: 'inline-block',
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          margin: '2px',
                          fontSize: '11px'
                        }}>
                          {isFemaleGender(person.gender) ? '👩' : '👨'} {person.name}{person.fullName && person.fullName !== person.name ? ` (${person.fullName})` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TableSelectionModal; 