import React, { useState, useEffect, useRef , useCallback } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './hallview.css';
import CollapsiblePanel from './CollapsiblePanel';
import SidebarLayout from './SidebarLayout';

// Define item type for drag and drop
const ItemTypes = {
GROUP: 'group'
};

// Group component that can be dragged inside a collapsible panel
const DraggableGroup = ({ group, onDragStart }) => {
const [{ isDragging }, drag] = useDrag({
  type: ItemTypes.GROUP,
  item: () => {
    if (onDragStart) onDragStart(group);
    return { group };
  },
  collect: (monitor) => ({
    isDragging: !!monitor.isDragging(),
  }),
});

const groupContent = (
  <div style={{ padding: '8px' }}>
    <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>
      Перетащите эту группу на стол для размещения
    </p>
    <div 
      ref={drag}
      style={{ 
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        padding: '10px',
        backgroundColor: '#333',
        borderRadius: '4px',
        marginBottom: '8px',
        borderLeft: `4px solid #${Math.floor(parseInt(group.id) * 9999).toString(16).padStart(6, '0')}`
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontWeight: 'bold' }}>Клиент: {group.name}</span>
        <span style={{ 
          backgroundColor: '#555', 
          padding: '2px 6px',
          borderRadius: '10px',
          fontSize: '11px'
        }}>{group.guestCount} гостей</span>
      </div>
    </div>
  </div>
);

return (
  <CollapsiblePanel
    title={`Группа "${group.name}" (${group.guestCount} гостей)`}
    defaultExpanded={false}
  >
    {groupContent}
  </CollapsiblePanel>
);
};

