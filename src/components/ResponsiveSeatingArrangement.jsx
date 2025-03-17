import React, { useState, useEffect } from 'react';
import SeatingArrangement from './SeatingArrangement'; // Импортируем десктопную версию
import MobileSeatingArrangement from './MobileSeatingArrangement'; // Импортируем мобильную версию

// Компонент для адаптивного выбора интерфейса в зависимости от размера экрана
const ResponsiveSeatingArrangement = () => {
  // Состояние для определения, является ли устройство мобильным
  const [isMobile, setIsMobile] = useState(false);

  // Функция для определения, является ли устройство мобильным
  const checkMobileDevice = () => {
    const width = window.innerWidth;
    setIsMobile(width < 768); // Считаем мобильным устройством все с шириной экрана менее 768px
  };

  // Эффект для проверки размера экрана при загрузке и изменении размера окна
  useEffect(() => {
    // Проверка при монтировании компонента
    checkMobileDevice();

    // Добавляем обработчик события resize для динамической проверки
    window.addEventListener('resize', checkMobileDevice);

    // Очистка обработчика при размонтировании
    return () => {
      window.removeEventListener('resize', checkMobileDevice);
    };
  }, []);

  // Общее хранилище данных для синхронизации между версиями интерфейса
  const [tables, setTables] = useState([]);
  const [people, setPeople] = useState([]);
  const [halls, setHalls] = useState([]);

  // Загрузка данных из localStorage
  useEffect(() => {
    const savedTables = JSON.parse(localStorage.getItem('tables'));
    if (savedTables) setTables(savedTables);
    
    const savedPeople = JSON.parse(localStorage.getItem('people'));
    if (savedPeople) setPeople(savedPeople);
    
    const savedHalls = JSON.parse(localStorage.getItem('halls'));
    if (savedHalls) setHalls(savedHalls);
  }, []);

  // Сохранение данных в localStorage при их изменении
  useEffect(() => {
    localStorage.setItem('tables', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem('people', JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    localStorage.setItem('halls', JSON.stringify(halls));
  }, [halls]);

  // Рендерим соответствующий компонент в зависимости от типа устройства
  return isMobile ? (
    <MobileSeatingArrangement 
      initialTables={tables}
      initialPeople={people}
      initialHalls={halls}
    />
  ) : (
    <SeatingArrangement />
  );
};

export default ResponsiveSeatingArrangement;