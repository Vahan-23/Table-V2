import React from 'react';
import { useSeating } from './SeatingContext';
import { useTranslations } from './useTranslations';
import { useGroups } from './useGroups';
import { useTables } from './useTables';

const PersonModal = () => {
  const { state, dispatch, actions } = useSeating();
  const { t } = useTranslations();
  const { getFilteredPeopleForPerson } = useGroups();
  const { savePerson, removePerson } = useTables();

  const {
    showPersonModal,
    selectedChair,
    personName,
    selectedGroup,
    selectedPersonFromGroup,
    personSearchTerm,
    showPersonSearch
  } = state;

  if (!showPersonModal || !selectedChair) return null;

  const handleClose = () => {
    dispatch({ type: actions.RESET_MODALS });
  };

  const handlePersonNameChange = (e) => {
    dispatch({ type: actions.SET_PERSON_NAME, payload: e.target.value });
  };

  const handleGroupChange = (e) => {
    dispatch({ type: actions.SET_SELECTED_GROUP, payload: e.target.value });
  };

  const handlePersonSearchChange = (e) => {
    dispatch({ type: actions.SET_PERSON_SEARCH_TERM, payload: e.target.value });
  };

  const handlePersonFromGroupSelect = (personData) => {
    dispatch({ type: actions.SET_SELECTED_PERSON_FROM_GROUP, payload: personData });
    dispatch({ type: actions.SET_PERSON_NAME, payload: personData.name });
    dispatch({ type: actions.SET_SELECTED_GROUP, payload: personData.groupId });
    dispatch({ type: actions.SET_SHOW_PERSON_SEARCH, payload: false });
  };

  const handleSave = () => {
    savePerson();
  };

  const handleRemove = () => {
    removePerson();
  };

  const filteredPeople = getFilteredPeopleForPerson();

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
        maxWidth: '400px',
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
           <h3 style={{ margin: 0, color: '#333' }}>{t('guestName')}</h3>
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

         {/* Статистика по людям */}
         {/* <div style={{
           marginBottom: '20px',
           padding: '15px',
           backgroundColor: '#f8f9fa',
           borderRadius: '8px',
           border: '1px solid #e9ecef'
         }}>
           <h4 style={{
             margin: '0 0 10px 0',
             color: '#495057',
             fontSize: '14px',
             fontWeight: 'bold'
           }}>
             📊 {t('statistics')}
           </h4>
           <div style={{
             display: 'flex',
             justifyContent: 'space-between',
             gap: '10px'
           }}>
             <div style={{
               textAlign: 'center',
               flex: 1,
               padding: '8px',
               backgroundColor: '#e3f2fd',
               borderRadius: '6px',
               border: '1px solid #2196f3'
             }}>
                               <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#1976d2'
                }}>
                  {state.groups?.reduce((total, group) => total + (group.people?.length || 0), 0) || 0}
                </div>
               <div style={{
                 fontSize: '11px',
                 color: '#666',
                 marginTop: '2px'
               }}>
                 {t('totalPeople')}
               </div>
             </div>
             <div style={{
               textAlign: 'center',
               flex: 1,
               padding: '8px',
               backgroundColor: '#e8f5e8',
               borderRadius: '6px',
               border: '1px solid #4caf50'
             }}>
               <div style={{
                 fontSize: '18px',
                 fontWeight: 'bold',
                 color: '#2e7d32'
               }}>
                 {state.hallData?.tables?.reduce((total, table) => {
                   return total + (table.people?.filter(person => person).length || 0);
                 }, 0) || 0}
               </div>
               <div style={{
                 fontSize: '11px',
                 color: '#666',
                 marginTop: '2px'
               }}>
                 {t('seatedPeople')}
               </div>
             </div>
             <div style={{
               textAlign: 'center',
               flex: 1,
               padding: '8px',
               backgroundColor: '#fff3e0',
               borderRadius: '6px',
               border: '1px solid #ff9800'
             }}>
                               <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#f57c00'
                }}>
                  {(state.groups?.reduce((total, group) => total + (group.people?.length || 0), 0) || 0) - 
                   (state.hallData?.tables?.reduce((total, table) => {
                     return total + (table.people?.filter(person => person).length || 0);
                   }, 0) || 0)}
                </div>
               <div style={{
                 fontSize: '11px',
                 color: '#666',
                 marginTop: '2px'
               }}>
                 {t('availablePeople')}
               </div>
             </div>
           </div>
         </div> */}

        {/* Секция для ввода имени и выбора группы - ОТКЛЮЧЕНА
        <div style={{ 
          marginBottom: '15px',
          border: '2px solid #3498db',
          borderRadius: '8px',
          padding: '15px',
          backgroundColor: '#f8f9fa'
        }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#2c3e50',
            fontSize: '16px'
          }}>
            ✏️ {t('enterName')}
          </label>
          <input
            type="text"
            value={personName}
            onChange={handlePersonNameChange}
            placeholder={t('enterName')}
            autoFocus
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #3498db',
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box',
              backgroundColor: 'white',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#2980b9';
              e.target.style.boxShadow = '0 0 8px rgba(52, 152, 219, 0.3)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#3498db';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            marginBottom: '5px',
            fontWeight: 'bold',
            color: '#333'
          }}>
            {t('group')}
          </label>
          <select
            value={selectedGroup}
            onChange={handleGroupChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          >
            <option value="">{t('noGroup')}</option>
            {state.groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
        */}

        <div style={{ marginBottom: '20px' }}>
          {/* Кнопка "Выбрать из групп" - ОТКЛЮЧЕНА
          <button
            onClick={() => dispatch({ type: actions.SET_SHOW_PERSON_SEARCH, payload: !showPersonSearch })}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              marginBottom: '10px'
            }}
          >
            {t('selectFromGroups')}
          </button>
          */}

          {/* Список людей всегда видим */}
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '10px',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            <input
              type="text"
              value={personSearchTerm}
              onChange={handlePersonSearchChange}
              placeholder={t('searchByName')}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px',
                marginBottom: '10px',
                boxSizing: 'border-box'
              }}
            />
            
            {filteredPeople.length > 0 ? (
              <div>
                {filteredPeople.map((person, index) => (
                  <div
                    key={index}
                    onClick={() => handlePersonFromGroupSelect(person)}
                    style={{
                      padding: '8px',
                      border: '1px solid #eee',
                      borderRadius: '4px',
                      marginBottom: '5px',
                      cursor: 'pointer',
                      backgroundColor: selectedPersonFromGroup?.name === person.name ? '#e3f2fd' : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = selectedPersonFromGroup?.name === person.name ? '#e3f2fd' : 'white';
                    }}
                  >
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: person.groupColor || '#95a5a6'
                    }} />
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                      {person.name}
                    </span>
                    <span style={{ fontSize: '10px', color: '#666' }}>
                      ({person.groupName})
                    </span>
                    <span style={{ fontSize: '10px', color: '#27ae60', marginLeft: 'auto' }}>
                      ✅
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#666',
                fontSize: '12px',
                padding: '20px'
              }}>
                {personSearchTerm ? t('noOneFound') : t('allPeopleUsed')}
              </div>
            )}
          </div>
        </div>

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
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {t('cancel')}
          </button>
          
          {selectedChair && state.hallData?.tables?.find(t => t.id === selectedChair.tableId)?.people?.[selectedChair.chairIndex] && (
            <button
              onClick={handleRemove}
              style={{
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 20px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {t('removeGuest')}
            </button>
          )}
          
          <button
            onClick={handleSave}
            style={{
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonModal; 