const HallViewer = ({ hallData: initialHallData, onDataChange }) => {
const [hallData, setHallData] = useState(initialHallData);
const [zoom, setZoom] = useState(0.4);
const tablesAreaRef = useRef(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);

// Added state for people, groups, and chair interaction
const [people, setPeople] = useState([]);
const [groups, setGroups] = useState([]);
const [draggingGroup, setDraggingGroup] = useState(null);
const [selectedChairIndex, setSelectedChairIndex] = useState(null);
const [selectedTableId, setSelectedTableId] = useState(null);
const [isPopupVisible, setIsPopupVisible] = useState(false);
const [isRemoveMode, setIsRemoveMode] = useState(false);
const [personToRemove, setPersonToRemove] = useState(null);

// Form state for adding people and groups
const [personName, setPersonName] = useState('');
const [groupName, setGroupName] = useState('');
const [showGroupForm, setShowGroupForm] = useState(false);
const [guestCount, setGuestCount] = useState(1);

// Table details panel state
const [showTableDetails, setShowTableDetails] = useState(false);
const [detailsTableId, setDetailsTableId] = useState(null);

// Booking confirmation modal state
const [showBookingModal, setShowBookingModal] = useState(false);
const [pendingBooking, setPendingBooking] = useState(null);
const [bookingTime, setBookingTime] = useState('');
const [bookingEndTime, setBookingEndTime] = useState('');
const [bookingNote, setBookingNote] = useState('');

// Side panel state
const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
const [sidePanelTab, setSidePanelTab] = useState('groups'); // 'groups', 'tableDetails'
const sidePanelRef = useRef(null);


// When a table is selected, open side panel with table details
useEffect(() => {
  if (detailsTableId) {
    setIsSidePanelOpen(true);
    setSidePanelTab('tableDetails');
  }
}, [detailsTableId]);  // Handle table click to show details
const handleTableClick = (tableId) => {
  // If it's the same table that's already selected, do nothing
  if (tableId === detailsTableId) return;
  
  // Set the new selected table
  setDetailsTableId(tableId);
  
  // Ensure side panel is open and showing table details
  setIsSidePanelOpen(true);
  setSidePanelTab('tableDetails');
};

useEffect(() => {
  // Initialize from localStorage or from props
  const savedHallData = localStorage.getItem('hallData');
  const savedPeople = localStorage.getItem('people');
  const savedGroups = localStorage.getItem('groups');
  
  if (savedHallData) {
    setHallData(JSON.parse(savedHallData));
  } else {
    setHallData(initialHallData);
  }
  
  if (savedPeople) {
    setPeople(JSON.parse(savedPeople));
  }
  
  if (savedGroups) {
    setGroups(JSON.parse(savedGroups));
  }
}, [initialHallData]);

// Add click outside listener to close side panel
useEffect(() => {
  if (!isSidePanelOpen) return;
  
  const handleClickOutside = (event) => {
    if (sidePanelRef.current && !sidePanelRef.current.contains(event.target)) {
      // Don't close panel if this is a table click 
      // (tables have their own click handler for switching details)
      const isTableClick = event.target.closest('.table-container');
      if (!isTableClick) {
        setIsSidePanelOpen(false);
      }
    }
  };
  
  document.addEventListener('mousedown', handleClickOutside);
  
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [isSidePanelOpen]);

useEffect(() => {
  // Save to localStorage when data changes
  if (hallData) {
    localStorage.setItem('hallData', JSON.stringify(hallData));
  }
  localStorage.setItem('people', JSON.stringify(people));
  localStorage.setItem('groups', JSON.stringify(groups));
  
  // Notify parent if needed
  if (onDataChange) {
    onDataChange(hallData);
  }
}, [hallData, people, groups, onDataChange]);

useEffect(() => {
  // When initialHallData prop changes, update local state
  setHallData(initialHallData);
}, [initialHallData]);

// State for dragging/panning the view
const [isDraggingView, setIsDraggingView] = useState(false);
const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
const [initialScrollPosition, setInitialScrollPosition] = useState({ x: 0, y: 0 });

// Handle mouse wheel for zooming
const handleWheel = useCallback((e) => {
  // Only zoom if Ctrl key is pressed
  if (e.ctrlKey) {
    e.preventDefault();
    
    // Get current mouse position relative to the tables area
    const rect = tablesAreaRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Get the position in the unzoomed content
    const contentX = (tablesAreaRef.current.scrollLeft + mouseX) / zoom;
    const contentY = (tablesAreaRef.current.scrollTop + mouseY) / zoom;
    
    // Calculate new zoom level
    let newZoom;
    if (e.deltaY < 0) {
      // Zoom in
      newZoom = Math.min(zoom * 1.1, 1.0);
    } else {
      // Zoom out
      newZoom = Math.max(zoom / 1.1, 0.2);
    }
    
    // Update zoom
    setZoom(newZoom);
    
    // Adjust scroll position to keep mouse over same content
    setTimeout(() => {
      if (tablesAreaRef.current) {
        tablesAreaRef.current.scrollLeft = contentX * newZoom - mouseX;
        tablesAreaRef.current.scrollTop = contentY * newZoom - mouseY;
      }
    }, 0);
  }
}, [zoom]);

// Handle start of view dragging
const handleStartDragView = (e) => {
  // Only start drag if it's directly on the tables area and NOT on a table
  if (e.target === tablesAreaRef.current && !isDraggingView) {
    e.preventDefault();
    setIsDraggingView(true);
    setDragStartPosition({ x: e.clientX, y: e.clientY });
    setInitialScrollPosition({ 
      x: tablesAreaRef.current.scrollLeft,
      y: tablesAreaRef.current.scrollTop
    });
  }
};

// Handle dragging view
const handleDragView = useCallback((e) => {
  if (!isDraggingView) return;
  
  if (tablesAreaRef.current) {
    const dx = e.clientX - dragStartPosition.x;
    const dy = e.clientY - dragStartPosition.y;
    
    tablesAreaRef.current.scrollLeft = initialScrollPosition.x - dx;
    tablesAreaRef.current.scrollTop = initialScrollPosition.y - dy;
  }
}, [isDraggingView, dragStartPosition, initialScrollPosition]);

// Handle end of view dragging
const handleEndDragView = useCallback(() => {
  setIsDraggingView(false);
}, []);

// Add and remove event listeners
useEffect(() => {
  const tablesArea = tablesAreaRef.current;
  if (tablesArea) {
    // Add wheel event for zooming
    tablesArea.addEventListener('wheel', handleWheel, { passive: false });
    
    // Add mousedown for starting drag
    tablesArea.addEventListener('mousedown', handleStartDragView);
    
    return () => {
      tablesArea.removeEventListener('wheel', handleWheel);
      tablesArea.removeEventListener('mousedown', handleStartDragView);
    };
  }
}, [handleWheel]);

// Add document-level event listeners for drag handling
useEffect(() => {
  if (isDraggingView) {
    document.addEventListener('mousemove', handleDragView);
    document.addEventListener('mouseup', handleEndDragView);
    
    return () => {
      document.removeEventListener('mousemove', handleDragView);
      document.removeEventListener('mouseup', handleEndDragView);
    };
  }
}, [isDraggingView, handleDragView, handleEndDragView]);

// Handle file upload for hall data
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  setIsLoading(true);
  setError(null);

  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const parsedData = JSON.parse(e.target.result);
      setHallData(parsedData);
      
      // If callback provided to notify parent component
      if (onDataChange) {
        onDataChange(parsedData);
      }
      
      setIsLoading(false);
    } catch (error) {
      setError("Ошибка при чтении JSON файла. Проверьте формат файла.");
      setIsLoading(false);
    }
  };

  reader.onerror = () => {
    setError("Ошибка при чтении файла.");
    setIsLoading(false);
  };

  reader.readAsText(file);
  
  // Reset input value to allow selecting the same file again
  event.target.value = "";
};

// Zoom handlers
const handleButtonZoomIn = () => {
  setZoom(Math.min(zoom * 1.1, 1.0));
};

const handleButtonZoomOut = () => {
  setZoom(Math.max(zoom / 1.1, 0.2));
};

// Chair click handler
const handleChairClick = (tableId, chairIndex) => {
  const table = hallData.tables.find(t => t.id === tableId);
  const person = table?.people?.[chairIndex];

  if (person) {
    // If chair is occupied, show removal popup
    setSelectedTableId(tableId);
    setSelectedChairIndex(chairIndex);
    setPersonToRemove(person);
    setIsRemoveMode(true);
    setIsPopupVisible(true);
  } else {
    // If chair is empty, show popup to add a person
    setSelectedTableId(tableId);
    setSelectedChairIndex(chairIndex);
    setIsRemoveMode(false);
    setIsPopupVisible(true);
  }
};

// Handle person removal from chair
const handleRemovePerson = () => {
  if (selectedTableId !== null && selectedChairIndex !== null && personToRemove) {
    setHallData(prevData => {
      const updatedTables = prevData.tables.map(table => {
        if (table.id === selectedTableId) {
          const updatedPeople = [...(table.people || [])];
          updatedPeople[selectedChairIndex] = null;
          
          return {
            ...table,
            people: updatedPeople
          };
        }
        return table;
      });
      
      return {
        ...prevData,
        tables: updatedTables
      };
    });
    
    setIsPopupVisible(false);
    setSelectedTableId(null);
    setSelectedChairIndex(null);
    setPersonToRemove(null);
    setIsRemoveMode(false);
  }
};

