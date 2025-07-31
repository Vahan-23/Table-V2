import React, { useState, useRef, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import CollapsiblePanel from './CollapsiblePanel';
import './GroupsPanel.css';

// Модальное окно для управления группой
const GroupManagementModal = ({ group, groupName, onClose, onUpdateGroup, onRemovePerson }) => {
  const [groupMembers, setGroupMembers] = useState([...group]);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');

  const handleRemoveMember = (memberName) => {
    const updatedGroupMembers = groupMembers.filter(
      member => member.name !== memberName
    );
    setGroupMembers(updatedGroupMembers);
    if (onRemovePerson) {
      onRemovePerson(memberName, groupName);
    }
  };

  const handleAddNewPerson = () => {
    if (!newPersonName.trim()) return;
    
    if (groupMembers.some(p => p.name === newPersonName)) {
      alert('Участник с таким именем уже существует в этой группе!');
      return;
    }
    
    const newPerson = {
      name: newPersonName,
      group: groupName
    };
    
    setGroupMembers([...groupMembers, newPerson]);
    setNewPersonName('');
    setShowAddSection(false);
  };

  const handleSaveChanges = () => {
    if (onUpdateGroup) {
      onUpdateGroup(groupName, groupMembers);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Управление группой: {groupName}</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        
        <div className="modal-body">
          <div className="members-section">
            <h4>Участники группы ({groupMembers.length})</h4>
            <div className="members-list">
              {groupMembers.length > 0 ? (
                groupMembers.map((member, index) => (
                  <div key={index} className="member-item">
                    <span>{member.name}</span>
                    <button
                      onClick={() => handleRemoveMember(member.name)}
                      className="remove-button"
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-message">
                  В этой группе пока нет участников
                </div>
              )}
            </div>
          </div>
          
          <div className="add-member-section">
            {showAddSection ? (
              <div className="add-form">
                <div className="form-group">
                  <input
                    type="text"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    placeholder="Введите имя нового участника"
                    className="form-input"
                  />
                </div>
                <div className="form-buttons">
                  <button
                    onClick={handleAddNewPerson}
                    disabled={!newPersonName.trim()}
                    className={`add-button ${!newPersonName.trim() ? 'disabled' : ''}`}
                  >
                    Добавить
                  </button>
                  <button
                    onClick={() => {
                      setShowAddSection(false);
                      setNewPersonName('');
                    }}
                    className="cancel-button"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddSection(true)}
                className="show-add-button"
              >
                + Добавить нового участника
              </button>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button
            onClick={handleSaveChanges}
            className="save-button"
          >
            Сохранить изменения
          </button>
          <button
            onClick={onClose}
            className="cancel-button"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

// Компонент для группы, которую можно перетаскивать
const DraggableGroup = ({ group, groupName, setDraggingGroup, people, setPeople, onDragStart }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'GROUP',
    item: () => {
      console.log("Drag started for group:", groupName);
      
      // Вызываем функцию закрытия панелей при начале перетаскивания
      if (onDragStart) {
        onDragStart();
      }
      
      setDraggingGroup(group);
      return { group, groupName, isPlaced: false };
    },
    end: (item, monitor) => {
      console.log("Drag ended for group:", groupName);
      setDraggingGroup(null);
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Обработчик клика для открытия модального окна
  const handleClick = (e) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  // Обработчик закрытия модального окна
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Обновление группы
  const handleUpdateGroup = (groupName, updatedMembers) => {
    if (setPeople && typeof setPeople === 'function') {
      setPeople(prevPeople => {
        // Удаляем всех участников группы
        const peopleWithoutGroup = prevPeople.filter(
          person => person.group !== groupName
        );
        
        // Добавляем обновленных участников
        return [...peopleWithoutGroup, ...updatedMembers];
      });
    }
  };

  // Удаление участника группы
  const handleRemovePerson = (personName, groupName) => {
    if (setPeople && typeof setPeople === 'function') {
      setPeople(prevPeople => 
        prevPeople.filter(person => 
          !(person.name === personName && person.group === groupName)
        )
      );
    }
  };

  return (
    <>
      <div
        ref={drag}
        className={`group-item ${isDragging ? 'dragging' : ''}`}
        onClick={handleClick}
      >
        <div className="group-name">Группа {groupName}</div>
        <div className="group-count">{group.length} чел.</div>
      </div>

      {isModalOpen && (
        <GroupManagementModal
          group={group}
          groupName={groupName}
          onClose={handleCloseModal}
          onUpdateGroup={handleUpdateGroup}
          onRemovePerson={handleRemovePerson}
        />
      )}
    </>
  );
};

// Основной компонент панели групп
const GroupsPanel = ({ groups, setDraggingGroup, createTablesForAllGroups, updateGroups, onDragStart }) => {
  // Состояние для отслеживания раскрытых панелей
  const [isGroupsPanelExpanded, setIsGroupsPanelExpanded] = useState(true);
  
  // Реф для панели групп
  const groupsPanelRef = useRef(null);
  
  // Сортируем группы по имени для более удобного отображения
  const sortedGroups = React.useMemo(() => {
    if (!groups || !Array.isArray(groups) || groups.length === 0) {
      return {};
    }
    
    const groupedPeople = groups.reduce((acc, person) => {
      if (!acc[person.group]) acc[person.group] = [];
      acc[person.group].push(person);
      return acc;
    }, {});
    
    return Object.entries(groupedPeople)
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce((acc, [groupName, people]) => {
        acc[groupName] = people;
        return acc;
      }, {});
  }, [groups]);
  
  // Функция для закрытия панели
  const closePanels = () => {
    setIsGroupsPanelExpanded(false);
  };
  
  // Обработчик клика вне панели
  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (groupsPanelRef.current && !groupsPanelRef.current.contains(event.target)) {
  //       closePanels();
  //     }
  //   };
    
  //   document.addEventListener('mousedown', handleClickOutside);
    
  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, []);
  
  // Функция, которая будет вызываться при начале перетаскивания
  const handleDragStart = () => {
    closePanels();
    // Если передана внешняя функция onDragStart, вызываем её
    if (onDragStart) {
      onDragStart();
    }
  };
  
  // Обработчик изменения состояния панели
  const handlePanelToggle = (isExpanded) => {
    setIsGroupsPanelExpanded(isExpanded);
  };

  return (
    <div className="groups-panel" ref={groupsPanelRef}>
      <CollapsiblePanel 
        title="Группы" 
        defaultExpanded={false}
        expanded={isGroupsPanelExpanded}
        onToggle={handlePanelToggle}
      >
        <div className="groups-panel-content">
          {Object.keys(sortedGroups).length > 0 ? (
            <div className="groups-list">
              {Object.entries(sortedGroups).map(([groupName, groupMembers], index) => (
                <DraggableGroup
                  key={`group-${groupName}-${index}`}
                  group={groupMembers}
                  groupName={groupName}
                  setDraggingGroup={setDraggingGroup}
                  people={groups}
                  setPeople={updateGroups}
                  // onDragStart={handleDragStart}
                />
              ))}
            </div>
          ) : (
            <div className="no-groups-message">
              Нет доступных групп
            </div>
          )}
          
          <div className="groups-actions">
            <button
              className="auto-place-button"
              onClick={createTablesForAllGroups}
            >
              Автоматически разместить группы
            </button>
          </div>
        </div>
      </CollapsiblePanel>
    </div>
  );
};

export default GroupsPanel;