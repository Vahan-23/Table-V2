import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './hallview.css';
import CollapsiblePanel from './CollapsiblePanel';

// ======================================================
// DATE AND TIME UTILITY FUNCTIONS
// ======================================================

/**
 * Date/time utilities for consistent handling throughout the component
 */
const DateTimeUtils = {
  /**
   * Formats a date as YYYY-MM-DD
   * @param {Date} date - The date to format
   * @returns {string} Formatted date string
   */
  formatDateToYMD: (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Formats a date for display in the UI
   * @param {string|Date} date - Date to format
   * @returns {string} Formatted date for display
   */
  formatDateForDisplay: (date) => {
    if (!date) return 'Дата не указана';
    
    try {
      let dateObj;
      
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        // Handle ISO date strings or YYYY-MM-DD format
        dateObj = new Date(date);
        
        // If parsing fails or gives invalid date, try manual parsing for YYYY-MM-DD
        if (isNaN(dateObj.getTime())) {
          const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (match) {
            const [_, year, month, day] = match;
            dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          }
        }
      }
      
      // Check if we have a valid date object now
      if (dateObj && !isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('ru-RU', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      
      // Return the original string if all parsing attempts failed
      return typeof date === 'string' ? date : 'Дата не указана';
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Дата не указана';
    }
  },

  /**
   * Parses a date string in YYYY-MM-DD format
   * @param {string} dateString - The date string to parse
   * @returns {Date} Parsed date object
   */
  parseBookingDate: (dateString) => {
    if (!dateString) {
      return new Date();
    }
    
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    } catch (e) {
      console.error('Error parsing date:', e);
      return new Date();
    }
  },

  /**
   * Converts a time string to minutes since midnight
   * @param {string} timeString - Time in HH:MM format
   * @returns {number} Minutes since midnight
   */
  parseTimeToMinutes: (timeString) => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  },

  /**
   * Formats time to ensure it's in 24-hour HH:MM format
   * @param {string} timeString - Time to format
   * @returns {string} Formatted time
   */
  formatTime24h: (timeString) => {
    if (!timeString) return '';
    
    // Check for valid format
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (timeRegex.test(timeString)) {
      // Already in correct format, just ensure two digits
      const [hours, minutes] = timeString.split(':').map(Number);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (e) {
      console.error('Error formatting time:', e);
      return timeString;
    }
  },

  /**
   * Generates time slots for the day with specified interval
   * @param {number} intervalMinutes - Interval between slots in minutes
   * @returns {Array<string>} Array of time slots in HH:MM format
   */
  generateTimeSlots: (intervalMinutes = 15) => {
    const slots = [];
    const slotsPerHour = 60 / intervalMinutes;
    
    for (let hour = 0; hour < 24; hour++) {
      for (let segment = 0; segment < slotsPerHour; segment++) {
        const minute = segment * intervalMinutes;
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    
    return slots;
  },

  /**
   * Determines if a booking spans midnight
   * @param {string} startTime - Start time in HH:MM format
   * @param {string} endTime - End time in HH:MM format
   * @returns {boolean} True if booking spans midnight
   */
  doesBookingSpanMidnight: (startTime, endTime) => {
    const startMinutes = DateTimeUtils.parseTimeToMinutes(startTime);
    const endMinutes = DateTimeUtils.parseTimeToMinutes(endTime);
    return endMinutes < startMinutes;
  },

  /**
   * Calculates the number of time slots a booking spans
   * @param {string} startTime - Start time in HH:MM format
   * @param {string} endTime - End time in HH:MM format
   * @param {number} intervalMinutes - Interval between slots in minutes
   * @returns {number} Number of time slots
   */
  calculateBookingSpan: (startTime, endTime, intervalMinutes = 15) => {
    if (!startTime || !endTime) return 1;
    
    const startMinutes = DateTimeUtils.parseTimeToMinutes(startTime);
    const endMinutes = DateTimeUtils.parseTimeToMinutes(endTime);
    
    // Handle bookings that span midnight
    if (endMinutes < startMinutes) {
      // Add 24 hours (in minutes) to end time
      return Math.ceil((endMinutes + 24 * 60 - startMinutes) / intervalMinutes);
    } else {
      return Math.ceil((endMinutes - startMinutes) / intervalMinutes);
    }
  },

  /**
   * Checks if a time slot is within a booking period
   * @param {string} timeSlot - Time slot to check
   * @param {string} startTime - Booking start time
   * @param {string} endTime - Booking end time
   * @returns {boolean} True if time slot is within booking
   */
  isTimeSlotInBooking: (timeSlot, startTime, endTime) => {
    const slotMinutes = DateTimeUtils.parseTimeToMinutes(timeSlot);
    const startMinutes = DateTimeUtils.parseTimeToMinutes(startTime);
    const endMinutes = DateTimeUtils.parseTimeToMinutes(endTime);
    
    // Handle bookings that span midnight
    if (endMinutes < startMinutes) {
      return slotMinutes >= startMinutes || slotMinutes < endMinutes;
    } else {
      return slotMinutes >= startMinutes && slotMinutes < endMinutes;
    }
  },

  /**
   * Checks if two booking times conflict
   * @param {string} start1 - First booking start time
   * @param {string} end1 - First booking end time
   * @param {string} start2 - Second booking start time
   * @param {string} end2 - Second booking end time
   * @returns {boolean} True if bookings conflict
   */
  doTimesConflict: (start1, end1, start2, end2) => {
    // Convert all times to minutes for easier comparison
    const start1Min = DateTimeUtils.parseTimeToMinutes(start1);
    const end1Min = DateTimeUtils.parseTimeToMinutes(end1);
    const start2Min = DateTimeUtils.parseTimeToMinutes(start2);
    const end2Min = DateTimeUtils.parseTimeToMinutes(end2);
    
    // Special handling for bookings that span midnight
    const booking1SpansMidnight = end1Min < start1Min;
    const booking2SpansMidnight = end2Min < start2Min;
    
    if (!booking1SpansMidnight && !booking2SpansMidnight) {
      // Neither booking spans midnight - simple case
      return start1Min < end2Min && start2Min < end1Min;
    } else if (booking1SpansMidnight && !booking2SpansMidnight) {
      // First booking spans midnight, second doesn't
      return start2Min < end1Min || start1Min < end2Min;
    } else if (!booking1SpansMidnight && booking2SpansMidnight) {
      // Second booking spans midnight, first doesn't
      return start1Min < end2Min || start2Min < end1Min;
    } else {
      // Both bookings span midnight
      return true; // They will always overlap in some way
    }
  },

  /**
   * Gets locale-specific day and month names
   */
  getMonthName: (month) => {
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return monthNames[month];
  },

  getDayName: (day) => {
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return dayNames[day];
  },

  getWeekDays: () => {
    return ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  },

  getDaysInMonth: (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  }
};

// ======================================================
// BOOKING CALENDAR COMPONENT
// ======================================================

const BookingCalendar = ({ hallData, groups, onBookingAdded, onBookingUpdated, onBookingDeleted }) => {
  // ----------------
  // STATE MANAGEMENT
  // ----------------
  
  // Calendar view state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month'); // 'month', 'week', or 'day'
  const [currentDay, setCurrentDay] = useState(new Date().getDate());
  const [zoom, setZoom] = useState(1);
  
  // Filter and selection state
  const [filterTable, setFilterTable] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  
  // Booking form state
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingEndTime, setBookingEndTime] = useState('');
  const [bookingNote, setBookingNote] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  
  // UI state
  const [scrollToCurrentTime, setScrollToCurrentTime] = useState(true);
  const timelineRef = useRef(null);
  const currentTimeRef = useRef(null);
  
  // ----------------
  // DERIVED STATE
  // ----------------
  
  // Generate time slots with 15-minute intervals (96 slots for 24 hours)
  const timeSlots = useMemo(() => {
    return DateTimeUtils.generateTimeSlots(15);
  }, []);

  // Extract all bookings from tables
  const allBookings = useMemo(() => {
    if (!hallData || !hallData.tables) return [];
    
    const bookings = [];
    
    hallData.tables.forEach(table => {
      if (!table.people) return;
      
      table.people.forEach((person, index) => {
        if (!person || !person.booking) return;
        
        // Skip hidden guests
        if (person.hiddenInCalendar) return;
        
        // Process date and time
        const { date, time, endTime, note } = person.booking;
        
        if (!date || !time || !endTime) return;
        
        const [startHour, startMinute] = time.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        // Create Date objects for booking with respect to the date
        const bookingDate = DateTimeUtils.parseBookingDate(date);
        const startDate = new Date(bookingDate);
        startDate.setHours(startHour, startMinute, 0);
        
        const endDate = new Date(bookingDate);
        endDate.setHours(endHour, endMinute, 0);
        
        // Generate a unique color based on table ID
        const color = `#${Math.floor(parseInt(table.id) * 9999).toString(16).padStart(6, '0')}`;
        
        bookings.push({
          id: `${table.id}-${index}-${person.name}`,
          tableId: table.id,
          personName: person.name,
          groupName: person.group,
          startTime: startDate,
          endTime: endDate,
          dateString: date,
          startTimeString: time,
          endTimeString: endTime,
          note: note || '',
          color,
          person, // Reference to the original person object
          tableIndex: index, // Save the index for edits/deletions
          guestCount: person.guestCount || 1
        });
      });
    });
    
    return bookings;
  }, [hallData]);

  // Filter bookings based on current selections
  const filteredBookings = useMemo(() => {
    let filtered = [...allBookings];
    
    if (filterTable !== 'all') {
      filtered = filtered.filter(booking => booking.tableId === parseInt(filterTable));
    }
    
    if (filterClient !== 'all') {
      filtered = filtered.filter(booking => booking.groupName === filterClient);
    }
    
    return filtered;
  }, [allBookings, filterTable, filterClient]);

  // Get all available tables for filtering
  const availableTables = useMemo(() => {
    if (!hallData || !hallData.tables) return [];
    
    return hallData.tables.map(table => ({
      id: table.id,
      name: `Стол ${table.id}`
    }));
  }, [hallData]);

  // Get all client groups for filtering
  const clientGroups = useMemo(() => {
    if (!groups) return [];
    return groups.map(group => group.name);
  }, [groups]);

  // ----------------
  // EFFECTS
  // ----------------
  
  // Set default booking date and times when modal opens
  useEffect(() => {
    if (showBookingModal) {
      // Set default date if not editing
      if (!editingBooking) {
        const today = new Date();
        setBookingDate(DateTimeUtils.formatDateToYMD(today));
        
        // Set default times
        const currentHour = today.getHours();
        const currentMinute = Math.floor(today.getMinutes() / 15) * 15;
        
        const startTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        setBookingTime(startTime);
        
        // Default end time is 2 hours later
        let endHour = currentHour + 2;
        if (endHour >= 24) {
          endHour = 23;
          setBookingEndTime(`${endHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);
        } else {
          setBookingEndTime(`${endHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);
        }
      }
    }
  }, [showBookingModal, editingBooking]);

  // Set editing form values when editingBooking changes
  useEffect(() => {
    if (editingBooking) {
      setBookingDate(editingBooking.dateString);
      setBookingTime(editingBooking.startTimeString);
      setBookingEndTime(editingBooking.endTimeString);
      setBookingNote(editingBooking.note || '');
    }
  }, [editingBooking]);

  // Scroll to current time in day view
  useEffect(() => {
    if (scrollToCurrentTime && timelineRef.current && currentView === 'day') {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Calculate position to scroll to
      const hourHeight = 150; // Approximate height of one hour block
      const scrollPos = currentHour * hourHeight;
      
      // Scroll to current hour
      timelineRef.current.scrollTop = scrollPos;
      
      setScrollToCurrentTime(false);
    }
  }, [scrollToCurrentTime, currentView]);

  // ----------------
  // EVENT HANDLERS
  // ----------------
  
  // Handlers for calendar navigation
  const handlePrevious = useCallback(() => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      
      if (currentView === 'month') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else if (currentView === 'week') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() - 1);
      }
      
      return newDate;
    });
  }, [currentView]);

  const handleNext = useCallback(() => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      
      if (currentView === 'month') {
        newDate.setMonth(newDate.getMonth() + 1);
      } else if (currentView === 'week') {
        newDate.setDate(newDate.getDate() + 7);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
      
      return newDate;
    });
  }, [currentView]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
    setCurrentDay(new Date().getDate());
    setScrollToCurrentTime(true);
  }, []);

  const handleDayClick = useCallback((day) => {
    setCurrentDay(day);
    setCurrentView('day');
    
    const newDate = new Date(currentDate);
    newDate.setDate(day);
    setCurrentDate(newDate);
    
    setScrollToCurrentTime(true);
  }, [currentDate]);

  // Booking selection and management
  const handleSelectBooking = useCallback((booking) => {
    setSelectedBooking(booking);
  }, []);

  const closeBookingDetails = useCallback(() => {
    setSelectedBooking(null);
  }, []);

  const handleEditBooking = useCallback((booking) => {
    setEditingBooking(booking);
    setShowBookingModal(true);
    closeBookingDetails();
  }, []);

  const handleDeleteBooking = useCallback((booking) => {
    setEditingBooking(booking);
    setShowDeleteConfirmation(true);
    closeBookingDetails();
  }, []);

  const cancelBookingEdit = useCallback(() => {
    setShowBookingModal(false);
    setEditingBooking(null);
    setBookingDate('');
    setBookingTime('');
    setBookingEndTime('');
    setBookingNote('');
    setPendingBooking(null);
  }, []);

  const confirmDeleteBooking = useCallback(() => {
    if (!editingBooking) return;
    
    // Call parent handler to update data
    if (onBookingDeleted) {
      onBookingDeleted(editingBooking);
    }
    
    setShowDeleteConfirmation(false);
    setEditingBooking(null);
  }, [editingBooking, onBookingDeleted]);

  const cancelDeleteBooking = useCallback(() => {
    setShowDeleteConfirmation(false);
    setEditingBooking(null);
  }, []);

  const saveBookingChanges = useCallback(() => {
    // Validate inputs
    if (!bookingDate || !bookingTime || !bookingEndTime) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    // Format times
    const formattedStartTime = DateTimeUtils.formatTime24h(bookingTime);
    const formattedEndTime = DateTimeUtils.formatTime24h(bookingEndTime);
    
    // Create booking data
    const bookingData = {
      date: bookingDate,
      time: formattedStartTime,
      endTime: formattedEndTime,
      note: bookingNote,
      timestamp: new Date().toISOString()
    };
    
    if (editingBooking) {
      // Update existing booking
      if (onBookingUpdated) {
        onBookingUpdated(editingBooking, bookingData);
      }
    } else if (pendingBooking) {
      // Create new booking
      if (onBookingAdded) {
        onBookingAdded(pendingBooking, bookingData);
      }
    }
    
    // Reset state
    setShowBookingModal(false);
    setEditingBooking(null);
    setPendingBooking(null);
    setBookingDate('');
    setBookingTime('');
    setBookingEndTime('');
    setBookingNote('');
  }, [
    bookingDate, 
    bookingTime, 
    bookingEndTime, 
    bookingNote, 
    editingBooking, 
    pendingBooking, 
    onBookingUpdated, 
    onBookingAdded
  ]);

  // ----------------
  // BOOKING VALIDATION AND UTILITY FUNCTIONS
  // ----------------
  
  /**
   * Checks if a time slot is occupied for a given table and date
   */
  const isSlotOccupied = useCallback((tableId, timeSlot, bookingDate) => {
    if (!hallData || !hallData.tables) return false;
    
    const table = hallData.tables.find(t => t.id === tableId);
    if (!table || !table.people) return false;
    
    // Check if any person at the table has a booking for this time
    return table.people.some(person => {
      if (!person || !person.booking) return false;
      
      // Check if the booking is for the selected date
      if (person.booking.date !== bookingDate) return false;
      
      return DateTimeUtils.isTimeSlotInBooking(
        timeSlot, 
        person.booking.time, 
        person.booking.endTime
      );
    });
  }, [hallData]);

  /**
   * Checks if a time slot is the start of a booking
   */
  const isBookingStart = useCallback((tableId, timeSlot, bookingDate) => {
    if (!hallData || !hallData.tables) return false;
    
    const table = hallData.tables.find(t => t.id === tableId);
    if (!table || !table.people) return false;
    
    return table.people.some(person => {
      if (!person || !person.booking) return false;
      if (person.booking.date !== bookingDate) return false;
      return person.booking.time === timeSlot;
    });
  }, [hallData]);

  /**
   * Gets booking end time for a given start time
   */
  const getBookingEndTime = useCallback((tableId, timeSlot, bookingDate) => {
    if (!hallData || !hallData.tables) return null;
    
    const table = hallData.tables.find(t => t.id === tableId);
    if (!table || !table.people) return null;
    
    const person = table.people.find(p => {
      if (!p || !p.booking) return false;
      if (p.booking.date !== bookingDate) return false;
      return p.booking.time === timeSlot;
    });
    
    return person ? person.booking.endTime : null;
  }, [hallData]);

  /**
   * Calculates the number of time slots a booking spans
   */
  const getBookingSpan = useCallback((startTime, endTime) => {
    return DateTimeUtils.calculateBookingSpan(startTime, endTime);
  }, []);

  /**
   * Gets booking details for a specific time slot
   */
  const getBookingDetails = useCallback((tableId, timeSlot, bookingDate) => {
    if (!hallData || !hallData.tables) return null;
    
    const table = hallData.tables.find(t => t.id === tableId);
    if (!table || !table.people) return null;
    
    // Find the first person with a booking that includes this time slot
    const personWithBooking = table.people.find(person => {
      if (!person || !person.booking) return false;
      if (person.booking.date !== bookingDate) return false;
      
      return DateTimeUtils.isTimeSlotInBooking(
        timeSlot, 
        person.booking.time, 
        person.booking.endTime
      );
    });
    
    if (!personWithBooking) return null;
    
    return {
      name: personWithBooking.name,
      group: personWithBooking.group,
      startTime: personWithBooking.booking.time,
      endTime: personWithBooking.booking.endTime,
      note: personWithBooking.booking.note || '',
      tableId: tableId,
      guestCount: personWithBooking.guestCount || 1,
      person: personWithBooking
    };
  }, [hallData]);

  /**
   * Gets all occupied time slots for a given table and date
   */
  const getOccupiedTimeSlots = useCallback((tableId, date) => {
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
      
      const startTime = DateTimeUtils.parseTimeToMinutes(person.booking.time);
      const endTime = DateTimeUtils.parseTimeToMinutes(person.booking.endTime);
      
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
  }, [hallData]);

  /**
   * Checks for time conflicts when creating or editing a booking
   */
  const checkTimeConflict = useCallback((tableId, date, startTime, endTime, excludeBookingId = null) => {
    if (!startTime || !endTime) return false;
    
    // For editing: we need to exclude the current booking being edited
    const relevantBookings = allBookings.filter(booking => 
      booking.tableId === tableId && 
      booking.dateString === date &&
      (excludeBookingId ? booking.id !== excludeBookingId : true)
    );
    
    // Check against each existing booking
    return relevantBookings.some(booking => 
      DateTimeUtils.doTimesConflict(
        startTime, 
        endTime, 
        booking.startTimeString, 
        booking.endTimeString
      )
    );
  }, [allBookings]);

  /**
   * Checks if a chair is currently occupied
   */
  const isChairOccupiedNow = useCallback((tableId, chairIndex) => {
    if (!hallData || !hallData.tables) return false;
    
    const table = hallData.tables.find(t => t.id === tableId);
    if (!table || !table.people || !table.people[chairIndex]) return false;
    
    const person = table.people[chairIndex];
    if (!person || !person.booking) return false;
    
    // Get current time
    const now = new Date();
    const today = DateTimeUtils.formatDateToYMD(now);
    
    // Check if booking is for today
    if (person.booking.date !== today) return false;
    
    // Check if current time is within booking hours
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    return DateTimeUtils.isTimeSlotInBooking(
      currentTimeStr,
      person.booking.time,
      person.booking.endTime
    );
  }, [hallData]);

  // ----------------
  // RENDERING METHODS FOR DIFFERENT VIEWS
  // ----------------
  
  /**
   * Renders the day view calendar
   */
  const renderDayView = () => {
    // Format date for queries
    const formattedDate = DateTimeUtils.formatDateToYMD(currentDate);
    
    // Create time slots for the entire day (00:00 to 23:45)
    const workingHourSlots = timeSlots;
    
    // Group time slots by hour for headers
    const hourGroups = {};
    workingHourSlots.forEach(slot => {
      const hour = slot.split(':')[0];
      if (!hourGroups[hour]) {
        hourGroups[hour] = [];
      }
      hourGroups[hour].push(slot);
    });
    
    // Get current time for highlighting
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = Math.floor(now.getMinutes() / 15) * 15;
    const currentTimeString = `${currentHour}:${currentMinute.toString().padStart(2, '0')}`;
    
    // Pre-process booking data for all tables and time slots
    const bookingsData = {};
    
    if (hallData && hallData.tables) {
      hallData.tables.forEach(table => {
        bookingsData[table.id] = {};
        
        workingHourSlots.forEach(timeSlot => {
          const isOccupied = isSlotOccupied(table.id, timeSlot, formattedDate);
          const isStart = isBookingStart(table.id, timeSlot, formattedDate);
          
          if (isOccupied) {
            let bookingSpan = 1;
            let bookingDetails = null;
            
            if (isStart) {
              const endTime = getBookingEndTime(table.id, timeSlot, formattedDate);
              bookingSpan = getBookingSpan(timeSlot, endTime);
              bookingDetails = getBookingDetails(table.id, timeSlot, formattedDate);
            } else {
              // Get details for non-starting cells too
              bookingDetails = getBookingDetails(table.id, timeSlot, formattedDate);
            }
            
            bookingsData[table.id][timeSlot] = {
              isOccupied,
              isStart,
              bookingSpan,
              bookingDetails
            };
          } else {
            bookingsData[table.id][timeSlot] = {
              isOccupied: false,
              isStart: false,
              bookingSpan: 1,
              bookingDetails: null
            };
          }
        });
      });
    }
    
    // Track which slots have been processed to skip cells
    const processedSlots = {};
    
    // Check if tables exist
    const hasTables = hallData && hallData.tables && hallData.tables.length > 0;
    
    return (
      <div className="day-view" style={{ 
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5',
        color: '#333'
      }}>
        <h3 style={{ 
          margin: '0', 
          textAlign: 'center',
          padding: '15px',
          backgroundColor: '#fff',
          color: '#333',
          borderBottom: '1px solid #ddd'
        }}>
          Расписание на {currentDate.getDate()} {DateTimeUtils.getMonthName(currentDate.getMonth())} {currentDate.getFullYear()} - {DateTimeUtils.getDayName(currentDate.getDay())}
        </h3>
        
        <div 
          ref={timelineRef}
          style={{ 
            flex: 1, 
            overflow: 'auto',
            position: 'relative'
          }}
        >
          <table style={{
            borderCollapse: 'collapse',
            width: 'max-content',
            minWidth: '100%'
          }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                {/* Time column header */}
                <th style={{
                  backgroundColor: '#0a0a1d',
                  color: 'white',
                  padding: '10px',
                  width: '150px',
                  textAlign: 'center',
                  borderRight: '2px solid #444',
                  position: 'sticky',
                  left: 0,
                  zIndex: 11,
                  boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
                }}>
                  Время
                </th>
                
                {/* Table headers */}
                {hasTables && hallData.tables.map(table => (
                  <th key={table.id} style={{
                    backgroundColor: '#0a0a1d',
                    color: 'white',
                    padding: '10px',
                    textAlign: 'center',
                    borderBottom: '1px solid #444',
                    borderRight: '1px solid #444',
                    width: '120px'
                  }}>
                    Стол {table.id}
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody>
              {/* Group cells by hour */}
              {Object.keys(hourGroups).map(hour => (
                <React.Fragment key={hour}>
                  {/* Hour header */}
                  <tr>
                    <td style={{
                      backgroundColor: '#2c3e50',
                      color: 'white',
                      padding: '8px 15px',
                      fontSize: '15px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      borderBottom: '1px solid #444',
                      borderRight: '2px solid #444',
                      position: 'sticky',
                      left: 0,
                      zIndex: 9,
                      boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
                    }}>
                      {hour}:00
                    </td>
                    
                    {/* Add horizontal hour divider for each table */}
                    {hasTables && hallData.tables.map(table => (
                      <td key={table.id} style={{
                        backgroundColor: '#2c3e50',
                        borderBottom: '1px solid #444',
                        borderRight: '1px solid #444',
                        padding: '2px'
                      }}></td>
                    ))}
                  </tr>
                  
                  {/* Rows for time slots within this hour */}
                  {hourGroups[hour].map((timeSlot) => {
                    const isCurrentTime = timeSlot === currentTimeString;
                    
                    // Reset processed slots tracking for each new time slot
                    Object.keys(processedSlots).forEach(tableId => {
                      processedSlots[tableId] = processedSlots[tableId] || {};
                    });
                    
                    return (
                      <tr key={timeSlot} style={{
                        backgroundColor: isCurrentTime ? 'rgba(52, 152, 219, 0.1)' : 'transparent'
                      }}>
                        {/* Time cell */}
                        <td style={{
                          backgroundColor: isCurrentTime ? 'rgba(52, 152, 219, 0.3)' : '#f0f0f0',
                          color: '#333',
                          padding: '6px 10px',
                          fontSize: '13px',
                          textAlign: 'center',
                          borderBottom: '1px solid #ddd',
                          borderRight: '2px solid #444',
                          position: 'sticky',
                          left: 0,
                          zIndex: 9,
                          boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
                          fontWeight: isCurrentTime ? 'bold' : 'normal'
                        }}
                        ref={isCurrentTime ? currentTimeRef : null}
                        >
                          {timeSlot.split(':')[1] === '00' ? timeSlot : timeSlot.split(':')[1]}
                        </td>
                        
                        {/* Cells for each table at this time slot */}
                        {hasTables && hallData.tables.map(table => {
                          const tableId = table.id;
                          
                          // Skip if this slot is already processed (part of a previous booking)
                          if (processedSlots[tableId] && processedSlots[tableId][timeSlot]) {
                            return null;
                          }
                          
                          const bookingData = bookingsData[tableId][timeSlot];
                          const { isOccupied, isStart, bookingSpan, bookingDetails } = bookingData;
                          
                          // Mark this and subsequent slots as processed if this is a booking start
                          if (isStart && bookingSpan > 1) {
                            processedSlots[tableId] = processedSlots[tableId] || {};
                            
                            // Mark all slots covered by this booking
                            for (let i = 0; i < bookingSpan; i++) {
                              const slotIndex = workingHourSlots.indexOf(timeSlot);
                              if (slotIndex + i < workingHourSlots.length) {
                                const nextSlot = workingHourSlots[slotIndex + i];
                                if (i > 0) { // Skip the first slot (current)
                                  processedSlots[tableId][nextSlot] = true;
                                }
                              }
                            }
                          }
                          
                          // Find the full booking if this cell is part of a booking
                          const fullBooking = isOccupied && bookingDetails ? 
                            allBookings.find(b => 
                              b.tableId === tableId && 
                              b.personName === bookingDetails.name &&
                              b.dateString === formattedDate
                            ) : null;
                          
                          return (
                            <td 
                              key={`${tableId}-${timeSlot}`}
                              rowSpan={isStart ? bookingSpan : 1}
                              style={{
                                backgroundColor: isOccupied
                                  ? '#e74c3c' // Red for occupied cells
                                  : (isCurrentTime ? 'rgba(46, 204, 113, 0.3)' : '#2ecc71'), // Green for free
                                border: '1px solid rgba(255, 255, 255, 0.4)',
                                padding: 0,
                                minHeight: '30px',
                                height: isStart ? `${bookingSpan * 30}px` : '30px',
                                position: 'relative',
                                cursor: isOccupied ? 'pointer' : 'default',
                                transition: 'all 0.2s'
                              }}
                              onClick={() => isOccupied && fullBooking && handleSelectBooking(fullBooking)}
                              onMouseOver={(e) => {
                                if (isStart && isOccupied) {
                                  e.currentTarget.style.backgroundColor = '#c0392b';
                                } else if (!isOccupied) {
                                  e.currentTarget.style.opacity = '0.8';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (isStart && isOccupied) {
                                  e.currentTarget.style.backgroundColor = '#e74c3c';
                                } else if (!isOccupied) {
                                  e.currentTarget.style.opacity = '1';
                                }
                              }}
                            >
                              {/* Display information in booking start cell */}
                              {isStart && isOccupied && bookingDetails && (
                                <div style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  padding: '5px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  textAlign: 'center',
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{bookingDetails.name}</div>
                                  <div style={{ fontSize: '10px' }}>
                                    {bookingDetails.startTime} - {bookingDetails.endTime}
                                  </div>
                                  {bookingDetails.note && (
                                    <div style={{ 
                                      fontSize: '9px', 
                                      marginTop: '2px',
                                      maxWidth: '100%',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {bookingDetails.note}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Also show client name in non-start booking cells */}
                              {isOccupied && !isStart && bookingDetails && (
                                <div style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  padding: '5px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  textAlign: 'center',
                                  color: 'white',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {bookingDetails.name}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Scroll to current time button */}
        <button
          onClick={() => setScrollToCurrentTime(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          <span style={{ fontSize: '20px' }}>⌚</span>
        </button>
      </div>
    );
  };

  /**
   * Renders the week view calendar
   */
  const renderWeekView = () => {
    // Get the first day of the week (Monday) for current date
    const firstDayOfWeek = new Date(currentDate);
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    firstDayOfWeek.setDate(diff);
    
    // Create array of dates for the week
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDayOfWeek);
      date.setDate(date.getDate() + i);
      weekDates.push(date);
    }
    
    // Group bookings by day
    const bookingsByDay = {};
    weekDates.forEach(date => {
      const dateStr = DateTimeUtils.formatDateToYMD(date);
      bookingsByDay[dateStr] = filteredBookings.filter(booking => 
        DateTimeUtils.formatDateToYMD(booking.startTime) === dateStr
      ).sort((a, b) => a.startTime - b.startTime);
    });
    
    return (
      <div className="week-view" style={{ padding: '15px', height: '100%', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>
          Неделя {firstDayOfWeek.getDate()} {DateTimeUtils.getMonthName(firstDayOfWeek.getMonth())} - {
            weekDates[6].getDate()} {DateTimeUtils.getMonthName(weekDates[6].getMonth())} {weekDates[6].getFullYear()}
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {weekDates.map((date, index) => {
            const dateStr = DateTimeUtils.formatDateToYMD(date);
            const dayBookings = bookingsByDay[dateStr] || [];
            const isToday = new Date().toDateString() === date.toDateString();
            
            return (
              <div key={index} style={{ marginBottom: '10px' }}>
                <div 
                  style={{ 
                    padding: '8px 12px',
                    backgroundColor: isToday ? '#3498db' : '#2c3e50',
                    borderRadius: '6px 6px 0 0',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: 'white'
                  }}
                  onClick={() => {
                    setCurrentDate(date);
                    setCurrentDay(date.getDate());
                    setCurrentView('day');
                  }}
                >
                  <span>
                    {DateTimeUtils.getDayName(date.getDay())}, {date.getDate()} {DateTimeUtils.getMonthName(date.getMonth())}
                    {isToday && <span style={{ marginLeft: '8px', fontSize: '12px' }}>(Сегодня)</span>}
                  </span>
                  {dayBookings.length > 0 && (
                    <span style={{ 
                      backgroundColor: '#3498db',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '12px'
                    }}>
                      {dayBookings.length}
                    </span>
                  )}
                </div>
                
                <div style={{ 
                  backgroundColor: '#1e1e1e',
                  borderRadius: '0 0 6px 6px',
                  padding: dayBookings.length > 0 ? '12px' : '0'
                }}>
                  {dayBookings.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {dayBookings.map(booking => (
                        <div 
                          key={booking.id}
                          onClick={() => handleSelectBooking(booking)}
                          style={{
                            backgroundColor: '#333',
                            borderLeft: `4px solid ${booking.color}`,
                            borderRadius: '4px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#444';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#333';
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                              {booking.personName}
                            </div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#aaa'
                            }}>
                              {booking.startTimeString} - {booking.endTimeString}
                            </div>
                          </div>
                          
                          <div style={{ 
                            marginTop: '4px',
                            fontSize: '12px',
                            color: '#999',
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}>
                            <div>Стол {booking.tableId}</div>
                            <div>{booking.groupName}</div>
                          </div>
                          
                          {booking.note && (
                            <div style={{
                              marginTop: '4px',
                              fontSize: '11px',
                              color: '#888',
                              borderTop: '1px dotted #444',
                              paddingTop: '4px'
                            }}>
                              {booking.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '10px',
                      textAlign: 'center',
                      color: '#666',
                      fontStyle: 'italic',
                      fontSize: '13px'
                    }}>
                      Нет бронирований
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /**
   * Renders the month view calendar
   */
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Adjust for Monday as first day
    
    // Get number of days in month
    const daysInMonth = DateTimeUtils.getDaysInMonth(year, month);
    
    // Create calendar grid cells
    const cells = [];
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < adjustedFirstDay; i++) {
      cells.push(null);
    }
    
    // Add cells for each day of month
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(day);
    }
    
    // Group bookings by day
    const bookingsByDay = {};
    filteredBookings.forEach(booking => {
      // Check if booking is for current month and year
      if (booking.startTime.getMonth() === month && booking.startTime.getFullYear() === year) {
        const day = booking.startTime.getDate();
        if (!bookingsByDay[day]) {
          bookingsByDay[day] = [];
        }
        bookingsByDay[day].push(booking);
      }
    });
    
    // Create week rows
    const rows = [];
    let cellsCopy = [...cells];
    
    while (cellsCopy.length > 0) {
      rows.push(cellsCopy.splice(0, 7));
    }
    
    // Get today's date for highlighting
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    const currentDay = today.getDate();
    
    return (
      <div className="month-view" style={{ padding: '15px', height: '100%', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>
          {DateTimeUtils.getMonthName(month)} {year}
        </h3>
        
        <div className="calendar-grid" style={{ width: '100%' }}>
          {/* Calendar header - days of week */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)',
            textAlign: 'center',
            fontWeight: 'bold',
            marginBottom: '10px',
            backgroundColor: '#2c3e50',
            borderRadius: '6px',
            padding: '8px 0',
            color: 'white'
          }}>
            {DateTimeUtils.getWeekDays().map((day, index) => (
              <div key={index} style={{ padding: '5px' }}>{day}</div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateRows: `repeat(${rows.length}, 1fr)`,
            gap: '8px',
            height: 'calc(100% - 40px)'
          }}>
            {rows.map((row, rowIndex) => (
              <div 
                key={rowIndex}
                style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '8px',
                  height: '100%'
                }}
              >
                {row.map((day, colIndex) => {
                  // Check if this day is today
                  const isToday = isCurrentMonth && day === currentDay;
                  
                  // Get bookings for this day
                  const dayBookings = day ? (bookingsByDay[day] || []) : [];
                  
                  // Check if this day is selected
                  const isSelected = day === currentDay && 
                    currentDate.getMonth() === month && 
                    currentDate.getFullYear() === year;
                  
                  return (
                    <div 
                      key={colIndex}
                      onClick={() => day && handleDayClick(day)}
                      style={{ 
                        backgroundColor: day ? (isSelected ? '#2c3e50' : '#1e1e1e') : 'transparent',
                        borderRadius: '6px',
                        padding: day ? '8px' : '0',
                        position: 'relative',
                        cursor: day ? 'pointer' : 'default',
                        border: isToday ? '2px solid #3498db' : 'none',
                        height: '100%',
                        minHeight: '100px',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        overflow: 'hidden'
                      }}
                      onMouseOver={(e) => {
                        if (day) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (day) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      {day && (
                        <>
                          <div style={{ 
                            fontWeight: isToday ? 'bold' : 'normal',
                            color: isToday ? '#3498db' : '#ccc',
                            marginBottom: '8px',
                            fontSize: '14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span>{day}</span>
                            {dayBookings.length > 0 && (
                              <span style={{
                                backgroundColor: '#3498db',
                                color: 'white',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px'
                              }}>
                                {dayBookings.length}
                              </span>
                            )}
                          </div>
                          
                          {dayBookings.length > 0 && (
                            <div style={{ 
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              overflow: 'hidden',
                              maxHeight: 'calc(100% - 25px)'
                            }}>
                              {dayBookings.slice(0, 3).map((booking, index) => (
                                <div 
                                  key={booking.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectBooking(booking);
                                  }}
                                  style={{
                                    backgroundColor: '#333',
                                    borderLeft: `3px solid ${booking.color}`,
                                    padding: '4px 6px',
                                    borderRadius: '3px',
                                    fontSize: '11px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {booking.startTimeString} {booking.personName}
                                </div>
                              ))}
                              
                              {dayBookings.length > 3 && (
                                <div 
                                  style={{
                                    backgroundColor: '#2c3e50',
                                    padding: '4px 6px',
                                    borderRadius: '3px',
                                    fontSize: '11px',
                                    textAlign: 'center',
                                    cursor: 'pointer'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDayClick(day);
                                  }}
                                >
                                  +{dayBookings.length - 3} ещё
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ----------------
  // MAIN RENDER METHOD
  // ----------------
  
  return (
    <div className="booking-calendar" style={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      color: 'white'
    }}>
      {/* Header with navigation and view controls */}
      <div style={{ 
        padding: '15px',
        borderBottom: '1px solid #3a3a3a',
        backgroundColor: '#1a1a1a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0 }}>Календарь бронирований</h3>
        
        {/* View controls */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setCurrentView('day')}
            style={{
              backgroundColor: currentView === 'day' ? '#3498db' : '#2c3e50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              cursor: 'pointer'
            }}
          >
            День
          </button>
          
          <button
            onClick={() => setCurrentView('week')}
            style={{
              backgroundColor: currentView === 'week' ? '#3498db' : '#2c3e50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              cursor: 'pointer'
            }}
          >
            Неделя
          </button>
          
          <button
            onClick={() => setCurrentView('month')}
            style={{
              backgroundColor: currentView === 'month' ? '#3498db' : '#2c3e50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              cursor: 'pointer'
            }}
          >
            Месяц
          </button>
          
          {currentView === 'day' && (
            <button
              onClick={() => setScrollToCurrentTime(true)}
              style={{
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                cursor: 'pointer',
                marginLeft: '10px'
              }}
            >
              Текущее время
            </button>
          )}
        </div>
      </div>

      {/* Filters and navigation */}
      <div style={{ 
        padding: '15px',
        borderBottom: '1px solid #3a3a3a',
        backgroundColor: '#252525',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        {/* Filters for table and client */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#999' }}>
              Фильтр по столу:
            </label>
            <select
              value={filterTable}
              onChange={(e) => setFilterTable(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#2c3e50',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              <option value="all">Все столы</option>
              {availableTables.map(table => (
                <option key={table.id} value={table.id}>
                  {table.name}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#999' }}>
              Фильтр по клиенту:
            </label>
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#2c3e50',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              <option value="all">Все клиенты</option>
              {clientGroups.map((group, index) => (
                <option key={index} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Calendar navigation */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <button
            onClick={handlePrevious}
            style={{
              backgroundColor: '#2c3e50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 15px',
              cursor: 'pointer'
            }}
          >
            ←
          </button>
          
          <button
            onClick={handleToday}
            style={{
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 15px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Сегодня
          </button>
          
          <button
            onClick={handleNext}
            style={{
              backgroundColor: '#2c3e50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 15px',
              cursor: 'pointer'
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* Calendar content */}
      <div style={{ flex: 1, overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
        {currentView === 'month' && renderMonthView()}
        {currentView === 'week' && renderWeekView()}
        {currentView === 'day' && renderDayView()}
      </div>

      {/* Booking details modal */}
      {selectedBooking && (
        <div
          className="fullscreen-popup"
          onClick={closeBookingDetails}
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
              backgroundColor: '#252525',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '500px',
              width: '90%',
              color: 'white'
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid #3a3a3a',
              paddingBottom: '15px'
            }}>
              <h3 style={{ margin: 0 }}>Детали бронирования</h3>
              <button
                onClick={closeBookingDetails}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#999',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ 
              marginBottom: '20px',
              backgroundColor: '#1e1e1e',
              padding: '15px',
              borderRadius: '6px',
              borderLeft: `4px solid ${selectedBooking.color}`
            }}>
              <div style={{ 
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '5px'
              }}>
                {selectedBooking.personName}
              </div>
              
              <div style={{ 
                fontSize: '14px',
                color: '#999',
                marginBottom: '10px'
              }}>
                Группа: {selectedBooking.groupName}
                {selectedBooking.guestCount > 1 && ` (${selectedBooking.guestCount} человек)`}
              </div>
              
              {/* Display formatted date */}
              <div style={{ 
                backgroundColor: '#2c3e50',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '14px',
                marginBottom: '10px'
              }}>
                Дата: {DateTimeUtils.formatDateForDisplay(selectedBooking.dateString || selectedBooking.startTime)}
              </div>
              
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '15px'
              }}>
                <div style={{ 
                  backgroundColor: '#2c3e50',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  Стол {selectedBooking.tableId}
                </div>
                
                <div style={{ 
                  backgroundColor: '#2c3e50',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  {selectedBooking.startTimeString} - {selectedBooking.endTimeString}
                </div>
              </div>
              
              {selectedBooking.note && (
                <div style={{ 
                  backgroundColor: '#333',
                  padding: '12px',
                  borderRadius: '4px',
                  marginTop: '10px'
                }}>
                  <div style={{ 
                    fontSize: '12px',
                    color: '#999',
                    marginBottom: '5px'
                  }}>
                    Примечание:
                  </div>
                  <div style={{ 
                    fontSize: '14px'
                  }}>
                    {selectedBooking.note}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => handleEditBooking(selectedBooking)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  flex: 1
                }}
              >
                Редактировать
              </button>
              
              <button
                onClick={() => handleDeleteBooking(selectedBooking)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  flex: 1
                }}
              >
                Удалить
              </button>
              
              <button
                onClick={closeBookingDetails}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#7f8c8d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  flex: 1
                }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking form modal */}
      {showBookingModal && (editingBooking || pendingBooking) && (
        <div
          className="fullscreen-popup"
          onClick={(e) => e.stopPropagation()} 
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
              {editingBooking ? 'Редактирование бронирования' : 'Подтверждение бронирования'}
            </h3>

            <div>
              {!editingBooking && pendingBooking && (
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
              )}

              {/* Date selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Дата бронирования:
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

              {/* Time selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Время бронирования:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Start time */}
                  <div style={{ 
                    display: 'flex', 
                    flex: 1,
                    gap: '5px'
                  }}>
                    {/* Start hour */}
                    <select
                      value={bookingTime.split(':')[0] || '12'}
                      onChange={(e) => {
                        const hours = e.target.value;
                        const minutes = bookingTime.split(':')[1] || '00';
                        setBookingTime(`${hours}:${minutes}`);
                      }}
                      style={{
                        flex: '1',
                        padding: '10px',
                        backgroundColor: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    >
                      {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                        <option key={hour} value={hour.toString().padStart(2, '0')}>
                          {hour.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    
                    <span style={{ 
                      fontSize: '18px', 
                      fontWeight: 'bold' 
                    }}>:</span>
                    
                    {/* Start minute */}
                    <select
                      value={bookingTime.split(':')[1] || '00'}
                      onChange={(e) => {
                        const hours = bookingTime.split(':')[0] || '12';
                        const minutes = e.target.value;
                        setBookingTime(`${hours}:${minutes}`);
                      }}
                      style={{
                        flex: '1',
                        padding: '10px',
                        backgroundColor: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    >
                      <option value="00">00</option>
                      <option value="15">15</option>
                      <option value="30">30</option>
                      <option value="45">45</option>
                    </select>
                  </div>
                  
                  <span>до</span>
                  
                  {/* End time */}
                  <div style={{ 
                    display: 'flex', 
                    flex: 1,
                    gap: '5px'
                  }}>
                    {/* End hour */}
                    <select
                      value={bookingEndTime.split(':')[0] || '14'}
                      onChange={(e) => {
                        const hours = e.target.value;
                        const minutes = bookingEndTime.split(':')[1] || '00';
                        setBookingEndTime(`${hours}:${minutes}`);
                      }}
                      style={{
                        flex: '1',
                        padding: '10px',
                        backgroundColor: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    >
                      {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                        <option key={hour} value={hour.toString().padStart(2, '0')}>
                          {hour.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    
                    <span style={{ 
                      fontSize: '18px', 
                      fontWeight: 'bold' 
                    }}>:</span>
                    
                    {/* End minute */}
                    <select
                      value={bookingEndTime.split(':')[1] || '00'}
                      onChange={(e) => {
                        const hours = bookingEndTime.split(':')[0] || '14';
                        const minutes = e.target.value;
                        setBookingEndTime(`${hours}:${minutes}`);
                      }}
                      style={{
                        flex: '1',
                        padding: '10px',
                        backgroundColor: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    >
                      <option value="00">00</option>
                      <option value="15">15</option>
                      <option value="30">30</option>
                      <option value="45">45</option>
                    </select>
                  </div>
                </div>
                
                {/* Time conflict warning */}
                {bookingDate && bookingTime && bookingEndTime && (
                  editingBooking ? 
                    checkTimeConflict(
                      editingBooking.tableId, 
                      bookingDate, 
                      bookingTime, 
                      bookingEndTime, 
                      editingBooking.id
                    ) : 
                    pendingBooking && checkTimeConflict(
                      pendingBooking.tableId, 
                      bookingDate, 
                      bookingTime, 
                      bookingEndTime
                    )
                ) && (
                  <div style={{
                    backgroundColor: '#ffebee',
                    color: '#d32f2f',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    marginTop: '10px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '16px' }}>⚠️</span>
                    <span>Внимание! Обнаружен конфликт с существующим бронированием.</span>
                  </div>
                )}
              </div>

              {/* Notes field */}
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

              {/* Calendar info */}
              <div style={{ 
                backgroundColor: '#e8f4fd', 
                padding: '10px', 
                borderRadius: '4px', 
                marginBottom: '15px', 
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                color: '#2980b9'
              }}>
                <span style={{ fontSize: '18px' }}>📆</span>
                <div>
                  После {editingBooking ? 'изменения' : 'подтверждения'} бронирования вы увидите обновленный календарь со всеми бронированиями.
                </div>
              </div>

              {/* Action buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '15px'
              }}>
                <button
                  onClick={saveBookingChanges}
                  disabled={!bookingDate || !bookingTime || !bookingEndTime}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: (!bookingDate || !bookingTime || !bookingEndTime) ? '#cccccc' : '#2ecc71',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: (!bookingDate || !bookingTime || !bookingEndTime) ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    flex: '1'
                  }}
                >
                  {editingBooking ? 'Сохранить изменения' : 'Подтвердить бронирование'}
                </button>

                <button
                  onClick={cancelBookingEdit}
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

      {/* Booking deletion confirmation modal */}
      {showDeleteConfirmation && editingBooking && (
        <div
          className="fullscreen-popup"
          onClick={cancelDeleteBooking}
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
              marginBottom: '20px',
              color: '#e74c3c'
            }}>
              Подтверждение удаления
            </h3>
            
            <div style={{ 
              backgroundColor: '#f5f5f5',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Клиент:</strong> {editingBooking.personName}
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Дата:</strong> {DateTimeUtils.formatDateForDisplay(editingBooking.dateString)}
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                <strong>Время:</strong> {editingBooking.startTimeString} - {editingBooking.endTimeString}
              </p>
              <p style={{ margin: '0 0 0 0' }}>
                <strong>Стол:</strong> {editingBooking.tableId}
              </p>
            </div>
            
            <p style={{
              textAlign: 'center',
              margin: '20px 0',
              fontSize: '16px'
            }}>
              Вы уверены, что хотите удалить это бронирование?
              <br />
              <span style={{ fontSize: '14px', color: '#777', display: 'block', marginTop: '8px' }}>
                Это действие нельзя отменить.
              </span>
            </p>
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px'
            }}>
              <button
                onClick={confirmDeleteBooking}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  flex: '1'
                }}
              >
                Удалить
              </button>
              
              <button
                onClick={cancelDeleteBooking}
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
      )}
    </div>
  );
};

export default BookingCalendar;