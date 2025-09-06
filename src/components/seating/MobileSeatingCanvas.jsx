import React from 'react';
import { useSeating, isFemaleGender } from './SeatingContext';
import { useTranslations } from './useTranslations';
import { useTables } from './useTables';
import { useGroups } from './useGroups';

const MobileSeatingCanvas = () => {
  const { state, dispatch, actions } = useSeating();
  const { t } = useTranslations();
  const { seatGroupAtTable } = useTables();
  const { getGroupColor } = useGroups();
  
  const {
    showMobileSeatingCanvas,
    selectedGroupForSeating,
    windowWidth
  } = state;

  if (!showMobileSeatingCanvas || !selectedGroupForSeating) return null;

  const group = state.groups.find(g => g.id === selectedGroupForSeating);
  if (!group) return null;

  const handleClose = () => {
    dispatch({ type: actions.SET_SHOW_MOBILE_SEATING_CANVAS, payload: false });
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
      backgroundColor: '#0a0a1d',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#3498db',
        color: 'white',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
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
            color: 'white',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)'
          }}
        >
          ×
        </button>
      </div>

      {/* Group Info */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: '15px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div style={{ color: 'white', fontSize: '14px', marginBottom: '8px' }}>
          <strong>{t('groupMembers')}:</strong> {group.members.length} {t('people')}
        </div>
        <div style={{ color: '#bdc3c7', fontSize: '12px' }}>
          {group.members.join(', ')}
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        backgroundColor: 'rgba(46, 204, 113, 0.2)',
        padding: '10px 20px',
        borderBottom: '1px solid rgba(46, 204, 113, 0.3)'
      }}>
        <div style={{ color: '#2ecc71', fontSize: '14px', textAlign: 'center' }}>
          💡 {t('tapTableToSeatGroup')}
        </div>
      </div>

      {/* Canvas Area */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px',
        position: 'relative'
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
                marginBottom: '15px',
                borderRadius: '12px',
                cursor: isEnabled && canSeatGroup ? 'pointer' : 'not-allowed',
                border: '2px solid',
                borderColor: isEnabled ? (canSeatGroup ? '#27ae60' : '#c0392b') : '#7f8c8d',
                transition: 'all 0.2s ease',
                opacity: isEnabled ? 1 : 0.6,
                position: 'relative'
              }}
              onTouchStart={(e) => {
                if (isEnabled && canSeatGroup) {
                  e.target.style.transform = 'scale(0.95)';
                }
              }}
              onTouchEnd={(e) => {
                if (isEnabled && canSeatGroup) {
                  e.target.style.transform = 'scale(1)';
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
                  borderRadius: '8px',
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
  );
};

export default MobileSeatingCanvas; 