// Handle person selection for an empty chair
const handleSelectPerson = (person) => {
  if (selectedTableId !== null && selectedChairIndex !== null) {
    setHallData(prevData => {
      const updatedTables = prevData.tables.map(table => {
        if (table.id === selectedTableId) {
          const updatedPeople = [...(table.people || [])];
          
          // Ensure the people array is long enough
          while (updatedPeople.length <= selectedChairIndex) {
            updatedPeople.push(null);
          }
          
          updatedPeople[selectedChairIndex] = person;
          
          return {
            ...table,
            people: updatedPeople
          };
        }
        return table;
      });
      
      return {
        ...prevData,
        tables: updatedTables
      };
    });
    
    setIsPopupVisible(false);
    setSelectedTableId(null);
    setSelectedChairIndex(null);
  }
};

// Close popup
const closePopup = () => {
  setIsPopupVisible(false);
  setSelectedTableId(null);
  setSelectedChairIndex(null);
  setPersonToRemove(null);
  setIsRemoveMode(false);
};

// Handle adding a person to the general list
const handleAddPerson = () => {
  if (personName.trim()) {
    const newPerson = { name: personName.trim() };
    setPeople([...people, newPerson]);
    setPersonName('');
  }
};

// Handle adding a new group
const handleAddGroup = () => {
  if (groupName.trim() && guestCount > 0) {
    // Create generic names for guests based on count
    const groupGuests = Array.from({ length: guestCount }, (_, i) => ({
      name: `Гость ${i + 1}`,
      group: groupName.trim()
    }));
    
    const newGroup = {
      id: Date.now().toString(),
      name: groupName.trim(),
      guestCount: guestCount,
      people: groupGuests
    };
    
    setGroups([...groups, newGroup]);
    
    // Reset form
    setGroupName('');
    setGuestCount(1);
    setShowGroupForm(false);
  }
};

// Handle click on empty area to lose table focus
const handleTablesAreaClick = (e) => {
  // Check if the click was directly on the tables-area element (not on any child element)
  if (e.target === tablesAreaRef.current) {
    // Clear selected table and close table details if open
    setDetailsTableId(null);
    if (sidePanelTab === 'tableDetails') {
      setIsSidePanelOpen(false);
    }
  }
};

// Get table details for the details panel
const getTableDetails = () => {
  if (!detailsTableId || !hallData || !hallData.tables) return null;
  
  const table = hallData.tables.find(t => t.id === detailsTableId);
  if (!table) return null;
  
  const occupiedSeats = (table.people || []).filter(Boolean).length;
  const availableSeats = table.chairCount - occupiedSeats;
  
  // Get booking information if available
  let bookingInfo = null;
  const seatedPeople = (table.people || []).filter(Boolean);
  
  if (seatedPeople.length > 0 && seatedPeople[0].booking) {
    bookingInfo = seatedPeople[0].booking;
  }
  
  return {
    table,
    occupiedSeats,
    availableSeats,
    seatedPeople: seatedPeople,
    bookingInfo
  };
};

