import React from 'react';
import { useSeating } from './SeatingContext';
import { useTranslations } from './useTranslations';
import { useGroups } from './useGroups';

const MobileGroupsPanel = () => {
  const { state, dispatch, actions } = useSeating();
  const { t } = useTranslations();
  const { getGroupStatus, removeGroup, releaseGroup } = useGroups();
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const {
    isMobileGroupsExpanded,
    groups,
    windowWidth
  } = state;

  if (!isMobileGroupsExpanded) return null;

  const handleViewGroupDetails = (group) => {
    dispatch({ type: actions.SET_SELECTED_GROUP_FOR_DETAILS, payload: group });
    dispatch({ type: actions.SET_SHOW_GROUP_DETAILS_MODAL, payload: true });
  };

  const handleSeatGroup = (group) => {
    // Передаем ID группы
    dispatch({ type: actions.SET_SELECTED_GROUP_FOR_SEATING, payload: group.id });
    
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
    dispatch({ type: actions.SET_IS_MOBILE_GROUPS_EXPANDED, payload: false });
  };

  const handleReleaseGroup = (group) => {
    if (window.confirm(`${t('releaseGroupConfirm')} "${group.name}" ${t('returnMembersForReSeating')}`)) {
      releaseGroup(group.id);
    }
  };

  const handleDeleteGroup = (group) => {
    if (window.confirm(`${t('deleteGroupConfirm')} "${group.name}"?`)) {
      removeGroup(group.id);
    }
  };

  const getStatusIcon = (status) => {
    if (status.isFullySeated) return '🔴';
    if (status.isPartiallySeated) return '🟡';
    return '🟢';
  };

  const getStatusText = (status) => {
    if (status.isFullySeated) return t('fullySeated');
    if (status.isPartiallySeated) return t('partiallySeated');
    return t('available');
  };

  // Фильтрация групп
  const filterGroups = () => {
    let filtered = groups || [];
    
    // Фильтр по поиску
    if (searchTerm.trim()) {
      filtered = filtered.filter(group => 
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.members?.some(member => {
          const memberName = typeof member === 'string' ? member : member.name;
          return memberName.toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }
    
    // Фильтр по статусу
    if (statusFilter !== 'all') {
      filtered = filtered.filter(group => {
        const status = getGroupStatus(group);
        switch (statusFilter) {
          case 'available':
            return !status.isPartiallySeated && !status.isFullySeated;
          case 'partiallySeated':
            return status.isPartiallySeated;
          case 'fullySeated':
            return status.isFullySeated;
          default:
            return true;
        }
      });
    }
    
    return filtered;
  };

  const filteredGroups = filterGroups();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#f8f9fa',
      zIndex: 1500,
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
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
          👥 {t('groups')}
        </h3>
                 <button
           onClick={() => dispatch({ type: actions.SET_IS_MOBILE_GROUPS_EXPANDED, payload: false })}
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

             {/* Search and Filters */}
             <div style={{
               padding: '15px',
               borderBottom: '1px solid #e9ecef',
               backgroundColor: '#f8f9fa'
             }}>
               {/* Search */}
               <div style={{ marginBottom: '10px' }}>
                 <input
                   type="text"
                   placeholder={t('searchGroups')}
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   style={{
                     width: '100%',
                     padding: '8px 12px',
                     border: '1px solid #ddd',
                     borderRadius: '6px',
                     fontSize: '14px',
                     boxSizing: 'border-box'
                   }}
                 />
               </div>
               
               {/* Status Filter */}
               <div style={{
                 display: 'flex',
                 gap: '6px',
                 flexWrap: 'wrap'
               }}>
                 <button
                   onClick={() => setStatusFilter('all')}
                   style={{
                     padding: '4px 8px',
                     border: '1px solid #ddd',
                     borderRadius: '4px',
                     fontSize: '10px',
                     cursor: 'pointer',
                     backgroundColor: statusFilter === 'all' ? '#3498db' : '#fff',
                     color: statusFilter === 'all' ? 'white' : '#333',
                     fontWeight: statusFilter === 'all' ? 'bold' : 'normal'
                   }}
                 >
                   {t('allGroups')} ({groups?.length || 0})
                 </button>
                 <button
                   onClick={() => setStatusFilter('available')}
                   style={{
                     padding: '4px 8px',
                     border: '1px solid #ddd',
                     borderRadius: '4px',
                     fontSize: '10px',
                     cursor: 'pointer',
                     backgroundColor: statusFilter === 'available' ? '#2ecc71' : '#fff',
                     color: statusFilter === 'available' ? 'white' : '#333',
                     fontWeight: statusFilter === 'available' ? 'bold' : 'normal'
                   }}
                 >
                   🟢 {t('available')}
                 </button>
                 <button
                   onClick={() => setStatusFilter('partiallySeated')}
                   style={{
                     padding: '4px 8px',
                     border: '1px solid #ddd',
                     borderRadius: '4px',
                     fontSize: '10px',
                     cursor: 'pointer',
                     backgroundColor: statusFilter === 'partiallySeated' ? '#f39c12' : '#fff',
                     color: statusFilter === 'partiallySeated' ? 'white' : '#333',
                     fontWeight: statusFilter === 'partiallySeated' ? 'bold' : 'normal'
                   }}
                 >
                   🟡 {t('partiallySeated')}
                 </button>
                 <button
                   onClick={() => setStatusFilter('fullySeated')}
                   style={{
                     padding: '4px 8px',
                     border: '1px solid #ddd',
                     borderRadius: '4px',
                     fontSize: '10px',
                     cursor: 'pointer',
                     backgroundColor: statusFilter === 'fullySeated' ? '#e74c3c' : '#fff',
                     color: statusFilter === 'fullySeated' ? 'white' : '#333',
                     fontWeight: statusFilter === 'fullySeated' ? 'bold' : 'normal'
                   }}
                 >
                   🔴 {t('fullySeated')}
                 </button>
               </div>
             </div>

             {/* Groups List */}
             <div style={{
               flex: 1,
               overflow: 'auto',
               padding: '15px'
             }}>
         {filteredGroups.length === 0 ? (
           <div style={{
             textAlign: 'center',
             padding: '40px 20px',
             color: '#666'
           }}>
             <div style={{ fontSize: '48px', marginBottom: '10px' }}>👥</div>
             <div style={{ fontSize: '16px', marginBottom: '5px' }}>
               {groups.length === 0 ? t('noGroups') : t('noGroupsFound')}
             </div>
             <div style={{ fontSize: '14px' }}>
               {groups.length === 0 ? t('createFirstGroup') : t('tryDifferentFilter')}
             </div>
           </div>
         ) : (
                                              <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              paddingBottom: '10px'
            }}>
                           {/* Available Groups Section */}
              {(() => {
                const availableGroups = filteredGroups.filter(group => {
                  const status = getGroupStatus(group);
                  return status.isReadyToSeat && !status.isPartiallySeated && !status.isFullySeated;
                });
               
                               return availableGroups.length > 0 && (
                  <div style={{
                    backgroundColor: '#e8f5e8',
                    borderRadius: '8px',
                    padding: '10px',
                    border: '1px solid #4caf50'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '8px',
                      padding: '6px 8px',
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      borderRadius: '6px'
                    }}>
                      <span style={{ fontSize: '14px' }}>🟢</span>
                      <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#2e7d32' }}>
                        {t('availableGroups')} ({availableGroups.length})
                      </h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', overflowX: 'auto' }}>
                     {availableGroups.map((group) => {
                       const status = getGroupStatus(group);
                                               return (
                          <div
                            key={group.id}
                            style={{
                              backgroundColor: 'white',
                              borderRadius: '6px',
                              padding: '8px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              border: `1px solid ${group.color}`,
                              position: 'relative',
                              minWidth: '140px',
                              flexShrink: 0
                            }}
                          >
                            {/* Group Header */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '6px'
                            }}>
                              <h4 style={{
                                margin: 0,
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: '#333',
                                flex: 1
                              }}>
                                {group.name}
                              </h4>
                            </div>

                            {/* Status Info */}
                            <div style={{
                              backgroundColor: '#f8f9fa',
                              padding: '4px 6px',
                              borderRadius: '4px',
                              marginBottom: '6px',
                              fontSize: '10px',
                              color: '#666'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{t('available')}</span>
                                <span>{status.seatedMembers}/{group.members.length}</span>
                              </div>
                            </div>

                            {/* Members Preview */}
                            <div style={{
                              fontSize: '10px',
                              color: '#666',
                              marginBottom: '8px',
                              lineHeight: '1.2'
                            }}>
                              {group.members.slice(0, 1).map(member => {
                                const memberName = typeof member === 'string' ? member : member.name;
                                return memberName;
                              }).join(', ')}
                              {group.members.length > 1 && ` +${group.members.length - 1}`}
                            </div>

                                                        {/* Action Buttons */}
                            <div style={{
                              display: 'flex',
                              gap: '4px',
                              flexWrap: 'wrap'
                            }}>
                              <button
                                onClick={() => handleSeatGroup(group)}
                                style={{
                                  flex: 1,
                                  padding: '4px 6px',
                                  backgroundColor: '#2ecc71',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '9px',
                                  fontWeight: 'bold',
                                  minWidth: '50px'
                                }}
                              >
                                🪑 {t('seatGroup')}
                              </button>

                              <button
                                onClick={() => handleViewGroupDetails(group)}
                                style={{
                                  padding: '4px 6px',
                                  backgroundColor: '#3498db',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '9px',
                                  fontWeight: 'bold',
                                  minWidth: '35px'
                                }}
                              >
                                👁️
                              </button>

                              <button
                                onClick={() => handleDeleteGroup(group)}
                                style={{
                                  padding: '4px 6px',
                                  backgroundColor: '#e74c3c',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '9px',
                                  fontWeight: 'bold',
                                  minWidth: '35px'
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

                                                       {/* Partially Seated Groups Section */}
              {(() => {
                const partiallySeatedGroups = filteredGroups.filter(group => {
                  const status = getGroupStatus(group);
                  return status.isPartiallySeated && !status.isFullySeated;
                });
               
                               return partiallySeatedGroups.length > 0 && (
                  <div style={{
                    backgroundColor: '#fff3e0',
                    borderRadius: '8px',
                    padding: '10px',
                    border: '1px solid #f39c12'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '8px',
                      padding: '6px 8px',
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      borderRadius: '6px'
                    }}>
                      <span style={{ fontSize: '14px' }}>🟡</span>
                      <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#f57c00' }}>
                        {t('partiallySeatedGroups')} ({partiallySeatedGroups.length})
                      </h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', overflowX: 'auto' }}>
                     {partiallySeatedGroups.map((group) => {
                       const status = getGroupStatus(group);
                       return (
                          <div
                            key={group.id}
                            style={{
                              backgroundColor: 'white',
                              borderRadius: '6px',
                              padding: '8px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              border: `1px solid ${group.color}`,
                              position: 'relative',
                              minWidth: '140px',
                              flexShrink: 0
                            }}
                          >
                            {/* Group Header */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '6px'
                            }}>
                              <h4 style={{
                                margin: 0,
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: '#333',
                                flex: 1
                              }}>
                                {group.name}
                              </h4>
                            </div>

                            {/* Status Info */}
                            <div style={{
                              backgroundColor: '#f8f9fa',
                              padding: '4px 6px',
                              borderRadius: '4px',
                              marginBottom: '6px',
                              fontSize: '10px',
                              color: '#666'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{t('partiallySeated')}</span>
                                <span>{status.seatedMembers}/{group.members.length}</span>
                              </div>
                            </div>

                            {/* Members Preview */}
                            <div style={{
                              fontSize: '10px',
                              color: '#666',
                              marginBottom: '8px',
                              lineHeight: '1.2'
                            }}>
                              {group.members.slice(0, 1).map(member => {
                                const memberName = typeof member === 'string' ? member : member.name;
                                return memberName;
                              }).join(', ')}
                              {group.members.length > 1 && ` +${group.members.length - 1}`}
                            </div>

                            {/* Action Buttons */}
                            <div style={{
                              display: 'flex',
                              gap: '4px',
                              flexWrap: 'wrap'
                            }}>
                              <button
                                onClick={() => handleSeatGroup(group)}
                                style={{
                                  flex: 1,
                                  padding: '4px 6px',
                                  backgroundColor: '#2ecc71',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '9px',
                                  fontWeight: 'bold',
                                  minWidth: '50px'
                                }}
                              >
                                🪑 {t('seatGroup')}
                              </button>

                              <button
                                onClick={() => handleReleaseGroup(group)}
                                style={{
                                  padding: '4px 6px',
                                  backgroundColor: '#f39c12',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '9px',
                                  fontWeight: 'bold',
                                  minWidth: '35px'
                                }}
                              >
                                🔄
                              </button>

                              <button
                                onClick={() => handleViewGroupDetails(group)}
                                style={{
                                  padding: '4px 6px',
                                  backgroundColor: '#3498db',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '9px',
                                  fontWeight: 'bold',
                                  minWidth: '35px'
                                }}
                              >
                                👁️
                              </button>

                              <button
                                onClick={() => handleDeleteGroup(group)}
                                style={{
                                  padding: '4px 6px',
                                  backgroundColor: '#e74c3c',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '9px',
                                  fontWeight: 'bold',
                                  minWidth: '35px'
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

                           {/* Fully Seated Groups Section */}
              {(() => {
                const fullySeatedGroups = filteredGroups.filter(group => {
                  const status = getGroupStatus(group);
                  return status.isFullySeated;
                });
                
                               return fullySeatedGroups.length > 0 && (
                  <div style={{
                    backgroundColor: '#ffebee',
                    borderRadius: '8px',
                    padding: '10px',
                    border: '1px solid #e74c3c'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '8px',
                      padding: '6px 8px',
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      borderRadius: '6px'
                    }}>
                      <span style={{ fontSize: '14px' }}>🔴</span>
                      <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#c62828' }}>
                        {t('fullySeatedGroups')} ({fullySeatedGroups.length})
                      </h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', overflowX: 'auto' }}>
                     {fullySeatedGroups.map((group) => {
                       const status = getGroupStatus(group);
                       return (
                          <div
                            key={group.id}
                            style={{
                              backgroundColor: 'white',
                              borderRadius: '6px',
                              padding: '8px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              border: `1px solid ${group.color}`,
                              position: 'relative',
                              minWidth: '140px',
                              flexShrink: 0
                            }}
                          >
                            {/* Group Header */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '6px'
                            }}>
                              <h4 style={{
                                margin: 0,
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: '#333',
                                flex: 1
                              }}>
                                {group.name}
                              </h4>
                            </div>

                            {/* Status Info */}
                            <div style={{
                              backgroundColor: '#f8f9fa',
                              padding: '4px 6px',
                              borderRadius: '4px',
                              marginBottom: '6px',
                              fontSize: '10px',
                              color: '#666'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{t('fullySeated')}</span>
                                <span>{status.seatedMembers}/{group.members.length}</span>
                              </div>
                            </div>

                            {/* Members Preview */}
                            <div style={{
                              fontSize: '10px',
                              color: '#666',
                              marginBottom: '8px',
                              lineHeight: '1.2'
                            }}>
                              {group.members.slice(0, 1).map(member => {
                                const memberName = typeof member === 'string' ? member : member.name;
                                return memberName;
                              }).join(', ')}
                              {group.members.length > 1 && ` +${group.members.length - 1}`}
                            </div>

                            {/* Action Buttons */}
                            <div style={{
                              display: 'flex',
                              gap: '4px',
                              flexWrap: 'wrap'
                            }}>
                              <button
                                onClick={() => handleReleaseGroup(group)}
                                style={{
                                  flex: 1,
                                  padding: '4px 6px',
                                  backgroundColor: '#f39c12',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '9px',
                                  fontWeight: 'bold',
                                  minWidth: '50px'
                                }}
                              >
                                🔄 {t('release')}
                              </button>

                              <button
                                onClick={() => handleViewGroupDetails(group)}
                                style={{
                                  padding: '4px 6px',
                                  backgroundColor: '#3498db',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '9px',
                                  fontWeight: 'bold',
                                  minWidth: '35px'
                                }}
                              >
                                👁️
                              </button>

                              <button
                                onClick={() => handleDeleteGroup(group)}
                                style={{
                                  padding: '4px 6px',
                                  backgroundColor: '#e74c3c',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '9px',
                                  fontWeight: 'bold',
                                  minWidth: '35px'
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
           </div>
         )}
       </div>
    </div>
  );
};

export default MobileGroupsPanel; 