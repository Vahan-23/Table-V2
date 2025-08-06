import React from 'react';
import { useSeating } from './SeatingContext';
import { useTranslations } from './useTranslations';
import { useGroups } from './useGroups';

const CreateGroupModal = () => {
  const { state, dispatch, actions } = useSeating();
  const { t } = useTranslations();
  const { addGroup, getFilteredPeople, TEST_PEOPLE } = useGroups();

  const {
    showAddGroupModal,
    newGroupName,
    groupMembers,
    newMemberName,
    searchTerm,
    usedPeople,
    windowWidth
  } = state;

  if (!showAddGroupModal) return null;

  const handleClose = () => {
    dispatch({ type: actions.RESET_MODALS });
  };

  const handleGroupNameChange = (e) => {
    dispatch({ type: actions.SET_NEW_GROUP_NAME, payload: e.target.value });
  };

  const handleMemberNameChange = (e) => {
    dispatch({ type: actions.SET_NEW_MEMBER_NAME, payload: e.target.value });
  };

  const handleSearchChange = (e) => {
    dispatch({ type: actions.SET_SEARCH_TERM, payload: e.target.value });
  };

  const handleAddMemberFromList = (personName) => {
    if (!groupMembers.includes(personName)) {
      dispatch({ type: actions.SET_GROUP_MEMBERS, payload: [...groupMembers, personName] });
      dispatch({ type: actions.SET_USED_PEOPLE, payload: [...usedPeople, personName] });
    }
  };

  const handleAddCustomMember = () => {
    if (newMemberName.trim() && !groupMembers.includes(newMemberName.trim())) {
      dispatch({ type: actions.SET_GROUP_MEMBERS, payload: [...groupMembers, newMemberName.trim()] });
      dispatch({ type: actions.SET_NEW_MEMBER_NAME, payload: '' });
    }
  };

  const handleRemoveMember = (index) => {
    const memberToRemove = groupMembers[index];
    const updatedMembers = groupMembers.filter((_, i) => i !== index);
    dispatch({ type: actions.SET_GROUP_MEMBERS, payload: updatedMembers });
    
    // Возвращаем человека в доступные, если он был из списка
    if (TEST_PEOPLE.includes(memberToRemove)) {
      dispatch({ 
        type: actions.SET_USED_PEOPLE, 
        payload: usedPeople.filter(person => person !== memberToRemove)
      });
    }
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      alert(t('enterGroupName'));
      return;
    }

    if (groupMembers.length === 0) {
      alert(t('selectAtLeastOne'));
      return;
    }

    addGroup(newGroupName.trim(), groupMembers);
    handleClose();
  };

  const filteredPeople = getFilteredPeople();
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
          <h3 style={{ margin: 0, color: '#333' }}>{t('createNewGroup')}</h3>
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

        {/* Group Name */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#333'
          }}>
            {t('groupName')}
          </label>
          <input
            type="text"
            value={newGroupName}
            onChange={handleGroupNameChange}
            placeholder={t('groupNamePlaceholder')}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Members Section */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#333'
          }}>
            {t('groupMembers')}
          </label>

          {/* Search and Add from List */}
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={t('searchByName')}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                marginBottom: '10px',
                boxSizing: 'border-box'
              }}
            />

            {filteredPeople.length > 0 && (
              <div style={{
                border: '1px solid #ddd',
                borderRadius: '4px',
                maxHeight: '150px',
                overflow: 'auto',
                padding: '10px'
              }}>
                {filteredPeople.map((person, index) => (
                  <div
                    key={index}
                    onClick={() => handleAddMemberFromList(person)}
                    style={{
                      padding: '8px',
                      border: '1px solid #eee',
                      borderRadius: '4px',
                      marginBottom: '5px',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'white';
                    }}
                  >
                    {person}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Custom Member */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}>
              <input
                type="text"
                value={newMemberName}
                onChange={handleMemberNameChange}
                placeholder={t('orEnterNamePlaceholder')}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <button
                onClick={handleAddCustomMember}
                style={{
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px 15px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  whiteSpace: 'nowrap'
                }}
              >
                {t('add')}
              </button>
            </div>
          </div>

          {/* Current Members */}
          <div>
            <h4 style={{
              margin: '0 0 10px 0',
              fontSize: '14px',
              color: '#666'
            }}>
              {t('members')} ({groupMembers.length})
            </h4>
            
            {groupMembers.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#999',
                fontSize: '12px',
                padding: '20px',
                border: '1px dashed #ddd',
                borderRadius: '4px'
              }}>
                {t('noMembersAdded')}
              </div>
            ) : (
              <div style={{
                border: '1px solid #ddd',
                borderRadius: '4px',
                maxHeight: '150px',
                overflow: 'auto',
                padding: '10px'
              }}>
                {groupMembers.map((member, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px',
                      border: '1px solid #eee',
                      borderRadius: '4px',
                      marginBottom: '5px',
                      backgroundColor: '#f9f9f9'
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>{member}</span>
                    <button
                      onClick={() => handleRemoveMember(index)}
                      style={{
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleClose}
            style={{
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {t('cancel')}
          </button>
          
          <button
            onClick={handleCreateGroup}
            style={{
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {t('createGroupBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal; 