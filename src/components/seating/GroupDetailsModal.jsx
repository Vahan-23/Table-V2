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
    selectedGroupForDetails
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
    dispatch({ type: actions.SET_SELECTED_GROUP_FOR_SEATING, payload: selectedGroupForDetails });
    dispatch({ type: actions.SET_SHOW_SEATING_MODAL, payload: true });
    handleClose();
  };

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
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '10px',
              marginBottom: '10px'
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '8px',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                  {t('totalMembers')}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                  {status.totalMembers}
                </div>
              </div>
              
              <div style={{
                backgroundColor: 'white',
                padding: '8px',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                  {t('availableMembers')}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#27ae60' }}>
                  {status.availableMembers}
                </div>
              </div>
              
              {status.seatedMembers > 0 && (
                <div style={{
                  backgroundColor: 'white',
                  padding: '8px',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                    {t('seatedMembers')}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3498db' }}>
                    {status.seatedMembers}
                  </div>
                </div>
              )}
            </div>

            {status.seatedAtTable && (
              <div style={{
                fontSize: '12px',
                color: '#27ae60',
                marginTop: '5px',
                fontStyle: 'italic',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                📍 {status.seatedAtTable}
              </div>
            )}

            <div style={{
              marginTop: '10px',
              padding: '8px',
              backgroundColor: 'white',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#666',
              textAlign: 'center'
            }}>
              {status.isFullySeated ? (
                <span style={{ color: '#3498db', fontWeight: 'bold' }}>
                  ✅ {t('allMembersSeated')}
                </span>
              ) : status.isPartiallySeated ? (
                <span style={{ color: '#f39c12', fontWeight: 'bold' }}>
                  ⏳ {status.seatedMembers} {t('seatedMembers')}, {status.availableMembers} {t('waitingForSeating')}
                </span>
              ) : (
                <span style={{ color: '#27ae60', fontWeight: 'bold' }}>
                  🎯 {t('groupReadyToSeat')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Members List */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{
            margin: '0 0 10px 0',
            fontSize: '16px',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            👥 {t('members')} ({selectedGroupForDetails.members.length})
          </h4>

          {selectedGroupForDetails.members.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#999',
              fontSize: '12px',
              padding: '20px',
              border: '1px dashed #ddd',
              borderRadius: '4px'
            }}>
              {t('membersNotFound')}
            </div>
          ) : (
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              maxHeight: '200px',
              overflow: 'auto',
              backgroundColor: '#fafafa'
            }}>
              {selectedGroupForDetails.members.map((member, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: 'white',
                    margin: '4px',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa';
                    e.target.style.transform = 'translateX(2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: selectedGroupForDetails.color,
                    flexShrink: 0
                  }} />
                  <span style={{ 
                    fontSize: '14px', 
                    flex: 1,
                    fontWeight: '500'
                  }}>
                    {member}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    color: '#27ae60',
                    backgroundColor: '#e8f5e8',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontWeight: 'bold'
                  }}>
                    {t('readyToSeat')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px'
        }}>
          {status.availableMembers > 0 && (
            <button
              onClick={handleSelectTable}
              style={{
                padding: '12px 16px',
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              🎯 {t('selectTableAction')}
            </button>
          )}

          {status.seatedMembers > 0 && (
            <button
              onClick={handleReleaseGroup}
              style={{
                padding: '12px 16px',
                backgroundColor: '#f39c12',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            >
              🔄 {t('releaseGroupAction')}
            </button>
          )}

          <button
            onClick={handleEditGroup}
            style={{
              padding: '12px 16px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            ✏️ {t('editGroupAction')}
          </button>

          <button
            onClick={handleDeleteGroup}
            style={{
              padding: '12px 16px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            🗑️ {t('deleteGroupAction')}
          </button>

          <button
            onClick={handleClose}
            style={{
              gridColumn: '1 / -1',
              padding: '12px 16px',
              backgroundColor: '#f1f1f1',
              color: '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e5e5e5';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f1f1f1';
            }}
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsModal; 