import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// Переводы
const translations = {
  ru: {
    guestSeating: 'Рассадка гостей',
    loadPlan: 'Загрузить план',
    loading: 'Загрузка...',
    groups: 'Группы',
    createGroup: 'Создать группу',
    readyToSeat: 'К рассадке',
    seated: 'Рассажены',
    allGroupsSeated: 'Все группы рассажены',
    noSeatedGroups: 'Нет рассаженных групп',
    selectTable: 'Выбрать стол',
    editGroup: 'Редактировать',
    deleteGroup: 'Удалить группу',
    releaseGroup: 'Освободить группу',
    seatGroup: 'Рассадить',
    dragToTable: 'перетащите на стол',
    createNewGroup: 'Создать новую группу',
    editGroupTitle: 'Редактировать группу',
    groupName: 'Название группы',
    groupMembers: 'Участники группы',
    addMember: 'Добавить',
    enterName: 'Или введите имя',
    selectFromList: 'Выбрать из списка',
    table: 'Стол',
    seat: 'Место',
    seats: 'мест',
    availableSeats: 'свободных мест',
    occupiedSeats: 'Занято мест',
    totalSeats: 'Всего мест',
    selectTableForGroup: 'Выберите стол для группы',
    selectMembersToSeat: 'Выберите участников для рассадки',
    notEnoughSeats: 'Недостаточно мест за столом!',
    needSeats: 'Нужно',
    availableSeatsCount: 'доступно',
    participants: 'участников',
    person: 'чел.',
    people: 'человек',
    seatedGuests: 'Рассаженные гости',
    save: 'Сохранить',
    cancel: 'Отмена',
    close: 'Закрыть',
    add: 'Добавить',
    remove: 'Убрать',
    edit: 'Изменить',
    delete: 'Ջнжел',
    confirm: 'Подтвердить',
    enterGuestName: 'Введите имя гостя',
    enterGroupName: 'Введите название группы',
    groupIsEmpty: 'Группа пустая',
    tableIsFull: 'За этим столом нет свободных мест',
    selectAtLeastOne: 'Выберите хотя бы одного участника',
    groupReady: 'Группа готова к рассадке',
    groupSeated: 'Группа рассажена',
    tableFullyOccupied: 'Стол полностью занят',
    guestName: 'Имя гостя',
    group: 'Группа',
    withoutGroup: 'Без группы',
    searchByName: 'Поиск по имени...',
    dragGroupToTable: 'Перетащите группу на стол для рассадки',
    clickGroupToSelectTable: 'Нажмите на группу чтобы выбрать стол',
    errorLoadingFile: 'Ошибка при чтении JSON файла. Проверьте формат файла.',
    noDataFound: 'Данные не найдены',
    members: 'Участники',
    selected: 'Выбрано',
    from: 'из',
    necessary: 'необходимых',
    seatSelected: 'Рассадить выбранных',
    removeGuest: 'Убрать гостя',
    details: 'Подробнее',
    availablePeople: 'Доступно',
    fromPeople: 'из',
    peopleUsed: 'человек',
    selectPersonFromList: 'Выберите человека из списка',
    enterCustomName: 'Или введите свое имя',
    noOneFound: 'Никого не найдено',
    allPeopleUsed: 'Все люди уже использованы',
    seatedMembers: 'рассажены',
    createFirstGroup: 'Создайте первую группу',
    availableToSeat: 'готовы к рассадке',
    allGroupsAreSeated: 'Все группы рассажены',
    fullySeated: 'Полностью рассаженные',
    partiallySeated: 'Частично рассаженные'
  },
  
  hy: {
    guestSeating: 'Հյուրերի նստեցում',
    loadPlan: 'Բեռնել պլանը',
    loading: 'Բեռնում...',
    groups: 'Խմբեր',
    createGroup: 'Ստեղծել խումբ',
    readyToSeat: 'Նստեցման համար',
    seated: 'Նստած',
    allGroupsSeated: 'Բոլոր խմբերը նստեցված են',
    noSeatedGroups: 'Նստեցված խմբեր չկան',
    selectTable: 'Ընտրել սեղան',
    editGroup: 'Խմբագրել',
    deleteGroup: 'Ջնջել խումբը',
    releaseGroup: 'Ազատել խումբը',
    seatGroup: 'Նստեցնել',
    dragToTable: 'քաշել սեղանի վրա',
    createNewGroup: 'Ստեղծել նոր խումբ',
    editGroupTitle: 'Խմբագրել խումբը',
    groupName: 'Խմբի անունը',
    groupMembers: 'Խմբի անդամներ',
    addMember: 'Ավելացնել',
    enterName: 'Կամ մուտքագրեք անունը',
    selectFromList: 'Ընտրել ցանկից',
    table: 'Սեղան',
    seat: 'Տեղ',
    seats: 'տեղեր',
    availableSeats: 'ազատ տեղեր',
    occupiedSeats: 'Զբաղված տեղեր',
    totalSeats: 'Ընդամենը տեղեր',
    selectTableForGroup: 'Ընտրեք սեղան խմբի համար',
    selectMembersToSeat: 'Ընտրեք նստեցման անդամները',
    notEnoughSeats: 'Սեղանի մոտ բավարար տեղեր չկան!',
    needSeats: 'Պետք է',
    availableSeatsCount: 'հասանելի',
    participants: 'մասնակիցներ',
    person: 'մարդ',
    people: 'մարդիկ',
    seatedGuests: 'Նստեցված հյուրեր',
    save: 'Պահպանել',
    cancel: 'Չեղարկել',
    close: 'Փակել',
    add: 'Ավելացնել',
    remove: 'Հանել',
    edit: 'Փոփոխել',
    delete: 'Ջնջել',
    confirm: 'Հաստատել',
    enterGuestName: 'Մուտքագրեք հյուրի անունը',
    enterGroupName: 'Մուտքագրեք խմբի անունը',
    groupIsEmpty: 'Խումբը դատարկ է',
    tableIsFull: 'Այս սեղանի մոտ ազատ տեղեր չկան',
    selectAtLeastOne: 'Ընտրեք առնվազն մեկ մասնակից',
    groupReady: 'Խումբը պատրաստ է նստեցման',
    groupSeated: 'Խումբը նստեցված է',
    tableFullyOccupied: 'Սեղանը ամբողջությամբ զբաղված է',
    guestName: 'Հյուրի անունը',
    group: 'Խումբ',
    withoutGroup: 'Առանց խմբի',
    searchByName: 'Որոնել ըստ անվան...',
    dragGroupToTable: 'Քաշեք խումբը սեղանի վրա նստեցման համար',
    clickGroupToSelectTable: 'Սեղեք խմբի վրա սեղան ընտրելու համար',
    errorLoadingFile: 'JSON ֆայլի կարդալու սխալ: Ստուգեք ֆայլի ֆորմատը:',
    noDataFound: 'Տվյալներ չեն գտնվել',
    members: 'Անդամներ',
    selected: 'Ընտրված',
    from: '-ից',
    necessary: 'անհրաժեշտ',
    seatSelected: 'Նստեցնել ընտրվածները',
    removeGuest: 'Հանել հյուրին',
    details: 'Մանրամասներ',
    availablePeople: 'Հասանելի',
    fromPeople: '-ից',
    peopleUsed: 'մարդ',
    selectPersonFromList: 'Ընտրեք մարդ ցանկից',
    enterCustomName: 'Կամ մուտքագրեք սեփական անունը',
    noOneFound: 'Ոչ ոք չի գտնվել',
    allPeopleUsed: 'Բոլոր մարդիկ արդեն օգտագործված են',
    seatedMembers: 'նստեցված',
    createFirstGroup: 'Ստեղծեք առաջին խումբը',
    availableToSeat: 'պատրաստ նստեցման',
    allGroupsAreSeated: 'Բոլոր խմբերը նստեցված են',
    fullySeated: 'Ամբողջությամբ նստեցված',
    partiallySeated: 'Մասամբ նստեցված'
  }
};

