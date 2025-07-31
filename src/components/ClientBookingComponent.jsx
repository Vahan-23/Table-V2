import React, { useState, useEffect, useRef } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// Helper functions remain the same
const parseTimeToMinutes = (timeString) => {
  if (!timeString) return 0;
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatDateToYMD = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimeDisplay = (timeString) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  return `${hours}:${minutes}`;
};

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

// Helper function to get event emoji
const getEventTypeEmoji = (type) => {
  const types = {
    'birthday': '🎂',
    'business': '💼',
    'party': '🎉',
    'romantic': '❤️',
    'family': '👨‍👩‍👧‍👦',
    'other': '✨'
  };
  return types[type] || '';
};

// Helper function to get event type name
const getEventTypeName = (type) => {
  const types = {
    'birthday': 'День Рождения',
    'business': 'Деловая Встреча',
    'party': 'Вечеринка',
    'romantic': 'Романтический Ужин',
    'family': 'Семейный Ужин',
    'other': 'Другое'
  };
  return types[type] || '';
};

const ClientBookingComponent = () => {
  const [hallData, setHallData] = useState(null);
  const [scale, setScale] = useState(1);
  const [zoom, setZoom] = useState(0.2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingEndTime, setBookingEndTime] = useState('');
  const [bookingNote, setBookingNote] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [guestCount, setGuestCount] = useState(1);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingSummary, setBookingSummary] = useState(null);
  const [occupiedSlots, setOccupiedSlots] = useState([]);
  const [bookingType, setBookingType] = useState('');
  const [showEventTypeSelector, setShowEventTypeSelector] = useState(false);

  // This state will store the shapes imported from the hall data
  const [shapes, setShapes] = useState([]);

  const tablesAreaRef = useRef(null);
  const zoomRef = useRef(0.2); // Use ref for intermediate zoom values to prevent re-renders

  // View dragging state
  const [isDraggingView, setIsDraggingView] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const [initialScrollPosition, setInitialScrollPosition] = useState({ x: 0, y: 0 });

  // Enhanced touch state for mobile pinch zoom
  const touchDistanceRef = useRef(null);
  const zoomOperationInProgress = useRef(false);
  const lastZoomUpdateTime = useRef(0);

  // ✅ ИСПРАВЛЕННАЯ функция для правильной обработки координат shapes
  const processShapePosition = (shape) => {
    let displayX, displayY;

    // Определяем правильные координаты в зависимости от типа и доступных свойств
    switch (shape.type) {
      case 'rect':
        if (shape.centerX !== undefined && shape.centerY !== undefined) {
          // Используем центральные координаты для прямоугольника
          displayX = shape.centerX - (shape.width || 100) / 2;
          displayY = shape.centerY - (shape.height || 50) / 2;
        } else {
          // Используем угловые координаты
          displayX = shape.x || 0;
          displayY = shape.y || 0;
        }
        break;

      case 'circle':
        if (shape.centerX !== undefined && shape.centerY !== undefined) {
          // Для кругов используем центр и радиус
          displayX = shape.centerX - (shape.radius || 50);
          displayY = shape.centerY - (shape.radius || 50);
        } else {
          // Fallback к угловым координатам
          displayX = shape.x || 0;
          displayY = shape.y || 0;
        }
        break;

      case 'text':
        // Для текста всегда используем x,y как левый верхний угол
        displayX = shape.x || 0;
        displayY = shape.y || 0;
        break;

      case 'line':
        // Для линий используем первую точку
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

  // ✅ ОТКЛЮЧАЕМ автоматическую корректировку позиций - используем координаты как есть
  useEffect(() => {
    if (hallData && (hallData.tables?.length > 0 || shapes.length > 0)) {
      console.log("Hall data loaded - using original coordinates");
      // Не корректируем координаты автоматически, используем как есть из JSON
    }
  }, [hallData, shapes]);

  // Add an additional fix to ensure tables render correctly when first loaded
  useEffect(() => {
    if (hallData && hallData.tables) {
      // This force-triggers a component update to ensure tables are rendered
      const forceUpdateTimeout = setTimeout(() => {
        console.log("Force update to ensure tables render");
        setScale(prev => prev + 0.01);
        setTimeout(() => setScale(prev => prev - 0.01), 100);
      }, 1000);

      return () => clearTimeout(forceUpdateTimeout);
    }
  }, [hallData]);

  useEffect(() => {
    setTimeout(() => {
      var zoomOutBtn = window.document.getElementById('zoomOutBtn');
      if (zoomOutBtn) {
        zoomOutBtn.click();
      }
    }, 200)
  }, []);

  // ✅ ИСПРАВЛЕННАЯ загрузка данных с учетом canvasData
  useEffect(() => {
    const savedHallData = localStorage.getItem('hallData');
    if (savedHallData) {
      try {
        const parsedData = JSON.parse(savedHallData);
        setHallData(parsedData);

        if (parsedData.shapes && Array.isArray(parsedData.shapes)) {
          console.log("Importing shapes:", parsedData.shapes);
          setShapes(parsedData.shapes);
        }

        // ✅ Устанавливаем зум из canvasData без увеличения
        if (parsedData.canvasData && parsedData.canvasData.zoom) {
          const canvasZoom = Math.max(parsedData.canvasData.zoom, 0.1); // Используем как есть
          console.log("Setting initial zoom from canvas data:", canvasZoom);
          setZoom(canvasZoom);
          zoomRef.current = canvasZoom;
        }
      } catch (e) {
        console.error("Error loading saved hall data:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (tablesAreaRef.current && hallData) {
      // Calculate hall content dimensions with proper padding
      const tables = hallData.tables || [];

      // ✅ FIX: Account for center-based positioning and add proper padding
      const positions = tables.map(t => {
        const rawLeft = t.renderingOptions?.left ?? t.x ?? 0;
        const rawTop = t.renderingOptions?.top ?? t.y ?? 0;
        const width = t.renderingOptions?.width ?? t.width ?? (t.shape !== 'rectangle' ? 300 : 400);
        const height = t.renderingOptions?.height ?? t.height ?? (t.shape !== 'rectangle' ? 300 : 150);
        const scaleX = t.renderingOptions?.scaleX ?? 1;
        const scaleY = t.renderingOptions?.scaleY ?? 1;

        // Convert from center-based to boundaries
        const leftBound = rawLeft - (width * scaleX) / 2;
        const topBound = rawTop - (height * scaleY) / 2;
        const rightBound = rawLeft + (width * scaleX) / 2;
        const bottomBound = rawTop + (height * scaleY) / 2;

        return { leftBound, topBound, rightBound, bottomBound };
      });

      if (positions.length > 0) {
        const minX = Math.min(...positions.map(p => p.leftBound)) - 200; // Add padding
        const minY = Math.min(...positions.map(p => p.topBound)) - 200;
        const maxX = Math.max(...positions.map(p => p.rightBound)) + 200;
        const maxY = Math.max(...positions.map(p => p.bottomBound)) + 200;

        const totalWidth = maxX - minX;
        const totalHeight = maxY - minY;

        // Set minimum container size
        tablesAreaRef.current.style.minWidth = `${totalWidth}px`;
        tablesAreaRef.current.style.minHeight = `${totalHeight}px`;

        // Adjust positioning offset if needed
        if (minX < 0 || minY < 0) {
          const offsetX = Math.max(0, -minX);
          const offsetY = Math.max(0, -minY);

          // Apply offset to all tables by updating their positioning
          // This ensures all tables are visible within the container
          const tablesContent = document.querySelector('.tables-content');
          if (tablesContent) {
            tablesContent.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
          }
        }
      }
    }
  }, [hallData, zoom]);

  // Set default booking values when modal opens
  useEffect(() => {
    if (showBookingModal) {
      // Set default date to today
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setBookingDate(`${year}-${month}-${day}`);

      // Set default time to current hour rounded to next 15 minutes
      const now = new Date();
      const currentHour = now.getHours();
      let currentMinute = Math.ceil(now.getMinutes() / 15) * 15;

      // Adjust if we rolled over to next hour
      if (currentMinute === 60) {
        currentMinute = 0;
        const nextHour = (currentHour + 1) % 24;
        setBookingTime(`${nextHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);
      } else {
        setBookingTime(`${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);
      }

      // Set default end time to 2 hours after start
      let endHour = currentHour + 2;
      if (endHour >= 24) {
        endHour = 23;
        setBookingEndTime(`${endHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);
      } else {
        setBookingEndTime(`${endHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);
      }
    }
  }, [showBookingModal]);

  // ✅ ИСПРАВЛЕННАЯ обработка загрузки файла с canvasData
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const parsedData = JSON.parse(e.target.result);

        console.log("Imported data:", parsedData);
        console.log("Tables:", parsedData.tables?.length);
        console.log("Shapes:", parsedData.shapes?.length);

        setHallData(parsedData);

        if (parsedData.shapes && Array.isArray(parsedData.shapes)) {
          setShapes(parsedData.shapes);
        } else {
          setShapes([]);
        }

        // ✅ Устанавливаем зум из canvasData без изменений
        if (parsedData.canvasData && parsedData.canvasData.zoom) {
          const canvasZoom = Math.max(parsedData.canvasData.zoom, 0.1);
          console.log("Setting zoom from imported canvas data:", canvasZoom);
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

  // Get all occupied time slots for a table
  const getOccupiedTimeSlots = (tableId, date) => {
    if (!hallData || !hallData.tables) return [];

    const table = hallData.tables.find(t => t.id === tableId);
    if (!table || !table.people) return [];

    const occupiedSlots = [];
    const timeSlotSet = new Set(); // For unique slots

    // For each person at the table with a booking
    table.people.forEach(person => {
      if (!person || !person.booking) return;

      // Check if the date matches
      if (person.booking.date !== date) return;

      const startTime = parseTimeToMinutes(person.booking.time);
      const endTime = parseTimeToMinutes(person.booking.endTime);

      if (endTime < startTime) {
        // Booking spans midnight
        // Add slots from start time to midnight
        for (let time = startTime; time < 24 * 60; time += 15) {
          const hour = Math.floor(time / 60).toString().padStart(2, '0');
          const minute = (time % 60).toString().padStart(2, '0');
          const timeSlot = `${hour}:${minute}`;

          if (!timeSlotSet.has(timeSlot)) {
            timeSlotSet.add(timeSlot);
            occupiedSlots.push(timeSlot);
          }
        }

        // Add slots from midnight to end time
        for (let time = 0; time < endTime; time += 15) {
          const hour = Math.floor(time / 60).toString().padStart(2, '0');
          const minute = (time % 60).toString().padStart(2, '0');
          const timeSlot = `${hour}:${minute}`;

          if (!timeSlotSet.has(timeSlot)) {
            timeSlotSet.add(timeSlot);
            occupiedSlots.push(timeSlot);
          }
        }
      } else {
        // Regular booking within same day
        for (let time = startTime; time < endTime; time += 15) {
          const hour = Math.floor(time / 60).toString().padStart(2, '0');
          const minute = (time % 60).toString().padStart(2, '0');
          const timeSlot = `${hour}:${minute}`;

          if (!timeSlotSet.has(timeSlot)) {
            timeSlotSet.add(timeSlot);
            occupiedSlots.push(timeSlot);
          }
        }
      }
    });

    return occupiedSlots;
  };

  // Check if a time range is available for booking
  const isTableAvailableAtTime = (tableId, date, startTime, endTime) => {
    const occupiedSlots = getOccupiedTimeSlots(tableId, date);

    // Convert times to minutes
    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);

    // Check for overlaps
    if (endMinutes < startMinutes) {
      // Booking spans midnight
      // Check from start time to midnight
      for (let time = startMinutes; time < 24 * 60; time += 15) {
        const hour = Math.floor(time / 60).toString().padStart(2, '0');
        const minute = (time % 60).toString().padStart(2, '0');
        const timeSlot = `${hour}:${minute}`;

        if (occupiedSlots.includes(timeSlot)) {
          return false;
        }
      }

      // Check from midnight to end time
      for (let time = 0; time < endMinutes; time += 15) {
        const hour = Math.floor(time / 60).toString().padStart(2, '0');
        const minute = (time % 60).toString().padStart(2, '0');
        const timeSlot = `${hour}:${minute}`;

        if (occupiedSlots.includes(timeSlot)) {
          return false;
        }
      }
    } else {
      // Regular booking within same day
      for (let time = startMinutes; time < endMinutes; time += 15) {
        const hour = Math.floor(time / 60).toString().padStart(2, '0');
        const minute = (time % 60).toString().padStart(2, '0');
        const timeSlot = `${hour}:${minute}`;

        if (occupiedSlots.includes(timeSlot)) {
          return false;
        }
      }
    }

    return true;
  };

  // Get table booking info for display
  const getTableBookings = (tableId, date) => {
    if (!hallData || !hallData.tables) return [];

    const table = hallData.tables.find(t => t.id === tableId);
    if (!table || !table.people) return [];

    const bookings = [];

    table.people.forEach(person => {
      if (!person || !person.booking) return;

      // Check if booking is for the requested date
      if (person.booking.date === date) {
        bookings.push({
          startTime: person.booking.time,
          endTime: person.booking.endTime,
          name: person.name,
          guestCount: person.guestCount || person.seatsOccupied || 1,
          type: person.booking.type // Add type to include event emoji
        });
      }
    });

    // Sort bookings by start time
    return bookings.sort((a, b) => {
      return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
    });
  };

  // Merge consecutive bookings for display
  const getMergedTimeRanges = (bookings) => {
    if (!bookings || bookings.length === 0) return [];

    // Sort bookings by start time
    const sortedBookings = [...bookings].sort((a, b) => {
      const aMinutes = parseTimeToMinutes(a.startTime);
      const bMinutes = parseTimeToMinutes(b.startTime);
      return aMinutes - bMinutes;
    });

    const mergedRanges = [];
    let currentRange = { ...sortedBookings[0] };

    for (let i = 1; i < sortedBookings.length; i++) {
      const booking = sortedBookings[i];
      const currentEndMinutes = parseTimeToMinutes(currentRange.endTime);
      const nextStartMinutes = parseTimeToMinutes(booking.startTime);

      // Check if bookings are consecutive or overlapping
      if (nextStartMinutes <= currentEndMinutes) {
        // Update end time if the new booking ends later
        const nextEndMinutes = parseTimeToMinutes(booking.endTime);
        if (nextEndMinutes > currentEndMinutes) {
          currentRange.endTime = booking.endTime;
        }
      } else {
        // If bookings aren't consecutive, add current range and start new one
        mergedRanges.push(currentRange);
        currentRange = { ...booking };
      }
    }

    // Add the last range
    mergedRanges.push(currentRange);

    return mergedRanges;
  };

  // Handle table selection
  const handleTableClick = (tableId) => {
    setSelectedTableId(tableId);
    // After selecting table, show booking form
    setShowBookingModal(true);
    // Reset booking type selection
    setBookingType('');
    setShowEventTypeSelector(false);
  };

  // Handle booking confirmation
  const confirmBooking = () => {
    // Validate inputs
    if (!clientName.trim()) {
      alert('Пожалуйста, введите ваше имя');
      return;
    }

    if (!clientPhone.trim()) {
      alert('Пожалуйста, введите ваш номер телефона');
      return;
    }

    if (guestCount < 1) {
      alert('Количество гостей должно быть не менее 1');
      return;
    }

    if (!bookingType) {
      alert('Пожалуйста, выберите тип мероприятия');
      return;
    }

    // Check if table is available at selected time
    if (!isTableAvailableAtTime(selectedTableId, bookingDate, bookingTime, bookingEndTime)) {
      alert('Выбранное время недоступно. Пожалуйста, выберите другое время.');
      return;
    }

    // Create client info
    const client = {
      name: clientName.trim(),
      phone: clientPhone.trim(),
      guestCount: guestCount
    };

    // Create booking details
    const bookingDetails = {
      date: bookingDate,
      time: bookingTime,
      endTime: bookingEndTime,
      note: bookingNote.trim(),
      type: bookingType, // Include booking type
      timestamp: new Date().toISOString()
    };

    // Update hall data with new booking
    setHallData(prevData => {
      const updatedTables = prevData.tables.map(t => {
        if (t.id === selectedTableId) {
          // Create a copy of the people array or initialize it
          const tablePeople = [...(t.people || [])];

          // Find the first empty chair or add to the end
          let chairIndex = -1;
          for (let i = 0; i < tablePeople.length; i++) {
            if (!tablePeople[i]) {
              chairIndex = i;
              break;
            }
          }

          // If no empty chair found, add to the end
          if (chairIndex === -1) {
            chairIndex = tablePeople.length;
          }

          // Place the client with booking info
          tablePeople[chairIndex] = {
            name: client.name,
            phone: client.phone,
            isMainGuest: true,
            guestCount: client.guestCount,
            seatsOccupied: client.guestCount,
            booking: bookingDetails
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
        shapes: shapes // Make sure to preserve shapes when updating hall data
      };

      // Save to localStorage
      localStorage.setItem('hallData', JSON.stringify(updatedHallData));

      return updatedHallData;
    });

    // Show success message
    setBookingSummary({
      tableName: `Стол ${selectedTableId}`,
      date: formatDateForDisplay(bookingDate),
      time: `${formatTimeDisplay(bookingTime)} - ${formatTimeDisplay(bookingEndTime)}`,
      guestCount: guestCount,
      name: clientName,
      phone: clientPhone,
      type: bookingType // Include type for emoji display
    });

    setBookingSuccess(true);
  };

  // Reset booking form
  const resetBooking = () => {
    setBookingSuccess(false);
    setSelectedTableId(null);
    setShowBookingModal(false);
    setClientName('');
    setClientPhone('');
    setGuestCount(1);
    setBookingNote('');
    setBookingTime('');
    setBookingEndTime('');
    setBookingSummary(null);
    setBookingType('');
    setShowEventTypeSelector(false);
  };

  // Apply zoom with smooth animation and centered on point
  const applyZoom = (newZoom, centerX, centerY) => {
    if (!tablesAreaRef.current) return;

    // Use the current zoom value from the ref, not state
    const currentZoom = zoomRef.current;

    // Get scroll position
    const containerRect = tablesAreaRef.current.getBoundingClientRect();
    const scrollLeft = tablesAreaRef.current.scrollLeft;
    const scrollTop = tablesAreaRef.current.scrollTop;

    // Calculate relative position of center point within viewport
    const relX = (centerX - containerRect.left) / containerRect.width;
    const relY = (centerY - containerRect.top) / containerRect.height;

    // Calculate the position in the document at current zoom
    const docX = scrollLeft + relX * containerRect.width;
    const docY = scrollTop + relY * containerRect.height;

    // Calculate the position in the unzoomed document
    const unzoomedX = docX / currentZoom;
    const unzoomedY = docY / currentZoom;

    // Calculate new scroll position to keep the point fixed
    const newScrollLeft = unzoomedX * newZoom - relX * containerRect.width;
    const newScrollTop = unzoomedY * newZoom - relY * containerRect.height;

    // Update the zoom ref
    zoomRef.current = newZoom;

    // Only update state if significantly different (reduces re-renders)
    if (Math.abs(newZoom - zoom) > 0.01) {
      setZoom(newZoom);
    }

    // Set new scroll position to keep the center point fixed
    tablesAreaRef.current.scrollLeft = newScrollLeft;
    tablesAreaRef.current.scrollTop = newScrollTop;
  };

  // Throttle zoom updates
  const throttledZoom = (newZoom, centerX, centerY) => {
    const now = Date.now();
    if (now - lastZoomUpdateTime.current > 50) { // 50ms throttle
      lastZoomUpdateTime.current = now;
      applyZoom(newZoom, centerX, centerY);
    } else {
      // Schedule for later if we're throttling
      if (!zoomOperationInProgress.current) {
        zoomOperationInProgress.current = true;
        window.requestAnimationFrame(() => {
          applyZoom(newZoom, centerX, centerY);
          zoomOperationInProgress.current = false;
        });
      }
    }
  };

  // Zoom buttons
  const handleZoomIn = () => {
    const newZoom = Math.min(zoomRef.current * 1.2, 1.0);
    if (!tablesAreaRef.current) return;

    // Center zoom on the middle of the viewport
    const rect = tablesAreaRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    applyZoom(newZoom, centerX, centerY);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomRef.current / 1.2, 0.2);
    if (!tablesAreaRef.current) return;

    // Center zoom on the middle of the viewport
    const rect = tablesAreaRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    applyZoom(newZoom, centerX, centerY);
  };

  // Enhanced mouse wheel zoom - centered on cursor position
  const handleWheel = (e) => {
    // Only zoom if Ctrl key is pressed
    if (e.ctrlKey) {
      e.preventDefault();

      // Calculate new zoom level
      let newZoom;
      if (e.deltaY < 0) {
        // Zoom in
        newZoom = Math.min(zoomRef.current * 1.1, 1.0);
      } else {
        // Zoom out
        newZoom = Math.max(zoomRef.current / 1.1, 0.2);
      }

      // Apply zoom centered on cursor position
      throttledZoom(newZoom, e.clientX, e.clientY);
    }
  };

  // Enhanced touch events for mobile devices with optimized pinch zoom
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch zoom detected - two fingers
      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      // Calculate distance between fingers
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      // Store center point between the two fingers
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      // Store initial zoom info in ref
      touchDistanceRef.current = {
        distance,
        centerX,
        centerY,
        initialZoom: zoomRef.current
      };
    } else if (e.touches.length === 1) {
      // Single finger drag/scroll
      // Only prevent default if not touching a table or interactive element
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
      // Optimized pinch zoom
      e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      // Calculate new distance between fingers
      const newDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      // Calculate scale change
      const scale = newDistance / touchDistanceRef.current.distance;
      const newZoom = Math.min(Math.max(touchDistanceRef.current.initialZoom * scale, 0.2), 1.0);

      // Get new center point
      const newCenterX = (touch1.clientX + touch2.clientX) / 2;
      const newCenterY = (touch1.clientY + touch2.clientY) / 2;

      // Apply zoom centered on pinch center
      throttledZoom(newZoom, newCenterX, newCenterY);
    } else if (e.touches.length === 1 && isDraggingView) {
      // Handle dragging/scrolling with one finger
      e.preventDefault();

      // Get current touch position
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;

      // Calculate how much we moved
      const dx = currentX - dragStartPosition.x;
      const dy = currentY - dragStartPosition.y;

      // Update scroll position - move in opposite direction of finger
      if (tablesAreaRef.current) {
        tablesAreaRef.current.scrollLeft = initialScrollPosition.x - dx;
        tablesAreaRef.current.scrollTop = initialScrollPosition.y - dy;
      }
    }
  };

  const handleTouchEnd = (e) => {
    // Reset pinch zoom state if all fingers are lifted
    if (e.touches.length === 0) {
      touchDistanceRef.current = null;
      setIsDraggingView(false);
    } else if (e.touches.length === 1 && touchDistanceRef.current) {
      // Switching from pinch zoom to single finger drag
      touchDistanceRef.current = null;

      // Set up new drag from current position
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

  // Handle dragging view
  const handleStartDragView = (e) => {
    // Only start drag if it's directly on the tables area
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
    // Update occupied slots when table or date changes
    if (selectedTableId && bookingDate) {
      const slots = getOccupiedTimeSlots(selectedTableId, bookingDate);
      setOccupiedSlots(slots);

      // If current selected time is occupied, find a new available time
      if (bookingTime && slots.includes(bookingTime)) {
        const now = new Date();
        const currentHour = now.getHours();
        const availableTime = findNextAvailableTime(slots, currentHour);
        setBookingTime(availableTime);

        // Also update end time (2 hours after start by default)
        const [startHour, startMinute] = availableTime.split(':').map(Number);
        let endHour = startHour + 2;
        if (endHour >= 24) endHour = 23;
        const endTime = `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
        setBookingEndTime(endTime);
      }
    }
  }, [selectedTableId, bookingDate]);

  // Add and remove event listeners
  useEffect(() => {
    // Update the zoom ref when the state changes
    zoomRef.current = zoom;

    const tablesArea = tablesAreaRef.current;
    if (tablesArea) {
      // Use passive: false to be able to prevent default
      tablesArea.addEventListener('wheel', handleWheel, { passive: false });
      tablesArea.addEventListener('mousedown', handleStartDragView);

      // Add touch event listeners for mobile
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
  }, [zoom]); // Only depend on zoom changes

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
  }, [isDraggingView]);

  // ✅ ПОЛНОСТЬЮ ИСПРАВЛЕННЫЙ рендер table component с правильными стульями
  const TableComponent = ({ table }) => {
    // Get current date for bookings display
    const today = new Date();
    const formattedDate = formatDateToYMD(today);

    // Get all bookings for this table today
    const tableBookings = getTableBookings(table.id, formattedDate);
    const mergedTimeRanges = getMergedTimeRanges(tableBookings);

    // Check if table is currently reserved
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTimeString = `${currentHour}:${currentMinute}`;
    const currentTimeMinutes = parseTimeToMinutes(currentTimeString);

    const isCurrentlyReserved = mergedTimeRanges.some(range => {
      const startMinutes = parseTimeToMinutes(range.startTime);
      const endMinutes = parseTimeToMinutes(range.endTime);

      if (endMinutes < startMinutes) {
        return currentTimeMinutes >= startMinutes || currentTimeMinutes < endMinutes;
      } else {
        return currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes;
      }
    });

    const activeReservation = isCurrentlyReserved
      ? mergedTimeRanges.find(range => {
        const startMinutes = parseTimeToMinutes(range.startTime);
        const endMinutes = parseTimeToMinutes(range.endTime);
        if (endMinutes < startMinutes) {
          return currentTimeMinutes >= startMinutes || currentTimeMinutes < endMinutes;
        } else {
          return currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes;
        }
      })
      : null;

    const reservationText = mergedTimeRanges.length > 0
      ? mergedTimeRanges.map(range => `${range.startTime}-${range.endTime}`).join(', ')
      : '';

    const chairCount = table.chairCount || 12;
    const isSelected = selectedTableId === table.id;

    // ✅ ИСПРАВЛЕННОЕ позиционирование - точно как в оригинале
    const getRenderingPosition = () => {
      // Get the raw position data
      const rawLeft = table.renderingOptions?.left ?? table.x ?? 0;
      const rawTop = table.renderingOptions?.top ?? table.y ?? 0;
      const angle = table.renderingOptions?.angle ?? table.rotation ?? 0;
      const scaleX = table.renderingOptions?.scaleX ?? 1;
      const scaleY = table.renderingOptions?.scaleY ?? 1;

      // ✅ ИСПРАВЛЕНО: Используем базовые размеры БЕЗ scale для HTML позиционирования
      const baseWidth = table.renderingOptions?.width ?? table.width ?? (isRound ? 300 : 400);
      const baseHeight = table.renderingOptions?.height ?? table.height ?? (isRound ? 300 : 150);

      // ✅ CRITICAL FIX: Convert from center-based (Fabric.js) to top-left based (HTML)
      // Fabric.js positions tables by their center, but HTML positions by top-left
      const left = rawLeft - (baseWidth * scaleX) / 2;
      const top = rawTop - (baseHeight * scaleY) / 2;

      // ✅ ИСПРАВЛЕНО: Возвращаем финальные размеры С учетом scale
      const width = baseWidth * scaleX;
      const height = baseHeight * scaleY;

      return { left, top, angle, scaleX, scaleY, width, height };
    };

    const position = getRenderingPosition();
    const isRound = table.shape !== 'rectangle';

    // ✅ ИСПРАВЛЕНО: используем размеры из getRenderingPosition
    const tableWidth = position.width;
    const tableHeight = position.height;
    const tableRadius = isRound ? Math.min(tableWidth, tableHeight) / 2 : 0;

    // ✅ ИСПРАВЛЕННЫЙ рендеринг стульев для круглого стола
    const renderChairsForRoundTable = () => {
      const chairs = [];

      const borderWidth = -20;
      const baseRadius = Math.min(tableWidth, tableHeight) / 2;
      const radius = baseRadius + borderWidth + 5;

      // ✅ ИСПРАВЛЕНО: Масштабируемые размеры стульев
      const chairSize = Math.max(30, Math.min(50, tableWidth * 0.13)); // Размер стула пропорционален столу
      const labelFontSize = Math.max(8, Math.min(12, tableWidth * 0.035)); // Размер шрифта подписи

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
            pointerEvents: 'none'
          }}>
            {/* Chair */}
            <div
              style={{
                position: 'absolute',
                left: `${x - chairSize / 2}px`,
                top: `${y - chairSize / 2}px`,
                width: `${chairSize}px`, // ✅ Масштабируемый размер
                height: `${chairSize}px`, // ✅ Масштабируемый размер
                borderRadius: '50%',
                backgroundColor: isOccupied ? '#c12f2f' : '#28592a',
                transform: `rotate(${(angle * 180 / Math.PI) + 90}deg)`,
                transformOrigin: 'center',
                zIndex: 1,
                border: `${Math.max(1, chairSize * 0.05)}px solid #1a1a1a`, // ✅ Масштабируемая граница
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
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
                  fontSize: `${labelFontSize}px`, // ✅ Масштабируемый шрифт
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

      // ✅ FIX: Use more consistent spacing calculation
      const horizontalSpacing = Math.max(80, tableWidth * 0.2); // Minimum 80px spacing
      const verticalSpacing = 50; // Distance from table edge

      // Top chairs
      for (let i = 0; i < chairsTop; i++) {
        const ratio = chairsTop === 1 ? 0.5 : i / (chairsTop - 1);
        const x = ((tableWidth - horizontalSpacing) * ratio) - (tableWidth / 2) + (horizontalSpacing / 2);
        const y = -(tableHeight / 2) - verticalSpacing;

        // ... rest of the chair rendering logic stays the same
        // Just update the positioning values to use the new x, y calculations
      }

      // Bottom chairs - similar fix
      for (let i = 0; i < chairsBottom; i++) {
        const ratio = chairsBottom === 1 ? 0.5 : i / (chairsBottom - 1);
        const x = ((tableWidth - horizontalSpacing) * ratio) - (tableWidth / 2) + (horizontalSpacing / 2);
        const y = (tableHeight / 2) + verticalSpacing;

        // ... rest of the chair rendering logic
      }

      return chairs;
    };




    {/* Booking type selection */ }
    <div className="form-group" style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block',
        marginBottom: '8px',
        fontWeight: 'bold',
        fontSize: '15px'
      }}>
        Дата:
      </label>
      <input
        type="date"
        value={bookingDate}
        onChange={(e) => setBookingDate(e.target.value)}
        style={{
          width: '80%',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #ddd',
          fontSize: '16px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
          backgroundColor: '#f9f9f9'
        }}
      />
    </div>

    {/* Time selectors */ }
    <div className="form-group" style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block',
        marginBottom: '8px',
        fontWeight: 'bold',
        fontSize: '15px'
      }}>
        Время:
      </label>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Start time */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#555',
            marginRight: '10px',
            width: '60px'
          }}>
            Начало:
          </span>
          <div style={{
            display: 'flex',
            flex: 1,
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
          }}>
            <select
              value={bookingTime.split(':')[0] || '12'}
              onChange={(e) => {
                const hours = e.target.value;
                const minutes = bookingTime.split(':')[1] || '00';
                setBookingTime(`${hours}:${minutes}`);
              }}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                borderRight: '1px solid #ddd',
                fontSize: '16px',
                backgroundColor: '#f9f9f9'
              }}
            >
              {Array.from({ length: 24 }, (_, i) => i).map(hour => {
                const hourStr = hour.toString().padStart(2, '0');
                const isHourFullyOccupied = ['00', '15', '30', '45'].every(min =>
                  occupiedSlots.includes(`${hourStr}:${min}`)
                );
                const isHourPartiallyOccupied = ['00', '15', '30', '45'].some(min =>
                  occupiedSlots.includes(`${hourStr}:${min}`)
                );

                return (
                  <option
                    key={hour}
                    value={hourStr}
                    disabled={isHourFullyOccupied}
                    style={{
                      backgroundColor: isHourFullyOccupied ? '#ffdddd' :
                        isHourPartiallyOccupied ? '#fff8e1' : '#ffffff',
                      color: isHourFullyOccupied ? '#999999' : '#000000'
                    }}
                  >
                    {hourStr}
                  </option>
                );
              })}
            </select>
            <span style={{
              padding: '12px 8px',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f0f0f0',
              fontWeight: 'bold'
            }}>:</span>
            <select
              value={bookingTime.split(':')[1] || '00'}
              onChange={(e) => {
                const hours = bookingTime.split(':')[0] || '12';
                const minutes = e.target.value;
                setBookingTime(`${hours}:${minutes}`);
              }}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                fontSize: '16px',
                backgroundColor: '#f9f9f9'
              }}
            >
              {['00', '15', '30', '45'].map(minute => {
                const hourStr = bookingTime.split(':')[0] || '12';
                const timeSlot = `${hourStr}:${minute}`;
                const isSlotOccupied = occupiedSlots.includes(timeSlot);

                return (
                  <option
                    key={minute}
                    value={minute}
                    disabled={isSlotOccupied}
                    style={{
                      backgroundColor: isSlotOccupied ? '#ffdddd' : '#ffffff',
                      color: isSlotOccupied ? '#999999' : '#000000'
                    }}
                  >
                    {minute}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* End time */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#555',
            marginRight: '10px',
            width: '60px'
          }}>
            Конец:
          </span>
          <div style={{
            display: 'flex',
            flex: 1,
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
          }}>
            <select
              value={bookingEndTime.split(':')[0] || '14'}
              onChange={(e) => {
                const hours = e.target.value;
                const minutes = bookingEndTime.split(':')[1] || '00';
                setBookingEndTime(`${hours}:${minutes}`);
              }}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                borderRight: '1px solid #ddd',
                fontSize: '16px',
                backgroundColor: '#f9f9f9'
              }}
            >
              {Array.from({ length: 24 }, (_, i) => i).map(hour => {
                const hourStr = hour.toString().padStart(2, '0');
                const startHour = parseInt(bookingTime.split(':')[0] || '12');
                const isHourFullyOccupied = ['00', '15', '30', '45'].every(min =>
                  occupiedSlots.includes(`${hourStr}:${min}`)
                );
                const shouldDisable = hour <= startHour && isHourFullyOccupied;
                const isHourPartiallyOccupied = ['00', '15', '30', '45'].some(min =>
                  occupiedSlots.includes(`${hourStr}:${min}`)
                );

                return (
                  <option
                    key={hour}
                    value={hourStr}
                    disabled={shouldDisable}
                    style={{
                      backgroundColor: shouldDisable ? '#ffdddd' :
                        isHourPartiallyOccupied ? '#fff8e1' : '#ffffff',
                      color: shouldDisable ? '#999999' : '#000000'
                    }}
                  >
                    {hourStr}
                  </option>
                );
              })}
            </select>
            <span style={{
              padding: '12px 8px',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f0f0f0',
              fontWeight: 'bold'
            }}>:</span>
            <select
              value={bookingEndTime.split(':')[1] || '00'}
              onChange={(e) => {
                const hours = bookingEndTime.split(':')[0] || '14';
                const minutes = e.target.value;
                setBookingEndTime(`${hours}:${minutes}`);
              }}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                fontSize: '16px',
                backgroundColor: '#f9f9f9'
              }}
            >
              {['00', '15', '30', '45'].map(minute => {
                const hourStr = bookingEndTime.split(':')[0] || '14';
                const timeSlot = `${hourStr}:${minute}`;
                const isSlotOccupied = occupiedSlots.includes(timeSlot);
                const startHour = parseInt(bookingTime.split(':')[0] || '12');
                const endHour = parseInt(hourStr);
                const shouldDisable = endHour <= startHour && isSlotOccupied;

                return (
                  <option
                    key={minute}
                    value={minute}
                    disabled={shouldDisable}
                    style={{
                      backgroundColor: shouldDisable ? '#ffdddd' :
                        isSlotOccupied ? '#fff8e1' : '#ffffff',
                      color: shouldDisable ? '#999999' : '#000000'
                    }}
                  >
                    {minute}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>
    </div>


    return (
      <div
        className={`table-container ${isSelected ? 'selected' : ''}`}
        data-id={table.id}
        style={{
          position: 'absolute',
          left: `${position.left}px`,
          top: `${position.top}px`,
          cursor: 'pointer',
          //  border: '40px solid #a67c52',
          border: isSelected ? '3px solid #3498db' : 'none',
          borderRadius: '50%',
          // transform: `rotate(${position.angle}deg) scale(${position.scaleX}, ${position.scaleY})`,
          transformOrigin: 'center center',
          zIndex: 10, // Увеличиваем zIndex чтобы столы были поверх shapes
          width: `${tableWidth}px`,
          height: `${tableHeight}px`
        }}
        onClick={() => handleTableClick(table.id)}
      >
        {/* ✅ Структура стола */}
        <div style={{ position: 'relative' }}>
          {isRound ? (
            // ✅ Круглый стол
            <div style={{ position: 'relative' }}>
              {/* Table Base */}
              <div
                style={{
                  width: `${tableWidth}px`,
                  height: `${tableHeight}px`,
                  // borderRadius: '50%',
                  // backgroundColor: '#293352',
                  //  border: '20px solid #a67c52',
                  position: 'relative',
                  // boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
              >
                {/* Table Top */}
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

                {/* Wood Texture */}
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
               

                {/* Table Label */}
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
                  <br />
                   <button className='btn'>Click me</button>
                </div>

                {/* Reservation overlay */}
                {(isCurrentlyReserved || mergedTimeRanges.length > 0) && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: isCurrentlyReserved
                        ? 'rgba(231, 76, 60, 0.8)'
                        : 'rgba(242, 120, 75, 0.5)',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: isCurrentlyReserved ? '18px' : '16px',
                      borderRadius: '50%',
                      zIndex: 4
                    }}
                  >
                    <div>
                      {activeReservation && activeReservation.type ?
                        getEventTypeEmoji(activeReservation.type) + " " : ""}
                      {isCurrentlyReserved ? "ЗАНЯТО" : "ЗАБРОНИРОВАНО"}
                    </div>
                    {(activeReservation || (!isCurrentlyReserved && reservationText)) && (
                      <div style={{ fontSize: '14px', marginTop: '5px', textAlign: 'center' }}>
                        {isCurrentlyReserved
                          ? `${activeReservation.startTime} - ${activeReservation.endTime}`
                          : reservationText
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Стулья */}
              {renderChairsForRoundTable()}
            </div>
          ) : (
            // ✅ Прямоугольный стол
            <div style={{ position: 'relative' }}>
              {/* Table Base */}
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
                {/* Table Top */}
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

                {/* Wood Texture */}
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

                {/* Table Label */}
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

                {/* Reservation overlay */}
                {(isCurrentlyReserved || mergedTimeRanges.length > 0) && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: isCurrentlyReserved
                        ? 'rgba(231, 76, 60, 0.8)'
                        : 'rgba(242, 120, 75, 0.5)',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: isCurrentlyReserved ? '18px' : '16px',
                      padding: '10px',
                      textAlign: 'center',
                      zIndex: 4,
                      borderRadius: '8px'
                    }}
                  >
                    <div>
                      {activeReservation && activeReservation.type ?
                        getEventTypeEmoji(activeReservation.type) + " " : ""}
                      {isCurrentlyReserved ? "ЗАНЯТО" : "ЗАБРОНИРОВАНО"}
                    </div>
                    {(activeReservation || (!isCurrentlyReserved && reservationText)) && (
                      <div style={{ fontSize: '14px', marginTop: '5px' }}>
                        {isCurrentlyReserved
                          ? `${activeReservation.startTime} - ${activeReservation.endTime}`
                          : reservationText
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Стулья */}
              {renderChairsForRectangleTable()}
            </div>
          )}

          {/* Book button */}
          {/* <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '15px'
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTableClick(table.id);
              }}
              style={{
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '14px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              Забронировать
            </button>
          </div> */}
        </div>
      </div>
    );
  };

  return (
    <div className="client-booking-container" style={{
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
          {hallData?.name || 'Бронирование столика'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
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
              Импорт плана зала
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
                {/* Mobile-friendly controls */}
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

                {/* Scale indicator */}
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
                      {/* ✅ ИСПРАВЛЕННЫЙ рендеринг shapes */}
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

                      {/* Render hall elements (entrances, bathrooms, etc.) */}
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
                        <h2 style={{ marginTop: 0 }}>Добро пожаловать в систему бронирования</h2>
                        <p>Чтобы начать, загрузите план зала с помощью кнопки "Импорт плана зала".</p>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileUpload}
                          id="import-file-center"
                          className="file-input"
                          style={{ display: 'none' }}
                        />
                        <label
                          htmlFor="import-file-center"
                          className="import-button-large"
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
                          Импортировать план зала
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



      {/* Mobile instructions overlay */}
      {hallData && (
        <div className="mobile-instructions" style={{
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
          Используйте пальцы для перемещения зала и масштабирования
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && !bookingSuccess && (
        <div className="booking-modal" style={{
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
        }}>
          <div className="booking-modal-content" style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 5px 25px rgba(0, 0, 0, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => {
                setShowBookingModal(false);
                setSelectedTableId(null);
              }}
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
                justifyContent: 'center',
                zIndex: 2
              }}
            >
              ×
            </button>

            {/* Title */}
            <h2 style={{
              textAlign: 'center',
              margin: '0 0 25px 0',
              fontSize: '24px',
              color: '#333',
              borderBottom: '2px solid #f0f0f0',
              paddingBottom: '15px',
            }}>
              Бронирование стола {selectedTableId}
            </h2>

            {/* Main form content with 80% width for form elements */}
            <div style={{
              margin: '0 auto',
              width: '80%'
            }}>
              {/* Date selector */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  fontSize: '15px'
                }}>
                  Тип мероприятия:
                </label>

                {/* Event type selector button */}
                <div
                  onClick={() => setShowEventTypeSelector(!showEventTypeSelector)}
                  style={{
                    padding: '12px 15px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    backgroundColor: '#f9f9f9',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>
                      {bookingType ? getEventTypeEmoji(bookingType) : '📅'}
                    </span>
                    <span>
                      {bookingType ? getEventTypeName(bookingType) : 'Выберите тип мероприятия'}
                    </span>
                  </div>
                  <span style={{ fontSize: '18px' }}>
                    {showEventTypeSelector ? '▲' : '▼'}
                  </span>
                </div>

                {/* Event type options dropdown */}
                {showEventTypeSelector && (
                  <div style={{
                    marginTop: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {[
                      { type: 'birthday', label: 'День Рождения', emoji: '🎂' },
                      { type: 'business', label: 'Деловая Встреча', emoji: '💼' },
                      { type: 'party', label: 'Вечеринка', emoji: '🎉' },
                      { type: 'romantic', label: 'Романтический Ужин', emoji: '❤️' },
                      { type: 'family', label: 'Семейный Ужин', emoji: '👨‍👩‍👧‍👦' },
                      { type: 'other', label: 'Другое', emoji: '✨' }
                    ].map(item => (
                      <div
                        key={item.type}
                        onClick={() => {
                          setBookingType(item.type);
                          setShowEventTypeSelector(false);
                        }}
                        style={{
                          padding: '12px 15px',
                          borderBottom: '1px solid #eee',
                          backgroundColor: bookingType === item.type ? '#e8f8f0' : 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span style={{ fontSize: '24px' }}>{item.emoji}</span>
                        <span style={{
                          fontWeight: bookingType === item.type ? 'bold' : 'normal'
                        }}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available times info */}
              <div className="available-times-info" style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px',
                fontSize: '14px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
              }}>
                {(() => {
                  const occupiedSlots = selectedTableId && bookingDate ?
                    getOccupiedTimeSlots(selectedTableId, bookingDate) : [];

                  if (occupiedSlots.length > 0) {
                    // Group consecutive times for better display
                    let currentHour = -1;
                    const occupiedHours = [];

                    occupiedSlots.forEach(slot => {
                      const hour = parseInt(slot.split(':')[0], 10);
                      if (hour !== currentHour) {
                        occupiedHours.push(hour);
                        currentHour = hour;
                      }
                    });

                    return (
                      <div>
                        <p style={{
                          color: '#dc3545',
                          margin: '0 0 8px 0',
                          fontWeight: 'bold'
                        }}>
                          Занятое время:
                        </p>
                        <p style={{ margin: '0' }}>
                          {occupiedHours.map(h => `${h}:00-${(h + 1).toString().padStart(2, '0')}:00`).join(', ')}
                        </p>
                      </div>
                    );
                  } else {
                    return (
                      <p style={{
                        color: '#28a745',
                        margin: '0',
                        fontWeight: 'bold'
                      }}>
                        Стол свободен в выбранную дату и время
                      </p>
                    );
                  }
                })()}
              </div>

              {/* Client information */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  fontSize: '15px'
                }}>
                  Ваше имя:
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Иван Иванов"
                  style={{
                    width: '80%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '16px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    backgroundColor: '#f9f9f9'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  fontSize: '15px'
                }}>
                  Номер телефона:
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+374 (77) 77-77-77"
                  style={{
                    width: '80%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '16px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    backgroundColor: '#f9f9f9'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  fontSize: '15px'
                }}>
                  Количество гостей:
                </label>
                <input
                  type="number"
                  min="1"
                  value={guestCount === 0 ? '' : guestCount.toString()}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                  style={{
                    width: '80%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '16px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    backgroundColor: '#f9f9f9'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  fontSize: '15px'
                }}>
                  Примечание (необязательно):
                </label>
                <textarea
                  value={bookingNote}
                  onChange={(e) => setBookingNote(e.target.value)}
                  placeholder="Особые пожелания, комментарии..."
                  style={{
                    width: '80%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '16px',
                    minHeight: '100px',
                    resize: 'vertical',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    backgroundColor: '#f9f9f9'
                  }}
                />
              </div>

              {/* Action buttons */}
              <div className="actions" style={{
                display: 'flex',
                gap: '15px',
                marginTop: '10px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={confirmBooking}
                  style={{
                    padding: '14px 24px',
                    backgroundColor: '#2ecc71',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    boxShadow: '0 4px 6px rgba(46, 204, 113, 0.2)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Подтвердить бронирование
                </button>

                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedTableId(null);
                  }}
                  style={{
                    padding: '14px 24px',
                    backgroundColor: '#f1f1f1',
                    color: '#333',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Success Modal */}
      {bookingSuccess && bookingSummary && (
        <div className="success-modal" style={{
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
        }}>
          <div className="success-modal-content" style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#2ecc71',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 25px auto'
            }}>
              <span style={{ color: 'white', fontSize: '45px' }}>✓</span>
            </div>

            <h2 style={{
              marginBottom: '25px',
              color: '#2ecc71',
              fontSize: '28px'
            }}>
              {getEventTypeEmoji(bookingSummary.type)} Бронирование успешно!
            </h2>

            <div className="booking-details" style={{
              backgroundColor: '#f8f9fa',
              padding: '25px',
              borderRadius: '10px',
              textAlign: 'left',
              marginBottom: '25px',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)'
            }}>
              <h3 style={{
                marginTop: 0,
                marginBottom: '20px',
                textAlign: 'center',
                color: '#333',
                fontSize: '20px'
              }}>
                Детали бронирования
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '15px'
              }}>
                <div>
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Стол:</strong> {bookingSummary.tableName}
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <strong>Дата:</strong> {bookingSummary.date}
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <strong>Время:</strong> {bookingSummary.time}
                  </div>
                </div>

                <div>
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Имя:</strong> {bookingSummary.name}
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <strong>Телефон:</strong> {bookingSummary.phone}
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <strong>Количество гостей:</strong> {bookingSummary.guestCount}
                  </div>
                </div>
              </div>

              {/* Display booking type with emoji */}
              <div style={{
                marginTop: '15px',
                textAlign: 'center',
                padding: '15px',
                backgroundColor: '#e8f8f0',
                borderRadius: '8px'
              }}>
                <div style={{
                  fontSize: '24px',
                  marginBottom: '5px'
                }}>
                  {getEventTypeEmoji(bookingSummary.type)}
                </div>
                <strong>Тип мероприятия:</strong> {getEventTypeName(bookingSummary.type)}
              </div>
            </div>

            <p style={{
              marginBottom: '25px',
              fontSize: '15px',
              color: '#666'
            }}>
              В случае изменения планов, пожалуйста, свяжитесь с нами по телефону для отмены бронирования.
            </p>

            <button
              onClick={resetBooking}
              style={{
                padding: '14px 24px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                boxShadow: '0 4px 6px rgba(52, 152, 219, 0.2)',
                transition: 'all 0.2s ease'
              }}
            >
              Вернуться к плану зала
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientBookingComponent;
