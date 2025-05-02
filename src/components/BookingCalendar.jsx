import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './hallview.css';
import CollapsiblePanel from './CollapsiblePanel';

// Вспомогательные функции для календаря
const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

const getMonthName = (month) => {
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  return monthNames[month];
};

const getDayName = (day) => {
  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  return dayNames[day];
};

const getWeekDays = () => {
  return ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
};

// Функция для парсинга даты из строки формата YYYY-MM-DD
const parseBookingDate = (dateString) => {
  if (!dateString) {
    return new Date(); // Если дата не указана, используем текущую
  }
  
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const BookingCalendar = ({ hallData, groups }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('month'); // 'month', 'week', 'day', или 'timeline'
  const [currentDay, setCurrentDay] = useState(new Date().getDate());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [filterTable, setFilterTable] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [scrollToCurrentTime, setScrollToCurrentTime] = useState(true);
  
  // Ссылки для прокрутки в режиме расписания
  const timelineRef = useRef(null);
  const currentTimeRef = useRef(null);

  // Генерация временных слотов с 15-минутными интервалами (96 слотов на 24 часа)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 60; j += 15) {
        const hour = i.toString().padStart(2, '0');
        const minute = j.toString().padStart(2, '0');
        slots.push(`${hour}:${minute}`);
      }
    }
    return slots;
  }, []);

  // Извлекаем все бронирования из таблиц
  const allBookings = useMemo(() => {
    if (!hallData || !hallData.tables) return [];
    
    const bookings = [];
    
    hallData.tables.forEach(table => {
      if (!table.people) return;
      
      table.people.forEach((person, index) => {
        if (!person || !person.booking) return;
        
        // Обрабатываем дату и время
        const { date, time, endTime } = person.booking;
        const [startHour, startMinute] = time.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        // Создаем объекты Date для бронирования с учетом даты
        const bookingDate = parseBookingDate(date);
        bookingDate.setHours(startHour, startMinute, 0);
        
        const bookingEndDate = parseBookingDate(date);
        bookingEndDate.setHours(endHour, endMinute, 0);
        
        bookings.push({
          id: `${table.id}-${index}-${person.name}`,
          tableId: table.id,
          personName: person.name,
          groupName: person.group,
          startTime: bookingDate,
          endTime: bookingEndDate,
          dateString: date || '', // Добавляем строку с датой
          startTimeString: time,
          endTimeString: endTime,
          note: person.booking.note || '',
          color: `#${Math.floor(parseInt(table.id) * 9999).toString(16).padStart(6, '0')}`
        });
      });
    });
    
    return bookings;
  }, [hallData]);

  // Фильтруем бронирования на основе текущих выборов
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

  // Функция для получения всех столов для опций фильтра
  const getTables = useMemo(() => {
    if (!hallData || !hallData.tables) return [];
    return hallData.tables.map(table => ({
      id: table.id,
      name: `Стол ${table.id}`
    }));
  }, [hallData]);

  // Функция для получения всех групп клиентов для опций фильтра
  const getClientGroups = useMemo(() => {
    if (!groups) return [];
    return groups.map(group => group.name);
  }, [groups]);

  // Обрабатываем выбор бронирования
  const handleSelectBooking = (booking) => {
    setSelectedBooking(booking);
  };

  // Закрываем панель деталей бронирования
  const closeBookingDetails = () => {
    setSelectedBooking(null);
  };

  // Переходим к предыдущему месяцу/неделе/дню
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  // Переходим к следующему месяцу/неделе/дню
  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (currentView === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  // Переходим к сегодняшнему дню
  const handleToday = () => {
    setCurrentDate(new Date());
    setCurrentDay(new Date().getDate());
  };

  // Обрабатываем клик по дню в месячном представлении
  const handleDayClick = (day) => {
    setCurrentDay(day);
    setCurrentView('day');
    const newDate = new Date(currentDate);
    newDate.setDate(day);
    setCurrentDate(newDate);
  };

  // Форматирование даты для отображения
  const formatDateToLocalString = (date) => {
    return date.toLocaleDateString('ru-RU', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  // Функции для работы с временными слотами в режиме расписания
  
  // Функция для парсинга времени
  const parseTime = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes; // Преобразуем в минуты с полуночи
  };
  
  // Функция для проверки, занят ли слот
  const isSlotOccupied = useCallback((tableId, timeSlot, bookingDate) => {
    if (!hallData || !hallData.tables) return false;
    
    const table = hallData.tables.find(t => t.id === tableId);
    if (!table || !table.people) return false;
    
    // Преобразуем время слота в минуты для сравнения
    const slotTime = parseTime(timeSlot);
    
    // Проверяем, есть ли у кого-то за столом бронирование на это время
    return table.people.some(person => {
      if (!person || !person.booking) return false;
      
      // Проверяем, соответствует ли бронирование выбранной дате
      if (person.booking.date !== bookingDate) return false;
      
      const startTime = parseTime(person.booking.time);
      const endTime = parseTime(person.booking.endTime);
      
      // Проверяем, входит ли слот в диапазон времени бронирования
      return slotTime >= startTime && slotTime < endTime;
    });
  }, [hallData]);

  // Функция для определения, является ли слот началом бронирования
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

  // Функция для получения времени окончания бронирования
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

  // Функция для расчета длительности бронирования (сколько временных слотов оно занимает)
  const getBookingSpan = useCallback((startTime, endTime) => {
    if (!startTime || !endTime) return 1;
    
    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);
    
    // Вычисляем, сколько 15-минутных слотов охватывает бронирование
    return Math.ceil((endMinutes - startMinutes) / 15);
  }, []);

  // Функция для получения деталей бронирования для конкретного слота и стола
  const getBookingDetails = useCallback((tableId, timeSlot, bookingDate) => {
    if (!hallData || !hallData.tables) return null;
    
    const table = hallData.tables.find(t => t.id === tableId);
    if (!table || !table.people) return null;
    
    const slotTime = parseTime(timeSlot);
    
    // Находим первого человека с бронированием, охватывающим этот временной слот
    const personWithBooking = table.people.find(person => {
      if (!person || !person.booking) return false;
      
      if (person.booking.date !== bookingDate) return false;
      
      const startTime = parseTime(person.booking.time);
      const endTime = parseTime(person.booking.endTime);
      
      return slotTime >= startTime && slotTime < endTime;
    });
    
    if (!personWithBooking) return null;
    
    return {
      name: personWithBooking.name,
      group: personWithBooking.group,
      startTime: personWithBooking.booking.time,
      endTime: personWithBooking.booking.endTime,
      note: personWithBooking.booking.note || '',
      tableId: tableId
    };
  }, [hallData]);

  // Функция для установки ссылки на текущий временной слот
  const setCurrentTimeSlotRef = useCallback((timeSlot) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Форматируем текущее время, чтобы соответствовать формату временного слота
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${Math.floor(currentMinute / 15) * 15 .toString().padStart(2, '0')}`;
    
    if (timeSlot === currentTimeString) {
      return currentTimeRef;
    }
    return null;
  }, []);

  // Эффект для прокрутки к текущему времени
  useEffect(() => {
    if (scrollToCurrentTime && timelineRef.current && currentTimeRef.current && currentView === 'timeline') {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Находим ближайший временной слот
      let closestSlotIndex = (currentHour * 4) + Math.floor(currentMinute / 15);
      closestSlotIndex = Math.max(0, Math.min(closestSlotIndex, timeSlots.length - 1));
      
      // Прокручиваем таймлайн, чтобы центрировать текущее время
      if (currentTimeRef.current) {
        const scrollLeft = currentTimeRef.current.offsetLeft - (timelineRef.current.clientWidth / 2) + 50;
        timelineRef.current.scrollLeft = scrollLeft;
      }
      
      setScrollToCurrentTime(false);
    }
  }, [scrollToCurrentTime, timeSlots, currentView]);

  // Форматирование даты для отображения деталей бронирования
  const formatBookingDateForDisplay = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('ru-RU', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Отрисовываем представление дня
  // Новая улучшенная версия renderDayView для BookingCalendar.jsx

const renderDayView = () => {
  // Форматированная дата для запросов бронирования
  const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  
  // Создаем набор тайм-слотов только для рабочих часов (например, с 10:00 до 23:00)
  const workingHourSlots = [];
  const startHour = 0; // Начало рабочего дня
  const endHour = 23;   // Конец рабочего дня
  
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      workingHourSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }
  
  // Группируем тайм-слоты по часам для заголовков
  const hourGroups = {};
  workingHourSlots.forEach(slot => {
    const hour = slot.split(':')[0];
    if (!hourGroups[hour]) {
      hourGroups[hour] = [];
    }
    hourGroups[hour].push(slot);
  });
  
  // Получаем текущее время для подсветки
  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, '0');
  const currentMinute = Math.floor(now.getMinutes() / 15) * 15;
  const currentTimeString = `${currentHour}:${currentMinute.toString().padStart(2, '0')}`;
  
  // Предварительно обрабатываем данные бронирований для всех столов и временных слотов
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
  
  // Отслеживаем, какие временные слоты уже были обработаны для пропуска ячеек
  const processedSlots = {};
  
  // Проверяем наличие столов
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
        Расписание на {currentDate.getDate()} {getMonthName(currentDate.getMonth())} {currentDate.getFullYear()} - {getDayName(currentDate.getDay())}
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
              {/* Первая ячейка в заголовке - для колонки времени */}
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
              
              {/* Заголовки столов */}
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
            {/* Группируем ячейки по часам */}
            {Object.keys(hourGroups).map(hour => (
              <React.Fragment key={hour}>
                {/* Заголовок часа */}
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
                  
                  {/* Добавляем горизонтальный разделитель часов для каждого стола */}
                  {hasTables && hallData.tables.map(table => (
                    <td key={table.id} style={{
                      backgroundColor: '#2c3e50',
                      borderBottom: '1px solid #444',
                      borderRight: '1px solid #444',
                      padding: '2px'
                    }}></td>
                  ))}
                </tr>
                
                {/* Ряды для временных слотов в пределах этого часа */}
                {hourGroups[hour].map((timeSlot, slotIndex) => {
                  const isCurrentTime = timeSlot === currentTimeString;
                  
                  // Сбрасываем отслеживание обработанных слотов для каждого нового временного слота
                  Object.keys(processedSlots).forEach(tableId => {
                    processedSlots[tableId] = processedSlots[tableId] || {};
                  });
                  
                  return (
                    <tr key={timeSlot} style={{
                      backgroundColor: isCurrentTime ? 'rgba(52, 152, 219, 0.1)' : 'transparent'
                    }}>
                      {/* Ячейка времени */}
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
                      }}>
                        {timeSlot.split(':')[1] === '00' ? timeSlot : timeSlot.split(':')[1]}
                      </td>
                      
                      {/* Ячейки для каждого стола в данном временном слоте */}
                      {hasTables && hallData.tables.map(table => {
                        const tableId = table.id;
                        
                        // Если этот слот уже обработан (часть предыдущего бронирования), пропускаем его
                        if (processedSlots[tableId] && processedSlots[tableId][timeSlot]) {
                          return null;
                        }
                        
                        const bookingData = bookingsData[tableId][timeSlot];
                        const { isOccupied, isStart, bookingSpan, bookingDetails } = bookingData;
                        
                        // Отмечаем этот и последующие слоты как обработанные, если это начало бронирования
                        if (isStart && bookingSpan > 1) {
                          processedSlots[tableId] = processedSlots[tableId] || {};
                          
                          // Отмечаем все слоты, охваченные этим бронированием
                          for (let i = 0; i < bookingSpan; i++) {
                            const slotIndex = workingHourSlots.indexOf(timeSlot);
                            if (slotIndex + i < workingHourSlots.length) {
                              const nextSlot = workingHourSlots[slotIndex + i];
                              if (i > 0) { // Пропускаем первый слот (текущий)
                                processedSlots[tableId][nextSlot] = true;
                              }
                            }
                          }
                        }
                        
                        return (
                          <td 
                            key={`${tableId}-${timeSlot}`}
                            rowSpan={isStart ? bookingSpan : 1}
                            style={{
                              backgroundColor: isOccupied
                                ? '#e74c3c' // Красный для занятых ячеек
                                : (isCurrentTime ? 'rgba(46, 204, 113, 0.3)' : '#2ecc71'), // Зеленый для свободных
                              border: '1px solid rgba(255, 255, 255, 0.4)',
                              padding: 0,
                              minHeight: '30px',
                              height: isStart ? `${bookingSpan * 30}px` : '30px',
                              position: 'relative',
                              cursor: isStart && isOccupied ? 'pointer' : 'default',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => isStart && isOccupied && handleSelectBooking(bookingDetails)}
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
                                <div>{bookingDetails.name}</div>
                                <div style={{ fontSize: '10px' }}>
                                  {bookingDetails.startTime} - {bookingDetails.endTime}
                                </div>
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
      
      {/* Кнопка перехода к текущему времени */}
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

// Обновленный эффект для прокрутки к текущему времени
useEffect(() => {
  if (scrollToCurrentTime && timelineRef.current && currentView === 'day') {
    // Найдем текущий час
    const now = new Date();
    const currentHour = now.getHours();
    
    // Вычисляем примерную позицию для прокрутки
    const startHour = 10; // Должно соответствовать startHour в renderDayView
    const cellWidth = 60; // Ширина одной ячейки в пикселях
    const minutesInHour = 60;
    const minuteStep = 15; // Шаг в минутах
    const slotsPerHour = minutesInHour / minuteStep; // Количество слотов в часе
    
    // Определяем, сколько пикселей нужно прокрутить для текущего часа
    if (currentHour >= startHour) {
      const hourOffset = (currentHour - startHour) * slotsPerHour * cellWidth;
      
      // Добавляем смещение для текущей минуты
      const currentMinute = now.getMinutes();
      const minuteSlot = Math.floor(currentMinute / minuteStep);
      const minuteOffset = minuteSlot * cellWidth;
      
      // Учитываем ширину столбца с названиями столов
      const tableColumnWidth = 150;
      
      // Общее смещение должно показать текущий временной слот в центре
      const containerWidth = timelineRef.current.clientWidth;
      const targetCenter = hourOffset + minuteOffset;
      const scrollPosition = targetCenter - (containerWidth / 2) + (cellWidth * 2) + tableColumnWidth;
      
      // Выполняем прокрутку
      timelineRef.current.scrollLeft = Math.max(0, scrollPosition);
    } else {
      timelineRef.current.scrollLeft = 0;
    }
    
    setScrollToCurrentTime(false);
  }
}, [scrollToCurrentTime, currentView]);
  // Дополнительно добавьте этот эффект, чтобы обеспечить прокрутку к текущему времени
useEffect(() => {
  if (scrollToCurrentTime && timelineRef.current && currentView === 'day') {
    // Найдем текущий час для прокрутки
    const now = new Date();
    const currentHour = now.getHours();
    
    // Вычисляем примерную позицию для прокрутки по вертикали
    const startHour = 10; // Должно соответствовать startHour в renderDayView
    const hourHeight = 150; // Примерная высота блока для одного часа (включая заголовок и 4 временных слота)
    
    if (currentHour >= startHour) {
      const scrollPos = (currentHour - startHour) * hourHeight;
      
      // Прокручиваем вниз к текущему времени
      timelineRef.current.scrollTop = scrollPos;
      
      // Для нового макета с таблицами сверху, сбрасываем горизонтальную прокрутку
      timelineRef.current.scrollLeft = 0;
    } else {
      timelineRef.current.scrollTop = 0;
    }
    
    setScrollToCurrentTime(false);
  }
}, [scrollToCurrentTime, currentView]);

  // Отрисовываем представление недели
  const renderWeekView = () => {
    // Получаем первый день недели (понедельник) для текущей даты
    const firstDayOfWeek = new Date(currentDate);
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // Корректируем, когда день - воскресенье
    firstDayOfWeek.setDate(diff);
    
    // Создаем массив дат для недели
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(firstDayOfWeek);
      date.setDate(date.getDate() + i);
      weekDates.push(date);
    }
    
    // Группируем бронирования по дням
    const bookingsByDay = {};
    weekDates.forEach(date => {
      const dateStr = formatDateToLocalString(date);
      bookingsByDay[dateStr] = filteredBookings.filter(booking => 
        formatDateToLocalString(booking.startTime) === dateStr
      ).sort((a, b) => a.startTime - b.startTime);
    });
    
    return (
      <div className="week-view" style={{ padding: '15px', height: '100%', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>
          Неделя {firstDayOfWeek.getDate()} {getMonthName(firstDayOfWeek.getMonth())} - {
            weekDates[6].getDate()} {getMonthName(weekDates[6].getMonth())} {weekDates[6].getFullYear()}
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {weekDates.map((date, index) => {
            const dateStr = formatDateToLocalString(date);
            const dayBookings = bookingsByDay[dateStr] || [];
            
            return (
              <div key={index} style={{ marginBottom: '10px' }}>
                <div 
                  style={{ 
                    padding: '8px 12px',
                    backgroundColor: '#2c3e50',
                    borderRadius: '6px 6px 0 0',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                  onClick={() => {
                    setCurrentDate(date);
                    setCurrentView('day');
                  }}
                >
                  <span>
                    {getDayName(date.getDay())}, {date.getDate()} {getMonthName(date.getMonth())}
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
                            cursor: 'pointer'
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

  // Отрисовываем представление месяца
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Получаем первый день месяца
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Воскресенье, 1 = Понедельник и т. д.
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Корректируем для понедельника как первого дня
    
    // Получаем количество дней в месяце
    const daysInMonth = getDaysInMonth(year, month);
    
    // Создаем ячейки сетки календаря
    const cells = [];
    
    // Добавляем пустые ячейки для дней перед первым днем месяца
    for (let i = 0; i < adjustedFirstDay; i++) {
      cells.push(null);
    }
    
    // Добавляем ячейки для каждого дня месяца
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(day);
    }
    
    // Группируем бронирования по дням
    const bookingsByDay = {};
    filteredBookings.forEach(booking => {
      // Проверяем, соответствует ли бронирование текущему месяцу и году
      if (booking.startTime.getMonth() === month && booking.startTime.getFullYear() === year) {
        const day = booking.startTime.getDate();
        if (!bookingsByDay[day]) {
          bookingsByDay[day] = [];
        }
        bookingsByDay[day].push(booking);
      }
    });
    
    // Создаем строки недель
    const rows = [];
    let cells2 = [...cells];
    
    while (cells2.length > 0) {
      rows.push(cells2.splice(0, 7));
    }
    
    return (
      <div className="month-view" style={{ padding: '15px', height: '100%', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>
          {getMonthName(month)} {year}
        </h3>
        
        <div className="calendar-grid" style={{ width: '100%' }}>
          {/* Заголовок календаря - названия дней недели */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)',
            textAlign: 'center',
            fontWeight: 'bold',
            marginBottom: '10px',
            backgroundColor: '#2c3e50',
            borderRadius: '6px',
            padding: '8px 0'
          }}>
            {getWeekDays().map((day, index) => (
              <div key={index} style={{ padding: '5px' }}>{day}</div>
            ))}
          </div>
          
          {/* Сетка дней календаря */}
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
                  // Проверяем, является ли текущий день сегодняшним
                  const isToday = day && 
                    new Date().getDate() === day && 
                    new Date().getMonth() === month && 
                    new Date().getFullYear() === year;
                  
                  // Получаем бронирования на день
                  const dayBookings = day ? (bookingsByDay[day] || []) : [];
                  
                  // Проверяем, является ли этот день выбранным днем
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
                        minHeight: '80px',
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
                            fontSize: '14px'
                          }}>
                            {day}
                          </div>
                          
                          {dayBookings.length > 0 && (
                            <div style={{ 
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              overflow: 'hidden',
                              maxHeight: 'calc(100% - 25px)'
                            }}>
                              {dayBookings.map((booking, index) => {
                                // Показываем максимум 3 бронирования, остальные показываем в виде счетчика
                                if (index < 2) {
                                  return (
                                    <div 
                                      key={booking.id}
                                      style={{
                                        backgroundColor: '#333',
                                        borderLeft: `3px solid ${booking.color}`,
                                        padding: '4px 6px',
                                        borderRadius: '3px',
                                        fontSize: '11px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}
                                    >
                                      {booking.startTimeString} {booking.personName}
                                    </div>
                                  );
                                } else if (index === 2 && dayBookings.length > 3) {
                                  return (
                                    <div 
                                      key="more"
                                      style={{
                                        backgroundColor: '#2c3e50',
                                        padding: '4px 6px',
                                        borderRadius: '3px',
                                        fontSize: '11px',
                                        textAlign: 'center'
                                      }}
                                    >
                                      +{dayBookings.length - 2} ещё
                                    </div>
                                  );
                                } else if (index === 2) {
                                  return (
                                    <div 
                                      key={booking.id}
                                      style={{
                                        backgroundColor: '#333',
                                        borderLeft: `3px solid ${booking.color}`,
                                        padding: '4px 6px',
                                        borderRadius: '3px',
                                        fontSize: '11px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}
                                    >
                                      {booking.startTimeString} {booking.personName}
                                    </div>
                                  );
                                }
                                return null;
                              })}
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

  // Отрисовываем представление расписания
  const renderTimelineView = () => {
    // Отформатируйте дату для выбора слотов
    const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

    return (
      <div className="timeline-view" style={{ 
        height: '100%', 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h3 style={{ 
          margin: '0 0 15px 0', 
          textAlign: 'center',
          padding: '10px' 
        }}>
          Расписание на {currentDate.getDate()} {getMonthName(currentDate.getMonth())} {currentDate.getFullYear()} - {getDayName(currentDate.getDay())}
        </h3>
        
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ 
            display: 'flex', 
            height: '100%',
            overflow: 'hidden'
          }}>
            {/* Названия столов слева */}
            <div style={{ 
              width: '120px', 
              borderRight: '1px solid #3a3a3a',
              backgroundColor: '#1e1e1e',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Угловая ячейка (пустая) */}
              <div style={{ 
                height: '80px', 
                borderBottom: '1px solid #3a3a3a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                fontWeight: 'bold',
                backgroundColor: '#0a0a1d'
              }}>
                Столы
              </div>
              
              {/* Названия столов */}
              <div style={{ 
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden'
              }}>
                {hallData && hallData.tables && hallData.tables.map((table) => (
                  <div 
                    key={table.id}
                    style={{ 
                      height: '60px',
                      borderBottom: '1px solid #2c2c2c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      padding: '8px',
                      backgroundColor: '#2c3e50'
                    }}
                  >
                    Стол {table.id}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Временные слоты и сетка бронирований */}
            <div 
              ref={timelineRef}
              style={{ 
                flex: 1, 
                overflow: 'auto'
              }}
            >
              {/* Заголовки времени */}
              <div style={{ 
                display: 'flex',
                height: '80px',
                position: 'sticky',
                top: 0,
                backgroundColor: '#0a0a1d',
                borderBottom: '1px solid #3a3a3a',
                zIndex: 10
              }}>
                {timeSlots.map((timeSlot, index) => {
                  // Показываем метки часов только для полных часов (XX:00)
                  const showHourLabel = timeSlot.endsWith(':00');
                  
                  // Форматируем для отображения
                  const displayTime = showHourLabel 
                    ? timeSlot 
                    : timeSlot.split(':')[1]; // Только минуты
                  
                  // Это текущий временной слот?
                  const now = new Date();
                  const currentHour = now.getHours().toString().padStart(2, '0');
                  const currentMinute = Math.floor(now.getMinutes() / 15) * 15;
                  const currentTimeString = `${currentHour}:${currentMinute.toString().padStart(2, '0')}`;
                  const isCurrentTime = timeSlot === currentTimeString;
                  
                  return (
                    <div 
                      key={index}
                      ref={setCurrentTimeSlotRef(timeSlot)}
                      style={{ 
                        width: '100px',
                        minWidth: '100px',
                        borderRight: '1px solid #3a3a3a',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px',
                        position: 'relative',
                        backgroundColor: isCurrentTime ? 'rgba(52, 152, 219, 0.2)' : 'transparent'
                      }}
                    >
                      {showHourLabel ? (
                        <>
                          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                            {timeSlot.split(':')[0]}:00
                          </div>
                          <div style={{ fontSize: '12px', marginTop: '4px', color: '#999' }}>
                            {index > 0 && index < timeSlots.length - 1 ? 'час' : ''}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: '14px', color: '#aaa' }}>
                          {displayTime}
                        </div>
                      )}
                      
                      {/* Индикатор текущего времени */}
                      {isCurrentTime && (
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          width: '100%',
                          height: '3px',
                          backgroundColor: '#3498db'
                        }}></div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Сетка столов и бронирований */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {hallData && hallData.tables && hallData.tables.map((table) => (
                  <div 
                    key={table.id}
                    style={{ 
                      display: 'flex',
                      height: '60px',
                      borderBottom: '1px solid #2c2c2c'
                    }}
                  >
                    {timeSlots.map((timeSlot, slotIndex) => {
                      // Проверяем, занят ли этот слот
                      const isOccupied = isSlotOccupied(table.id, timeSlot, formattedDate);
                      
                      // Проверяем, является ли это началом бронирования
                      const isStart = isBookingStart(table.id, timeSlot, formattedDate);
                      
                      // Если это начало бронирования, получаем его продолжительность
                      let bookingSpan = 1;
                      if (isStart) {
                        const endTime = getBookingEndTime(table.id, timeSlot, formattedDate);
                        bookingSpan = getBookingSpan(timeSlot, endTime);
                      }
                      
                      // Получаем детали бронирования, если слот занят
                      const bookingDetails = isOccupied ? getBookingDetails(table.id, timeSlot, formattedDate) : null;
                      
                      // Пропускаем ячейки, которые покрыты периодом бронирования
                      if (isOccupied && !isStart) {
                        return null;
                      }
                      
                      // Это текущий временной слот?
                      const now = new Date();
                      const currentHour = now.getHours().toString().padStart(2, '0');
                      const currentMinute = Math.floor(now.getMinutes() / 15) * 15;
                      const currentTimeString = `${currentHour}:${currentMinute.toString().padStart(2, '0')}`;
                      const isCurrentTime = timeSlot === currentTimeString;
                      
                      return (
                        <div 
                          key={slotIndex}
                          style={{ 
                            width: isStart ? `${bookingSpan * 100}px` : '100px',
                            minWidth: isStart ? `${bookingSpan * 100}px` : '100px',
                            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                            backgroundColor: isStart 
                              ? '#e74c3c' // Забронировано - красный 
                              : (isCurrentTime ? 'rgba(46, 204, 113, 0.2)' : '#2ecc71'), // Свободно - зеленый
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: isStart ? 'pointer' : 'default',
                            transition: 'background-color 0.2s'
                          }}
                          onClick={() => isStart && handleSelectBooking(bookingDetails)}
                          onMouseOver={(e) => {
                            if (isStart) {
                              e.currentTarget.style.backgroundColor = '#c0392b';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (isStart) {
                              e.currentTarget.style.backgroundColor = '#e74c3c';
                            }
                          }}
                        >
                          {isStart && bookingDetails && (
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              padding: '8px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis'
                            }}>
                              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{bookingDetails.name}</div>
                              <div style={{ fontSize: '11px' }}>
                                {bookingDetails.startTime} - {bookingDetails.endTime}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="booking-calendar" style={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Заголовок с навигацией и элементами управления представлением */}
      <div style={{ 
        padding: '15px',
        borderBottom: '1px solid #3a3a3a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0 }}>Календарь бронирований</h3>
        
        {/* Элементы управления представлением */}
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

      {/* Фильтры и навигация */}
      <div style={{ 
        padding: '15px',
        borderBottom: '1px solid #3a3a3a',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        {/* Фильтры по столу и клиенту */}
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
              {getTables.map(table => (
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
              {getClientGroups.map((group, index) => (
                <option key={index} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Навигация по календарю */}
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

      {/* Содержимое календаря */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
  {currentView === 'month' && renderMonthView()}
  {currentView === 'week' && renderWeekView()}
  {currentView === 'day' && renderDayView()}
</div>

      {/* Модальное окно деталей бронирования */}
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
              </div>
              
              {/* Отображаем дату */}
              <div style={{ 
                backgroundColor: '#2c3e50',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '14px',
                marginBottom: '10px'
              }}>
                Дата: {formatBookingDateForDisplay(selectedBooking.startTime)}
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
            
            <button
              onClick={closeBookingDetails}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;