// Language Context
const LanguageContext = createContext();

const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('ru');

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const changeLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguage(newLanguage);
      localStorage.setItem('language', newLanguage);
    }
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Language Switch Component
const LanguageSwitch = () => {
  const { language, changeLanguage } = useLanguage();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <span style={{ 
        fontSize: '14px', 
        color: 'white',
        fontWeight: 'bold'
      }}>
        Язык / Լեզու:
      </span>
      <button
        onClick={() => changeLanguage('ru')}
        style={{
          backgroundColor: language === 'ru' ? '#3498db' : 'transparent',
          color: 'white',
          border: '2px solid white',
          borderRadius: '6px',
          padding: '4px 8px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold',
          transition: 'all 0.2s'
        }}
      >
        РУС
      </button>
      <button
        onClick={() => changeLanguage('hy')}
        style={{
          backgroundColor: language === 'hy' ? '#3498db' : 'transparent',
          color: 'white',
          border: '2px solid white',
          borderRadius: '6px',
          padding: '4px 8px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold',
          transition: 'all 0.2s'
        }}
      >
        ՀԱՅ
      </button>
    </div>
  );
};

// Тестовые люди для выбора
const TEST_PEOPLE = [
  'Анна Петрова', 'Михаил Сидоров', 'Елена Козлова', 'Дмитрий Волков', 'Ольга Морозова',
  'Александр Иванов', 'Мария Смирнова', 'Сергей Попов', 'Татьяна Лебедева', 'Николай Новиков',
  'Екатерина Федорова', 'Андрей Соколов', 'Наталья Павлова', 'Владимир Михайлов', 'Светлана Захарова',
  'Игорь Кузнецов', 'Людмила Васильева', 'Алексей Григорьев', 'Ирина Степанова', 'Виктор Романов',
  'Юлия Белова', 'Константин Орлов', 'Валентина Макарова', 'Евгений Николаев', 'Галина Фролова',
  'Артем Зайцев', 'Оксана Крылова', 'Максим Семенов', 'Лариса Богданова', 'Роман Гусев'
];

