import React, { useState, useEffect, useRef } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// Helper functions remain the same
const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}.${month}.${year}`;
};

// Function to find closest available time
const findNextAvailableTime = (occupiedSlots, startHour = 12) => {
  // Start checking from the provided hour
  for (let hour = startHour; hour < 24; hour++) {
    for (let minute of ['00', '15', '30', '45']) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:${minute}`;
      if (!occupiedSlots.includes(timeSlot)) {
        return timeSlot;
      }
    }
  }
  // If no slots found after startHour, check earlier hours
  for (let hour = 0; hour < startHour; hour++) {
    for (let minute of ['00', '15', '30', '45']) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:${minute}`;
      if (!occupiedSlots.includes(timeSlot)) {
        return timeSlot;
      }
    }
  }

  return "12:00"; // Default fallback
};

// Helper function to process shape positions
const processShapePosition = (shape) => {
  let displayX, displayY;

  switch (shape.type) {
    case 'rect':
      if (shape.centerX !== undefined && shape.centerY !== undefined) {
        displayX = shape.centerX - (shape.width || 100) / 2;
        displayY = shape.centerY - (shape.height || 50) / 2;
      } else {
        displayX = shape.x || 0;
        displayY = shape.y || 0;
      }
      break;

    case 'circle':
      if (shape.centerX !== undefined && shape.centerY !== undefined) {
        displayX = shape.centerX - (shape.radius || 50);
        displayY = shape.centerY - (shape.radius || 50);
      } else {
        displayX = shape.x || 0;
        displayY = shape.y || 0;
      }
      break;

    case 'text':
      displayX = shape.x || 0;
      displayY = shape.y || 0;
      break;

    case 'line':
      if (shape.points && shape.points.length >= 2) {
        displayX = shape.points[0];
        displayY = shape.points[1];
      } else {
        displayX = shape.x || 0;
        displayY = shape.y || 0;
      }
      break;

    default:
      displayX = shape.x || 0;
      displayY = shape.y || 0;
  }

  return { displayX, displayY };
};

const SimpleSeatingApp = () => {
  const [hallData, setHallData] = useState(null);
  const [scale, setScale] = useState(1);
  const [zoom, setZoom] = useState(0.2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Простые состояния для рассадки
  const [selectedChair, setSelectedChair] = useState(null); // {tableId, chairIndex}
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [personName, setPersonName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groups, setGroups] = useState([
    { id: 'family', name: 'Семья', color: '#e74c3c' },
    { id: 'friends', name: 'Друзья', color: '#3498db' },
    { id: 'colleagues', name: 'Коллеги', color: '#2ecc71' },
    { id: 'vip', name: 'VIP гости', color: '#f39c12' }
  ]);
  const [showGroupsPanel, setShowGroupsPanel] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);

  // Shapes state
  const [shapes, setShapes] = useState([]);

  const tablesAreaRef = useRef(null);
  const zoomRef = useRef(0.2);

  // View dragging state
  const [isDraggingView, setIsDraggingView] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const [initialScrollPosition, setInitialScrollPosition] = useState({ x: 0, y: 0 });

  // Enhanced touch state for mobile pinch zoom
  const touchDistanceRef = useRef(null);
  const zoomOperationInProgress = useRef(false);
  const lastZoomUpdateTime = useRef(0);

  // Загрузка данных
  useEffect(() => {
    const savedHallData = localStorage.getItem('hallData');
    const savedGroups = localStorage.getItem('seatingGroups');
    
    if (savedHallData) {
      try {
        const parsedData = JSON.parse(savedHallData);
        setHallData(parsedData);

        if (parsedData.shapes && Array.isArray(parsedData.shapes)) {
          setShapes(parsedData.shapes);
        }

        if (parsedData.canvasData && parsedData.canvasData.zoom) {
          const canvasZoom = Math.max(parsedData.canvasData.zoom, 0.1);
          setZoom(canvasZoom);
          zoomRef.current = canvasZoom;
        }
      } catch (e) {
        console.error("Error loading saved hall data:", e);
      }
    }

    if (savedGroups) {
      try {
        const parsedGroups = JSON.parse(savedGroups);
        setGroups(parsedGroups);
      } catch (e) {
        console.error("Error loading groups:", e);
      }
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      var zoomOutBtn = window.document.getElementById('zoomOutBtn');
      if (zoomOutBtn) {
        zoomOutBtn.click();
      }
    }, 200)
  }, []);

  useEffect(() => {
    if (tablesAreaRef.current && hallData) {
      const tables = hallData.tables || [];

      const positions = tables.map(t => {
        const rawLeft = t.renderingOptions?.left ?? t.x ?? 0;
        const rawTop = t.renderingOptions?.top ?? t.y ?? 0;
        const width = t.renderingOptions?.width ?? t.width ?? (t.shape !== 'rectangle' ? 300 : 400);
        const height = t.renderingOptions?.height ?? t.height ?? (t.shape !== 'rectangle' ? 300 : 150);
        const scaleX = t.renderingOptions?.scaleX ?? 1;
        const scaleY = t.renderingOptions?.scaleY ?? 1;

        const leftBound = rawLeft - (width * scaleX) / 2;
        const topBound = rawTop - (height * scaleY) / 2;
        const rightBound = rawLeft + (width * scaleX) / 2;
        const bottomBound = rawTop + (height * scaleY) / 2;

        return { leftBound, topBound, rightBound, bottomBound };
      });

      if (positions.length > 0) {
        const minX = Math.min(...positions.map(p => p.leftBound)) - 200;
        const minY = Math.min(...positions.map(p => p.topBound)) - 200;
        const maxX = Math.max(...positions.map(p => p.rightBound)) + 200;
        const maxY = Math.max(...positions.map(p => p.bottomBound)) + 200;

        const totalWidth = maxX - minX;
        const totalHeight = maxY - minY;

        tablesAreaRef.current.style.minWidth = `${totalWidth}px`;
        tablesAreaRef.current.style.minHeight = `${totalHeight}px`;

        if (minX < 0 || minY < 0) {
          const offsetX = Math.max(0, -minX);
          const offsetY = Math.max(0, -minY);

          const tablesContent = document.querySelector('.tables-content');
          if (tablesContent) {
            tablesContent.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
          }
        }
      }
    }
  }, [hallData, zoom]);

  // Загрузка файла
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

        if (parsedData.shapes && Array.isArray(parsedData.shapes)) {
          setShapes(parsedData.shapes);
        } else {
          setShapes([]);
        }

        if (parsedData.canvasData && parsedData.canvasData.zoom) {
          const canvasZoom = Math.max(parsedData.canvasData.zoom, 0.1);
          setZoom(canvasZoom);
          zoomRef.current = canvasZoom;
        }

        localStorage.setItem('hallData', JSON.stringify(parsedData));
        setIsLoading(false);

      } catch (error) {
        console.error("Error parsing JSON:", error);
        setError("Ошибка при чтении JSON файла. Проверьте формат файла.");
        setIsLoading(false);
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  // Функции для работы с рассадкой
  const handleChairClick = (tableId, chairIndex) => {
    setSelectedChair({ tableId, chairIndex });
    
    // Проверяем есть ли уже человек на этом стуле
    const table = hallData.tables.find(t => t.id === tableId);
    if (table && table.people && table.people[chairIndex]) {
      setPersonName(table.people[chairIndex].name || '');
      setSelectedGroup(table.people[chairIndex].groupId || '');
    } else {
      setPersonName('');
      setSelectedGroup('');
    }
    
    setShowPersonModal(true);
  };

  const savePerson = () => {
    if (!personName.trim()) {
      alert('Введите имя!');
      return;
    }

    setHallData(prevData => {
      const updatedTables = prevData.tables.map(t => {
        if (t.id === selectedChair.tableId) {
          const tablePeople = [...(t.people || [])];
          
          tablePeople[selectedChair.chairIndex] = {
            name: personName.trim(),
            groupId: selectedGroup,
            isMainGuest: true
          };

          return {
            ...t,
            people: tablePeople
          };
        }
        return t;
      });

      const updatedHallData = {
        ...prevData,
        tables: updatedTables,
        shapes: shapes
      };

      localStorage.setItem('hallData', JSON.stringify(updatedHallData));
      return updatedHallData;
    });

    resetPersonModal();
  };

  const removePerson = () => {
    setHallData(prevData => {
      const updatedTables = prevData.tables.map(t => {
        if (t.id === selectedChair.tableId) {
          const tablePeople = [...(t.people || [])];
          tablePeople[selectedChair.chairIndex] = null;

          return {
            ...t,
            people: tablePeople
          };
        }
        return t;
      });

      const updatedHallData = {
        ...prevData,
        tables: updatedTables,
        shapes: shapes
      };

      localStorage.setItem('hallData', JSON.stringify(updatedHallData));
      return updatedHallData;
    });

    resetPersonModal();
  };

  const resetPersonModal = () => {
    setShowPersonModal(false);
    setSelectedChair(null);
    setPersonName('');
    setSelectedGroup('');
  };

  // Функции для работы с группами
  const addGroup = () => {
    if (!newGroupName.trim()) {
      alert('Введите название группы!');
      return;
    }

    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
    const usedColors = groups.map(g => g.color);
    const availableColor = colors.find(color => !usedColors.includes(color)) || '#95a5a6';

    const newGroup = {
      id: 'group_' + Date.now(),
      name: newGroupName.trim(),
      color: availableColor
    };

    const updatedGroups = [...groups, newGroup];
    setGroups(updatedGroups);
    localStorage.setItem('seatingGroups', JSON.stringify(updatedGroups));
    
    setNewGroupName('');
    setShowAddGroupModal(false);
  };

  const removeGroup = (groupId) => {
    const updatedGroups = groups.filter(g => g.id !== groupId);
    setGroups(updatedGroups);
    localStorage.setItem('seatingGroups', JSON.stringify(updatedGroups));
  };

  const getGroupColor = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.color : '#95a5a6';
  };

  // Zoom functions
  const applyZoom = (newZoom, centerX, centerY) => {
    if (!tablesAreaRef.current) return;

    const currentZoom = zoomRef.current;
    const containerRect = tablesAreaRef.current.getBoundingClientRect();
    const scrollLeft = tablesAreaRef.current.scrollLeft;
    const scrollTop = tablesAreaRef.current.scrollTop;

    const relX = (centerX - containerRect.left) / containerRect.width;
    const relY = (centerY - containerRect.top) / containerRect.height;

    const docX = scrollLeft + relX * containerRect.width;
    const docY = scrollTop + relY * containerRect.height;

    const unzoomedX = docX / currentZoom;
    const unzoomedY = docY / currentZoom;

    const newScrollLeft = unzoomedX * newZoom - relX * containerRect.width;
    const newScrollTop = unzoomedY * newZoom - relY * containerRect.height;

    zoomRef.current = newZoom;

    if (Math.abs(newZoom - zoom) > 0.01) {
      setZoom(newZoom);
    }

    tablesAreaRef.current.scrollLeft = newScrollLeft;
    tablesAreaRef.current.scrollTop = newScrollTop;
  };

  const throttledZoom = (newZoom, centerX, centerY) => {
    const now = Date.now();
    if (now - lastZoomUpdateTime.current > 50) {
      lastZoomUpdateTime.current = now;
      applyZoom(newZoom, centerX, centerY);
    } else {
      if (!zoomOperationInProgress.current) {
        zoomOperationInProgress.current = true;
        window.requestAnimationFrame(() => {
          applyZoom(newZoom, centerX, centerY);
          zoomOperationInProgress.current = false;
        });
      }
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomRef.current * 1.2, 1.0);
    if (!tablesAreaRef.current) return;

    const rect = tablesAreaRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    applyZoom(newZoom, centerX, centerY);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomRef.current / 1.2, 0.2);
    if (!tablesAreaRef.current) return;

    const rect = tablesAreaRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    applyZoom(newZoom, centerX, centerY);
  };

  const handleWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault();

      let newZoom;
      if (e.deltaY < 0) {
        newZoom = Math.min(zoomRef.current * 1.1, 1.0);
      } else {
        newZoom = Math.max(zoomRef.current / 1.1, 0.2);
      }

      throttledZoom(newZoom, e.clientX, e.clientY);
    }
  };

  // Touch events
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      touchDistanceRef.current = {
        distance,
        centerX,
        centerY,
        initialZoom: zoomRef.current
      };
    } else if (e.touches.length === 1) {
      if (!e.target.closest('.table-container, button, .hall-element, input, select, textarea')) {
        e.preventDefault();
        setIsDraggingView(true);
        setDragStartPosition({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        });
        setInitialScrollPosition({
          x: tablesAreaRef.current.scrollLeft,
          y: tablesAreaRef.current.scrollTop
        });
      }
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchDistanceRef.current) {
      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const newDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      const scale = newDistance / touchDistanceRef.current.distance;
      const newZoom = Math.min(Math.max(touchDistanceRef.current.initialZoom * scale, 0.2), 1.0);

      const newCenterX = (touch1.clientX + touch2.clientX) / 2;
      const newCenterY = (touch1.clientY + touch2.clientY) / 2;

      throttledZoom(newZoom, newCenterX, newCenterY);
    } else if (e.touches.length === 1 && isDraggingView) {
      e.preventDefault();

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;

      const dx = currentX - dragStartPosition.x;
      const dy = currentY - dragStartPosition.y;

      if (tablesAreaRef.current) {
        tablesAreaRef.current.scrollLeft = initialScrollPosition.x - dx;
        tablesAreaRef.current.scrollTop = initialScrollPosition.y - dy;
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length === 0) {
      touchDistanceRef.current = null;
      setIsDraggingView(false);
    } else if (e.touches.length === 1 && touchDistanceRef.current) {
      touchDistanceRef.current = null;

      setIsDraggingView(true);
      setDragStartPosition({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });

      if (tablesAreaRef.current) {
        setInitialScrollPosition({
          x: tablesAreaRef.current.scrollLeft,
          y: tablesAreaRef.current.scrollTop
        });
      }
    }
  };

  // Mouse drag handlers
  const handleStartDragView = (e) => {
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

  const handleDragView = (e) => {
    if (!isDraggingView) return;

    if (tablesAreaRef.current) {
      const dx = e.clientX - dragStartPosition.x;
      const dy = e.clientY - dragStartPosition.y;

      tablesAreaRef.current.scrollLeft = initialScrollPosition.x - dx;
      tablesAreaRef.current.scrollTop = initialScrollPosition.y - dy;
    }
  };

  const handleEndDragView = () => {
    setIsDraggingView(false);
  };

  useEffect(() => {
    zoomRef.current = zoom;

    const tablesArea = tablesAreaRef.current;
    if (tablesArea) {
      tablesArea.addEventListener('wheel', handleWheel, { passive: false });
      tablesArea.addEventListener('mousedown', handleStartDragView);
      tablesArea.addEventListener('touchstart', handleTouchStart, { passive: false });
      tablesArea.addEventListener('touchmove', handleTouchMove, { passive: false });
      tablesArea.addEventListener('touchend', handleTouchEnd);
      tablesArea.addEventListener('touchcancel', handleTouchEnd);

      return () => {
        tablesArea.removeEventListener('wheel', handleWheel);
        tablesArea.removeEventListener('mousedown', handleStartDragView);
        tablesArea.removeEventListener('touchstart', handleTouchStart);
        tablesArea.removeEventListener('touchmove', handleTouchMove);
        tablesArea.removeEventListener('touchend', handleTouchEnd);
        tablesArea.removeEventListener('touchcancel', handleTouchEnd);
      };
    }
  }, [zoom]);

  useEffect(() => {
    if (isDraggingView) {
      document.addEventListener('mousemove', handleDragView);
      document.addEventListener('mouseup', handleEndDragView);

      return () => {
        document.removeEventListener('mousemove', handleDragView);
        document.removeEventListener('mouseup', handleEndDragView);
      };
    }
  }, [isDraggingView]);

  // RENDER TABLE COMPONENT - НЕ ИЗМЕНЯЕМ!
  const TableComponent = ({ table }) => {
    const chairCount = table.chairCount || 12;

    const getRenderingPosition = () => {
      const rawLeft = table.renderingOptions?.left ?? table.x ?? 0;
      const rawTop = table.renderingOptions?.top ?? table.y ?? 0;
      const angle = table.renderingOptions?.angle ?? table.rotation ?? 0;
      const scaleX = table.renderingOptions?.scaleX ?? 1;
      const scaleY = table.renderingOptions?.scaleY ?? 1;

      const baseWidth = table.renderingOptions?.width ?? table.width ?? (isRound ? 300 : 400);
      const baseHeight = table.renderingOptions?.height ?? table.height ?? (isRound ? 300 : 150);

      const left = rawLeft - (baseWidth * scaleX) / 2;
      const top = rawTop - (baseHeight * scaleY) / 2;

      const width = baseWidth * scaleX;
      const height = baseHeight * scaleY;

      return { left, top, angle, scaleX, scaleY, width, height };
    };

    const position = getRenderingPosition();
    const isRound = table.shape !== 'rectangle';

    const tableWidth = position.width;
    const tableHeight = position.height;

    const renderChairsForRoundTable = () => {
      const chairs = [];
      const borderWidth = -20;
      const baseRadius = Math.min(tableWidth, tableHeight) / 2;
      const radius = baseRadius + borderWidth + 5;

      const chairSize = Math.max(30, Math.min(50, tableWidth * 0.13));
      const labelFontSize = Math.max(8, Math.min(12, tableWidth * 0.035));

      for (let i = 0; i < chairCount; i++) {
        const angle = (Math.PI * 2 * i) / chairCount;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);

        const person = table.people && table.people[i];
        const isOccupied = Boolean(person);

        chairs.push(
          <div key={i} style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%)`,
            pointerEvents: 'auto'
          }}>
            {/* Chair */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleChairClick(table.id, i);
              }}
              style={{
                position: 'absolute',
                left: `${x - chairSize / 2}px`,
                top: `${y - chairSize / 2}px`,
                width: `${chairSize}px`,
                height: `${chairSize}px`,
                borderRadius: '50%',
                backgroundColor: isOccupied ? (person.groupId ? getGroupColor(person.groupId) : '#c12f2f') : '#28592a',
                transform: `rotate(${(angle * 180 / Math.PI) + 90}deg)`,
                transformOrigin: 'center',
                zIndex: 1,
                border: `${Math.max(1, chairSize * 0.05)}px solid #1a1a1a`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                cursor: 'pointer'
              }}
            />

            {/* Name label */}
            {isOccupied && person && person.name && (
              <div
                style={{
                  position: 'absolute',
                  left: `${x - chairSize * 0.7}px`,
                  top: `${y + chairSize * 0.6}px`,
                  width: `${chairSize * 1.4}px`,
                  fontSize: `${labelFontSize}px`,
                  fontFamily: 'Arial',
                  color: '#211812',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  textAlign: 'center',
                  borderRadius: '3px',
                  padding: '2px',
                  zIndex: 2,
                  pointerEvents: 'none',
                  border: '1px solid #ccc',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}
              >
                {person.name}
              </div>
            )}
          </div>
        );
      }

      return chairs;
    };

    const renderChairsForRectangleTable = () => {
      const chairs = [];

      const chairsTop = Math.ceil(chairCount / 2);
      const chairsBottom = chairCount - chairsTop;
      let currentChairIndex = 0;

      const horizontalSpacing = Math.max(80, tableWidth * 0.2);
      const verticalSpacing = 50;
      const chairSize = 40;
      const labelFontSize = 10;

      // Top chairs
      for (let i = 0; i < chairsTop; i++) {
        const ratio = chairsTop === 1 ? 0.5 : i / (chairsTop - 1);
        const x = ((tableWidth - horizontalSpacing) * ratio) - (tableWidth / 2) + (horizontalSpacing / 2);
        const y = -(tableHeight / 2) - verticalSpacing;

        const person = table.people && table.people[currentChairIndex];
        const isOccupied = Boolean(person);

        chairs.push(
          <div key={currentChairIndex} style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%)`,
            pointerEvents: 'auto'
          }}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleChairClick(table.id, currentChairIndex);
              }}
              style={{
                position: 'absolute',
                left: `${x - chairSize / 2}px`,
                top: `${y - chairSize / 2}px`,
                width: `${chairSize}px`,
                height: `${chairSize}px`,
                borderRadius: '50%',
                backgroundColor: isOccupied ? (person.groupId ? getGroupColor(person.groupId) : '#c12f2f') : '#28592a',
                zIndex: 1,
                border: `2px solid #1a1a1a`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                cursor: 'pointer'
              }}
            />

            {isOccupied && person && person.name && (
              <div
                style={{
                  position: 'absolute',
                  left: `${x - chairSize * 0.7}px`,
                  top: `${y + chairSize * 0.6}px`,
                  width: `${chairSize * 1.4}px`,
                  fontSize: `${labelFontSize}px`,
                  fontFamily: 'Arial',
                  color: '#211812',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  textAlign: 'center',
                  borderRadius: '3px',
                  padding: '2px',
                  zIndex: 2,
                  pointerEvents: 'none',
                  border: '1px solid #ccc',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}
              >
                {person.name}
              </div>
            )}
          </div>
        );

        currentChairIndex++;
      }

      // Bottom chairs
      for (let i = 0; i < chairsBottom; i++) {
        const ratio = chairsBottom === 1 ? 0.5 : i / (chairsBottom - 1);
        const x = ((tableWidth - horizontalSpacing) * ratio) - (tableWidth / 2) + (horizontalSpacing / 2);
        const y = (tableHeight / 2) + verticalSpacing;

        const person = table.people && table.people[currentChairIndex];
        const isOccupied = Boolean(person);

        chairs.push(
          <div key={currentChairIndex} style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%)`,
            pointerEvents: 'auto'
          }}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                handleChairClick(table.id, currentChairIndex);
              }}
              style={{
                position: 'absolute',
                left: `${x - chairSize / 2}px`,
                top: `${y - chairSize / 2}px`,
                width: `${chairSize}px`,
                height: `${chairSize}px`,
                borderRadius: '50%',
                backgroundColor: isOccupied ? (person.groupId ? getGroupColor(person.groupId) : '#c12f2f') : '#28592a',
                zIndex: 1,
                border: `2px solid #1a1a1a`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                cursor: 'pointer'
              }}
            />

            {isOccupied && person && person.name && (
              <div
                style={{
                  position: 'absolute',
                  left: `${x - chairSize * 0.7}px`,
                  top: `${y + chairSize * 0.6}px`,
                  width: `${chairSize * 1.4}px`,
                  fontSize: `${labelFontSize}px`,
                  fontFamily: 'Arial',
                  color: '#211812',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  textAlign: 'center',
                  borderRadius: '3px',
                  padding: '2px',
                  zIndex: 2,
                  pointerEvents: 'none',
                  border: '1px solid #ccc',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}
              >
                {person.name}
              </div>
            )}
          </div>
        );

        currentChairIndex++;
      }

      return chairs;
    };

    return (
      <div
        className="table-container"
        data-id={table.id}
        style={{
          position: 'absolute',
          left: `${position.left}px`,
          top: `${position.top}px`,
          cursor: 'default',
          transformOrigin: 'center center',
          zIndex: 10,
          width: `${tableWidth}px`,
          height: `${tableHeight}px`
        }}
      >
        <div style={{ position: 'relative' }}>
          {isRound ? (
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: `${tableWidth}px`,
                  height: `${tableHeight}px`,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    width: `${tableWidth - 40}px`,
                    height: `${tableHeight - 40}px`,
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    opacity: 0.8
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: '25px',
                    left: '25px',
                    width: `${tableWidth - 50}px`,
                    height: `${tableHeight - 50}px`,
                    borderRadius: '50%',
                    backgroundColor: '#e0d6cc',
                    border: '20px solid #a67c52',
                    boxSizing: 'border-box'
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '20px',
                    fontFamily: 'Arial',
                    color: '#374151',
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '8px',
                    borderRadius: '6px',
                    lineHeight: 1.2,
                    zIndex: 3,
                    fontWeight: 'bold',
                    border: '1px solid #ddd',
                    overflow: 'hidden'
                  }}
                >
                  {table.name || `Стол ${table.id}`}<br />
                  {chairCount} мест
                </div>
              </div>

              {renderChairsForRoundTable()}
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: `${tableWidth}px`,
                  height: `${tableHeight}px`,
                  backgroundColor: '#e7d8c7',
                  border: '20px solid #7b5c3e',
                  borderRadius: '8px',
                  position: 'relative',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    width: `${tableWidth - 40}px`,
                    height: `${tableHeight - 40}px`,
                    backgroundColor: '#ffffff',
                    opacity: 0.8,
                    borderRadius: '5px'
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: '25px',
                    left: '25px',
                    width: `${tableWidth - 50}px`,
                    height: `${tableHeight - 50}px`,
                    backgroundColor: '#e7d8c7',
                    borderRadius: '3px'
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '20px',
                    fontFamily: 'Arial',
                    color: '#374151',
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '8px',
                    borderRadius: '6px',
                    lineHeight: 1.2,
                    zIndex: 3,
                    fontWeight: 'bold',
                    border: '1px solid #ddd'
                  }}
                >
                  {table.name || `Стол ${table.id}`}<br />
                  {chairCount} мест
                </div>
              </div>

              {renderChairsForRectangleTable()}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="simple-seating-container" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
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
        <div style={{
          fontSize: '20px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap'
        }}>
          {hallData?.name || 'Рассадка гостей'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Groups button */}
          <button
            onClick={() => setShowGroupsPanel(true)}
            style={{
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Группы ({groups.length})
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <button id='zoomOutBtn'
              onClick={handleZoomOut}
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
              aria-label="Уменьшить"
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
              onClick={handleZoomIn}
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
              aria-label="Увеличить"
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
              Импорт плана
            </label>
            {isLoading && <div className="loading-indicator">Загрузка...</div>}
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="main-content" style={{
        flex: 1,
        width: '100%',
        height: 'calc(100vh - 60px)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div className="zoom-container">
          <TransformWrapper
            initialScale={1}
            minScale={0.1}
            maxScale={4}
            limitToBounds={false}
            doubleClick={{ disabled: true }}
            pinch={{ step: 5 }}
            wheel={{ step: 0.05 }}
            onZoomChange={({ state }) => setScale(state.scale)}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div style={{
                  position: 'fixed',
                  bottom: '20px',
                  right: '20px',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <button
                    onClick={() => zoomIn(0.2)}
                    style={{
                      padding: '12px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      border: '2px solid #ddd',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}
                  >
                    +
                  </button>
                  <button
                    onClick={() => zoomOut(0.2)}
                    style={{
                      padding: '12px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      border: '2px solid #ddd',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}
                  >
                    -
                  </button>
                  <button
                    onClick={() => resetTransform()}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'white',
                      borderRadius: '20px',
                      border: '2px solid #ddd',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    Reset
                  </button>
                </div>

                <div style={{
                  position: 'fixed',
                  top: '70px',
                  left: '20px',
                  zIndex: 10,
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  Масштаб: {Math.round(scale * 100)}%
                </div>

                <TransformComponent
                  wrapperStyle={{ width: "100%", height: "100vh" }}
                  contentStyle={{ width: "100%", height: "100%" }}
                  className="tables-area"
                  ref={tablesAreaRef}
                >
                  {hallData ? (
                    <div
                      className="tables-content"
                      style={{
                        position: 'relative',
                        minWidth: '3000px',
                        minHeight: '3000px',
                        willChange: 'transform'
                      }}
                    >
                      {/* Render shapes */}
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                        {shapes.map(shape => {
                          const { displayX, displayY } = processShapePosition(shape);

                          switch (shape.type) {
                            case 'rect':
                              return (
                                <div
                                  key={shape.id}
                                  style={{
                                    position: 'absolute',
                                    left: `${displayX}px`,
                                    top: `${displayY}px`,
                                    width: `${shape.width}px`,
                                    height: `${shape.height}px`,
                                    border: `${shape.strokeWidth || 2}px solid ${shape.color}`,
                                    backgroundColor: shape.fill === 'transparent' ? 'transparent' : (shape.fill || 'transparent'),
                                    pointerEvents: 'none',
                                    boxSizing: 'border-box',
                                    transform: `rotate(${shape.rotation || 0}deg)`,
                                    transformOrigin: '50% 50%',
                                  }}
                                />
                              );

                            case 'circle':
                              return (
                                <div
                                  key={shape.id}
                                  style={{
                                    position: 'absolute',
                                    left: `${displayX}px`,
                                    top: `${displayY}px`,
                                    width: `${(shape.radius || 50) * 2}px`,
                                    height: `${(shape.radius || 50) * 2}px`,
                                    borderRadius: '50%',
                                    border: `${shape.strokeWidth || 2}px solid ${shape.color}`,
                                    backgroundColor: shape.fill === 'transparent' ? 'transparent' : (shape.fill || 'transparent'),
                                    pointerEvents: 'none',
                                    boxSizing: 'border-box',
                                    transform: `rotate(${shape.rotation || 0}deg)`,
                                    transformOrigin: '50% 50%',
                                  }}
                                />
                              );

                            case 'text':
                              return (
                                <div
                                  key={shape.id}
                                  style={{
                                    position: 'absolute',
                                    left: `${displayX}px`,
                                    top: `${displayY}px`,
                                    color: shape.color,
                                    fontSize: `${shape.fontSize || 16}px`,
                                    fontFamily: shape.fontFamily || 'Arial, sans-serif',
                                    pointerEvents: 'none',
                                    whiteSpace: 'nowrap',
                                    transform: `rotate(${shape.rotation || 0}deg)`,
                                    transformOrigin: '0 0',
                                    fontWeight: shape.fontFamily === 'Serif' ? 'bold' : 'normal'
                                  }}
                                >
                                  {shape.text}
                                </div>
                              );

                            case 'line':
                              if (shape.points && shape.points.length >= 4) {
                                const [x1, y1, x2, y2] = shape.points;
                                const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                                const baseAngle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
                                const totalAngle = baseAngle + (shape.rotation || 0);

                                return (
                                  <div
                                    key={shape.id}
                                    style={{
                                      position: 'absolute',
                                      left: `${x1}px`,
                                      top: `${y1}px`,
                                      width: `${length}px`,
                                      height: `${shape.strokeWidth || 2}px`,
                                      backgroundColor: shape.color,
                                      transformOrigin: '0 50%',
                                      transform: `rotate(${totalAngle}deg)`,
                                      pointerEvents: 'none'
                                    }}
                                  />
                                );
                              }
                              return null;

                            default:
                              return null;
                          }
                        })}
                      </div>

                      {/* Render tables */}
                      {hallData.tables && hallData.tables.map((table) => (
                        <TableComponent key={table.id} table={table} />
                      ))}

                      {/* Render hall elements */}
                      {hallData.hallElements && hallData.hallElements.map(element => (
                        <div
                          key={element.id}
                          className="hall-element"
                          style={{
                            position: 'absolute',
                            left: `${element.x}px`,
                            top: `${element.y}px`,
                            transform: `rotate(${element.rotation || 0}deg)`,
                            opacity: element.opacity || 1,
                            zIndex: 2
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
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      width: '100%',
                      flexDirection: 'column',
                      padding: '20px'
                    }}>
                      <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                        textAlign: 'center',
                        maxWidth: '500px',
                        width: '90%'
                      }}>
                        <h2 style={{ marginTop: 0 }}>Система рассадки гостей</h2>
                        <p>Загрузите план зала для начала работы</p>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileUpload}
                          id="import-file-center"
                          style={{ display: 'none' }}
                        />
                        <label
                          htmlFor="import-file-center"
                          style={{
                            backgroundColor: '#2ecc71',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '12px 24px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            display: 'inline-block',
                            marginTop: '15px',
                            fontWeight: 'bold'
                          }}
                        >
                          Загрузить план зала
                        </label>
                      </div>
                    </div>
                  )}
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>
      </div>

      {/* Mobile instructions */}
      {hallData && (
        <div style={{
          position: 'absolute',
          bottom: '15px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 15px',
          borderRadius: '20px',
          fontSize: '12px',
          zIndex: 10,
          textAlign: 'center',
          pointerEvents: 'none',
          opacity: '0.8',
          display: window.innerWidth <= 768 ? 'block' : 'none'
        }}>
          Нажмите на стул для рассадки гостей
        </div>
      )}

      {/* Person Modal */}
      {showPersonModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            width: '100%',
            maxWidth: '400px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
          }}>
            <button
              onClick={resetPersonModal}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                fontWeight: 'bold',
                cursor: 'pointer',
                color: '#777',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>

            <h2 style={{
              textAlign: 'center',
              margin: '0 0 25px 0',
              fontSize: '24px',
              color: '#333'
            }}>
              {selectedChair ? `Стол ${selectedChair.tableId} • Место ${selectedChair.chairIndex + 1}` : 'Рассадка'}
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                Имя гостя:
              </label>
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Введите имя"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #ddd',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  backgroundColor: '#f9f9f9'
                }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                Группа:
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #ddd',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  backgroundColor: '#f9f9f9'
                }}
              >
                <option value="">Без группы</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{
              display: 'flex',
              gap: '10px',
              flexDirection: 'column'
            }}>
              <button
                onClick={savePerson}
                style={{
                  padding: '14px',
                  backgroundColor: '#2ecc71',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  boxShadow: '0 4px 6px rgba(46, 204, 113, 0.2)',
                  width: '100%'
                }}
              >
                Сохранить
              </button>

              {/* Show remove button only if person exists */}
              {selectedChair && hallData.tables?.find(t => t.id === selectedChair.tableId)?.people?.[selectedChair.chairIndex] && (
                <button
                  onClick={removePerson}
                  style={{
                    padding: '14px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    width: '100%'
                  }}
                >
                  Убрать гостя
                </button>
              )}

              <button
                onClick={resetPersonModal}
                style={{
                  padding: '14px',
                  backgroundColor: '#f1f1f1',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  width: '100%'
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Groups Panel */}
      {showGroupsPanel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
          }}>
            <button
              onClick={() => setShowGroupsPanel(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                fontWeight: 'bold',
                cursor: 'pointer',
                color: '#777'
              }}
            >
              ×
            </button>

            <h2 style={{
              textAlign: 'center',
              margin: '0 0 25px 0',
              fontSize: '24px',
              color: '#333'
            }}>
              Управление группами
            </h2>

            <button
              onClick={() => setShowAddGroupModal(true)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                marginBottom: '20px'
              }}
            >
              + Добавить группу
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {groups.map(group => (
                <div key={group.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '15px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#f9f9f9'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: group.color
                    }}></div>
                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                      {group.name}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => removeGroup(group.id)}
                    style={{
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '5px 10px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>

            {groups.length === 0 && (
              <div style={{
                textAlign: 'center',
                color: '#666',
                fontStyle: 'italic',
                padding: '20px'
              }}>
                Группы не созданы
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Group Modal */}
      {showAddGroupModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ textAlign: 'center', marginTop: 0, marginBottom: '20px' }}>
              Новая группа
            </h3>

            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Название группы"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #ddd',
                fontSize: '16px',
                boxSizing: 'border-box',
                marginBottom: '20px'
              }}
              autoFocus
            />

            <div style={{
              display: 'flex',
              gap: '10px'
            }}>
              <button
                onClick={addGroup}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#2ecc71',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Создать
              </button>
              
              <button
                onClick={() => {
                  setShowAddGroupModal(false);
                  setNewGroupName('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#f1f1f1',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleSeatingApp;