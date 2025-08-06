import React from 'react';
import { useSeating } from './SeatingContext';
import { useTranslations } from './useTranslations';
import { useGroups } from './useGroups';

const GroupDetailsModal = () => {
  const { state, dispatch, actions } = useSeating();
  const { t } = useTranslations();
  const { getGroupStatus, removeGroup, releaseGroup } = useGroups();

  const {
    showGroupDetailsModal,
    selectedGroupForDetails,
    windowWidth
  } = state;

  if (!showGroupDetailsModal || !selectedGroupForDetails) return null;

  const status = getGroupStatus(selectedGroupForDetails);

  const handleClose = () => {
    dispatch({ type: actions.SET_SHOW_GROUP_DETAILS_MODAL, payload: false });
    dispatch({ type: actions.SET_SELECTED_GROUP_FOR_DETAILS, payload: null });
  };

  const handleReleaseGroup = () => {
    if (window.confirm(`${t('releaseGroupConfirm')} "${selectedGroupForDetails.name}" ${t('returnMembersForReSeating')}`)) {
      releaseGroup(selectedGroupForDetails.id);
      handleClose();
    }
  };

  const handleDeleteGroup = () => {
    if (window.confirm(`${t('deleteGroupConfirm')} "${selectedGroupForDetails.name}"?`)) {
      removeGroup(selectedGroupForDetails.id);
      handleClose();
    }
  };

  const handleEditGroup = () => {
    dispatch({ type: actions.SET_EDITING_GROUP, payload: selectedGroupForDetails });
    dispatch({ type: actions.SET_EDIT_GROUP_NAME, payload: selectedGroupForDetails.name });
    dispatch({ type: actions.SET_EDIT_GROUP_MEMBERS, payload: [...selectedGroupForDetails.members] });
    dispatch({ type: actions.SET_SHOW_EDIT_GROUP_MODAL, payload: true });
    handleClose();
  };

  const handleSelectTable = () => {
    // Передаем ID группы, а не весь объект
    dispatch({ type: actions.SET_SELECTED_GROUP_FOR_SEATING, payload: selectedGroupForDetails.id });
    
    // Включаем режим выбора стола
    dispatch({ type: actions.SET_TABLE_SELECTION_MODE, payload: true });
    
    // Закрываем все модальные окна и панели
    dispatch({ type: actions.SET_SHOW_GROUP_DETAILS_MODAL, payload: false });
    dispatch({ type: actions.SET_SELECTED_GROUP_FOR_DETAILS, payload: null });
    dispatch({ type: actions.SET_SHOW_ADD_GROUP_MODAL, payload: false });
    dispatch({ type: actions.SET_SHOW_EDIT_GROUP_MODAL, payload: false });
    dispatch({ type: actions.SET_SHOW_PERSON_MODAL, payload: false });
    dispatch({ type: actions.SET_SHOW_TABLE_DETAILS_MODAL, payload: false });
    dispatch({ type: actions.SET_SHOW_SEATING_MODAL, payload: false });
    dispatch({ type: actions.SET_SHOW_MOBILE_SEATING_CANVAS, payload: false });
    dispatch({ type: actions.SET_SHOW_STATISTICS, payload: false });
    dispatch({ type: actions.SET_SHOW_GROUPS_PANEL, payload: false });
    dispatch({ type: actions.SET_IS_MOBILE_GROUPS_EXPANDED, payload: false });
    
    // Принудительно закрываем панель групп
    setTimeout(() => {
      dispatch({ type: actions.SET_SHOW_GROUPS_PANEL, payload: false });
      dispatch({ type: actions.SET_IS_MOBILE_GROUPS_EXPANDED, payload: false });
    }, 100);
    
    // Явно закрываем модальное окно группы
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
        maxWidth: isMobile ? '100%' : '500px',
        maxHeight: isMobile ? '90vh' : '80vh',
        overflow: 'auto',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #eee',
          paddingBottom: '10px'
        }}>
          <h3 style={{ margin: 0, color: '#333' }}>{t('groupMembers')}</h3>
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
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
          border: `3px solid ${selectedGroupForDetails.color}`,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Цветная полоса сверху */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            backgroundColor: selectedGroupForDetails.color
          }} />
          
          <div style={{ paddingTop: '5px' }}>
            <h4 style={{
              margin: '0 0 10px 0',
              color: '#333',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: selectedGroupForDetails.color
              }} />
              {selectedGroupForDetails.name}
            </h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '10px',
              marginBottom: '15px'
            }}>
              <div style={{
                backgroundColor: '#e3f2fd',
                padding: '10px',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                  {selectedGroupForDetails.members.length}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {t('members')}
                </div>
              </div>

              <div style={{
                backgroundColor: '#e8f5e8',
                padding: '10px',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                  {status.seatedMembers}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {t('seated')}
                </div>
              </div>

              <div style={{
                backgroundColor: '#fff3e0',
                padding: '10px',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>
                  {status.availableMembers}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {t('available')}
                </div>
              </div>
            </div>

            {/* Members List */}
            <div>
              <h5 style={{
                margin: '0 0 10px 0',
                color: '#333',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {t('groupMembers')}:
              </h5>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '8px'
              }}>
                {selectedGroupForDetails.members.map((member, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: '#f5f5f5',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    {member}
                  </div>
                ))}
              </div>
            </div>

            {/* Seating Status */}
            {status.seatedAtTable && (
              <div style={{
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#e8f5e8',
                borderRadius: '6px',
                border: '1px solid #4caf50'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2e7d32' }}>
                  🪑 {t('seatedAtTable')}: {status.seatedAtTable}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '10px',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '10px',
            flex: 1
          }}>
            <button
              onClick={handleEditGroup}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              ✏️ {t('editGroup')}
            </button>

            {status.seatedMembers > 0 && (
              <button
                onClick={handleReleaseGroup}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#f39c12',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                🔄 {t('releaseGroup')}
              </button>
            )}
          </div>

          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '10px',
            flex: 1
          }}>
                         {status.availableMembers > 0 && (
               <button
                 onClick={handleSelectTable}
                 style={{
                   flex: 1,
                   padding: '12px',
                   backgroundColor: '#2ecc71',
                   color: 'white',
                   border: 'none',
                   borderRadius: '6px',
                   cursor: 'pointer',
                   fontSize: '14px',
                   fontWeight: 'bold'
                 }}
               >
                 🪑 {t('seatGroup')}
               </button>
             )}

            <button
              onClick={handleDeleteGroup}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              🗑️ {t('deleteGroup')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsModal; 