import React, { useState } from 'react';
import { useSeating } from './SeatingContext';
import { useTranslations } from './useTranslations';
import { useTables } from './useTables';

const SeatingModal = () => {
  const { state, dispatch, actions } = useSeating();
  const { t } = useTranslations();
  const { seatGroupAtTable } = useTables();
  
  const {
    showSeatingModal,
    selectedGroupForSeating,
    targetTableForSeating,
    availableSeatsForSeating
  } = state;

  const [selectedPeople, setSelectedPeople] = useState([]);

  console.log('SeatingModal render:', {
    showSeatingModal,
    selectedGroupForSeating,
    targetTableForSeating,
    availableSeatsForSeating,
    group: state.groups.find(g => g.id === selectedGroupForSeating)
  });

  if (!showSeatingModal || !selectedGroupForSeating) return null;

  const group = state.groups.find(g => g.id === selectedGroupForSeating);
  if (!group) return null;

  const handleClose = () => {
    dispatch({ type: actions.RESET_MODALS });
    setSelectedPeople([]);
  };

  const handlePersonToggle = (personName) => {
    setSelectedPeople(prev => {
      if (prev.includes(personName)) {
        return prev.filter(name => name !== personName);
      } else {
        if (prev.length < availableSeatsForSeating) {
          return [...prev, personName];
        }
        return prev;
      }
    });
  };

  const handleConfirm = () => {
    if (selectedPeople.length === 0) {
      alert('Выберите хотя бы одного человека!');
      return;
    }

    seatGroupAtTable(selectedGroupForSeating, targetTableForSeating, selectedPeople);
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
          <h3 style={{ margin: 0, color: '#333' }}>
            🪑 {t('selectPeopleForSeating')}
          </h3>
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

        {/* Информация о группе и доступных местах */}
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#e8f5e8',
          borderRadius: '8px',
          border: '1px solid #4caf50'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>Группа:</strong> {group.name}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Всего людей в группе:</strong> {group.members.length}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Нерассаженных людей:</strong> {(() => {
              const seatedPeople = [];
              state.hallData?.tables?.forEach(table => {
                if (table.people) {
                  table.people.forEach(person => {
                    if (person && person.groupId === selectedGroupForSeating) {
                      seatedPeople.push(person.name);
                    }
                  });
                }
              });
              return group.members.filter(member => !seatedPeople.includes(member)).length;
            })()}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Доступно мест за столом:</strong> {availableSeatsForSeating}
          </div>
          <div style={{
            padding: '8px',
            backgroundColor: '#fff3cd',
            borderRadius: '4px',
            border: '1px solid #ffeaa7',
            fontSize: '14px'
          }}>
            ⚠️ Выберите до {availableSeatsForSeating} человек для рассадки
          </div>
        </div>

        {/* Список людей для выбора */}
        <div style={{
          marginBottom: '20px',
          maxHeight: '300px',
          overflow: 'auto',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '10px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
            padding: '0 5px'
          }}>
            <span style={{ fontWeight: 'bold' }}>Выбрано: {selectedPeople.length}/{availableSeatsForSeating}</span>
            {selectedPeople.length > 0 && (
              <button
                onClick={() => setSelectedPeople([])}
                style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Очистить
              </button>
            )}
          </div>
          
                     {/* Получаем только нерассаженных людей из группы */}
                     {(() => {
                       const seatedPeople = [];
                       state.hallData?.tables?.forEach(table => {
                         if (table.people) {
                           table.people.forEach(person => {
                             if (person && person.groupId === selectedGroupForSeating) {
                               seatedPeople.push(person.name);
                             }
                           });
                         }
                       });
                       
                       const unseatedPeople = group.members.filter(member => !seatedPeople.includes(member));
                       
                       return unseatedPeople.map((person, index) => {
                         const isSelected = selectedPeople.includes(person);
                         
                         // Человек "красный" только если он не выбран И уже выбрано максимальное количество людей
                         const isOverLimit = !isSelected && selectedPeople.length >= availableSeatsForSeating;
            
            return (
              <div
                key={index}
                onClick={() => handlePersonToggle(person)}
                style={{
                  padding: '10px',
                  border: isOverLimit ? '1px solid #e74c3c' : '1px solid #eee',
                  borderRadius: '4px',
                  marginBottom: '5px',
                  cursor: isOverLimit ? 'not-allowed' : 'pointer',
                  backgroundColor: isSelected ? '#e3f2fd' : isOverLimit ? '#ffebee' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s ease',
                  opacity: isOverLimit ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !isOverLimit) {
                    e.target.style.backgroundColor = '#f5f5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !isOverLimit) {
                    e.target.style.backgroundColor = 'white';
                  }
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: isSelected ? '#2196f3' : isOverLimit ? '#e74c3c' : '#ddd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {isSelected ? '✓' : isOverLimit ? '✗' : ''}
                </div>
                <span style={{ 
                  fontSize: '14px',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  color: isOverLimit ? '#e74c3c' : 'inherit'
                }}>
                                     {person}
                   {isOverLimit && (
                     <span style={{
                       fontSize: '11px',
                       color: '#e74c3c',
                       marginLeft: '8px',
                       fontStyle: 'italic'
                     }}>
                       ({t('willNotFit')})
                     </span>
                   )}
                </span>
              </div>
            );
          });
        })()}
        </div>

        {/* Кнопки действий */}
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
          
          <button
            onClick={handleConfirm}
            disabled={selectedPeople.length === 0}
            style={{
              backgroundColor: selectedPeople.length === 0 ? '#bdc3c7' : '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '10px 20px',
              cursor: selectedPeople.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            {t('seatSelectedPeople')} ({selectedPeople.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatingModal; 