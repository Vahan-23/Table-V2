import React, { useState, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './MobileSeating.css';

// Multi-backend setup to support both touch and mouse
const MultiBackend = ({ children }) => {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return (
    <DndProvider backend={isTouchDevice ? TouchBackend : HTML5Backend}>
      {children}
    </DndProvider>
  );
};

const MobileSeatingArrangement = ({ initialTables = [], initialPeople = [], initialHalls = [] }) => {
  // State management
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState('hall'); // 'hall', 'people', 'tables', 'groups'
  const [tables, setTables] = useState(initialTables);
  const [people, setPeople] = useState(initialPeople);
  const [halls, setHalls] = useState(initialHalls);
  const [currentHall, setCurrentHall] = useState(null);
  const [zoom, setZoom] = useState(0.5); // Start with higher zoom for mobile
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [isTableDetailsOpen, setIsTableDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [peopleInput, setPeopleInput] = useState('');
  const [groupInput, setGroupInput] = useState('');
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [chairCount, setChairCount] = useState(8); // Default for mobile
  const [tableCount, setTableCount] = useState(1);
  const [showHallModal, setShowHallModal] = useState(false);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [showChairAssignModal, setShowChairAssignModal] = useState(false);
  const [selectedChairIndex, setSelectedChairIndex] = useState(null);
  
  // Refs
  const tablesAreaRef = useRef(null);
  const groupDropdownRef = useRef(null);
  const initialTouchDistance = useRef(null);
  const mobileMenuRef = useRef(null);
  
  // Effect to handle click outside to close mobile menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    }
    
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileMenuOpen]);
  
  // Effect to handle click outside to close group dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(event.target)) {
        setShowGroupDropdown(false);
      }
    }
    
    if (showGroupDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showGroupDropdown]);
  
  // Load data from localStorage
  useEffect(() => {
    const savedTables = JSON.parse(localStorage.getItem('tables'));
    if (savedTables && savedTables.length) setTables(savedTables);
    
    const savedPeople = JSON.parse(localStorage.getItem('people'));
    if (savedPeople && savedPeople.length) setPeople(savedPeople);
    
    const savedHalls = JSON.parse(localStorage.getItem('halls'));
    if (savedHalls && savedHalls.length) {
      setHalls(savedHalls);
      // Set current hall to the first hall if available
      if (savedHalls.length > 0 && !currentHall) {
        setCurrentHall(savedHalls[0]);
        setTables(savedHalls[0].tables || []);
      }
    }
  }, []);
  
  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('tables', JSON.stringify(tables));
  }, [tables]);
  
  useEffect(() => {
    localStorage.setItem('people', JSON.stringify(people));
  }, [people]);
  
  useEffect(() => {
    localStorage.setItem('halls', JSON.stringify(halls));
  }, [halls]);
  
  // Touch handlers for pinch-to-zoom
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Calculate initial distance between two fingers
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialTouchDistance.current = Math.sqrt(dx * dx + dy * dy);
    }
  };
  
  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && initialTouchDistance.current !== null) {
      e.preventDefault(); // Prevent default scrolling
      
      // Calculate new distance
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDistance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate zoom factor
      const scale = newDistance / initialTouchDistance.current;
      
      // Update zoom with limits
      const newZoom = Math.min(Math.max(zoom * scale, 0.3), 1.5);
      setZoom(newZoom);
      
      // Update initial distance for continuous zooming
      initialTouchDistance.current = newDistance;
    }
  };
  
  const handleTouchEnd = () => {
    initialTouchDistance.current = null;
  };
  
  // Drag handlers for panning the view
  const isDraggingView = useRef(false);
  const lastTouchPosition = useRef({ x: 0, y: 0 });
  
  const handleTouchStartDrag = (e) => {
    if (e.touches.length === 1) {
      isDraggingView.current = true;
      lastTouchPosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  };
  
  const handleTouchMoveDrag = (e) => {
    if (e.touches.length === 1 && isDraggingView.current && tablesAreaRef.current) {
      const deltaX = e.touches[0].clientX - lastTouchPosition.current.x;
      const deltaY = e.touches[0].clientY - lastTouchPosition.current.y;
      
      tablesAreaRef.current.scrollLeft -= deltaX;
      tablesAreaRef.current.scrollTop -= deltaY;
      
      lastTouchPosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  };
  
  const handleTouchEndDrag = () => {
    isDraggingView.current = false;
  };
  
  // Function to get existing groups
  const getExistingGroups = () => {
    const groups = people.map(person => person.group);
    return [...new Set(groups)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  };
  
  // Function to get people not seated at tables
  const getAvailablePeople = () => {
    return people.filter((person) => {
      return !tables.some((table) =>
        table.people.some((tablePerson) =>
          tablePerson && tablePerson.name === person.name
        )
      );
    });
  };
  
  // Function to filter people based on search query
  const getFilteredPeople = () => {
    if (!searchQuery) return getAvailablePeople();
    
    return getAvailablePeople().filter(person => 
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.group.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  // Add person handler
  const handleAddPerson = () => {
    if (peopleInput && groupInput) {
      const newPerson = { name: peopleInput, group: groupInput };
      setPeople([...people, newPerson]);
      setPeopleInput('');
      setShowAddPersonModal(false);
    } else {
      alert('Пожалуйста, заполните все поля.');
    }
  };
  
  // Delete person handler
  const handleDeletePerson = (personName) => {
    setPeople(people.filter((person) => person.name !== personName));
  };
  
  // Add table handler
  const handleAddTable = () => {
    const newTable = {
      id: Date.now(),
      people: Array(chairCount).fill(null),
      chairCount,
      x: 20,
      y: (tables.length * 320) + 20, // Position tables vertically for better mobile view
      width: 300,
      height: 300
    };
    
    setTables([...tables, newTable]);
  };
  
  // Delete table handler
  const handleDeleteTable = (tableId) => {
    if (window.confirm('Уверены что хотите удалить этот стол?')) {
      setTables((prevTables) => {
        const tableToRemove = prevTables.find((t) => t.id === tableId);
        
        if (tableToRemove) {
          setPeople((prevPeople) => {
            const peopleToReturn = tableToRemove.people.filter((p) => p && p.name);
            
            const newPeople = [...prevPeople];
            peopleToReturn.forEach((person) => {
              if (person && !newPeople.some((p) => p.name === person.name)) {
                newPeople.push(person);
              }
            });
            return newPeople;
          });
        }
        
        return prevTables.filter((t) => t.id !== tableId);
      });
      
      // Close details if this table was selected
      if (selectedTableId === tableId) {
        setIsTableDetailsOpen(false);
        setSelectedTableId(null);
      }
    }
  };
  
  // Chair assignment handlers
  const handleChairClick = (tableId, chairIndex) => {
    setSelectedTableId(tableId);
    setSelectedChairIndex(chairIndex);
    setShowChairAssignModal(true);
  };
  
  const handleAssignPerson = (person) => {
    if (selectedTableId && selectedChairIndex !== null) {
      setTables((prevTables) => {
        return prevTables.map(table => {
          if (table.id === selectedTableId) {
            const newPeople = [...table.people];
            newPeople[selectedChairIndex] = person;
            return { ...table, people: newPeople };
          }
          return table;
        });
      });
      
      // Remove person from available people
      setPeople((prevPeople) => prevPeople.filter(p => p.name !== person.name));
      
      setShowChairAssignModal(false);
      setSelectedTableId(null);
      setSelectedChairIndex(null);
    }
  };
  
  const handleRemovePersonFromChair = () => {
    if (selectedTableId && selectedChairIndex !== null) {
      setTables((prevTables) => {
        return prevTables.map(table => {
          if (table.id === selectedTableId) {
            const person = table.people[selectedChairIndex];
            if (person) {
              // Add person back to available people
              setPeople((prevPeople) => {
                if (!prevPeople.some(p => p.name === person.name)) {
                  return [...prevPeople, person];
                }
                return prevPeople;
              });
              
              // Remove from chair
              const newPeople = [...table.people];
              newPeople[selectedChairIndex] = null;
              return { ...table, people: newPeople };
            }
          }
          return table;
        });
      });
      
      setShowChairAssignModal(false);
      setSelectedTableId(null);
      setSelectedChairIndex(null);
    }
  };
  
  // Hall management
  const handleCreateNewHall = (name) => {
    if (!name.trim()) {
      alert('Пожалуйста, введите название зала');
      return;
    }
    
    const newHall = {
      id: Date.now(),
      name: name.trim(),
      tables: []
    };
    
    setHalls([...halls, newHall]);
    setCurrentHall(newHall);
    setTables([]);
    setShowHallModal(false);
  };
  
  const handleSaveHall = () => {
    if (!currentHall) {
      alert('Пожалуйста, сначала выберите зал');
      return;
    }
    
    const updatedHalls = halls.map(hall =>
      hall.id === currentHall.id
        ? { ...hall, tables: tables }
        : hall
    );
    
    setHalls(updatedHalls);
    localStorage.setItem('halls', JSON.stringify(updatedHalls));
    alert(`Зал "${currentHall.name}" успешно сохранен`);
  };
  
  const handleLoadHall = (hallId) => {
    const hall = halls.find(h => h.id === hallId);
    if (hall) {
      setCurrentHall(hall);
      setTables(hall.tables || []);
    }
  };
  
  const handleDeleteHall = (hallId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот зал?')) {
      const updatedHalls = halls.filter(hall => hall.id !== hallId);
      setHalls(updatedHalls);
      
      // If current hall is deleted, reset current hall
      if (currentHall && currentHall.id === hallId) {
        setCurrentHall(null);
        setTables([]);
      }
    }
  };
  
  // Add multiple tables
  const handleAddMultipleTables = () => {
    const newTables = [];
    const startY = tables.length > 0 
      ? Math.max(...tables.map(t => t.y + t.height)) + 20 
      : 20;
    
    for (let i = 0; i < tableCount; i++) {
      newTables.push({
        id: Date.now() + i,
        people: Array(chairCount).fill(null),
        chairCount,
        x: 20,
        y: startY + (i * 320), // Stack vertically for mobile
        width: 300,
        height: 300
      });
    }
    
    setTables([...tables, ...newTables]);
  };
  
  // Auto-seat groups
  const handleAutoSeatGroups = () => {
    const unseatedPeople = getAvailablePeople();
    if (unseatedPeople.length === 0) {
      alert('Нет доступных людей для рассадки');
      return;
    }
    
    if (tables.length === 0) {
      alert('Сначала добавьте столы');
      return;
    }
    
    // Group people by their group
    const groupedPeople = unseatedPeople.reduce((acc, person) => {
      if (!acc[person.group]) acc[person.group] = [];
      acc[person.group].push(person);
      return acc;
    }, {});
    
    // Updated tables array
    const updatedTables = [...tables];
    let anyGroupsSeated = false;
    
    // Try to seat each group
    Object.values(groupedPeople).forEach(group => {
      if (group.length === 0) return;
      
      // Find tables with enough free seats
      for (const table of updatedTables) {
        const emptySeats = table.people.filter(p => p === null).length;
        
        if (emptySeats >= group.length) {
          // This table has enough space for the group
          const newPeople = [...table.people];
          let seatedCount = 0;
          
          // Place people in empty chairs
          for (let i = 0; i < newPeople.length && seatedCount < group.length; i++) {
            if (newPeople[i] === null) {
              newPeople[i] = group[seatedCount];
              seatedCount++;
            }
          }
          
          // Update the table
          table.people = newPeople;
          anyGroupsSeated = true;
          
          // Remove seated people from available people
          setPeople(prevPeople => 
            prevPeople.filter(person => 
              !group.some(seatedPerson => seatedPerson.name === person.name)
            )
          );
          
          break; // Move to next group
        }
      }
    });
    
    if (anyGroupsSeated) {
      setTables(updatedTables);
    } else {
      alert('Не удалось разместить группы - не хватает свободных мест');
    }
  };
  
  // Scroll to table (for mobile navigation)
  const scrollToTable = (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (table && tablesAreaRef.current) {
      tablesAreaRef.current.scrollLeft = 0;
      tablesAreaRef.current.scrollTop = table.y * zoom;
      
      // Highlight the table
      setSelectedTableId(tableId);
      setTimeout(() => {
        const tableElement = document.querySelector(`.mobile-table[data-id="${tableId}"]`);
        if (tableElement) {
          tableElement.classList.add('highlight-pulse');
          setTimeout(() => {
            tableElement.classList.remove('highlight-pulse');
          }, 1500);
        }
      }, 100);
    }
  };
  
  // Table Component for Mobile
  const MobileTable = ({ table }) => {
    const occupiedSeats = table.people.filter(Boolean).length;
    const isSelected = selectedTableId === table.id;
    
    return (
      <div 
        className={`mobile-table ${isSelected ? 'mobile-table-selected' : ''}`}
        data-id={table.id}
        style={{
          position: 'absolute',
          left: `${table.x}px`,
          top: `${table.y}px`,
          width: `${table.width}px`,
          height: `${table.height}px`
        }}
      >
        <div className="mobile-table-header">
          <h3>Стол {table.id}</h3>
          <div className="mobile-table-stats">
            <span>{occupiedSeats}/{table.chairCount}</span>
          </div>
          <div className="mobile-table-actions">
            <button 
              className="mobile-table-info-btn" 
              onClick={() => {
                setSelectedTableId(table.id);
                setIsTableDetailsOpen(true);
              }}
            >
              i
            </button>
            <button 
              className="mobile-table-delete-btn" 
              onClick={() => handleDeleteTable(table.id)}
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="mobile-table-body">
          <div className="mobile-chairs-grid">
            {table.people.map((person, index) => (
              <div 
                key={index}
                className={`mobile-chair ${person ? 'occupied' : 'empty'}`}
                onClick={() => handleChairClick(table.id, index)}
              >
                {person ? (
                  <div className="mobile-chair-person">
                    <span className="mobile-chair-name">{person.name}</span>
                    <span className="mobile-chair-group">Группа {person.group}</span>
                  </div>
                ) : (
                  <div className="mobile-chair-empty">
                    <span>Пусто</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // Hall View
  const MobileHallView = () => {
    return (
      <div className="mobile-hall-view">
        <div className="mobile-hall-header">
          <h2>{currentHall ? currentHall.name : 'Зал не выбран'}</h2>
          <div className="mobile-hall-actions">
            <button 
              className="mobile-action-btn" 
              onClick={() => setActiveView('tables')}
            >
              Управление столами
            </button>
          </div>
        </div>
        
        <div className="mobile-table-quick-nav">
          <select 
            value={selectedTableId || ''}
            onChange={(e) => scrollToTable(parseInt(e.target.value))}
            className="mobile-table-select"
          >
            <option value="">Перейти к столу...</option>
            {tables.map(table => (
              <option key={table.id} value={table.id}>
                Стол {table.id} ({table.people.filter(Boolean).length}/{table.chairCount})
              </option>
            ))}
          </select>
        </div>
        
        <div className="mobile-zoom-controls">
          <button 
            className="mobile-zoom-btn"
            onClick={() => setZoom(Math.max(0.3, zoom - 0.1))}
          >−</button>
          <span className="mobile-zoom-level">{Math.round(zoom * 100)}%</span>
          <button 
            className="mobile-zoom-btn"
            onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
          >+</button>
        </div>
        
        <div 
          className="mobile-tables-area"
          ref={tablesAreaRef}
          onTouchStart={(e) => {
            handleTouchStart(e);
            handleTouchStartDrag(e);
          }}
          onTouchMove={(e) => {
            handleTouchMove(e);
            handleTouchMoveDrag(e);
          }}
          onTouchEnd={() => {
            handleTouchEnd();
            handleTouchEndDrag();
          }}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left'
          }}
        >
          {tables.map(table => (
            <MobileTable key={table.id} table={table} />
          ))}
        </div>
      </div>
    );
  };
  
  // People View
  const MobilePeopleView = () => {
    const filteredPeople = getFilteredPeople();
    
    return (
      <div className="mobile-people-view">
        <div className="mobile-people-header">
          <h2>Управление гостями</h2>
          <div className="mobile-people-actions">
            <button 
              className="mobile-action-btn"
              onClick={() => setShowAddPersonModal(true)}
            >
              + Добавить гостя
            </button>
          </div>
        </div>
        
        <div className="mobile-people-search">
          <input
            type="text"
            placeholder="Поиск по имени или группе..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mobile-search-input"
          />
          {searchQuery && (
            <button 
              className="mobile-clear-search"
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
        </div>
        
        <div className="mobile-people-stats">
          <div className="mobile-stat-card">
            <span className="mobile-stat-value">{people.length}</span>
            <span className="mobile-stat-label">Всего гостей</span>
          </div>
          <div className="mobile-stat-card">
            <span className="mobile-stat-value">{getAvailablePeople().length}</span>
            <span className="mobile-stat-label">Без мест</span>
          </div>
          <div className="mobile-stat-card">
            <span className="mobile-stat-value">{getExistingGroups().length}</span>
            <span className="mobile-stat-label">Групп</span>
          </div>
        </div>
        
        <div className="mobile-people-list">
          {filteredPeople.length > 0 ? (
            filteredPeople.map(person => (
              <div key={person.name} className="mobile-person-card">
                <div className="mobile-person-info">
                  <div className="mobile-person-name">{person.name}</div>
                  <div className="mobile-person-group">Группа {person.group}</div>
                </div>
                <div className="mobile-person-actions">
                  <button 
                    className="mobile-person-delete-btn"
                    onClick={() => handleDeletePerson(person.name)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="mobile-empty-message">
              {searchQuery ? 'Ничего не найдено' : 'Нет доступных гостей'}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Tables View
  const MobileTablesView = () => {
    return (
      <div className="mobile-tables-view">
        <div className="mobile-tables-header">
          <h2>Управление столами</h2>
        </div>
        
        <div className="mobile-tables-controls">
          <div className="mobile-tables-control-group">
            <label>Стульев за столом:</label>
            <div className="mobile-number-control">
              <button 
                onClick={() => setChairCount(Math.max(4, chairCount - 1))}
              >−</button>
              <input 
                type="number" 
                value={chairCount}
                onChange={(e) => setChairCount(Math.max(4, parseInt(e.target.value) || 4))}
                min="4"
              />
              <button 
                onClick={() => setChairCount(chairCount + 1)}
              >+</button>
            </div>
          </div>
          
          <div className="mobile-tables-control-group">
            <label>Добавить столов:</label>
            <div className="mobile-number-control">
              <button 
                onClick={() => setTableCount(Math.max(1, tableCount - 1))}
              >−</button>
              <input 
                type="number" 
                value={tableCount}
                onChange={(e) => setTableCount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
              />
              <button 
                onClick={() => setTableCount(tableCount + 1)}
              >+</button>
            </div>
          </div>
          
          <div className="mobile-tables-buttons">
            <button 
              className="mobile-primary-btn"
              onClick={handleAddMultipleTables}
            >
              Добавить {tableCount} {tableCount === 1 ? 'стол' : 'столов'}
            </button>
            
            <button 
              className="mobile-secondary-btn"
              onClick={handleAutoSeatGroups}
            >
              Авторассадка
            </button>
          </div>
        </div>
        
        <div className="mobile-tables-list">
          <h3>Существующие столы</h3>
          
          {tables.length > 0 ? (
            tables.map(table => (
              <div key={table.id} className="mobile-table-item">
                <div className="mobile-table-item-info">
                  <div className="mobile-table-item-name">Стол {table.id}</div>
                  <div className="mobile-table-item-stats">
                    {table.people.filter(Boolean).length}/{table.chairCount} мест занято
                  </div>
                </div>
                <div className="mobile-table-item-actions">
                  <button 
                    className="mobile-table-view-btn"
                    onClick={() => {
                      setActiveView('hall');
                      scrollToTable(table.id);
                    }}
                  >
                    Просмотр
                  </button>
                  <button 
                    className="mobile-table-delete-btn"
                    onClick={() => handleDeleteTable(table.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="mobile-empty-message">
              Нет столов. Добавьте новые столы выше.
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Halls View
  const MobileHallsView = () => {
    return (
      <div className="mobile-halls-view">
        <div className="mobile-halls-header">
          <h2>Управление залами</h2>
          <div className="mobile-halls-actions">
            <button 
              className="mobile-action-btn"
              onClick={() => setShowHallModal(true)}
            >
              + Новый зал
            </button>
          </div>
        </div>
        
        <div className="mobile-current-hall">
          <h3>Текущий зал</h3>
          {currentHall ? (
            <div className="mobile-current-hall-info">
              <div className="mobile-current-hall-name">{currentHall.name}</div>
              <div className="mobile-current-hall-stats">
                {tables.length} столов, {tables.reduce((acc, table) => acc + table.people.filter(Boolean).length, 0)} гостей
              </div>
              
              <button 
                className="mobile-primary-btn"
                onClick={handleSaveHall}
              >
                Сохранить изменения
              </button>
            </div>
          ) : (
            <div className="mobile-empty-message">
              Зал не выбран. Выберите зал из списка ниже или создайте новый.
            </div>
          )}
        </div>
        
        <div className="mobile-halls-list">
          <h3>Доступные залы</h3>
          
          {halls.length > 0 ? (
            halls.map(hall => (
              <div key={hall.id} className="mobile-hall-item">
                <div className="mobile-hall-item-info">
                  <div className="mobile-hall-item-name">{hall.name}</div>
                  <div className="mobile-hall-item-stats">
                    {hall.tables?.length || 0} столов
                  </div>
                </div>
                
                <div className="mobile-hall-item-actions">
                  <button 
                    className="mobile-hall-load-btn"
                    onClick={() => handleLoadHall(hall.id)}
                  >
                    Загрузить
                  </button>
                  <button 
                    className="mobile-hall-delete-btn"
                    onClick={() => handleDeleteHall(hall.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="mobile-empty-message">
              Нет доступных залов. Создайте новый зал.
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Table Details Modal
  const TableDetailsModal = () => {
    const table = tables.find(t => t.id === selectedTableId);
    if (!table) return null;
    
    // Group people by their group
    const getTableGroups = () => {
      const tablePeople = table.people.filter(Boolean);
      const groups = {};
      
      tablePeople.forEach(person => {
        if (!groups[person.group]) {
          groups[person.group] = [];
        }
        groups[person.group].push(person);
      });
      
      return Object.entries(groups).map(([groupName, people]) => ({
        groupName,
        people
      }));
    };
    
    const tableGroups = getTableGroups();
    
    // Remove group from table
    const handleRemoveGroup = (groupName) => {
      if (window.confirm(`Удалить группу ${groupName} со стола?`)) {
        // Find people with this group at the table
        const groupPeople = table.people.filter(person => person && person.group === groupName);
        
        // Update the table by removing these people
        setTables(prevTables =>
          prevTables.map(t => {
            if (t.id === table.id) {
              return {
                ...t,
                people: t.people.map(person =>
                  (person && person.group === groupName) ? null : person
                )
              };
            }
            return t;
          })
        );
        
        // Add these people back to the people list
        setPeople(prevPeople => [...prevPeople, ...groupPeople]);
      }
    };
    
    return (
      <div className="mobile-modal">
        <div className="mobile-modal-content">
          <div className="mobile-modal-header">
            <h3>Стол {table.id}</h3>
            <button 
              className="mobile-modal-close"
              onClick={() => setIsTableDetailsOpen(false)}
            >
              ×
            </button>
          </div>
          
          <div className="mobile-modal-body">
            <div className="mobile-table-stats">
              <div className="mobile-stat-row">
                <span className="mobile-stat-label">Всего стульев:</span>
                <span className="mobile-stat-value">{table.chairCount}</span>
              </div>
              <div className="mobile-stat-row">
                <span className="mobile-stat-label">Занято:</span>
                <span className="mobile-stat-value">{table.people.filter(Boolean).length}</span>
              </div>
              <div className="mobile-stat-row">
                <span className="mobile-stat-label">Свободно:</span>
                <span className="mobile-stat-value">{table.chairCount - table.people.filter(Boolean).length}</span>
              </div>
            </div>
            
            <div className="mobile-table-groups">
              <h4>Группы за столом</h4>
              
              {tableGroups.length > 0 ? (
                tableGroups.map((group, index) => (
                  <div key={index} className="mobile-table-group">
                    <div className="mobile-group-header">
                      <span className="mobile-group-name">Группа {group.groupName}</span>
                      <span className="mobile-group-count">{group.people.length} чел.</span>
                      <button 
                        className="mobile-group-remove"
                        onClick={() => handleRemoveGroup(group.groupName)}
                      >
                        Удалить
                      </button>
                    </div>
                    
                    <div className="mobile-group-people">
                      {group.people.map((person, i) => (
                        <div key={i} className="mobile-group-person">
                          {person.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="mobile-empty-message">
                  Нет групп за этим столом
                </div>
              )}
            </div>
            
            <div className="mobile-chair-management">
              <h4>Управление местами</h4>
              <button 
                className="mobile-primary-btn"
                onClick={() => {
                  setIsTableDetailsOpen(false);
                  setActiveView('hall');
                  scrollToTable(table.id);
                }}
              >
                Перейти к размещению
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // New Hall Modal
  const NewHallModal = () => {
    const [hallName, setHallName] = useState('');
    
    return (
      <div className="mobile-modal">
        <div className="mobile-modal-content">
          <div className="mobile-modal-header">
            <h3>Создать новый зал</h3>
            <button 
              className="mobile-modal-close"
              onClick={() => setShowHallModal(false)}
            >
              ×
            </button>
          </div>
          
          <div className="mobile-modal-body">
            <div className="mobile-form-group">
              <label>Название зала:</label>
              <input 
                type="text"
                value={hallName}
                onChange={(e) => setHallName(e.target.value)}
                placeholder="Например: Главный зал"
                className="mobile-form-input"
                autoFocus
              />
            </div>
            
            <div className="mobile-form-actions">
              <button 
                className="mobile-primary-btn"
                onClick={() => handleCreateNewHall(hallName)}
                disabled={!hallName.trim()}
              >
                Создать зал
              </button>
              <button 
                className="mobile-secondary-btn"
                onClick={() => setShowHallModal(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Add Person Modal
  const AddPersonModal = () => {
    return (
      <div className="mobile-modal">
        <div className="mobile-modal-content">
          <div className="mobile-modal-header">
            <h3>Добавить гостя</h3>
            <button 
              className="mobile-modal-close"
              onClick={() => setShowAddPersonModal(false)}
            >
              ×
            </button>
          </div>
          
          <div className="mobile-modal-body">
            <div className="mobile-form-group">
              <label>Имя гостя:</label>
              <input 
                type="text"
                value={peopleInput}
                onChange={(e) => setPeopleInput(e.target.value)}
                placeholder="Например: Иван Иванов"
                className="mobile-form-input"
                autoFocus
              />
            </div>
            
            <div className="mobile-form-group">
              <label>Группа:</label>
              <div className="mobile-group-selection" ref={groupDropdownRef}>
                <input 
                  type="text"
                  value={groupInput}
                  onChange={(e) => setGroupInput(e.target.value)}
                  placeholder="Номер группы"
                  className="mobile-form-input"
                  onFocus={() => setShowGroupDropdown(true)}
                />
                
                {showGroupDropdown && (
                  <div className="mobile-group-dropdown">
                    {getExistingGroups().length > 0 ? (
                      getExistingGroups().map((group) => (
                        <div 
                          key={group}
                          className="mobile-group-option"
                          onClick={() => {
                            setGroupInput(group);
                            setShowGroupDropdown(false);
                          }}
                        >
                          {group}
                        </div>
                      ))
                    ) : (
                      <div className="mobile-group-option-empty">
                        Нет существующих групп
                      </div>
                    )}
                    
                    <div 
                      className="mobile-group-option-new"
                      onClick={() => setShowGroupDropdown(false)}
                    >
                      + Новая группа
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mobile-form-actions">
              <button 
                className="mobile-primary-btn"
                onClick={handleAddPerson}
                disabled={!peopleInput.trim() || !groupInput.trim()}
              >
                Добавить
              </button>
              <button 
                className="mobile-secondary-btn"
                onClick={() => setShowAddPersonModal(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Chair Assignment Modal
  const ChairAssignModal = () => {
    if (selectedTableId === null || selectedChairIndex === null) return null;
    
    const table = tables.find(t => t.id === selectedTableId);
    if (!table) return null;
    
    const person = table.people[selectedChairIndex];
    const availablePeople = getAvailablePeople();
    
    return (
      <div className="mobile-modal">
        <div className="mobile-modal-content">
          <div className="mobile-modal-header">
            <h3>{person ? 'Управление местом' : 'Назначить место'}</h3>
            <button 
              className="mobile-modal-close"
              onClick={() => setShowChairAssignModal(false)}
            >
              ×
            </button>
          </div>
          
          <div className="mobile-modal-body">
            {person ? (
              // Chair is occupied
              <div className="mobile-chair-occupied-info">
                <div className="mobile-person-card large">
                  <div className="mobile-person-name">{person.name}</div>
                  <div className="mobile-person-group">Группа {person.group}</div>
                </div>
                
                <div className="mobile-chair-actions">
                  <button 
                    className="mobile-danger-btn"
                    onClick={handleRemovePersonFromChair}
                  >
                    Освободить место
                  </button>
                </div>
              </div>
            ) : (
              // Chair is empty
              <div className="mobile-chair-empty-info">
                <h4>Выберите гостя для места {selectedChairIndex + 1}</h4>
                
                {availablePeople.length > 0 ? (
                  <div className="mobile-available-people">
                    {availablePeople.map(person => (
                      <div 
                        key={person.name} 
                        className="mobile-available-person"
                        onClick={() => handleAssignPerson(person)}
                      >
                        <div className="mobile-person-name">{person.name}</div>
                        <div className="mobile-person-group">Группа {person.group}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mobile-empty-message">
                    Нет доступных гостей. Добавьте новых гостей.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <MultiBackend>
      <div className="mobile-app">
        {/* Mobile Header */}
        <header className="mobile-header">
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="mobile-menu-icon"></span>
          </button>
          
          <h1 className="mobile-title">Рассадка гостей</h1>
        </header>
        
        {/* Mobile Menu */}
        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`} ref={mobileMenuRef}>
          <div className="mobile-menu-header">
            <h2>Меню</h2>
            <button 
              className="mobile-menu-close"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ×
            </button>
          </div>
          
          <nav className="mobile-nav">
            <div 
              className={`mobile-nav-item ${activeView === 'hall' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('hall');
                setIsMobileMenuOpen(false);
              }}
            >
              <span className="mobile-nav-icon">🏛️</span>
              <span className="mobile-nav-text">План зала</span>
            </div>
            
            <div 
              className={`mobile-nav-item ${activeView === 'people' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('people');
                setIsMobileMenuOpen(false);
              }}
            >
              <span className="mobile-nav-icon">👥</span>
              <span className="mobile-nav-text">Гости</span>
            </div>
            
            <div 
              className={`mobile-nav-item ${activeView === 'tables' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('tables');
                setIsMobileMenuOpen(false);
              }}
            >
              <span className="mobile-nav-icon">🪑</span>
              <span className="mobile-nav-text">Столы</span>
            </div>
            
            <div 
              className={`mobile-nav-item ${activeView === 'halls' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('halls');
                setIsMobileMenuOpen(false);
              }}
            >
              <span className="mobile-nav-icon">🏢</span>
              <span className="mobile-nav-text">Залы</span>
            </div>
          </nav>
        </div>
        
        {/* Main Content */}
        <main className="mobile-content">
          {activeView === 'hall' && <MobileHallView />}
          {activeView === 'people' && <MobilePeopleView />}
          {activeView === 'tables' && <MobileTablesView />}
          {activeView === 'halls' && <MobileHallsView />}
        </main>
        
        {/* Bottom Action Bar */}
        <div className="mobile-action-bar">
          <div 
            className="mobile-action-item"
            onClick={() => setActiveView('hall')}
          >
            <span className="mobile-action-icon">🏛️</span>
            <span className="mobile-action-text">Зал</span>
          </div>
          
          <div 
            className="mobile-action-item"
            onClick={() => setActiveView('people')}
          >
            <span className="mobile-action-icon">👥</span>
            <span className="mobile-action-text">Гости</span>
          </div>
          
          <div 
            className="mobile-action-item"
            onClick={() => {
              if (activeView === 'hall') {
                handleAddTable();
              } else if (activeView === 'people') {
                setShowAddPersonModal(true);
              }
            }}
          >
            <span className="mobile-action-icon">+</span>
          </div>
          
          <div 
            className="mobile-action-item"
            onClick={() => setActiveView('tables')}
          >
            <span className="mobile-action-icon">🪑</span>
            <span className="mobile-action-text">Столы</span>
          </div>
          
          <div 
            className="mobile-action-item"
            onClick={() => setActiveView('halls')}
          >
            <span className="mobile-action-icon">🏢</span>
            <span className="mobile-action-text">Залы</span>
          </div>
        </div>
        
        {/* Modals */}
        {isTableDetailsOpen && <TableDetailsModal />}
        {showHallModal && <NewHallModal />}
        {showAddPersonModal && <AddPersonModal />}
        {showChairAssignModal && <ChairAssignModal />}
      </div>
    </MultiBackend>
  );
};

export default MobileSeatingArrangement;