// Table details panel component
const TableDetailsPanel = () => {
  const details = getTableDetails();
  
  if (!details) return null;
  
  const occupiedPercentage = Math.round((details.occupiedSeats / details.table.chairCount) * 100);
  
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div style={{ 
        padding: '15px', 
        borderBottom: '1px solid #3a3a3a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0 }}>Детали стола {details.table.id}</h3>
      </div>
      
      <CollapsiblePanel 
        title="Заполненность"
        defaultExpanded={true}
      >
        <div style={{ padding: '15px' }}>
          <div style={{ marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: '#999' }}>Занято мест:</span>
            <span style={{ 
              float: 'right', 
              fontWeight: 'bold',
              color: details.occupiedSeats === details.table.chairCount ? '#ff5555' : '#55aa55'
            }}>
              {details.occupiedSeats} из {details.table.chairCount} ({occupiedPercentage}%)
            </span>
          </div>
          
          <div style={{ 
            height: '8px', 
            backgroundColor: '#444', 
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '15px'
          }}>
            <div style={{ 
              height: '100%', 
              width: `${occupiedPercentage}%`,
              backgroundColor: occupiedPercentage === 100 ? '#ff5555' : '#55aa55',
              borderRadius: '4px'
            }}></div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{
              backgroundColor: '#333',
              padding: '10px',
              borderRadius: '4px',
              textAlign: 'center',
              flex: '1',
              marginRight: '5px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{details.occupiedSeats}</div>
              <div style={{ fontSize: '12px', color: '#999' }}>Занято</div>
            </div>
            
            <div style={{
              backgroundColor: '#333',
              padding: '10px',
              borderRadius: '4px',
              textAlign: 'center',
              flex: '1',
              marginLeft: '5px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{details.availableSeats}</div>
              <div style={{ fontSize: '12px', color: '#999' }}>Свободно</div>
            </div>
          </div>
        </div>
      </CollapsiblePanel>
      
      <CollapsiblePanel 
        title={`Люди за столом (${details.seatedPeople.length})`}
        defaultExpanded={true}
      >
        <div style={{ padding: '10px' }}>
          {details.seatedPeople.length > 0 ? (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {details.seatedPeople.map((person, index) => (
                <div 
                  key={index}
                  style={{
                    padding: '8px',
                    backgroundColor: '#333',
                    borderRadius: '4px',
                    marginBottom: '5px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{person.name}</div>
                    {person.group && (
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        Группа: {person.group}
                      </div>
                    )}
                    {person.booking && (
                      <div style={{ fontSize: '10px', color: '#aaa', marginTop: '3px' }}>
                        Время: {person.booking.time} - {person.booking.endTime}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => {
                      // Set up state for removal popup
                      setSelectedTableId(details.table.id);
                      // Find the index of this person in the table
                      const personIndex = details.table.people.findIndex(p => p && p.name === person.name);
                      if (personIndex !== -1) {
                        setSelectedChairIndex(personIndex);
                        setPersonToRemove(person);
                        setIsRemoveMode(true);
                        setIsPopupVisible(true);
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff5555',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              color: '#999',
              fontStyle: 'italic'
            }}>
              За этим столом никто не сидит
            </div>
          )}
        </div>
      </CollapsiblePanel>
      
      <CollapsiblePanel 
        title="Ориентировочное время"
        defaultExpanded={false}
      >
        <div style={{ padding: '15px' }}>
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '10px' }}>
            Оценка времени освобождения стола:
          </div>
          
          {details.occupiedSeats === details.table.chairCount ? (
            <div>
              {details.seatedPeople[0]?.booking ? (
                <div style={{
                  backgroundColor: '#333',
                  padding: '10px',
                  borderRadius: '4px',
                  textAlign: 'center',
                  marginBottom: '10px'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {details.seatedPeople[0].booking.endTime}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    (Время окончания бронирования)
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#333',
                  padding: '10px',
                  borderRadius: '4px',
                  textAlign: 'center',
                  marginBottom: '10px'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>~45-60 мин.</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    (Примерное время для полностью занятого стола)
                  </div>
                </div>
              )}
              
              <div style={{ fontSize: '12px', color: '#999' }}>
                Примечание: Это ориентировочное время основано на среднем времени пребывания посетителей.
              </div>
            </div>
          ) : (
            <div style={{ 
              padding: '15px', 
              backgroundColor: '#333', 
              borderRadius: '4px',
              fontSize: '13px'
            }}>
              Стол не полностью занят, оценка недоступна
            </div>
          )}
        </div>
      </CollapsiblePanel>
    </div>
  );
};

// Groups management panel component
const GroupsPanel = () => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div style={{ 
        padding: '15px', 
        borderBottom: '1px solid #3a3a3a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0 }}>Управление группами</h3>
      </div>
      
      <CollapsiblePanel title="Добавление людей и групп" defaultExpanded={true}>
        <div style={{ padding: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Имя человека"
              className="input-field"
              style={{ 
                backgroundColor: '#333', 
                color: '#fff', 
                border: 'none',
                flex: 1
              }}
            />
            <button
              className="primary-btn add-person-btn"
              onClick={handleAddPerson}
              style={{ width: 'auto' }}
            >
              +
            </button>
          </div>
          
          <button
            className="primary-btn"
            onClick={() => setShowGroupForm(true)}
            style={{ 
              width: '100%', 
              backgroundColor: '#2ecc71',
              marginTop: '10px'
            }}
          >
            Создать группу
          </button>
        </div>
      </CollapsiblePanel>
      
      <CollapsiblePanel title="Доступные люди" defaultExpanded={false}>
        <div style={{ padding: '10px' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '5px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {getAvailablePeople().length > 0 ? (
              getAvailablePeople().map((person, index) => (
                <div key={index} style={{
                  backgroundColor: '#333',
                  padding: '8px 12px',
                  borderRadius: '4px'
                }}>
                  {person.name}
                </div>
              ))
            ) : (
              <div style={{ color: '#999', fontStyle: 'italic' }}>Нет доступных людей</div>
            )}
          </div>
        </div>
      </CollapsiblePanel>
      
      <CollapsiblePanel title="Группы" defaultExpanded={true}>
        <div style={{ 
          padding: '5px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '5px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {groups.length > 0 ? (
            groups.map((group, index) => (
              <DraggableGroup 
                key={index} 
                group={group} 
                onDragStart={setDraggingGroup}
              />
            ))
          ) : (
            <div style={{ 
              color: '#999', 
              fontStyle: 'italic',
              padding: '10px',
              textAlign: 'center'
            }}>
              Нет созданных групп
            </div>
          )}
        </div>
      </CollapsiblePanel>
    </div>
  );
};

// Table drop handler for groups - now with confirmation modal
const handleTableDrop = (tableId, group) => {
  const table = hallData.tables.find(t => t.id === tableId);
  
  if (!table) return;
  
  // Count available seats
  const occupiedSeats = table.people ? table.people.filter(Boolean).length : 0;
  const availableSeats = table.chairCount - occupiedSeats;
  
  // Check if there's enough space for the group
  if (group.guestCount > availableSeats) {
    alert(`На столе недостаточно свободных мест для группы "${group.name}". Нужно: ${group.guestCount}, доступно: ${availableSeats}`);
    return;
  }
  
  // Instead of immediately assigning seats, show booking confirmation modal
  setPendingBooking({
    tableId,
    group,
    availableSeats
  });
  
  // Set default booking time values (current time, +2 hours)
  const now = new Date();
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  
  // Format times for input fields (HH:MM)
  const formatTime = (date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  setBookingTime(formatTime(now));
  setBookingEndTime(formatTime(twoHoursLater));
  setBookingNote('');
  setShowBookingModal(true);
};

// Confirm booking and assign seats
const confirmBooking = () => {
  if (!pendingBooking) return;
  
  const { tableId, group } = pendingBooking;
  
  // Add booking time and note to the group
  const bookingDetails = {
    time: bookingTime,
    endTime: bookingEndTime,
    note: bookingNote,
    timestamp: new Date().toISOString()
  };
  
  // Add people from the group to empty chairs
  setHallData(prevData => {
    const updatedTables = prevData.tables.map(t => {
      if (t.id === tableId) {
        // Make a copy of the people array or initialize it
        const tablePeople = [...(t.people || [])];
        
        // Find empty seats
        const emptySeats = [];
        for (let i = 0; i < t.chairCount; i++) {
          if (!tablePeople[i]) {
            emptySeats.push(i);
          }
        }
        
        // Place group people in empty seats
        group.people.forEach((person, index) => {
          if (index < emptySeats.length) {
            // Add booking details to each person
            tablePeople[emptySeats[index]] = { 
              ...person, 
              group: group.name,
              booking: bookingDetails
            };
          }
        });
        
        return {
          ...t,
          people: tablePeople
        };
      }
      return t;
    });
    
    return {
      ...prevData,
      tables: updatedTables
    };
  });
  
  // Show notification
  const notification = document.createElement('div');
  notification.className = 'transfer-notification';
  notification.textContent = `Группа "${group.name}" размещена за столом ${tableId}`;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  }, 100);
  
  // Reset booking state
  setShowBookingModal(false);
  setPendingBooking(null);
  setBookingTime('');
  setBookingEndTime('');
  setBookingNote('');
};

// Cancel booking
const cancelBooking = () => {
  setShowBookingModal(false);
  setPendingBooking(null);
  setBookingTime('');
  setBookingEndTime('');
  setBookingNote('');
};

// Function to render chairs for tables
const renderChairs = (table) => {
  if (table.shape === 'rectangle') {
    return renderRectangleChairs(table);
  } else {
    return renderRoundChairs(table);
  }
};

// Render chairs for round tables
const renderRoundChairs = (table) => {
  const chairs = [];
  const angleStep = 360 / table.chairCount;
  const radius = 140;
  const peopleOnTable = table.people || [];

  for (let i = 0; i < table.chairCount; i++) {
    const angle = angleStep * i;
    const xPosition = radius * Math.cos((angle * Math.PI) / 180);
    const yPosition = radius * Math.sin((angle * Math.PI) / 180);

    const chairStyle = {
      position: 'absolute',
      transformOrigin: 'center',
      width: '60px',
      height: '60px',
      backgroundImage: peopleOnTable[i] ? "url('/red1.png')" : "url('/green2.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '50%',
      fontSize: '12px',
      textAlign: 'center',
      left: `calc(50% + ${xPosition}px)`,
      top: `calc(50% + ${yPosition}px)`,
      transform: `rotate(${angle + 90}deg)`,
      cursor: 'pointer'
    };

    const nameOverlayStyle = {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      padding: '2px 6px',
      color: "#211812",
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 'bold',
      maxWidth: '55px',
      textAlign: 'center',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      zIndex: 5
    };

    chairs.push(
      <div
        key={i}
        className="chair"
        style={chairStyle}
        onClick={(e) => {
          e.stopPropagation();
          handleChairClick(table.id, i);
        }}
        title={peopleOnTable[i] ? `Нажмите, чтобы убрать ${peopleOnTable[i].name}` : "Нажмите, чтобы добавить человека"}
      >
        {peopleOnTable[i] && (
          <div
            className="person-name-overlay"
            style={nameOverlayStyle}
          >
            {peopleOnTable[i].name}
          </div>
        )}
      </div>
    );
  }

  return chairs;
};

// Render chairs for rectangle tables
const renderRectangleChairs = (table) => {
  const chairs = [];
  const tableWidth = 400;
  const tableHeight = 150;
  const border = 50;
  const peopleOnTable = table.people || [];

  const totalChairs = table.chairCount;

  // Distribute chairs around the table
  let chairsLeft = 0;
  let chairsRight = 0;
  let chairsTop = 0;
  let chairsBottom = 0;

  // Initially allocate chairs on left and right sides (if more than 4 chairs)
  if (totalChairs > 4) {
    chairsLeft = 1;
    chairsRight = 1;
    // Remaining chairs go to top and bottom sides
    const remainingChairs = totalChairs - 2;
    const maxTopBottom = Math.floor(remainingChairs / 2);
    chairsTop = maxTopBottom;
    chairsBottom = remainingChairs - chairsTop;
  } else {
    // If 4 or fewer chairs, distribute only on top and bottom
    chairsTop = Math.ceil(totalChairs / 2);
    chairsBottom = totalChairs - chairsTop;
  }

  let chairIndex = 0;

  // Left side chairs
  if (chairsLeft > 0) {
    const leftChairIndex = chairIndex;
    const person = peopleOnTable[leftChairIndex];

    chairs.push(
      <div
        key={`left-${leftChairIndex}`}
        className="chair"
        style={{
          position: 'absolute',
          width: '60px',
          height: '60px',
          backgroundImage: person ? "url('/red1.png')" : "url('/green2.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '50%',
          fontSize: '12px',
          textAlign: 'center',
          left: `calc(50% - ${250}px)`, 
          top: `calc(50% - ${15}px)`,
          cursor: 'pointer',
          transform: 'rotate(270deg)' 
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleChairClick(table.id, leftChairIndex);
        }}
        title={person ? `Нажмите, чтобы убрать ${person.name}` : "Нажмите, чтобы добавить человека"}
      >
        {person && (
          <div
            className="person-name-overlay"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: '2px 6px',
              color: "#211812",
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
              maxWidth: '55px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              zIndex: 5
            }}
          >
            {person.name}
          </div>
        )}
      </div>
    );

    chairIndex++;
  }

  // Right side chairs
  if (chairsRight > 0) {
    const rightChairIndex = chairIndex;
    const person = peopleOnTable[rightChairIndex];

    chairs.push(
      <div
        key={`right-${rightChairIndex}`}
        className="chair"
        style={{
          position: 'absolute',
          width: '60px',
          height: '60px',
          backgroundImage: person ? "url('/red1.png')" : "url('/green2.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '50%',
          fontSize: '12px',
          textAlign: 'center',
          left: `calc(50% + ${190}px)`,
          top: `calc(50% - ${15}px)`, 
          cursor: 'pointer',
          transform: 'rotate(90deg)' 
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleChairClick(table.id, rightChairIndex);
        }}
        title={person ? `Нажмите, чтобы убрать ${person.name}` : "Нажмите, чтобы добавить человека"}
      >
        {person && (
          <div
            className="person-name-overlay"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: '2px 6px',
              color: "#211812",
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
              maxWidth: '55px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              zIndex: 5
            }}
          >
            {person.name}
          </div>
        )}
      </div>
    );

    chairIndex++;
  }

  // Top chairs
  for (let i = 0; i < chairsTop; i++) {
    const topChairIndex = chairIndex;
    const person = peopleOnTable[topChairIndex];
    const ratio = chairsTop === 1 ? 0.5 : i / (chairsTop - 1);
    const xPosition = ((tableWidth - 50) * ratio) - tableWidth / 2;
    const yPosition = -tableHeight / 2 - border + 10;

    chairs.push(
      <div
        key={`top-${topChairIndex}`}
        className="chair"
        style={{
          position: 'absolute',
          width: '60px',
          height: '60px',
          backgroundImage: person ? "url('/red1.png')" : "url('/green2.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '50%',
          fontSize: '12px',
          textAlign: 'center',
          left: `calc(50% + ${xPosition}px)`,
          top: `calc(50% + ${yPosition}px)`,
          cursor: 'pointer',
          transform: 'rotate(0deg)'
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleChairClick(table.id, topChairIndex);
        }}
        title={person ? `Нажмите, чтобы убрать ${person.name}` : "Нажмите, чтобы добавить человека"}
      >
        {person && (
          <div
            className="person-name-overlay"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: '2px 6px',
              color: "#211812",
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
              maxWidth: '55px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              zIndex: 5
            }}
          >
            {person.name}
          </div>
        )}
      </div>
    );

    chairIndex++;
  }

  // Bottom chairs
  for (let i = 0; i < chairsBottom; i++) {
    const bottomChairIndex = chairIndex;
    const person = peopleOnTable[bottomChairIndex];
    const ratio = chairsBottom === 1 ? 0.5 : i / (chairsBottom - 1);
    const xPosition = ((tableWidth - 50) * ratio) - tableWidth / 2;
    const yPosition = tableHeight / 2;

    chairs.push(
      <div
        key={`bottom-${bottomChairIndex}`}
        className="chair"
        style={{
          position: 'absolute',
          width: '60px',
          height: '60px',
          backgroundImage: person ? "url('/red1.png')" : "url('/green2.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '50%',
          fontSize: '12px',
          textAlign: 'center',
          left: `calc(50% + ${xPosition}px)`,
          top: `calc(50% + ${yPosition}px)`,
          cursor: 'pointer',
          transform: 'rotate(180deg)'
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleChairClick(table.id, bottomChairIndex);
        }}
        title={person ? `Нажмите, чтобы убрать ${person.name}` : "Нажмите, чтобы добавить человека"}
      >
        {person && (
          <div
            className="person-name-overlay"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: '2px 6px',
              color: "#211812",
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
              maxWidth: '55px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              zIndex: 5
            }}
          >
            {person.name}
          </div>
        )}
      </div>
    );

    chairIndex++;
  }

  return chairs;
};

// Render hall elements (entrances, bathrooms, etc.)
const renderHallElements = () => {
  if (!hallData.hallElements) return null;
  
  return hallData.hallElements.map(element => {
    return (
      <div
        key={element.id}
        className="hall-element"
        style={{
          position: 'absolute',
          left: `${element.x}px`,
          top: `${element.y}px`,
          transform: `rotate(${element.rotation || 0}deg)`,
          opacity: element.opacity || 1,
          zIndex: element.zIndex || 1
        }}
      >
        <img 
          src={element.icon} 
          alt={element.name} 
          style={{ 
            width: `${element.fontSize || 100}px`,
            height: 'auto',
          }} 
        />
        <div className="element-label" style={{ textAlign: 'center', marginTop: '5px' }}>
          {element.customName || element.name}
        </div>
      </div>
    );
  });
};

// DroppableTable component
const DroppableTable = ({ table }) => {
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.GROUP,
    drop: (item) => handleTableDrop(table.id, item.group),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });
  
  return (
    <div
      ref={drop}
      className={`table-container ${isOver ? 'drop-target' : ''} ${detailsTableId === table.id ? 'highlighted-table' : ''}`}
      style={{
        position: 'absolute',
        left: `${table.x || 0}px`,
        top: `${table.y || 0}px`,
        padding: '1rem',
        borderRadius: '10px',
        opacity: isOver ? 0.8 : 1,
        cursor: 'pointer',
        border: detailsTableId === table.id ? '2px solid #3498db' : 'none'
      }}
      onClick={() => handleTableClick(table.id)}
    >
      <div className="table-header">
        <h3>Стол {table.id} (Стульев: {table.chairCount})</h3>
      </div>
      
      {table.shape === 'rectangle' ? (
        <div className="table" style={{
          margin: "20px",
          width: "400px",
          height: "150px",
          border: "30px solid #e7d8c7",
          borderRadius: "0%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundImage: "url('/table2.png')",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}>
          {renderChairs(table)}
        </div>
      ) : (
        <div className="table">
          <div className="table-top">
            {renderChairs(table)}
          </div>
        </div>
      )}
    </div>
  );
};

// Get list of people not yet seated
const getAvailablePeople = () => {
  // Collect all seated people from tables
  const seatedPeople = [];
  
  if (hallData && hallData.tables) {
    hallData.tables.forEach(table => {
      if (table.people) {
        table.people.forEach(person => {
          if (person) seatedPeople.push(person.name);
        });
      }
    });
  }
  
  // Return people who are not seated
  return people.filter(person => !seatedPeople.includes(person.name));
};

return (
  <DndProvider backend={HTML5Backend}>
    <div className="app-container" style={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Compact header */}
      <header className="app-header" style={{ 
        padding: '10px 15px',
        backgroundColor: '#0a0a1d',
        color: 'white',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 'bold',
            whiteSpace: 'nowrap'
          }}>
            {hallData?.name || 'Зал без названия'}
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => { 
                setIsSidePanelOpen(true); 
                setSidePanelTab('groups');
              }}
              style={{
                backgroundColor: sidePanelTab === 'groups' && isSidePanelOpen ? '#3498db' : '#333',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>Группы</span>
              <span style={{ 
                backgroundColor: '#555',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}>
                {groups.length}
              </span>
            </button>
            
            {detailsTableId && (
              <button 
                onClick={() => { 
                  setIsSidePanelOpen(true); 
                  setSidePanelTab('tableDetails');
                }}
                style={{
                  backgroundColor: sidePanelTab === 'tableDetails' && isSidePanelOpen ? '#3498db' : '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Стол {detailsTableId}
              </button>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <button
              className="zoom-btn zoom-out-btn"
              onClick={handleButtonZoomOut}
              style={{
                backgroundColor: '#333',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                cursor: 'pointer'
              }}
            >−</button>
            <span style={{ 
              color: 'white',
              fontSize: '14px',
              width: '40px',
              textAlign: 'center'
            }}>
              {Math.round(zoom * 100)}%
            </span>
            <button
              className="zoom-btn zoom-in-btn"
              onClick={handleButtonZoomIn}
              style={{
                backgroundColor: '#333',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                cursor: 'pointer'
              }}
            >+</button>
          </div>
          
          <div className="import-container">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              id="import-file"
              className="file-input"
              style={{ display: 'none' }}
            />
            <label 
              htmlFor="import-file" 
              className="import-button"
              style={{
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'inline-block'
              }}
            >
              Импорт зала
            </label>
            {isLoading && <div className="loading-indicator">Загрузка...</div>}
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      </header>
      
      {/* Main content with hall view and side panel */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#f7f7f7'
      }}>
        {/* Collapsible side panel */}
        <div 
          ref={sidePanelRef}
          style={{
            width: isSidePanelOpen ? '300px' : '0',
            height: '100%',
            backgroundColor: '#252525',
            transition: 'width 0.3s ease',
            overflowX: 'hidden',
            overflowY: 'auto',
            color: 'white',
            position: 'relative',
            zIndex: 50,
            boxShadow: isSidePanelOpen ? '0 0 10px rgba(0, 0, 0, 0.2)' : 'none'
          }}
        >
          {isSidePanelOpen && (
            <>
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 10,
                cursor: 'pointer',
                fontSize: '20px',
                color: '#999'
              }}
              onClick={() => setIsSidePanelOpen(false)}
              >
                ×
              </div>
              
              {sidePanelTab === 'groups' && <GroupsPanel />}
              {sidePanelTab === 'tableDetails' && <TableDetailsPanel />}
            </>
          )}
        </div>
        
        {/* Hall view */}
        {hallData ? (
          <div 
            style={{ 
              flex: 1,
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: '#f7f7f7' 
            }}
          >
            <div
              className="tables-area"
              ref={tablesAreaRef}
              onClick={handleTablesAreaClick}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                display: 'flex',
                overflow: 'auto',
                width: `${100 / zoom}%`,
                height: `${100 / zoom}%`,
                minHeight: `${100 / zoom}%`,
                padding: '20px',
                position: 'relative',
                '--zoom-level': zoom,
                transition: isDraggingView ? 'none' : 'transform 0.1s ease-out',
                background: 'linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                backgroundColor: '#e6eef5',
                border: '2px dashed #3a3a3a',
                cursor: isDraggingView ? 'grabbing' : 'default'
              }}
            >
              {/* Render tables */}
              {hallData.tables && hallData.tables.map((table) => (
                <DroppableTable key={table.id} table={table} />
              ))}
              
              {/* Render hall elements */}
              {renderHallElements()}
            </div>
            
            {/* Floating action button for groups */}
            {!isSidePanelOpen && (
              <button
                onClick={() => {
                  setIsSidePanelOpen(true);
                  setSidePanelTab('groups');
                }}
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '20px',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10
                }}
              >
                +
              </button>
            )}
          </div>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              maxWidth: '500px'
            }}>
              <h2 style={{ marginTop: 0 }}>Нет данных для отображения</h2>
              <p>Пожалуйста, импортируйте JSON файл с данными зала, используя кнопку выше.</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Fullscreen popup for chair selection/removal */}
      {isPopupVisible && (
        <div 
          className="fullscreen-popup" 
          onClick={closePopup}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="fullscreen-popup-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            {isRemoveMode ? (
              // Remove Person Popup
              <div className="remove-person-popup">
                <h3 style={{ 
                  textAlign: 'center',
                  marginTop: 0,
                  marginBottom: '20px'
                }}>
                  Убрать человека с места?
                </h3>
                
                <div style={{
                  backgroundColor: '#f5f5f5',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <p style={{
                    textAlign: 'center',
                    fontSize: '18px',
                    margin: '0 0 10px 0',
                    fontWeight: 'bold'
                  }}>
                    {personToRemove?.name}
                  </p>
                  {personToRemove?.group && (
                    <p style={{
                      textAlign: 'center',
                      margin: 0
                    }}>
                      Группа: {personToRemove.group}
                    </p>
                  )}
                </div>
                
                <p style={{
                  textAlign: 'center',
                  marginBottom: '20px',
                  color: '#555'
                }}>
                  Вы уверены, что хотите убрать этого человека с места?
                </p>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '15px'
                }}>
                  <button 
                    onClick={handleRemovePerson} 
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Убрать
                  </button>
                  
                  <button 
                    onClick={closePopup} 
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#7f8c8d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              // Add Person Popup
              <>
                <h3 style={{
                  textAlign: 'center',
                  marginTop: 0,
                  marginBottom: '20px'
                }}>
                  Выберите человека для этого места
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '15px',
                  marginBottom: '20px',
                  maxHeight: '60vh',
                  overflowY: 'auto',
                  padding: '10px'
                }}>
                  {getAvailablePeople().length > 0 ? (
                    getAvailablePeople().map((person, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectPerson(person)}
                        style={{
                          backgroundColor: '#f5f5f5',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          padding: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#e8f4fd';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <span style={{
                          display: 'block',
                          fontWeight: 'bold',
                          marginBottom: '4px'
                        }}>
                          {person.name}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '20px',
                      color: '#666',
                      gridColumn: '1 / -1'
                    }}>
                      Нет доступных людей
                    </div>
                  )}
                </div>
                <button 
                  onClick={closePopup} 
                  style={{
                    display: 'block',
                    margin: '0 auto',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#2980b9';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#3498db';
                  }}
                >
                  Закрыть
                </button>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Group creation form */}
      {showGroupForm && (
        <div 
          className="fullscreen-popup" 
          onClick={() => setShowGroupForm(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="fullscreen-popup-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '500px',
              width: '90%'
            }}
          >
            <h3 style={{
              textAlign: 'center',
              marginTop: 0,
              marginBottom: '20px'
            }}>
              Создание новой группы
            </h3>
            
            <div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Имя клиента (название группы):
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                  placeholder="Например: Семья Ивановых"
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Количество гостей:
                </label>
                <input
                  type="number"
                  min="1"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ 
                    width: '100px',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '15px'
              }}>
                <button
                  onClick={handleAddGroup}
                  disabled={!groupName.trim() || guestCount < 1}
                  style={{ 
                    padding: '10px 20px',
                    backgroundColor: !groupName.trim() || guestCount < 1 ? '#aaa' : '#2ecc71',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !groupName.trim() || guestCount < 1 ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    flex: '1'
                  }}
                >
                  Создать группу
                </button>
                
                <button
                  onClick={() => setShowGroupForm(false)}
                  style={{ 
                    padding: '10px 20px',
                    backgroundColor: '#7f8c8d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    flex: '1'
                  }}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Booking confirmation modal */}
      {showBookingModal && pendingBooking && (
        <div 
          className="fullscreen-popup" 
          onClick={cancelBooking}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="fullscreen-popup-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '500px',
              width: '90%'
            }}
          >
            <h3 style={{
              textAlign: 'center',
              marginTop: 0,
              marginBottom: '20px'
            }}>
              Подтверждение бронирования
            </h3>
            
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Информация о бронировании</h4>
                <div style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '15px', 
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}>
                  <p style={{ margin: '0 0 8px 0' }}><strong>Группа:</strong> {pendingBooking.group.name}</p>
                  <p style={{ margin: '0 0 8px 0' }}><strong>Количество гостей:</strong> {pendingBooking.group.guestCount}</p>
                  <p style={{ margin: '0 0 8px 0' }}><strong>Стол:</strong> {pendingBooking.tableId}</p>
                  <p style={{ margin: '0 0 0 0' }}><strong>Доступно мест:</strong> {pendingBooking.availableSeats}</p>
                </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Время бронирования:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="time"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    style={{ 
                      flex: '1',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                  <span>до</span>
                  <input
                    type="time"
                    value={bookingEndTime}
                    onChange={(e) => setBookingEndTime(e.target.value)}
                    style={{ 
                      flex: '1',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Примечание (необязательно):
                </label>
                <textarea
                  value={bookingNote}
                  onChange={(e) => setBookingNote(e.target.value)}
                  style={{ 
                    width: '100%',
                    minHeight: '80px',
                    resize: 'vertical',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                  placeholder="Особые пожелания, комментарии к заказу и т.д."
                />
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '15px'
              }}>
                <button
                  onClick={confirmBooking}
                  style={{ 
                    padding: '10px 20px',
                    backgroundColor: '#2ecc71',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    flex: '1'
                  }}
                >
                  Подтвердить бронирование
                </button>
                
                <button
                  onClick={cancelBooking}
                  style={{ 
                    padding: '10px 20px',
                    backgroundColor: '#7f8c8d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    flex: '1'
                  }}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </DndProvider>
);
};

export default HallViewer;