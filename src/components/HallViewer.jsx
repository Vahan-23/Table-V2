import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// Исправленный компонент ClientListItem для мгновенного перетаскивания


const HallViewer = ({ hallData: initialHallData, onDataChange }) => {
  const [hallData, setHallData] = useState(initialHallData);
  const [zoom, setZoom] = useState(0.4);
  const tablesAreaRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [groups, setGroups] = useState([]);
  const [draggingGroup, setDraggingGroup] = useState(null);
  const [selectedChairIndex, setSelectedChairIndex] = useState(null);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [personToRemove, setPersonToRemove] = useState(null);

  const [groupName, setGroupName] = useState('');
  const [groupPhone, setGroupPhone] = useState('');
  const [groupEmail, setGroupEmail] = useState('');
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [guestCount, setGuestCount] = useState(1);
  const [viewingGroupDetails, setViewingGroupDetails] = useState(null);

  const [showTableDetails, setShowTableDetails] = useState(false);
  const [detailsTableId, setDetailsTableId] = useState(null);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [bookingTime, setBookingTime] = useState('');
  const [bookingEndTime, setBookingEndTime] = useState('');
  const [bookingNote, setBookingNote] = useState('');

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [sidePanelTab, setSidePanelTab] = useState('groups');
  const sidePanelRef = useRef(null);

  const [isDraggingView, setIsDraggingView] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const [initialScrollPosition, setInitialScrollPosition] = useState({ x: 0, y: 0 });

  let isDraggingActive = false;
  let currentDraggedItem = null;
  let dragImage = null;
  let dragOffset = { x: 0, y: 0 };

  const ClientListItem = ({ group, onDragStart, onViewDetails }) => {
    const [isDragging, setIsDragging] = useState(false);
    const elementRef = useRef(null);

    // Функция для начала перетаскивания
    const startDrag = (e) => {
      if (isDraggingActive) return;

      // Предотвращаем стандартное перетаскивание браузера
      e.preventDefault();

      // Получаем размеры и положение элемента
      const rect = elementRef.current.getBoundingClientRect();

      // Вычисляем смещение мыши относительно элемента
      dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      // Создаем элемент для перетаскивания
      dragImage = document.createElement('div');
      dragImage.className = 'drag-image';
      dragImage.innerHTML = `
        <div style="
          padding: 12px;
          background-color: #333;
          border-radius: 6px;
          border-left: 4px solid #${Math.floor(parseInt(group.id) * 9999).toString(16).padStart(6, '0')}; 
          color: white;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          width: ${rect.width}px;
          opacity: 0.9;
        ">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 3px;">
            ${group.name}
          </div>
          <div style="font-size: 12px; color: #aaa;">
            ${group.guestCount} ${group.guestCount === 1 ? 'гость' : group.guestCount < 5 ? 'гостя' : 'гостей'}
          </div>
        </div>
      `;

      // Позиционируем элемент и добавляем на страницу
      dragImage.style.position = 'fixed';
      dragImage.style.left = `${e.clientX - dragOffset.x}px`;
      dragImage.style.top = `${e.clientY - dragOffset.y}px`;
      dragImage.style.pointerEvents = 'none';
      dragImage.style.zIndex = '1000';
      document.body.appendChild(dragImage);

      // Устанавливаем флаги перетаскивания
      isDraggingActive = true;
      currentDraggedItem = group;
      setIsDragging(true);

      // Вызываем функцию onDragStart
      onDragStart(group);

      // Добавляем обработчики для перемещения и завершения перетаскивания
      document.addEventListener('mousemove', onDragMove);
      document.addEventListener('mouseup', onDragEnd);

      // Изменяем курсор на всей странице
      document.body.style.cursor = 'grabbing';
    };

    // Функция для перемещения при перетаскивании
    const onDragMove = (e) => {
      if (!isDraggingActive || !dragImage) return;

      // Перемещаем элемент перетаскивания за курсором
      dragImage.style.left = `${e.clientX - dragOffset.x}px`;
      dragImage.style.top = `${e.clientY - dragOffset.y}px`;

      // Ищем элемент под курсором, который может быть целью для сброса
      const elementsUnderCursor = document.elementsFromPoint(e.clientX, e.clientY);

      // Проверяем, есть ли среди элементов под курсором таблица
      let tableElement = null;
      for (const element of elementsUnderCursor) {
        if (element.classList.contains('table-container')) {
          tableElement = element;
          break;
        }
      }

      // Убираем подсветку со всех столов
      document.querySelectorAll('.table-container').forEach(table => {
        table.classList.remove('drop-target');
      });

      // Подсвечиваем текущий стол, если он есть
      if (tableElement) {
        tableElement.classList.add('drop-target');
      }
    };

    // Функция завершения перетаскивания
    // Исправленная функция onDragEnd, которая правильно обрабатывает элемент при отпускании на стол
    const onDragEnd = (e) => {
      // Даже если что-то пойдет не так, всегда сбрасываем состояние
      const savedDraggedItem = currentDraggedItem; // Сохраняем перед сбросом

      // Сбрасываем состояние перетаскивания
      isDraggingActive = false;
      setIsDragging(false);

      // Удаляем обработчики событий
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);

      // Перед удалением элемента перетаскивания, проверяем, есть ли под ним стол
      let tableElement = null;
      let tableId = null;

      // Важно! Проверяем элементы под позицией мыши, а не под элементом перетаскивания
      const elementsUnderCursor = document.elementsFromPoint(e.clientX, e.clientY);

      // Поиск стола среди элементов под курсором
      for (const element of elementsUnderCursor) {
        if (element.classList.contains('table-container')) {
          tableElement = element;
          // Получаем ID стола из атрибута data-id
          tableId = element.getAttribute('data-id');
          console.log('Найден стол с ID:', tableId);
          break;
        }
      }

      // Удаляем элемент перетаскивания
      if (dragImage && dragImage.parentNode) {
        dragImage.parentNode.removeChild(dragImage);
      }
      dragImage = null;

      // Восстанавливаем курсор
      document.body.style.cursor = '';

      // Если нашли стол и у нас есть сохраненный элемент, вызываем обработчик
      if (tableElement && tableId && savedDraggedItem) {
        console.log('Вызываем handleTableDrop с ID стола:', tableId, 'и элементом:', savedDraggedItem);

        // Вызываем функцию handleTableDrop
        handleTableDrop(tableId, savedDraggedItem);
      } else {
        console.log('Стол не найден или нет перетаскиваемого элемента:', {
          tableElement: !!tableElement,
          tableId,
          hasDraggedItem: !!savedDraggedItem
        });
      }

      // Сбрасываем глобальное состояние перетаскивания
      onDragStart(null);
      currentDraggedItem = null;

      // Убираем подсветку со всех столов
      document.querySelectorAll('.table-container').forEach(table => {
        table.classList.remove('drop-target');
      });
    };

    return (
      <div
        ref={elementRef}
        className="client-list-item"
        onMouseDown={startDrag} // Используем mousedown вместо drag events
        style={{
          backgroundColor: isDragging ? '#2c3e50' : '#333',
          borderRadius: '6px',
          marginBottom: '8px',
          borderLeft: `4px solid #${Math.floor(parseInt(group.id) * 9999).toString(16).padStart(6, '0')}`,
          opacity: isDragging ? 0.3 : 1,
          padding: '12px',
          cursor: 'grab',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none',
          touchAction: 'none', // Важно для мобильных устройств
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '3px' }}>
            {group.name}
          </div>
          <div style={{ fontSize: '12px', color: '#aaa' }}>
            {group.guestCount} {group.guestCount === 1 ? 'гость' : group.guestCount < 5 ? 'гостя' : 'гостей'}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onViewDetails(group);
          }}
          onMouseDown={(e) => {
            // Предотвращаем начало перетаскивания при клике на кнопку
            e.stopPropagation();
          }}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#4a6da7',
            color: 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginLeft: '10px',
            zIndex: 2,
            position: 'relative'
          }}
          title="Информация о клиенте"
        >
          i
        </button>
      </div>
    );
  };

  useEffect(() => {
    if (tablesAreaRef.current && hallData) {
      // Рассчитываем размеры содержимого зала
      const tables = hallData.tables || [];
      const maxX = Math.max(...tables.map(t => (t.x || 0) + 400), 0); // 400 - ширина стола
      const maxY = Math.max(...tables.map(t => (t.y || 0) + 150), 0); // 150 - высота стола

      // Устанавливаем минимальные размеры контейнера
      tablesAreaRef.current.style.minWidth = `${maxX}px`;
      tablesAreaRef.current.style.minHeight = `${maxY}px`;

      // Центрируем зал
      const containerWidth = tablesAreaRef.current.offsetWidth;
      const containerHeight = tablesAreaRef.current.offsetHeight;
      tablesAreaRef.current.scrollLeft = (maxX * zoom - containerWidth) / 2;
      tablesAreaRef.current.scrollTop = (maxY * zoom - containerHeight) / 2;
    }
  }, [hallData, zoom]);

  // When a table is selected, open side panel with table details
  useEffect(() => {
    if (detailsTableId) {
      setIsSidePanelOpen(true);
      setSidePanelTab('tableDetails');
    }
  }, [detailsTableId]);

  // Handle table click to show details
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
    const savedGroups = localStorage.getItem('groups');

    if (savedHallData) {
      setHallData(JSON.parse(savedHallData));
    } else {
      setHallData(initialHallData);
    }

    if (savedGroups) {
      setGroups(JSON.parse(savedGroups));
    }
  }, [initialHallData]);

  // Add click outside listener to close side panel
  useEffect(() => {
    if (!isSidePanelOpen) return;
  
    const handleClickOutside = (event) => {
      // Don't close panel if actively dragging
      if (draggingGroup) return;
  
      // Check if the mouse event target is related to dragging
      const isDragHandle = event.target.closest('.drag-handle');
      if (isDragHandle) return;
  
      // Check if the click is inside any of the fullscreen popups
      const isPopupClick = event.target.closest('.fullscreen-popup-content') || 
                          event.target.classList.contains('fullscreen-popup');
      if (isPopupClick) return;
  
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
  }, [isSidePanelOpen, draggingGroup]);

  useEffect(() => {
    // Save to localStorage when data changes
    if (hallData) {
      localStorage.setItem('hallData', JSON.stringify(hallData));
    }
    localStorage.setItem('groups', JSON.stringify(groups));

    // Notify parent if needed
    if (onDataChange) {
      onDataChange(hallData);
    }
  }, [hallData, groups, onDataChange]);

  useEffect(() => {
    // When initialHallData prop changes, update local state
    setHallData(initialHallData);
  }, [initialHallData]);

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
      tablesArea.addEventListener('wheel', handleWheel, { passive: false });
      tablesArea.addEventListener('mousedown', handleStartDragView);

      // Принудительно обновляем размеры контейнера
      tablesArea.style.width = `${100 / zoom}%`;
      tablesArea.style.height = `${100 / zoom}%`;

      return () => {
        tablesArea.removeEventListener('wheel', handleWheel);
        tablesArea.removeEventListener('mousedown', handleStartDragView);
      };
    }
  }, [handleWheel, handleStartDragView, zoom]);

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
      // If chair is empty, show popup to select a group
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

  // Handle selecting a client for an empty chair
  const handleSelectClient = (group) => {
    if (selectedTableId !== null && selectedChairIndex !== null) {
      // Create a person object from the group's client info
      const person = {
        name: group.name,
        group: group.name,
        phone: group.phone,
        email: group.email
      };

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

  // Handle adding a new group/client
  const handleAddGroup = () => {
    if (groupName.trim() && guestCount > 0) {
      const newGroup = {
        id: Date.now().toString(),
        name: groupName.trim(),
        phone: groupPhone.trim(),
        email: groupEmail.trim(),
        guestCount: guestCount,
      };

      setGroups([...groups, newGroup]);

      // Reset form
      setGroupName('');
      setGroupPhone('');
      setGroupEmail('');
      setGuestCount(1);
      setShowGroupForm(false);
    }
  };

  // Handle viewing group details
  const handleViewGroupDetails = (group) => {
    setViewingGroupDetails(group);
  };

  // Close group details view
  const closeGroupDetails = () => {
    setViewingGroupDetails(null);
  };

  // Упрощенный обработчик начала перетаскивания
  const handleDragStart = useCallback((group) => {
    // Просто устанавливаем draggingGroup
    setDraggingGroup(group);
  }, []);

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
 // Table details panel component with added client seating functionality
const TableDetailsPanel = () => {
  const details = getTableDetails();
  const [showClientSelection, setShowClientSelection] = useState(false);
  
  if (!details) return null;

  const occupiedPercentage = Math.round((details.occupiedSeats / details.table.chairCount) * 100);
  
  // New function to handle client selection for seating
  const handleSelectClientForSeating = (group) => {
    if (details.availableSeats < group.guestCount) {
      alert(`На столе недостаточно свободных мест для клиента "${group.name}". Нужно: ${group.guestCount}, доступно: ${details.availableSeats}`);
      return;
    }
    
    // Set up pending booking with the selected client
    setPendingBooking({
      tableId: details.table.id,
      group,
      availableSeats: details.availableSeats
    });
    
    // Set default booking times
    const now = new Date();
    setBookingTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    
    // Set default end time 2 hours later
    const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    setBookingEndTime(`${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`);
    
    // Show the booking modal
    setShowBookingModal(true);
    setShowClientSelection(false);
  };

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
          
          {/* Add button to seat a client if there are free seats */}
          {details.availableSeats > 0 && (
            <button
              onClick={() => setShowClientSelection(true)}
              style={{
                width: '100%',
                backgroundColor: '#3498db',
                padding: '8px 12px',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold',
                marginTop: '10px'
              }}
            >
              Посадить клиента
            </button>
          )}
          
          {/* Client selection dropdown panel */}
          {showClientSelection && (
            <div style={{
              marginTop: '10px',
              backgroundColor: '#2c3e50',
              borderRadius: '4px',
              padding: '10px',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#34495e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#eee'
              }} onClick={() => setShowClientSelection(false)}>
                ×
              </div>
              
              <h4 style={{ margin: '0 0 10px 0', color: '#eee', fontSize: '14px' }}>
                Выберите клиента для размещения:
              </h4>
              
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '5px'
              }}>
                {groups.length > 0 ? (
                  groups.map((group, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectClientForSeating(group)}
                      style={{
                        backgroundColor: '#34495e',
                        padding: '10px',
                        borderRadius: '4px',
                        marginBottom: '5px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#2980b9';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#34495e';
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#eee' }}>{group.name}</div>
                        <div style={{ fontSize: '12px', color: '#bbb' }}>
                          {group.guestCount} {group.guestCount === 1 ? 'гость' : group.guestCount < 5 ? 'гостя' : 'гостей'}
                        </div>
                      </div>
                      
                      <div style={{
                        backgroundColor: group.guestCount <= details.availableSeats ? '#27ae60' : '#e74c3c',
                        padding: '3px 6px',
                        borderRadius: '3px',
                        fontSize: '12px',
                        color: 'white'
                      }}>
                        {group.guestCount <= details.availableSeats ? 'Поместится' : 'Не поместится'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{
                    padding: '15px',
                    color: '#bbb',
                    textAlign: 'center',
                    fontStyle: 'italic'
                  }}>
                    Нет доступных клиентов
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CollapsiblePanel>

      {/* Reservation Time Section */}
      {details.bookingInfo && (
        <div style={{
          padding: '15px',
          borderBottom: '1px solid #333',
          marginBottom: '10px'
        }}>
          <h4 style={{
            margin: '0 0 10px 0',
            fontSize: '14px',
            color: '#ccc'
          }}>Время бронирования</h4>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            backgroundColor: '#333',
            padding: '12px',
            borderRadius: '6px',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {details.bookingInfo.time} - {details.bookingInfo.endTime}
              </div>
              {details.bookingInfo.note && (
                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>
                  Примечание: {details.bookingInfo.note}
                </div>
              )}
            </div>

            <div style={{
              backgroundColor: '#2c3e50',
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#3498db'
            }}>
              Бронь
            </div>
          </div>
        </div>
      )}

      <CollapsiblePanel
        title={`Клиенты за столом (${details.seatedPeople.length})`}
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
                    {person.phone && (
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        Телефон: {person.phone}
                      </div>
                    )}
                    {person.email && (
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        Email: {person.email}
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
    </div>
  );
};

  // Client management panel component - Redesigned to be more compact
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
          <h3 style={{ margin: 0 }}>Управление клиентами</h3>
        </div>

        <div style={{ padding: '15px' }}>
          <button
            className="primary-btn"
            onClick={() => setShowGroupForm(true)}
            style={{
              width: '100%',
              backgroundColor: '#2ecc71',
              padding: '12px',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginBottom: '15px'
            }}
          >
            Добавить нового клиента
          </button>

          {/* Quick instructions for users */}
          <div style={{
            backgroundColor: '#2c3e50',
            padding: '10px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#ecf0f1',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>💡</span>
            <div>
              Перетащите клиента на стол для размещения. Нажмите на <strong>i</strong> для просмотра деталей.
            </div>
          </div>

          <div style={{
            marginBottom: '15px',
            borderBottom: '1px solid #3a3a3a',
            paddingBottom: '5px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#aaa',
              marginBottom: '10px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>Клиенты ({groups.length})</span>
              {groups.length > 0 && (
                <span style={{ fontSize: '12px', color: '#777' }}>
                  Всего гостей: {groups.reduce((sum, group) => sum + group.guestCount, 0)}
                </span>
              )}
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '400px',
              overflowY: 'auto',
              paddingRight: '5px'
            }}>
              {groups.length > 0 ? (
                groups.map((group, index) => (
                  <ClientListItem
                    key={index}
                    group={group}
                    onDragStart={handleDragStart}
                    onViewDetails={handleViewGroupDetails}
                  />
                ))
              ) : (
                <div style={{
                  color: '#999',
                  fontStyle: 'italic',
                  padding: '15px 10px',
                  textAlign: 'center',
                  backgroundColor: '#2a2a2a',
                  borderRadius: '6px'
                }}>
                  Нет добавленных клиентов
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Handle table drop handler for groups - updated with useCallback and proper state reset
  const handleTableDrop = useCallback((tableId, group) => {
    console.log('handleTableDrop вызван с:', { tableId, group });

    // Преобразуем tableId в число, если он передается как строка
    const numericTableId = parseInt(tableId, 10) || tableId;

    const table = hallData.tables.find(t => t.id === numericTableId);

    if (!table) {
      console.error(`Стол с ID ${numericTableId} не найден`);
      return;
    }

    // Проверка доступных мест
    const occupiedSeats = table.people ? table.people.filter(Boolean).length : 0;
    const availableSeats = table.chairCount - occupiedSeats;

    if (group.guestCount > availableSeats) {
      alert(`На столе недостаточно свободных мест для клиента "${group.name}". Нужно: ${group.guestCount}, доступно: ${availableSeats}`);
      return;
    }

    // Устанавливаем ожидающее бронирование
    setPendingBooking({
      tableId: numericTableId,
      group,
      availableSeats
    });

    // Set default booking times if they're empty
    const now = new Date();
    setBookingTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);

    // Set default end time 2 hours later
    const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    setBookingEndTime(`${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`);

    // Show the booking modal
    setShowBookingModal(true);
  }, [hallData]);

  useEffect(() => {
    if (showBookingModal) {
      console.log('Booking modal should be visible:', { pendingBooking, showBookingModal });
    }
  }, [showBookingModal, pendingBooking]);

  // Confirm booking and assign seats - Fixed to prevent panel closing and with proper state reset
  const confirmBooking = useCallback(() => {
    console.log('confirmBooking called with:', pendingBooking);

    if (!pendingBooking) {
      // Ensure dragging state is reset
      setDraggingGroup(null);
      return;
    }

    const { tableId, group } = pendingBooking;

    // Add booking time and note to the group
    const bookingDetails = {
      time: bookingTime,
      endTime: bookingEndTime,
      note: bookingNote,
      timestamp: new Date().toISOString()
    };

    console.log('Setting up booking with details:', bookingDetails);

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

          console.log(`Found ${emptySeats.length} empty seats for table ${tableId}`);

          // Place client in first empty seat
          if (emptySeats.length > 0) {
            tablePeople[emptySeats[0]] = {
              name: group.name,
              group: group.name,
              phone: group.phone,
              email: group.email,
              booking: bookingDetails
            };

            // If there are additional guests, create placeholder entries
            // for the remaining seats (up to guestCount)
            for (let i = 1; i < Math.min(group.guestCount, emptySeats.length); i++) {
              tablePeople[emptySeats[i]] = {
                name: `Гость ${group.name} ${i}`,
                group: group.name,
                booking: bookingDetails
              };
            }
          }

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
    notification.textContent = `Клиент "${group.name}" размещен за столом ${tableId}`;
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

    // Ensure dragging state is reset
    setDraggingGroup(null);
  }, [pendingBooking, bookingTime, bookingEndTime, bookingNote]);

  // Cancel booking - Fixed to prevent panel closing with proper state reset
  const cancelBooking = useCallback(() => {
    setShowBookingModal(false);
    setPendingBooking(null);
    setBookingTime('');
    setBookingEndTime('');
    setBookingNote('');

    // Ensure dragging state is reset
    setDraggingGroup(null);
  }, []);

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
          title={peopleOnTable[i] ? `Нажмите, чтобы убрать ${peopleOnTable[i].name}` : "Нажмите, чтобы добавить клиента"}
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
          title={person ? `Нажмите, чтобы убрать ${person.name}` : "Нажмите, чтобы добавить клиента"}
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
          title={person ? `Нажмите, чтобы убрать ${person.name}` : "Нажмите, чтобы добавить клиента"}
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
          title={person ? `Нажмите, чтобы убрать ${person.name}` : "Нажмите, чтобы добавить клиента"}
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
          title={person ? `Нажмите, чтобы убрать ${person.name}` : "Нажмите, чтобы добавить клиента"}
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
    return (
      <div
        className="table-container"
        data-id={table.id} // Важно! Явно устанавливаем ID стола как data-атрибут
        style={{
          position: 'absolute',
          left: `${table.x || 0}px`,
          top: `${table.y || 0}px`,
          padding: '1rem',
          borderRadius: '10px',
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
                <span>Клиенты</span>
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

              {/* Floating action button for clients */}
              {!isSidePanelOpen && (
                <button
                  onClick={() => {
                    setIsSidePanelOpen(true);
                    setSidePanelTab('groups');
                    // Clear any dragging state
                    setDraggingGroup(null);
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
                    Убрать клиента с места?
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
                    {personToRemove?.phone && (
                      <p style={{
                        textAlign: 'center',
                        margin: '0 0 5px 0'
                      }}>
                        Телефон: {personToRemove.phone}
                      </p>
                    )}
                    {personToRemove?.email && (
                      <p style={{
                        textAlign: 'center',
                        margin: 0
                      }}>
                        Email: {personToRemove.email}
                      </p>
                    )}
                  </div>

                  <p style={{
                    textAlign: 'center',
                    marginBottom: '20px',
                    color: '#555'
                  }}>
                    Вы уверены, что хотите убрать этого клиента с места?
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
                // Add Client Popup - Now shows available clients/groups
                <>
                  <h3 style={{
                    textAlign: 'center',
                    marginTop: 0,
                    marginBottom: '20px'
                  }}>
                    Выберите клиента для этого места
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
                    {groups.length > 0 ? (
                      groups.map((group, index) => (
                        <div
                          key={index}
                          onClick={() => handleSelectClient(group)}
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
                            {group.name}
                          </span>
                          <span style={{
                            display: 'block',
                            fontSize: '12px',
                            color: '#666'
                          }}>
                            Гостей: {group.guestCount}
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
                        Нет доступных клиентов
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

        {/* Client creation form - Enhanced with additional fields */}
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
                Добавление нового клиента
              </h3>

              <div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Имя клиента:
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
                    placeholder="Например: Иван Иванов"
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Телефон:
                  </label>
                  <input
                    type="tel"
                    value={groupPhone}
                    onChange={(e) => setGroupPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                    placeholder="+7 (___) ___-__-__"
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Email:
                  </label>
                  <input
                    type="email"
                    value={groupEmail}
                    onChange={(e) => setGroupEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                    placeholder="example@mail.com"
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
                    Добавить клиента
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

        {/* Client details view */}
        {viewingGroupDetails && (
          <div
            className="fullscreen-popup"
            onClick={closeGroupDetails}
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
            <div className="fullscreen-popup-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '20px',
                maxWidth: '500px',
                width: '90%'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                borderBottom: '1px solid #eee',
                paddingBottom: '15px'
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '20px'
                }}>
                  {viewingGroupDetails.name}
                </h3>
                <div style={{
                  backgroundColor: '#3498db',
                  color: 'white',
                  padding: '5px 10px',
                  borderRadius: '15px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {viewingGroupDetails.guestCount} {viewingGroupDetails.guestCount === 1 ? 'гость' : viewingGroupDetails.guestCount < 5 ? 'гостя' : 'гостей'}
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '15px'
                }}>
                  <div style={{
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    padding: '15px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>
                      Телефон
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      {viewingGroupDetails.phone || 'Не указан'}
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    padding: '15px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>
                      Email
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', wordBreak: 'break-all' }}>
                      {viewingGroupDetails.email || 'Не указан'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <button
                  onClick={closeGroupDetails}
                  style={{
                    flex: '1',
                    padding: '10px',
                    backgroundColor: '#7f8c8d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Закрыть
                </button>

                <button
                  onClick={() => {
                    // Find an empty table with enough seats
                    const emptierTables = hallData.tables
                      .filter(table => {
                        const occupiedSeats = (table.people || []).filter(Boolean).length;
                        return (table.chairCount - occupiedSeats) >= viewingGroupDetails.guestCount;
                      })
                      .sort((a, b) => {
                        const aOccupied = (a.people || []).filter(Boolean).length;
                        const bOccupied = (b.people || []).filter(Boolean).length;
                        return (a.chairCount - aOccupied) - (b.chairCount - bOccupied);
                      });

                    if (emptierTables.length > 0) {
                      // Trigger the table drop with the first suitable table
                      handleTableDrop(emptierTables[0].id, viewingGroupDetails);
                      closeGroupDetails();
                    } else {
                      alert('Нет свободных столов с достаточным количеством мест для этого клиента');
                    }
                  }}
                  style={{
                    flex: '1',
                    padding: '10px',
                    backgroundColor: '#2ecc71',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  Разместить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Booking confirmation modal - Fixed to prevent panel closing issue */}
        {showBookingModal && pendingBooking && (
          <div
            className="fullscreen-popup"
            onClick={(e) => e.stopPropagation()} // Prevent click propagation
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
              onClick={(e) => e.stopPropagation()} // Prevent click propagation
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
                    <p style={{ margin: '0 0 8px 0' }}><strong>Клиент:</strong> {pendingBooking.group.name}</p>
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