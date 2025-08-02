import React from 'react';
import { useSeating } from './SeatingContext';
import { useTranslations } from './useTranslations';
import { useGroups } from './useGroups';

const GroupsPanel = () => {
  const { state, dispatch, actions } = useSeating();
  const { t } = useTranslations();
  const { 
    readyToSeatGroups, 
    fullySeatedGroups, 
    getGroupStatus, 
    getGroupColor,
    removeGroup,
    releaseGroup 
  } = useGroups();

  const { 
    windowWidth, 
    isGroupsExpanded, 
    isMobileGroupsExpanded,
    draggedGroup 
  } = state;

  const isMobile = windowWidth <= 768;
  const isExpanded = isMobile ? isMobileGroupsExpanded : isGroupsExpanded;

  const handleDragStart = (e, group) => {
    e.dataTransfer.setData('text/plain', group.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Создаем превью для перетаскивания
    const dragPreview = document.createElement('div');
    dragPreview.setAttribute('data-drag-preview', 'true');
    dragPreview.style.cssText = `
      position: fixed;
      top: -1000px;
      left: -1000px;
      background: white;
      border: 3px solid ${group.color};
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 8px 16px rgba(0,0,0,0.3);
      z-index: 10000;
      pointer-events: none;
      opacity: 0.9;
      transform: rotate(5deg);
      max-width: 200px;
      font-family: Arial, sans-serif;
    `;
    dragPreview.innerHTML = `
      <div style="font-weight: bold; color: #333; margin-bottom: 5px; font-size: 14px;">
        ${group.name}
      </div>
      <div style="font-size: 12px; color: #666; margin-bottom: 3px;">
        ${group.members.length} ${t('members')}
      </div>
      <div style="font-size: 10px; color: #27ae60; font-weight: bold;">
        🎯 ${t('dragToTable')}
      </div>
    `;
    document.body.appendChild(dragPreview);
    e.dataTransfer.setDragImage(dragPreview, 100, 50);
    
    dispatch({ type: actions.SET_DRAGGED_GROUP, payload: group });
  };

  const handleDragEnd = () => {
    // Удаляем превью
    const dragPreviews = document.querySelectorAll('[data-drag-preview]');
    dragPreviews.forEach(preview => preview.remove());
    
    dispatch({ type: actions.SET_DRAGGED_GROUP, payload: null });
  };

  const handleGroupClick = (e, group) => {
    e.stopPropagation();
    dispatch({ type: actions.SET_SELECTED_GROUP_FOR_DETAILS, payload: group });
    dispatch({ type: actions.SET_SHOW_GROUP_DETAILS_MODAL, payload: true });
  };

  const toggleExpanded = () => {
    if (isMobile) {
      dispatch({ type: actions.SET_IS_MOBILE_GROUPS_EXPANDED, payload: !isMobileGroupsExpanded });
    } else {
      dispatch({ type: actions.SET_IS_GROUPS_EXPANDED, payload: !isGroupsExpanded });
    }
  };

  const renderGroup = (group) => {
    const status = getGroupStatus(group);
    const isDragging = draggedGroup?.id === group.id;

    return (
      <div
        key={group.id}
        draggable
        onDragStart={(e) => handleDragStart(e, group)}
        onDragEnd={handleDragEnd}
        onClick={(e) => handleGroupClick(e, group)}
        style={{
          backgroundColor: isDragging ? 'rgba(52, 152, 219, 0.2)' : 'white',
          border: `2px solid ${group.color}`,
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '10px',
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: 'all 0.2s ease',
          opacity: isDragging ? 0.5 : 1,
          transform: isDragging ? 'scale(0.95) rotate(2deg)' : 'scale(1)',
          boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => {
          if (!isDragging) {
            e.target.style.transform = 'scale(1.02)';
            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
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
                fontWeight: 'bold'
              }}>
                {t('readyForSeating')}
              </span>
            )}
            
            {status.isFullySeated && (
              <span style={{
                fontSize: '10px',
                color: '#3498db',
                fontWeight: 'bold'
              }}>
                {t('allSeated')}
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
          gap: '5px',
          marginTop: '8px'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              releaseGroup(group.id);
            }}
            style={{
              backgroundColor: '#f39c12',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '10px',
              flex: 1
            }}
          >
            {t('releaseGroupAction')}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeGroup(group.id);
            }}
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '10px',
              flex: 1
            }}
          >
            {t('deleteGroupAction')}
          </button>
        </div>
      </div>
    );
  };

  if (!isExpanded) {
    return (
      <div style={{
        position: 'fixed',
        top: '70px',
        right: '20px',
        zIndex: 100,
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '15px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        minWidth: isMobile ? '150px' : '200px',
        maxWidth: isMobile ? '200px' : '300px'
      }}>
        <button
          onClick={toggleExpanded}
          style={{
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: isMobile ? '10px 8px' : '8px 12px',
            cursor: 'pointer',
            fontSize: isMobile ? '11px' : '12px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px'
          }}
        >
          👥 {t('groups')} ({readyToSeatGroups.length + fullySeatedGroups.length})
        </button>
        
        {isMobile && (
          <button
            onClick={() => dispatch({ type: actions.SET_SHOW_ADD_GROUP_MODAL, payload: true })}
            style={{
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px',
              cursor: 'pointer',
              fontSize: '11px',
              width: '100%',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px'
            }}
          >
            ➕ {t('createGroup')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '70px',
      right: isMobile ? '10px' : '20px',
      zIndex: 100,
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: isMobile ? '10px' : '15px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      minWidth: isMobile ? '200px' : '250px',
      maxWidth: isMobile ? '300px' : '350px',
      maxHeight: isMobile ? '60vh' : '70vh',
      overflow: 'auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        borderBottom: '1px solid #eee',
        paddingBottom: '10px'
      }}>
        <h3 style={{ margin: 0, fontSize: isMobile ? '14px' : '16px', color: '#333' }}>
          {t('groups')}
        </h3>
        
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          {!isMobile && (
            <button
              onClick={() => dispatch({ type: actions.SET_SHOW_ADD_GROUP_MODAL, payload: true })}
              style={{
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              ➕ {t('createGroup')}
            </button>
          )}
          
          <button
            onClick={toggleExpanded}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>
      </div>

      {readyToSeatGroups.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{
            margin: '0 0 10px 0',
            fontSize: '14px',
            color: '#27ae60',
            fontWeight: 'bold'
          }}>
            {t('readyToSeat')} ({readyToSeatGroups.length})
          </h4>
          {readyToSeatGroups.map(renderGroup)}
        </div>
      )}

      {fullySeatedGroups.length > 0 && (
        <div>
          <h4 style={{
            margin: '0 0 10px 0',
            fontSize: '14px',
            color: '#3498db',
            fontWeight: 'bold'
          }}>
            {t('seated')} ({fullySeatedGroups.length})
          </h4>
          {fullySeatedGroups.map(renderGroup)}
        </div>
      )}

      {readyToSeatGroups.length === 0 && fullySeatedGroups.length === 0 && (
        <div style={{
          textAlign: 'center',
          color: '#666',
          fontSize: '12px',
          padding: '20px'
        }}>
          {t('createFirstGroup')}
        </div>
      )}
    </div>
  );
};

export default GroupsPanel; 