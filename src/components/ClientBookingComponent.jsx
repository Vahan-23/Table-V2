import React, { useState, useEffect, useRef } from 'react';
import './clientBooking.css';

// Helper functions
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

const ClientBookingComponent = () => {
  const [hallData, setHallData] = useState(null);
  const [zoom, setZoom] = useState(0.21);
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
  
  const tablesAreaRef = useRef(null);
  
  // View dragging state
  const [isDraggingView, setIsDraggingView] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const [initialScrollPosition, setInitialScrollPosition] = useState({ x: 0, y: 0 });
  
  // Enhanced touch state for mobile pinch zoom
  const [touchDistance, setTouchDistance] = useState(null);
 useEffect(() => {
    setTimeout(() => {
      var zoomOutBtn = window.document.getElementById('zoomOutBtn');
      zoomOutBtn.click();
    }, 200)
  }, []);

  useEffect(() => {
    // Try loading saved hall data from localStorage on initial load
    const savedHallData = localStorage.getItem('hallData');
    if (savedHallData) {
      try {
        setHallData(JSON.parse(savedHallData));
      } catch (e) {
        console.error("Error loading saved hall data:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (tablesAreaRef.current && hallData) {
      // Calculate hall content dimensions
      const tables = hallData.tables || [];
      const maxX = Math.max(...tables.map(t => (t.x || 0) + 400), 0); // 400 - table width
      const maxY = Math.max(...tables.map(t => (t.y || 0) + 150), 0); // 150 - table height

      // Set minimum container size
      tablesAreaRef.current.style.minWidth = `${maxX}px`;
      tablesAreaRef.current.style.minHeight = `${maxY}px`;

      // Center the view
      const containerWidth = tablesAreaRef.current.offsetWidth;
      const containerHeight = tablesAreaRef.current.offsetHeight;
      tablesAreaRef.current.scrollLeft = (maxX * zoom - containerWidth) / 2;
      tablesAreaRef.current.scrollTop = (maxY * zoom - containerHeight) / 2;
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
        localStorage.setItem('hallData', JSON.stringify(parsedData));
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
          guestCount: person.guestCount || person.seatsOccupied || 1
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
        tables: updatedTables
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
      phone: clientPhone
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
  };
  
  // Zoom handlers
  const handleZoomIn = () => {
    setZoom(Math.min(zoom * 1.2, 1.0));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom / 1.2, 0.2));
  };
  
  // Mouse wheel zoom
  const handleWheel = (e) => {
    // Only zoom if Ctrl key is pressed
    if (e.ctrlKey) {
      e.preventDefault();

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
    }
  };
  
  // Handle touch events for mobile devices
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch zoom detected - two fingers
      e.preventDefault();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      // Store center point between the two fingers
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      setTouchDistance({
        distance,
        centerX,
        centerY,
        scrollLeft: tablesAreaRef.current.scrollLeft,
        scrollTop: tablesAreaRef.current.scrollTop
      });
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
    if (e.touches.length === 2 && touchDistance) {
      // Handle pinch zoom
      e.preventDefault();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const newDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      // Calculate zoom change based on pinch distance
      const scaleFactor = newDistance / touchDistance.distance;
      
      // Calculate new zoom level with limits and smoother transition
      const newZoom = Math.min(Math.max(zoom * scaleFactor, 0.2), 1.0);
      
      // Calculate the new center point
      const newCenterX = (touch1.clientX + touch2.clientX) / 2;
      const newCenterY = (touch1.clientY + touch2.clientY) / 2;
      
      // Update zoom
      setZoom(newZoom);
      
      // Update touch distance with new values
      setTouchDistance({
        ...touchDistance,
        distance: newDistance,
        centerX: newCenterX,
        centerY: newCenterY
      });
      
      // Adjust scroll position to keep the pinch center point fixed
      if (tablesAreaRef.current) {
        // This part helps keep the zoom centered on the pinch point
        const dx = newCenterX - touchDistance.centerX;
        const dy = newCenterY - touchDistance.centerY;
        
        tablesAreaRef.current.scrollLeft = touchDistance.scrollLeft - dx + (touchDistance.scrollLeft * (scaleFactor - 1));
        tablesAreaRef.current.scrollTop = touchDistance.scrollTop - dy + (touchDistance.scrollTop * (scaleFactor - 1));
      }
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
    // If we still have any touches active, adjust our state for remaining fingers
    if (e.touches.length === 1) {
      // Switching from pinch zoom to single finger scroll
      setTouchDistance(null);
      
      // Set up new drag from current position
      setIsDraggingView(true);
      setDragStartPosition({ 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
      });
      setInitialScrollPosition({
        x: tablesAreaRef.current.scrollLeft,
        y: tablesAreaRef.current.scrollTop
      });
    } else if (e.touches.length === 0) {
      // All fingers removed
      setIsDraggingView(false);
      setTouchDistance(null);
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
    const tablesArea = tablesAreaRef.current;
    if (tablesArea) {
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
  }, [zoom, isDraggingView, touchDistance]); // Include all dependencies

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
  
  // Render table component
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
        // Booking spans midnight
        return currentTimeMinutes >= startMinutes || currentTimeMinutes < endMinutes;
      } else {
        return currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes;
      }
    });
    
    // Get the active reservation if currently reserved
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
    
    // Format all reservation times for display
    const reservationText = mergedTimeRanges.length > 0
      ? mergedTimeRanges.map(range => `${range.startTime}-${range.endTime}`).join(', ')
      : '';
    
    // Get chair count and available seats
    const chairCount = table.chairCount || 0;
    
    // Check if table is selected
    const isSelected = selectedTableId === table.id;
    
    // Render chairs based on table shape
    const renderChairs = () => {
      if (table.shape === 'rectangle') {
        return renderRectangleChairs();
      } else {
        return renderRoundChairs();
      }
    };
    
    // Render chairs for round table
    const renderRoundChairs = () => {
      const chairs = [];
      const angleStep = 360 / table.chairCount;
      const radius = 140;
      
      for (let i = 0; i < table.chairCount; i++) {
        const angle = angleStep * i;
        const xPosition = radius * Math.cos((angle * Math.PI) / 180);
        const yPosition = radius * Math.sin((angle * Math.PI) / 180);
        
        chairs.push(
          <div
            key={i}
            className="chair"
            style={{
              position: 'absolute',
              transformOrigin: 'center',
              width: '60px',
              height: '60px',
              backgroundImage: "url('/green2.png')",
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
              zIndex: 1
            }}
          />
        );
      }
      
      return chairs;
    };
    
    // Render chairs for rectangle table
    const renderRectangleChairs = () => {
      const chairs = [];
      const tableWidth = 400;
      const tableHeight = 150;
      const border = 50;
      
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
      
      // Left side chair
      if (chairsLeft > 0) {
        chairs.push(
          <div
            key={`left-${chairIndex}`}
            className="chair"
            style={{
              position: 'absolute',
              width: '60px',
              height: '60px',
              backgroundImage: "url('/green2.png')",
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
              transform: 'rotate(270deg)',
              zIndex: 1
            }}
          />
        );
        chairIndex++;
      }
      
      // Right side chair
      if (chairsRight > 0) {
        chairs.push(
          <div
            key={`right-${chairIndex}`}
            className="chair"
            style={{
              position: 'absolute',
              width: '60px',
              height: '60px',
              backgroundImage: "url('/green2.png')",
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
              transform: 'rotate(90deg)',
              zIndex: 1
            }}
          />
        );
        chairIndex++;
      }
      
      // Top chairs
      for (let i = 0; i < chairsTop; i++) {
        const ratio = chairsTop === 1 ? 0.5 : i / (chairsTop - 1);
        const xPosition = ((tableWidth - 50) * ratio) - tableWidth / 2;
        const yPosition = -tableHeight / 2 - border + 10;
        
        chairs.push(
          <div
            key={`top-${chairIndex}`}
            className="chair"
            style={{
              position: 'absolute',
              width: '60px',
              height: '60px',
              backgroundImage: "url('/green2.png')",
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
              transform: 'rotate(0deg)',
              zIndex: 1
            }}
          />
        );
        chairIndex++;
      }
      
      // Bottom chairs
      for (let i = 0; i < chairsBottom; i++) {
        const ratio = chairsBottom === 1 ? 0.5 : i / (chairsBottom - 1);
        const xPosition = ((tableWidth - 50) * ratio) - tableWidth / 2;
        const yPosition = tableHeight / 2;
        
        chairs.push(
          <div
            key={`bottom-${chairIndex}`}
            className="chair"
            style={{
              position: 'absolute',
              width: '60px',
              height: '60px',
              backgroundImage: "url('/green2.png')",
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
              transform: 'rotate(180deg)',
              zIndex: 1
            }}
          />
        );
        chairIndex++;
      }
      
      return chairs;
    };
    
    return (
      <div
        className={`table-container ${isSelected ? 'selected' : ''}`}
        data-id={table.id}
        style={{
          position: 'absolute',
          left: `${table.x || 0}px`,
          top: `${table.y || 0}px`,
          padding: '1rem',
          borderRadius: '10px',
          cursor: 'pointer',
          border: isSelected ? '2px solid #3498db' : 'none',
          transition: 'transform 0.2s',
          transform: isSelected ? 'scale(1.05)' : 'scale(1)'
        }}
        onClick={() => handleTableClick(table.id)}
      >
        <div className="table-header">
          <h3>Стол {table.id} (Мест: {chairCount})</h3>
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
            position: "relative"
          }}>
            {/* Show RESERVED status if table is currently booked */}
            {isCurrentlyReserved && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(231, 76, 60, 0.8)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '24px',
                zIndex: 2
              }}>
                <div>ЗАНЯТО</div>
                {activeReservation && (
                  <div style={{ fontSize: '18px', marginTop: '5px', textAlign: 'center' }}>
                    {activeReservation.startTime} - {activeReservation.endTime}
                  </div>
                )}
              </div>
            )}

            {/* Show all reservations for today if not currently reserved */}
            {mergedTimeRanges.length > 0 && !isCurrentlyReserved && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(242, 120, 75, 0.5)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '20px',
                padding: '10px',
                textAlign: 'center',
                zIndex: 2
              }}>
                <div>ЗАБРОНИРОВАНО СЕГОДНЯ</div>
                <div style={{ fontSize: '16px', marginTop: '5px' }}>
                  {reservationText}
                </div>
              </div>
            )}

            {/* Render chairs */}
            {renderChairs()}
          </div>
        ) : (
          <div className="table" style={{ position: "relative" }}>
            {/* Show RESERVED status for round table */}
            {isCurrentlyReserved && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(231, 76, 60, 0.8)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '24px',
                borderRadius: '50%',
                zIndex: 2
              }}>
                <div>ЗАНЯТО</div>
                {activeReservation && (
                  <div style={{ fontSize: '18px', marginTop: '5px', textAlign: 'center' }}>
                    {activeReservation.startTime} - {activeReservation.endTime}
                  </div>
                )}
              </div>
            )}

            {/* Show all reservations for round table */}
            {mergedTimeRanges.length > 0 && !isCurrentlyReserved && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(242, 120, 75, 0.5)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '20px',
                borderRadius: '50%',
                padding: '10px',
                textAlign: 'center',
                zIndex: 2
              }}>
                <div>ЗАБРОНИРОВАНО СЕГОДНЯ</div>
                <div style={{ fontSize: '16px', marginTop: '5px' }}>
                  {reservationText}
                </div>
              </div>
            )}

            <div className="table-top">
              {renderChairs()}
            </div>
          </div>
        )}
        
        {/* Book now button for client-friendly UX */}
        <div className="book-button-container" style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '10px'
        }}>
          <button 
            className="book-button"
            onClick={(e) => {
              e.stopPropagation(); // Prevent event bubbling
              handleTableClick(table.id);
            }}
            style={{
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              padding: '8px 15px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Забронировать
          </button>
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
        {hallData ? (
          <div
            className="tables-area"
            ref={tablesAreaRef}
            style={{
              width: '100%',
              height: '100%',
              overflow: 'auto',
              padding: '20px',
              background: 'linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              backgroundColor: '#e6eef5',
              cursor: isDraggingView ? 'grabbing' : 'grab',
              // touchAction: 'none' // Prevent browser handling of all panning and zooming gestures
            }}
          >
            <div 
              className="tables-content"
              style={{
                position: 'relative',
                minWidth: '5000px',  // Большое значение, чтобы весь зал помещался
                minHeight: '5000px', // Большое значение, чтобы весь зал помещался
                transformOrigin: 'top left',
                transform: `scale(${zoom})`,
              }}
            >
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
              ))}
            </div>
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
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ textAlign: 'center' }}>Бронирование стола {selectedTableId}</h2>
            
            {/* Date selector */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Дата:
              </label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
            
            {/* Time selector */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Время:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', flex: 1 }}>
                  <select
                    value={bookingTime.split(':')[0] || '12'}
                    onChange={(e) => {
                      const hours = e.target.value;
                      const minutes = bookingTime.split(':')[1] || '00';
                      setBookingTime(`${hours}:${minutes}`);
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '4px 0 0 4px',
                      border: '1px solid #ddd',
                      borderRight: 'none'
                    }}
                  >
                    {Array.from({ length: 24 }, (_, i) => i).map(hour => {
                      const hourStr = hour.toString().padStart(2, '0');
                      
                      // Check if all slots in this hour are occupied
                      const isHourFullyOccupied = ['00', '15', '30', '45'].every(min => 
                        occupiedSlots.includes(`${hourStr}:${min}`)
                      );
                      
                      // Check if some slots in this hour are occupied
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
                                           isHourPartiallyOccupied ? '#fff8e1' : 
                                           '#ffffff',
                            color: isHourFullyOccupied ? '#999999' : '#000000'
                          }}
                        >
                          {hourStr}{isHourFullyOccupied ? ' (занято)' : 
                                  isHourPartiallyOccupied ? ' (частично)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <span style={{ 
                    padding: '10px 5px', 
                    backgroundColor: '#f5f5f5', 
                    borderTop: '1px solid #ddd',
                    borderBottom: '1px solid #ddd'
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
                      padding: '10px',
                      borderRadius: '0 4px 4px 0',
                      border: '1px solid #ddd',
                      borderLeft: 'none'
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
                          {minute}{isSlotOccupied ? ' (занято)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <span style={{ padding: '0 5px' }}>до</span>

                <div style={{ display: 'flex', flex: 1 }}>
                  <select
                    value={bookingEndTime.split(':')[0] || '14'}
                    onChange={(e) => {
                      const hours = e.target.value;
                      const minutes = bookingEndTime.split(':')[1] || '00';
                      setBookingEndTime(`${hours}:${minutes}`);
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '4px 0 0 4px',
                      border: '1px solid #ddd',
                      borderRight: 'none'
                    }}
                  >
                    {Array.from({ length: 24 }, (_, i) => i).map(hour => {
                      const hourStr = hour.toString().padStart(2, '0');
                      
                      // For end time, we don't need to disable hours that come after the start time
                      const startHour = parseInt(bookingTime.split(':')[0] || '12');
                      
                      // Check if all slots in this hour are occupied
                      const isHourFullyOccupied = ['00', '15', '30', '45'].every(min => 
                        occupiedSlots.includes(`${hourStr}:${min}`)
                      );
                      
                      // If this hour is before or equal to start hour, check if it's fully occupied
                      // Otherwise, it's selectable even if occupied (since end time can be after occupied slots)
                      const shouldDisable = hour <= startHour && isHourFullyOccupied;
                      
                      // Check if some slots in this hour are occupied (for color indication)
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
                                           isHourPartiallyOccupied ? '#fff8e1' : 
                                           '#ffffff',
                            color: shouldDisable ? '#999999' : '#000000'
                          }}
                        >
                          {hourStr}{shouldDisable ? ' (занято)' : 
                                  isHourPartiallyOccupied && hour > startHour ? ' (частично)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  <span style={{ 
                    padding: '10px 5px', 
                    backgroundColor: '#f5f5f5', 
                    borderTop: '1px solid #ddd',
                    borderBottom: '1px solid #ddd'
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
                      padding: '10px',
                      borderRadius: '0 4px 4px 0',
                      border: '1px solid #ddd',
                      borderLeft: 'none'
                    }}
                  >
                    {['00', '15', '30', '45'].map(minute => {
                      const hourStr = bookingEndTime.split(':')[0] || '14';
                      const timeSlot = `${hourStr}:${minute}`;
                      const isSlotOccupied = occupiedSlots.includes(timeSlot);
                      
                      // End time minute can be occupied if the hour is after start time
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
                                           isSlotOccupied ? '#fff8e1' : 
                                           '#ffffff',
                            color: shouldDisable ? '#999999' : '#000000'
                          }}
                        >
                          {minute}{shouldDisable ? ' (занято)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Client information */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Ваше имя:
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Иван Иванов"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Номер телефона:
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+7 (___) ___-__-__"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Количество гостей:
              </label>
              <input
                type="text"
                value={guestCount === 0 ? '' : guestCount.toString()}
                onChange={(e) => setGuestCount(parseInt(e.target.value) | 0)}
                style={{
                  width: '100px',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Примечание (необязательно):
              </label>
              <textarea
                value={bookingNote}
                onChange={(e) => setBookingNote(e.target.value)}
                placeholder="Особые пожелания, комментарии..."
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>
            
            {/* Available times info */}
            <div className="available-times-info" style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Информация о доступности:</h4>
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
                      <p style={{ color: '#dc3545' }}>
                        <strong>Занятое время:</strong> {occupiedHours.map(h => `${h}:00-${(h+1).toString().padStart(2, '0')}:00`).join(', ')}
                      </p>
                      <p>Выберите другое время для бронирования.</p>
                    </div>
                  );
                } else {
                  return (
                    <p style={{ color: '#28a745' }}>
                      <strong>Стол свободен</strong> в выбранную дату и время.
                    </p>
                  );
                }
              })()}
            </div>
            
            {/* Action buttons */}
            <div className="actions" style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedTableId(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Отмена
              </button>
              
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
                  flex: 1
                }}
              >
                Подтвердить бронирование
              </button>
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
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '500px',
            width: '90%',
            textAlign: 'center'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              backgroundColor: '#2ecc71',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <span style={{ color: 'white', fontSize: '40px' }}>✓</span>
            </div>
            
            <h2 style={{ marginBottom: '20px', color: '#2ecc71' }}>Бронирование успешно!</h2>
            
            <div className="booking-details" style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'left',
              marginBottom: '20px'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '15px', textAlign: 'center' }}>Детали бронирования</h3>
              
              <div style={{ marginBottom: '10px' }}>
                <strong>Стол:</strong> {bookingSummary.tableName}
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <strong>Дата:</strong> {bookingSummary.date}
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <strong>Время:</strong> {bookingSummary.time}
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <strong>Имя:</strong> {bookingSummary.name}
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <strong>Телефон:</strong> {bookingSummary.phone}
              </div>
              
              <div>
                <strong>Количество гостей:</strong> {bookingSummary.guestCount}
              </div>
            </div>
            
            <p style={{ marginBottom: '20px' }}>
              В случае изменения планов, пожалуйста, свяжитесь с нами по телефону для отмены бронирования.
            </p>
            
            <button
              onClick={resetBooking}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
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