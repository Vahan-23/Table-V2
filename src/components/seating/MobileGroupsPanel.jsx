import React from 'react';
import { useSeating } from './SeatingContext';
import { useTranslations } from './useTranslations';
import { useGroups } from './useGroups';

const MobileGroupsPanel = () => {
  const { state, dispatch, actions } = useSeating();
  const { t } = useTranslations();
  const { readyToSeatGroups, getGroupStatus, getGroupColor } = useGroups();

  const { windowWidth, isMobileGroupsExpanded } = state;
  const isMobile = windowWidth <= 768;

  if (!isMobile || !isMobileGroupsExpanded) return null;

  const handleGroupClick = (group) => {
    dispatch({ type: actions.SET_SELECTED_GROUP_FOR_DETAILS, payload: group });
    dispatch({ type: actions.SET_SHOW_GROUP_DETAILS_MODAL, payload: true });
  };

  const handleCreateGroup = () => {
    dispatch({ type: actions.SET_SHOW_ADD_GROUP_MODAL, payload: true });
  };

  const handleClose = () => {
    dispatch({ type: actions.SET_IS_MOBILE_GROUPS_EXPANDED, payload: false });
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'white',
      borderTop: '2px solid #3498db',
      boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
      zIndex: 200,
      maxHeight: '70vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 15px',
        borderBottom: '1px solid #eee',
        backgroundColor: '#f8f9fa'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          👥 {t('groups')} ({readyToSeatGroups.length})
        </h3>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleCreateGroup}
            style={{
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ➕ {t('createGroup')}
          </button>
          
          <button
            onClick={() => {
              dispatch({ type: actions.SET_IS_MOBILE_GROUPS_EXPANDED, payload: false });
            }}
            style={{
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            👁️ {t('viewHall')}
          </button>
          
          <button
            onClick={handleClose}
            style={{
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Groups List */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '10px'
      }}>
        {readyToSeatGroups.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '14px',
            padding: '30px 20px'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>👥</div>
            {t('createFirstGroup')}
            <div style={{
              marginTop: '15px'
            }}>
              <button
                onClick={handleCreateGroup}
                style={{
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ➕ {t('createGroup')}
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {readyToSeatGroups.map((group) => {
              const status = getGroupStatus(group);
              
              return (
                <div
                  key={group.id}
                  onClick={() => handleGroupClick(group)}
                  style={{
                    backgroundColor: 'white',
                    border: `2px solid ${group.color}`,
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  onTouchStart={(e) => {
                    e.target.style.transform = 'scale(0.98)';
                    e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
                  }}
                  onTouchEnd={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#333',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}>
                      {group.name}
                    </h4>
                    
                    <div style={{
                      display: 'flex',
                      gap: '5px',
                      alignItems: 'center'
                    }}>
                      {status.isReadyToSeat && (
                        <span style={{
                          fontSize: '10px',
                          color: '#27ae60',
                          fontWeight: 'bold',
                          backgroundColor: '#e8f5e8',
                          padding: '2px 6px',
                          borderRadius: '3px'
                        }}>
                          {t('readyForSeating')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    <span>
                      {status.availableMembers} {t('people')} {t('readyToSeat')}
                    </span>
                    
                    {status.seatedMembers > 0 && (
                      <span style={{ color: '#3498db' }}>
                        {status.seatedMembers} {t('seatedMembers')}
                      </span>
                    )}
                  </div>

                  {status.seatedAtTable && (
                    <div style={{
                      fontSize: '11px',
                      color: '#27ae60',
                      marginTop: '5px',
                      fontStyle: 'italic'
                    }}>
                      📍 {status.seatedAtTable}
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    gap: '3px',
                    marginTop: '8px'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: actions.SET_SELECTED_GROUP_FOR_SEATING, payload: group });
                        dispatch({ type: actions.SET_SHOW_SEATING_MODAL, payload: true });
                      }}
                      style={{
                        backgroundColor: '#2ecc71',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 6px',
                        cursor: 'pointer',
                        fontSize: '10px',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px'
                      }}
                    >
                      🎯
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: actions.SET_EDITING_GROUP, payload: group });
                        dispatch({ type: actions.SET_EDIT_GROUP_NAME, payload: group.name });
                        dispatch({ type: actions.SET_EDIT_GROUP_MEMBERS, payload: [...group.members] });
                        dispatch({ type: actions.SET_SHOW_EDIT_GROUP_MODAL, payload: true });
                      }}
                      style={{
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 6px',
                        cursor: 'pointer',
                        fontSize: '10px',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px'
                      }}
                    >
                      ✏️
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGroupClick(group);
                      }}
                      style={{
                        backgroundColor: '#9b59b6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px 6px',
                        cursor: 'pointer',
                        fontSize: '10px',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px'
                      }}
                    >
                      📋
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileGroupsPanel; 