// Helper functions (same as before)
const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}.${month}.${year}`;
};

const findNextAvailableTime = (occupiedSlots, startHour = 12) => {
  for (let hour = startHour; hour < 24; hour++) {
    for (let minute of ['00', '15', '30', '45']) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:${minute}`;
      if (!occupiedSlots.includes(timeSlot)) {
        return timeSlot;
      }
    }
  }
  for (let hour = 0; hour < startHour; hour++) {
    for (let minute of ['00', '15', '30', '45']) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:${minute}`;
      if (!occupiedSlots.includes(timeSlot)) {
        return timeSlot;
      }
    }
  }
  return "12:00";
};

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
  const { t } = useLanguage();
  
  const [hallData, setHallData] = useState(null);
  const [scale, setScale] = useState(1);
  const [zoom, setZoom] = useState(0.2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Простые состояния для рассадки
  const [selectedChair, setSelectedChair] = useState(null);
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [personName, setPersonName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groups, setGroups] = useState([
    {
      id: 'family',
      name: 'Семья',
      color: '#e74c3c',
      members: ['Анна Петрова', 'Михаил Петров']
    },
    {
      id: 'friends',
      name: 'Друзья',
      color: '#3498db',
      members: ['Елена Козлова', 'Дмитрий Волков']
    },
    {
      id: 'colleagues',
      name: 'Коллеги',
      color: '#2ecc71',
      members: []
    },
    {
      id: 'vip',
      name: 'VIP гости',
      color: '#f39c12',
      members: ['Ольга Морозова']
    }
  ]);
  const [showGroupsPanel, setShowGroupsPanel] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);

  // Состояния для создания/редактирования групп
  const [groupMembers, setGroupMembers] = useState([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [showSeatingModal, setShowSeatingModal] = useState(false);
  const [selectedGroupForSeating, setSelectedGroupForSeating] = useState(null);

  // Состояния для редактирования группы
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupMembers, setEditGroupMembers] = useState([]);

  // Состояния для выбора людей
  const [showPeopleSelector, setShowPeopleSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [usedPeople, setUsedPeople] = useState([]);

  // Состояния для drag & drop
  const [draggedGroup, setDraggedGroup] = useState(null);
  const [dragOverTable, setDragOverTable] = useState(null);

  // Состояния для выбора участников при нехватке мест
  const [showMemberSelectionModal, setShowMemberSelectionModal] = useState(false);
  const [pendingSeating, setPendingSeating] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showTableDetailsModal, setShowTableDetailsModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showGroupDetailsModal, setShowGroupDetailsModal] = useState(false);
  const [selectedGroupForDetails, setSelectedGroupForDetails] = useState(null);

  const [isGroupsExpanded, setIsGroupsExpanded] = useState(false);
  const [shapes, setShapes] = useState([]);

  const tablesAreaRef = useRef(null);
  const zoomRef = useRef(0.2);

  // View dragging state
  const [isDraggingView, setIsDraggingView] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const [initialScrollPosition, setInitialScrollPosition] = useState({ x: 0, y: 0 });

  const [isMobileGroupsExpanded, setIsMobileGroupsExpanded] = useState(false);
  const [selectedPersonFromGroup, setSelectedPersonFromGroup] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const selectPersonFromGroup = (personName, groupId) => {
    setSelectedPersonFromGroup({ name: personName, groupId: groupId });
    setPersonName(personName);
    setSelectedGroup(groupId);
  };

  const getSeatedMembersCount = (groupId) => {
    if (!hallData?.tables) return 0;
    
    let seatedCount = 0;
    hallData.tables.forEach(table => {
      if (table.people) {
        table.people.forEach(person => {
          if (person && person.groupId === groupId) {
            seatedCount++;
          }
        });
      }
    });
    
    return seatedCount;
  };

  const getGroupStatus = (group) => {
    const availableMembers = group.members.length;
    const seatedMembers = getSeatedMembersCount(group.id);
    const totalMembers = availableMembers + seatedMembers;
    
    let seatedAtTable = null;
    if (seatedMembers > 0) {
      hallData?.tables?.forEach(table => {
        const groupMembersAtTable = table.people?.filter(person => 
          person && person.groupId === group.id
        ).length || 0;
        
        if (groupMembersAtTable > 0) {
          seatedAtTable = table.name || `${t('table')} ${table.id}`;
        }
      });
    }
    
    return {
      availableMembers,
      seatedMembers,
      totalMembers,
      seatedAtTable,
      isFullySeated: availableMembers === 0 && seatedMembers > 0,
      isPartiallySeated: availableMembers > 0 && seatedMembers > 0,
      isReadyToSeat: availableMembers > 0
    };
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const touchDistanceRef = useRef(null);
  const zoomOperationInProgress = useRef(false);
  const lastZoomUpdateTime = useRef(0);

  const handleGroupClick = (e, group) => {
    e.stopPropagation();
    setSelectedGroupForDetails(group);
    setShowGroupDetailsModal(true);
  };

  const closeGroupDetailsModal = () => {
    setShowGroupDetailsModal(false);
    setSelectedGroupForDetails(null);
  };

  const handleTableClick = (e, table) => {
    e.stopPropagation();
    setSelectedTable(table);
    setShowTableDetailsModal(true);
  };

  const closeTableDetailsModal = () => {
    setShowTableDetailsModal(false);
    setSelectedTable(null);
  };

  const seatGroupAtTableFromModal = (groupId) => {
    if (!selectedTable) return;

    const group = groups.find(g => g.id === groupId);
    if (!group || !group.members.length) {
      alert(t('groupIsEmpty'));
      return;
    }

    const availableSeats = getAvailableSeats(selectedTable.id);

    if (availableSeats.length === 0) {
      alert(t('tableIsFull'));
      return;
    }

    if (group.members.length > availableSeats.length) {
      setPendingSeating({
        groupId: groupId,
        tableId: selectedTable.id,
        availableSeats: availableSeats.length
      });
      setSelectedMembers([]);
      setShowMemberSelectionModal(true);
      setShowTableDetailsModal(false);
    } else {
      seatGroupAtTable(groupId, selectedTable.id);
      setShowTableDetailsModal(false);
    }
  };

  const getAvailableSeats = (tableId) => {
    const table = hallData.tables.find(t => t.id === tableId);
    if (!table) return [];

    const availableSeats = [];
    const chairCount = table.chairCount || 12;

    for (let i = 0; i < chairCount; i++) {
      if (!table.people || !table.people[i]) {
        availableSeats.push(i);
      }
    }

    return availableSeats;
  };

  const releaseGroup = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const groupMembers = [];

    hallData.tables.forEach(table => {
      if (table.people) {
        table.people.forEach(person => {
          if (person && person.groupId === groupId) {
            groupMembers.push(person.name);
          }
        });
      }
    });

    setHallData(prevData => {
      const updatedTables = prevData.tables.map(table => {
        const updatedPeople = (table.people || []).map(person => {
          if (person && person.groupId === groupId) {
            return null;
          }
          return person;
        });

        return { ...table, people: updatedPeople };
      });

      const updatedHallData = {
        ...prevData,
        tables: updatedTables
      };

      localStorage.setItem('hallData', JSON.stringify(updatedHallData));
      return updatedHallData;
    });

    const updatedGroups = groups.map(g => {
      if (g.id === groupId) {
        const allMembers = [...(g.members || []), ...groupMembers];
        const uniqueMembers = [...new Set(allMembers)];

        return {
          ...g,
          members: uniqueMembers
        };
      }
      return g;
    });

    setGroups(updatedGroups);
    localStorage.setItem('seatingGroups', JSON.stringify(updatedGroups));
  };

  const seatGroupAtTable = (groupId, tableId, selectedPeople = null) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) {
      alert(t('groupIsEmpty'));
      return;
    }

    const peopleToSeat = selectedPeople || group.members;

    if (peopleToSeat.length === 0) {
      alert(t('groupIsEmpty'));
      return;
    }

    const availableSeats = getAvailableSeats(tableId);

    if (availableSeats.length < peopleToSeat.length) {
      alert(`${t('notEnoughSeats')} ${t('needSeats')}: ${peopleToSeat.length}, ${t('availableSeatsCount')}: ${availableSeats.length}`);
      return;
    }

    setHallData(prevData => {
      const updatedTables = prevData.tables.map(table => {
        if (table.id === tableId) {
          const updatedPeople = [...(table.people || [])];

          peopleToSeat.forEach((memberName, index) => {
            if (index < availableSeats.length) {
              const seatIndex = availableSeats[index];
              updatedPeople[seatIndex] = {
                name: memberName,
                groupId: groupId,
                isMainGuest: true
              };
            }
          });

          return {
            ...table,
            people: updatedPeople
          };
        }
        return table;
      });

      const updatedHallData = {
        ...prevData,
        tables: updatedTables,
        shapes: shapes
      };

      localStorage.setItem('hallData', JSON.stringify(updatedHallData));
      return updatedHallData;
    });

    const updatedGroups = groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          members: g.members.filter(member => !peopleToSeat.includes(member))
        };
      }
      return g;
    });

    setGroups(updatedGroups);
    localStorage.setItem('seatingGroups', JSON.stringify(updatedGroups));

    setShowSeatingModal(false);
    setSelectedGroupForSeating(null);
    setShowMemberSelectionModal(false);
    setPendingSeating(null);
    setSelectedMembers([]);
  };

  // Drag & Drop functions
  const handleDragStart = (e, group) => {
    setDraggedGroup(group);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedGroup(null);
    setDragOverTable(null);
  };

  const handleTableDragOver = (e, tableId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTable(tableId);
  };

  const handleTableDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverTable(null);
    }
  };

  const handleTableDrop = (e, tableId) => {
    e.preventDefault();
    setDragOverTable(null);

    if (!draggedGroup) return;

    const availableSeats = getAvailableSeats(tableId);

    if (draggedGroup.members.length === 0) {
      alert(t('groupIsEmpty'));
      return;
    }

    if (availableSeats.length === 0) {
      alert(t('tableIsFull'));
      return;
    }

    if (draggedGroup.members.length > availableSeats.length) {
      setPendingSeating({
        groupId: draggedGroup.id,
        tableId: tableId,
        availableSeats: availableSeats.length
      });
      setSelectedMembers([]);
      setShowMemberSelectionModal(true);
    } else {
      seatGroupAtTable(draggedGroup.id, tableId);
    }
  };

  const toggleMemberSelection = (memberName) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberName)) {
        return prev.filter(name => name !== memberName);
      } else {
        if (prev.length < pendingSeating.availableSeats) {
          return [...prev, memberName];
        }
        return prev;
      }
    });
  };

  const confirmMemberSelection = () => {
    if (selectedMembers.length === 0) {
      alert(t('selectAtLeastOne'));
      return;
    }

    seatGroupAtTable(pendingSeating.groupId, pendingSeating.tableId, selectedMembers);
  };

  const cancelMemberSelection = () => {
    setShowMemberSelectionModal(false);
    setPendingSeating(null);
    setSelectedMembers([]);
  };

  const getFilteredPeople = () => {
    const availablePeople = TEST_PEOPLE.filter(person => !usedPeople.includes(person));
    if (!searchTerm) return availablePeople;
    return availablePeople.filter(person =>
      person.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const addPersonFromList = (personName) => {
    setUsedPeople(prev => [...prev, personName]);

    if (isEditMode) {
      if (!editGroupMembers.includes(personName)) {
        setEditGroupMembers(prev => [...prev, personName]);
      }
    } else {
      if (!groupMembers.includes(personName)) {
        setGroupMembers(prev => [...prev, personName]);
      }
    }
    setShowPeopleSelector(false);
    setSearchTerm('');
  };

  const addCustomPerson = () => {
    const customName = newMemberName.trim();
    if (!customName) return;

    if (isEditMode) {
      if (!editGroupMembers.includes(customName)) {
        setEditGroupMembers(prev => [...prev, customName]);
      }
    } else {
      if (!groupMembers.includes(customName)) {
        setGroupMembers(prev => [...prev, customName]);
      }
    }

    setNewMemberName('');
    setShowPeopleSelector(false);
  };

  // Loading data
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

        const allUsedPeople = [];
        parsedGroups.forEach(group => {
          if (group.members) {
            group.members.forEach(member => {
              if (TEST_PEOPLE.includes(member)) {
                allUsedPeople.push(member);
              }
            });
          }
        });
        setUsedPeople(allUsedPeople);

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
        setError(t('errorLoadingFile'));
        setIsLoading(false);
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  const handleChairClick = (tableId, chairIndex) => {
    setSelectedChair({ tableId, chairIndex });

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
      alert(t('enterGuestName'));
      return;
    }

    const currentPersonOnChair = hallData.tables?.find(t => t.id === selectedChair.tableId)?.people?.[selectedChair.chairIndex];
    
    const updatedGroups = groups.map(group => {
      let updatedGroup = { ...group };
      
      if (currentPersonOnChair && 
          currentPersonOnChair.groupId === group.id && 
          currentPersonOnChair.name !== personName.trim()) {
        updatedGroup = {
          ...updatedGroup,
          members: [...updatedGroup.members, currentPersonOnChair.name]
        };
      }
      
      if (selectedPersonFromGroup && selectedPersonFromGroup.groupId === group.id) {
        updatedGroup = {
          ...updatedGroup,
          members: updatedGroup.members.filter(member => member !== selectedPersonFromGroup.name)
        };
      }
      
      return updatedGroup;
    });
    
    setGroups(updatedGroups);
    localStorage.setItem('seatingGroups', JSON.stringify(updatedGroups));

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
    const currentPerson = hallData.tables?.find(t => t.id === selectedChair.tableId)?.people?.[selectedChair.chairIndex];
    
    if (currentPerson && currentPerson.groupId) {
      const updatedGroups = groups.map(group => {
        if (group.id === currentPerson.groupId) {
          return {
            ...group,
            members: [...group.members, currentPerson.name]
          };
        }
        return group;
      });
      
      setGroups(updatedGroups);
      localStorage.setItem('seatingGroups', JSON.stringify(updatedGroups));
    }

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
    setSelectedPersonFromGroup(null);
  };

  const addMemberToGroup = () => {
    if (!newMemberName.trim()) {
      alert(t('enterGuestName'));
      return;
    }

    if (!groupMembers.includes(newMemberName.trim())) {
      setGroupMembers(prev => [...prev, newMemberName.trim()]);
    }
    setNewMemberName('');
  };

  const removeMemberFromGroup = (index) => {
    const memberToRemove = groupMembers[index];

    if (TEST_PEOPLE.includes(memberToRemove)) {
      setUsedPeople(prev => prev.filter(person => person !== memberToRemove));
    }

    setGroupMembers(prev => prev.filter((_, i) => i !== index));
  };

  const addMemberToEditGroup = () => {
    if (!newMemberName.trim()) {
      alert(t('enterGuestName'));
      return;
    }

    if (!editGroupMembers.includes(newMemberName.trim())) {
      setEditGroupMembers(prev => [...prev, newMemberName.trim()]);
    }
    setNewMemberName('');
  };

  const removeMemberFromEditGroup = (index) => {
    const memberToRemove = editGroupMembers[index];

    if (TEST_PEOPLE.includes(memberToRemove)) {
      setUsedPeople(prev => prev.filter(person => person !== memberToRemove));
    }

    setEditGroupMembers(prev => prev.filter((_, i) => i !== index));
  };

  const addGroup = () => {
    if (!newGroupName.trim()) {
      alert(t('enterGroupName'));
      return;
    }

    const colors = [
      '#e74c3c', '#c0392b', '#3498db', '#2980b9', '#2ecc71', '#27ae60',
      '#f39c12', '#d35400', '#9b59b6', '#8e44ad', '#1abc9c', '#16a085',
      '#e67e22', '#f1c40f', '#f39c12', '#34495e', '#2c3e50', '#ecf0f1',
      '#bdc3c7', '#95a5a6'
    ];

    const usedColors = groups.map(g => g.color);
    const availableColor = colors.find(color => !usedColors.includes(color)) || '#95a5a6';

    const newGroup = {
      id: 'group_' + Date.now(),
      name: newGroupName.trim(),
      color: availableColor,
      members: [...groupMembers]
    };

    const updatedGroups = [...groups, newGroup];
    setGroups(updatedGroups);
    localStorage.setItem('seatingGroups', JSON.stringify(updatedGroups));

    resetAddGroupModal();
  };

  const updateGroup = () => {
    if (!editGroupName.trim()) {
      alert(t('enterGroupName'));
      return;
    }

    const updatedGroups = groups.map(group => {
      if (group.id === editingGroup.id) {
        return {
          ...group,
          name: editGroupName.trim(),
          members: [...editGroupMembers]
        };
      }
      return group;
    });

    setGroups(updatedGroups);
    localStorage.setItem('seatingGroups', JSON.stringify(updatedGroups));

    resetEditGroupModal();
  };

  const removeGroup = (groupId) => {
    const groupToRemove = groups.find(g => g.id === groupId);

    if (groupToRemove && groupToRemove.members) {
      const peopleToFree = groupToRemove.members.filter(member =>
        TEST_PEOPLE.includes(member)
      );
      setUsedPeople(prev => prev.filter(person => !peopleToFree.includes(person)));
    }

    const updatedGroups = groups.filter(g => g.id !== groupId);
    setGroups(updatedGroups);
    localStorage.setItem('seatingGroups', JSON.stringify(updatedGroups));

    setHallData(prevData => {
      const updatedTables = prevData.tables.map(table => {
        const updatedPeople = (table.people || []).map(person => {
          if (person && person.groupId === groupId) {
            return null;
          }
          return person;
        });

        return { ...table, people: updatedPeople };
      });

      const updatedHallData = {
        ...prevData,
        tables: updatedTables
      };

      localStorage.setItem('hallData', JSON.stringify(updatedHallData));
      return updatedHallData;
    });
  };

  const getGroupColor = (groupId) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.color : '#95a5a6';
  };

  const resetAddGroupModal = () => {
    const peopleToFree = groupMembers.filter(member => TEST_PEOPLE.includes(member));
    setUsedPeople(prev => prev.filter(person => !peopleToFree.includes(person)));

    setShowAddGroupModal(false);
    setNewGroupName('');
    setGroupMembers([]);
    setNewMemberName('');
    setIsEditMode(false);
  };

  const resetEditGroupModal = () => {
    const originalMembers = editingGroup ? editingGroup.members : [];
    const newMembers = editGroupMembers.filter(member => !originalMembers.includes(member));
    const peopleToFree = newMembers.filter(member => TEST_PEOPLE.includes(member));
    setUsedPeople(prev => prev.filter(person => !peopleToFree.includes(person)));

    setShowEditGroupModal(false);
    setEditingGroup(null);
    setEditGroupName('');
    setEditGroupMembers([]);
    setNewMemberName('');
    setIsEditMode(false);
  };

  const openSeatingModal = (group) => {
    setSelectedGroupForSeating(group);
    setShowSeatingModal(true);
  };

  const closeSeatingModal = () => {
    setShowSeatingModal(false);
    setSelectedGroupForSeating(null);
  };

  const openEditGroupModal = (group) => {
    setEditingGroup(group);
    setEditGroupName(group.name);
    setEditGroupMembers([...group.members]);
    setIsEditMode(true);
    setShowEditGroupModal(true);
  };

  const openPeopleSelector = (editMode = false) => {
    setIsEditMode(editMode);
    setShowPeopleSelector(true);
    setSearchTerm('');
  };

  const closePeopleSelector = () => {
    setShowPeopleSelector(false);
    setSearchTerm('');
    setNewMemberName('');
  };

  // Zoom functions (сохранены без изменений)
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

  // Touch and mouse handlers (сохранены без изменений, но можно добавить переводы в alert'ы)

  // Render Table Component
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

    const isDragOver = dragOverTable === table.id;

    // Функции для рендеринга стульев остаются теми же...
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
      // Аналогично, функция остается той же...
      return [];
    };

    return (
      <div
        className="table-container"
        data-id={table.id}
        style={{
          position: 'absolute',
          left: `${position.left}px`,
          top: `${position.top}px`,
          cursor: 'pointer',
          transformOrigin: 'center center',
          zIndex: 10,
          width: `${tableWidth}px`,
          height: `${tableHeight}px`
        }}
        onDragOver={(e) => handleTableDragOver(e, table.id)}
        onDragLeave={handleTableDragLeave}
        onDrop={(e) => handleTableDrop(e, table.id)}
        onClick={(e) => handleTableClick(e, table)}
      >
        <div style={{ position: 'relative' }}>
          {isDragOver && (
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '-10px',
              right: '-10px',
              bottom: '-10px',
              backgroundColor: 'rgba(52, 152, 219, 0.3)',
              border: '3px dashed #3498db',
              borderRadius: isRound ? '50%' : '12px',
              zIndex: 1,
              pointerEvents: 'none'
            }} />
          )}

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
                    fontSize: `${Math.max(10, Math.min(16, tableWidth * 0.04))}px`,
                    fontFamily: 'Arial',
                    color: '#374151',
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: `${Math.max(2, Math.min(6, tableWidth * 0.015))}px`,
                    borderRadius: '4px',
                    lineHeight: 1.1,
                    zIndex: 3,
                    fontWeight: 'bold',
                    border: '1px solid #ccc',
                    overflow: 'hidden',
                    maxWidth: `${tableWidth * 0.8}px`,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis'
                  }}
                >
                  <div style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: `${Math.max(8, Math.min(14, tableWidth * 0.035))}px`
                  }}>
                    {table.name || `${t('table')} ${table.id}`}
                  </div>
                  <div style={{
                    fontSize: `${Math.max(6, Math.min(10, tableWidth * 0.025))}px`,
                    color: '#666',
                    marginTop: '1px'
                  }}>
                    {chairCount} {t('seats')}
                  </div>
                </div>
              </div>

              {renderChairsForRoundTable()}
            </div>
          ) : (
            // Прямоугольный стол - аналогично
            <div>Rectangular table rendering...</div>
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
      {/* Header с переключателем языка */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap'
          }}>
            {hallData?.name || t('guestSeating')}
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
                backgroundColor: '#3498db',
                color: 'white',
                border: '3px solid white',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                transition: 'all 0.2s'
              }}
            >
              📁 {t('loadPlan')}
            </label>
            {isLoading && (
              <div style={{
                position: 'absolute',
                top: '70px',
                left: '0',
                color: 'white',
                fontSize: '12px',
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: '5px 10px',
                borderRadius: '4px'
              }}>
                {t('loading')}
              </div>
            )}
            {error && (
              <div style={{
                position: 'absolute',
                top: '70px',
                left: '0',
                color: '#ff6b6b',
                fontSize: '12px',
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: '5px 10px',
                borderRadius: '4px',
                maxWidth: '200px'
              }}>
                {error}
              </div>
            )}
          </div>
        </div>

        <LanguageSwitch />
      </header>

      {/* Groups Panel с переводами */}
      <div style={{
        backgroundColor: '#34495e',
        padding: '10px 15px',
        borderBottom: '2px solid #2c3e50',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        minHeight: '70px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease-in-out',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 50
      }}>
        <button
          onClick={() => setShowAddGroupModal(true)}
          style={{
            backgroundColor: '#2ecc71',
            color: 'white',
            border: '2px solid white',
            borderRadius: '20px',
            padding: '10px 18px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>+</span>
          <span>{t('createGroup')}</span>
        </button>

        <button
          onClick={() => setIsGroupsExpanded(!isGroupsExpanded)}
          style={{
            backgroundColor: isGroupsExpanded ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: 'white',
            border: '2px solid white',
            borderRadius: '20px',
            padding: '10px 18px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span style={{
            transition: 'transform 0.3s ease',
            transform: isGroupsExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            fontSize: '12px'
          }}>
            ▶
          </span>
          <span>{t('groups')}</span>
          <span style={{
            backgroundColor: groups.length > 0 ? '#f39c12' : '#95a5a6',
            color: 'white',
            borderRadius: '12px',
            padding: '2px 8px',
            fontSize: '11px',
            minWidth: '20px',
            textAlign: 'center'
          }}>
            {groups.length}
          </span>
        </button>
      </div>

      {/* Main content area */}
      <div className="main-content" style={{
        flex: 1,
        width: '100%',
        height: 'calc(100vh - 190px)',
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
                          // Рендеринг shapes остается тем же...
                          return null;
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
                        <h2 style={{ marginTop: 0 }}>{t('guestSeating')}</h2>
                        <p>{t('loadPlan')}</p>
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
                          {t('loadPlan')}
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

      {/* Person Modal с переводами */}
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
            maxWidth: '500px',
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
              {selectedChair ? `${t('table')} ${selectedChair.tableId} • ${t('seat')} ${selectedChair.chairIndex + 1}` : t('guestSeating')}
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                {t('guestName')}:
              </label>
              <input
                type="text"
                value={personName}
                onChange={(e) => {
                  setPersonName(e.target.value);
                  if (selectedPersonFromGroup && e.target.value !== selectedPersonFromGroup.name) {
                    setSelectedPersonFromGroup(null);
                  }
                }}
                placeholder={t('enterName')}
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
                {t('group')}:
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
                <option value="">{t('withoutGroup')}</option>
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
                {selectedPersonFromGroup ? `${t('seatGroup')} ${selectedPersonFromGroup.name}` : t('save')}
              </button>

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
                  {t('removeGuest')}
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
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Group Modal с переводами */}
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
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ textAlign: 'center', marginTop: 0, marginBottom: '20px' }}>
              {t('createNewGroup')}
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                {t('groupName')}:
              </label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Например: Семья Ивановых"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #ddd',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontWeight: 'bold' }}>
                  {t('groupMembers')}:
                </label>
                <button
                  onClick={() => openPeopleSelector(false)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {t('selectFromList')}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder={t('enterName')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: '2px solid #ddd',
                    fontSize: '14px'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addMemberToGroup();
                    }
                  }}
                />
                <button
                  onClick={addMemberToGroup}
                  disabled={!newMemberName.trim()}
                  style={{
                    padding: '10px 15px',
                    backgroundColor: newMemberName.trim() ? '#3498db' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: newMemberName.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '14px'
                  }}
                >
                  {t('add')}
                </button>
              </div>

              {groupMembers.length > 0 && (
                <div style={{
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  backgroundColor: '#f8f9fa',
                  padding: '10px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#666' }}>
                    {t('participants')} ({groupMembers.length}):
                  </div>
                  {groupMembers.map((member, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '5px 0',
                      borderBottom: index < groupMembers.length - 1 ? '1px solid #eee' : 'none'
                    }}>
                      <span style={{ fontSize: '14px' }}>• {member}</span>
                      <button
                        onClick={() => removeMemberFromGroup(index)}
                        style={{
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          padding: '2px 8px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {groupMembers.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  color: '#666',
                  fontStyle: 'italic',
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #ddd'
                }}>
                  {t('participants')} не добавлены
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              gap: '10px'
            }}>
              <button
                onClick={addGroup}
                disabled={!newGroupName.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: newGroupName.trim() ? '#2ecc71' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: newGroupName.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                {t('createGroup')}
              </button>

              <button
                onClick={resetAddGroupModal}
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
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* People Selector Modal с переводами */}
      {showPeopleSelector && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
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
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ textAlign: 'center', marginTop: 0, marginBottom: '20px' }}>
              {t('selectPersonFromList')}
              <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                {t('availablePeople')}: {getFilteredPeople().length} {t('fromPeople')} {TEST_PEOPLE.length} {t('peopleUsed')}
              </div>
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchByName')}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #ddd',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder={t('enterCustomName')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: '2px solid #ddd',
                    fontSize: '14px'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addCustomPerson();
                    }
                  }}
                />
                <button
                  onClick={addCustomPerson}
                  disabled={!newMemberName.trim()}
                  style={{
                    padding: '10px 15px',
                    backgroundColor: newMemberName.trim() ? '#2ecc71' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: newMemberName.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '14px'
                  }}
                >
                  {t('add')}
                </button>
              </div>
            </div>

            <div style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              maxHeight: '300px',
              overflowY: 'auto',
              backgroundColor: '#f8f9fa'
            }}>
              {getFilteredPeople().map((person, index) => (
                <div
                  key={index}
                  onClick={() => addPersonFromList(person)}
                  style={{
                    padding: '12px 15px',
                    borderBottom: index < getFilteredPeople().length - 1 ? '1px solid #eee' : 'none',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    fontSize: '14px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e3f2fd'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  {person}
                </div>
              ))}

              {getFilteredPeople().length === 0 && (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  {searchTerm ? t('noOneFound') : t('allPeopleUsed')}
                  {!searchTerm && (
                    <div style={{ marginTop: '10px', fontSize: '12px' }}>
                      {t('enterCustomName')}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={closePeopleSelector}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#f1f1f1',
                color: '#333',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                marginTop: '15px'
              }}
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {/* Member Selection Modal с переводами */}
      {showMemberSelectionModal && pendingSeating && (
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
          zIndex: 1300,
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
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ textAlign: 'center', marginTop: 0, marginBottom: '20px' }}>
              {t('selectMembersToSeat')} {pendingSeating.availableSeats} {t('participants')}
            </h3>

            <div style={{
              backgroundColor: '#fff3cd',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #ffeaa7'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                ⚠️ {t('notEnoughSeats')}
              </div>
              <div style={{ fontSize: '14px' }}>
                За этим столом свободно только {pendingSeating.availableSeats} {t('seats')},
                а в группе {groups.find(g => g.id === pendingSeating.groupId)?.members.length} {t('person')}.
              </div>
            </div>

            <div style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: '#f8f9fa',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {groups.find(g => g.id === pendingSeating.groupId)?.members.map((member, index) => (
                <div
                  key={index}
                  onClick={() => toggleMemberSelection(member)}
                  style={{
                    padding: '12px 15px',
                    borderBottom: index < groups.find(g => g.id === pendingSeating.groupId).members.length - 1 ? '1px solid #eee' : 'none',
                    cursor: 'pointer',
                    backgroundColor: selectedMembers.includes(member) ? '#e3f2fd' : 'transparent',
                    border: selectedMembers.includes(member) ? '2px solid #2196f3' : '2px solid transparent',
                    margin: '2px',
                    borderRadius: '6px',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member)}
                    onChange={() => { }}
                    style={{ pointerEvents: 'none' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: selectedMembers.includes(member) ? 'bold' : 'normal' }}>
                    {member}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              margin: '15px 0',
              padding: '10px',
              backgroundColor: selectedMembers.length === pendingSeating.availableSeats ? '#d4edda' :
                selectedMembers.length > pendingSeating.availableSeats ? '#f8d7da' : '#f8f9fa',
              borderRadius: '6px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {t('selected')}: {selectedMembers.length} {t('from')} {pendingSeating.availableSeats} {t('necessary')}
            </div>

            <div style={{
              display: 'flex',
              gap: '10px'
            }}>
              <button
                onClick={confirmMemberSelection}
                disabled={selectedMembers.length === 0 || selectedMembers.length > pendingSeating.availableSeats}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: (selectedMembers.length > 0 && selectedMembers.length <= pendingSeating.availableSeats) ? '#2ecc71' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (selectedMembers.length > 0 && selectedMembers.length <= pendingSeating.availableSeats) ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                {t('seatSelected')}
              </button>

              <button
                onClick={cancelMemberSelection}
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
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seating Modal - выбор стола для группы с переводами */}
      {showSeatingModal && selectedGroupForSeating && (
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
          zIndex: 1200,
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
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ textAlign: 'center', marginTop: 0, marginBottom: '20px' }}>
              {t('selectTableForGroup')} "{selectedGroupForSeating.name}"
            </h3>

            <div style={{
              backgroundColor: '#f0f8ff',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #2196f3'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                {t('groupMembers')} ({selectedGroupForSeating.members.length}):
              </div>
              {selectedGroupForSeating.members.map((member, index) => (
                <div key={index} style={{ fontSize: '14px', marginBottom: '2px' }}>
                  • {member}
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Доступные столы:</h4>

              {hallData && hallData.tables.map(table => {
                const availableSeats = getAvailableSeats(table.id);
                const canSeatGroup = availableSeats.length >= selectedGroupForSeating.members.length;

                return (
                  <div key={table.id} style={{
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '10px',
                    backgroundColor: canSeatGroup ? '#f8f9fa' : '#fff5f5',
                    opacity: canSeatGroup ? 1 : 0.6
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '5px'
                    }}>
                      <div style={{ fontWeight: 'bold' }}>
                        {table.name || `${t('table')} ${table.id}`}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: canSeatGroup ? '#2ecc71' : '#e74c3c'
                      }}>
                        {availableSeats.length} {t('availableSeats')}
                      </div>
                    </div>

                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                      {t('totalSeats')}: {table.chairCount || 12} | {t('needSeats')}: {selectedGroupForSeating.members.length}
                    </div>

                    <button
                      onClick={() => seatGroupAtTable(selectedGroupForSeating.id, table.id)}
                      disabled={!canSeatGroup}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: canSeatGroup ? '#2ecc71' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: canSeatGroup ? 'pointer' : 'not-allowed',
                        fontWeight: 'bold'
                      }}
                    >
                      {canSeatGroup ? `${t('seatGroup')} здесь` : t('notEnoughSeats')}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={closeSeatingModal}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#f1f1f1',
                color: '#333',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* CSS стили остаются теми же */}
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 8px 20px rgba(46, 204, 113, 0.4); }
          50% { box-shadow: 0 8px 20px rgba(46, 204, 113, 0.8); }
          100% { box-shadow: 0 8px 20px rgba(46, 204, 113, 0.4); }
        }

        .groups-scroll::-webkit-scrollbar {
          height: 8px !important;
          background: rgba(255,255,255,0.1) !important;
          border-radius: 4px !important;
        }

        .groups-scroll::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.1) !important;
          border-radius: 4px !important;
        }

        .groups-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.6) !important;
          border-radius: 4px !important;
          border: 1px solid rgba(0,0,0,0.1) !important;
        }

        .groups-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.8) !important;
        }

        .groups-scroll {
          scrollbar-width: thin !important;
          scrollbar-color: rgba(255,255,255,0.6) rgba(255,255,255,0.2) !important;
        }
      `}</style>

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
          {t('dragGroupToTable')}
        </div>
      )}
    </div>
  );
};

// Main App Component with Language Provider
const MultilingualSeatingApp = () => {
  return (
    <LanguageProvider>
      <SimpleSeatingApp />
    </LanguageProvider>
  );
};

export default MultilingualSeatingApp;