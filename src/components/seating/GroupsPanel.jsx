import React, { useState } from 'react';
import { useSeating } from './SeatingContext';
import { useTranslations } from './useTranslations';
import { useGroups } from './useGroups';
import { useTables } from './useTables';
import CreateGroupModal from './CreateGroupModal';
import EditGroupModal from './EditGroupModal';
import GroupDetailsModal from './GroupDetailsModal';
import ImportJsonModal from './ImportJsonModal';

const GroupsPanel = () => {
  const { state, dispatch, actions } = useSeating();
  const { t } = useTranslations();
  const { 
    removeGroup,
    getGroupStatus
  } = useGroups();
  const { seatGroupAtTable } = useTables();
  const { windowWidth } = state;

  const [isExpanded, setIsExpanded] = useState(false);
  const [dragOverTable, setDragOverTable] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, available, partiallySeated, fullySeated

  // Правильная логика категоризации групп
  const categorizeGroups = () => {
    const available = [];
    const partiallySeated = [];
    const fullySeated = [];

    state.groups?.forEach(group => {
      const status = getGroupStatus(group);
      
      if (status.isFullySeated) {
        fullySeated.push(group);
      } else if (status.isPartiallySeated) {
        partiallySeated.push(group);
      } else {
        available.push(group);
      }
    });

    return { available, partiallySeated, fullySeated };
  };

  const { available: availableGroups, partiallySeated: partiallySeatedGroups, fullySeated: seatedGroups } = categorizeGroups();

  // Проверка на дублирование (отладочная информация)
  const allGroupIds = [...availableGroups, ...partiallySeatedGroups, ...seatedGroups].map(g => g.id);
  const uniqueGroupIds = [...new Set(allGroupIds)];
  
  if (allGroupIds.length !== uniqueGroupIds.length) {
    console.warn('Обнаружено дублирование групп!', {
      total: allGroupIds.length,
      unique: uniqueGroupIds.length,
      duplicates: allGroupIds.filter((id, index) => allGroupIds.indexOf(id) !== index)
    });
  }

  // Фильтруем группы по поиску и статусу
  const filterGroupsBySearch = (groups) => {
    let filtered = groups;
    
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

  const filteredAvailableGroups = filterGroupsBySearch(availableGroups);
  const filteredPartiallySeatedGroups = filterGroupsBySearch(partiallySeatedGroups);
  const filteredSeatedGroups = filterGroupsBySearch(seatedGroups);

  const handleDragStart = (e, group) => {
    console.log('handleDragStart для группы:', group);
    dispatch({ type: actions.SET_DRAGGED_GROUP, payload: group });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    dispatch({ type: actions.SET_DRAGGED_GROUP, payload: null });
  };

  const getGroupColor = (groupId) => {
    const colors = [
      '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
      '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b'
    ];
    const index = state.groups?.findIndex(g => g.id === groupId) || 0;
    return colors[index % colors.length];
  };

  const renderGroupCard = (group, seatingStatus = false) => {
    const isSeated = seatingStatus === true;
    const isPartiallySeated = seatingStatus === 'partial';
    const isMobile = windowWidth <= 768;
    
    // Получаем статус группы
    const status = getGroupStatus(group);
    const isFullySeated = status.isFullySeated;
    const isPartiallySeatedStatus = status.isPartiallySeated;
    const isAvailable = status.isReadyToSeat;
    

    
    return (
    <div
      key={group.id}
      draggable={!isSeated}
      onDragStart={(e) => !isSeated && handleDragStart(e, group)}
      onDragEnd={handleDragEnd}
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: isMobile ? '12px' : '15px',
        marginBottom: '10px',
        border: `2px solid ${getGroupColor(group.id)}`,
        cursor: isSeated ? 'default' : 'grab',
        opacity: isSeated ? 0.7 : 1,
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (!isSeated) {
          e.target.style.transform = 'scale(1.02)';
          e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSeated) {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }
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
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: 'bold',
          color: getGroupColor(group.id),
          flex: 1,
          marginRight: '8px'
        }}>
          {group.name}
        </h4>
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? '6px' : '4px',
          flexShrink: 0
        }}>
          {!isSeated && (
            <button
              onClick={() => {
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
                padding: isMobile ? '6px 10px' : '4px 8px',
                cursor: 'pointer',
                fontSize: isMobile ? '12px' : '10px',
                fontWeight: 'bold',
                minWidth: isMobile ? '32px' : 'auto'
              }}
              title={t('editGroup')}
            >
              {isMobile ? '✏️' : '✏️'}
            </button>
          )}
          <button
            onClick={() => {
              dispatch({ type: actions.SET_SELECTED_GROUP_FOR_DETAILS, payload: group });
              dispatch({ type: actions.SET_SHOW_GROUP_DETAILS_MODAL, payload: true });
            }}
            style={{
              backgroundColor: '#f39c12',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: isMobile ? '6px 10px' : '4px 8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '10px',
              fontWeight: 'bold',
              minWidth: isMobile ? '32px' : 'auto'
            }}
            title={t('groupDetails')}
          >
            {isMobile ? '👁️' : '👁️'}
          </button>
          <button
            onClick={() => removeGroup(group.id)}
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: isMobile ? '6px 10px' : '4px 8px',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '10px',
              fontWeight: 'bold',
              minWidth: isMobile ? '32px' : 'auto'
            }}
            title={t('deleteGroup')}
          >
            {isMobile ? '🗑️' : '🗑️'}
          </button>
        </div>
      </div>
      
      <div style={{
        fontSize: isMobile ? '12px' : '14px',
        color: '#666',
        marginBottom: '8px',
        lineHeight: '1.3'
      }}>
        {isMobile ? (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {group.members.length} {t('people')}
            </div>
            <div style={{ fontSize: '11px', color: '#888' }}>
              {group.members?.slice(0, 2).map(member => {
                const memberName = typeof member === 'string' ? member : member.name;
                return memberName;
              }).join(', ')}
              {group.members && group.members.length > 2 && ` +${group.members.length - 2}`}
            </div>
          </div>
        ) : (
          <>
            {group.members?.slice(0, 3).map(member => {
              const memberName = typeof member === 'string' ? member : member.name;
              return memberName;
            }).join(', ')}
            {group.members && group.members.length > 3 && ` +${group.members.length - 3}`}
          </>
        )}
      </div>
      
      {/* Статус группы */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
        fontSize: '11px',
        fontWeight: 'bold'
      }}>
        {isAvailable && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#2ecc71',
            backgroundColor: '#e8f5e8',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '10px'
          }}>
            🟢 {t('available')} ({status.availableMembers})
          </div>
        )}
        
        {isPartiallySeatedStatus && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#f39c12',
            backgroundColor: '#fff3e0',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '10px'
          }}>
            🟡 {t('partiallySeated')} ({status.seatedMembers}/{status.totalMembers})
          </div>
        )}
        
        {isFullySeated && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#e74c3c',
            backgroundColor: '#fdf2f2',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '10px'
          }}>
            🔴 {t('fullySeated')} ({status.seatedMembers})
          </div>
        )}
      </div>
      
      {isSeated && (
        <div style={{
          fontSize: isMobile ? '11px' : '10px',
          color: '#e74c3c',
          fontWeight: 'bold',
          textAlign: 'center',
          padding: isMobile ? '6px' : '4px',
          backgroundColor: '#fdf2f2',
          borderRadius: '4px'
        }}>
          {t('seated')}
        </div>
      )}
      
      {isPartiallySeated && (
        <div style={{
          fontSize: isMobile ? '11px' : '10px',
          color: '#f39c12',
          fontWeight: 'bold',
          textAlign: 'center',
          padding: '4px',
          backgroundColor: '#fef9e7',
          borderRadius: '4px'
        }}>
          {t('partiallySeated')}
        </div>
      )}
    </div>
  );
};

  return (
    <>
      {/* Desktop Groups Panel */}
      {state.showGroupsPanel && (
        <div style={{
          position: 'fixed',
          left: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '600px',
          maxHeight: '80vh',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          border: '1px solid #e9ecef',
          display: windowWidth > 768 ? 'block' : 'none',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: '#3498db',
            color: 'white',
            padding: '15px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
              👥 {t('groups')}
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => dispatch({ type: actions.SET_SHOW_ADD_GROUP_MODAL, payload: true })}
                style={{
                  backgroundColor: '#2ecc71',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                ➕
              </button>
              <button
                onClick={() => dispatch({ type: actions.SET_SHOW_IMPORT_JSON_MODAL, payload: true })}
                style={{
                  backgroundColor: '#9b59b6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Импорт гостей из JSON"
              >
                📥
              </button>
              <button
                onClick={() => dispatch({ type: actions.CREATE_TEST_GROUPS })}
                style={{
                  backgroundColor: '#f39c12',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Создать тестовые группы"
              >
                🧪
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Вы уверены, что хотите удалить все группы?')) {
                    dispatch({ type: actions.CLEAR_ALL_GROUPS });
                  }
                }}
                style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Удалить все группы"
              >
                🗑️
              </button>
              <button
                onClick={() => dispatch({ type: actions.SET_SHOW_GROUPS_PANEL, payload: false })}
                style={{
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div style={{
            padding: '15px 20px',
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
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setStatusFilter('all')}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'all' ? '#3498db' : '#fff',
                  color: statusFilter === 'all' ? 'white' : '#333',
                  fontWeight: statusFilter === 'all' ? 'bold' : 'normal'
                }}
              >
                {t('allGroups')} ({state.groups?.length || 0})
              </button>
              <button
                onClick={() => setStatusFilter('available')}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'available' ? '#2ecc71' : '#fff',
                  color: statusFilter === 'available' ? 'white' : '#333',
                  fontWeight: statusFilter === 'available' ? 'bold' : 'normal'
                }}
              >
                🟢 {t('available')} ({availableGroups.length})
              </button>
              <button
                onClick={() => setStatusFilter('partiallySeated')}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'partiallySeated' ? '#f39c12' : '#fff',
                  color: statusFilter === 'partiallySeated' ? 'white' : '#333',
                  fontWeight: statusFilter === 'partiallySeated' ? 'bold' : 'normal'
                }}
              >
                🟡 {t('partiallySeated')} ({partiallySeatedGroups.length})
              </button>
              <button
                onClick={() => setStatusFilter('fullySeated')}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === 'fullySeated' ? '#e74c3c' : '#fff',
                  color: statusFilter === 'fullySeated' ? 'white' : '#333',
                  fontWeight: statusFilter === 'fullySeated' ? 'bold' : 'normal'
                }}
              >
                🔴 {t('fullySeated')} ({seatedGroups.length})
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{
            padding: '25px',
            maxHeight: 'calc(80vh - 150px)',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '15px',
              height: '100%'
            }}>
              {/* Available Groups */}
              <div>
                <h4 style={{
                  margin: '0 0 15px 0',
                  color: '#2ecc71',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🟢 {t('availableGroups')} ({filteredAvailableGroups.length})
                </h4>
                <div style={{
                  maxHeight: 'calc(80vh - 200px)',
                  overflow: 'auto'
                }}>
                  {filteredAvailableGroups.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '20px',
                      color: '#95a5a6',
                      fontSize: '12px',
                      fontStyle: 'italic'
                    }}>
                      {t('noAvailableGroups')}
                    </div>
                  ) : (
                    <div>
                      {filteredAvailableGroups.map(group => renderGroupCard(group, false))}
                    </div>
                  )}
                </div>
              </div>

              {/* Partially Seated Groups */}
              <div>
                <h4 style={{
                  margin: '0 0 15px 0',
                  color: '#f39c12',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🟡 {t('partiallySeatedGroups')} ({filteredPartiallySeatedGroups.length})
                </h4>
                <div style={{
                  maxHeight: 'calc(80vh - 200px)',
                  overflow: 'auto'
                }}>
                  {filteredPartiallySeatedGroups.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '20px',
                      color: '#95a5a6',
                      fontSize: '12px',
                      fontStyle: 'italic'
                    }}>
                      {t('noPartiallySeatedGroups')}
                    </div>
                  ) : (
                    <div>
                      {filteredPartiallySeatedGroups.map(group => renderGroupCard(group, false))}
                    </div>
                  )}
                </div>
              </div>

              {/* Fully Seated Groups */}
              <div>
                <h4 style={{
                  margin: '0 0 15px 0',
                  color: '#e74c3c',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🔴 {t('fullySeatedGroups')} ({filteredSeatedGroups.length})
                </h4>
                <div style={{
                  maxHeight: 'calc(80vh - 200px)',
                  overflow: 'auto'
                }}>
                  {filteredSeatedGroups.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '20px',
                      color: '#95a5a6',
                      fontSize: '12px',
                      fontStyle: 'italic'
                    }}>
                      {t('noFullySeatedGroups')}
                    </div>
                  ) : (
                    <div>
                      {filteredSeatedGroups.map(group => renderGroupCard(group, false))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Expanded Panel */}
      {isExpanded && windowWidth <= 768 && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          left: '20px',
          width: 'calc(100vw - 40px)',
          maxHeight: '60vh',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          border: '1px solid #e9ecef',
          overflow: 'hidden',
          zIndex: 999
        }}>
          {/* Mobile Header */}
          <div style={{
            backgroundColor: '#3498db',
            color: 'white',
            padding: '15px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
              👥 {t('groups')}
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => dispatch({ type: actions.SET_SHOW_ADD_GROUP_MODAL, payload: true })}
                style={{
                  backgroundColor: '#2ecc71',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
                title={t('createGroup')}
              >
                ➕
              </button>
              <button
                onClick={() => dispatch({ type: actions.SET_SHOW_IMPORT_JSON_MODAL, payload: true })}
                style={{
                  backgroundColor: '#9b59b6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
                title="Импорт гостей из JSON"
              >
                📥
              </button>
              <button
                onClick={() => dispatch({ type: actions.CREATE_TEST_GROUPS })}
                style={{
                  backgroundColor: '#f39c12',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
                title="Создать тестовые группы"
              >
                🧪
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Вы уверены, что хотите удалить все группы?')) {
                    dispatch({ type: actions.CLEAR_ALL_GROUPS });
                  }
                }}
                style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
                title="Удалить все группы"
              >
                🗑️
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
                title={t('close')}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div style={{
            padding: '15px 20px',
            borderBottom: '1px solid #e9ecef',
            backgroundColor: '#f8f9fa'
          }}>
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

          {/* Mobile Content */}
          <div style={{
            padding: '20px',
            maxHeight: 'calc(60vh - 120px)',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {/* Available Groups */}
              <div>
                <h4 style={{
                  margin: '0 0 15px 0',
                  color: '#2ecc71',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🟢 {t('availableGroups')} ({availableGroups.length})
                </h4>
                <div style={{
                  maxHeight: 'calc(60vh - 200px)',
                  overflow: 'auto'
                }}>
                  {availableGroups.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '15px',
                      color: '#95a5a6',
                      fontSize: '13px',
                      fontStyle: 'italic',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px dashed #ddd'
                    }}>
                      {t('noAvailableGroups')}
                    </div>
                  ) : (
                    <div>
                      {availableGroups.map(group => renderGroupCard(group, false))}
                    </div>
                  )}
                </div>
              </div>

              {/* Seated Groups */}
              <div>
                <h4 style={{
                  margin: '0 0 15px 0',
                  color: '#e74c3c',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  🔴 {t('seatedGroups')} ({seatedGroups.length})
                </h4>
                <div style={{
                  maxHeight: 'calc(60vh - 200px)',
                  overflow: 'auto'
                }}>
                  {seatedGroups.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '15px',
                      color: '#95a5a6',
                      fontSize: '13px',
                      fontStyle: 'italic',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px dashed #ddd'
                    }}>
                      {t('noSeatedGroups')}
                    </div>
                  ) : (
                    <div>
                      {seatedGroups.map(group => renderGroupCard(group, true))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Modals */}
      <CreateGroupModal />
      <EditGroupModal />
      <GroupDetailsModal />
      <ImportJsonModal />
    </>
  );
};

export default GroupsPanel; 