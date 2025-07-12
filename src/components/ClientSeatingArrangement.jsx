import React, { useState, useEffect, useRef } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// Тестовые люди для выбора
const TEST_PEOPLE = [
  'Анна Петрова', 'Михаил Сидоров', 'Елена Козлова', 'Дмитрий Волков', 'Ольга Морозова',
  'Александр Иванов', 'Мария Смирнова', 'Сергей Попов', 'Татьяна Лебедева', 'Николай Новиков',
  'Екатерина Федорова', 'Андрей Соколов', 'Наталья Павлова', 'Владимир Михайлов', 'Светлана Захарова',
  'Игорь Кузнецов', 'Людмила Васильева', 'Алексей Григорьев', 'Ирина Степанова', 'Виктор Романов',
  'Юлия Белова', 'Константин Орлов', 'Валентина Макарова', 'Евгений Николаев', 'Галина Фролова',
  'Артем Зайцев', 'Оксана Крылова', 'Максим Семенов', 'Лариса Богданова', 'Роман Гусев'
];

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
  // Language state
  const [language, setLanguage] = useState('ru'); // 'ru' или 'hy'

  // Translations dictionary
  const translations = {
    ru: {
      // Header
      guestSeating: 'Рассадка гостей',
      loadPlan: 'Загрузить план',
      loading: 'Загрузка...',
      

      // Menu

       settings: 'Настройки',
    language: 'Язык',
    planLoaded: 'План загружен',
    tables: 'столов',

      // Groups
      createGroup: 'Создать группу',
      groups: 'Группы',
      readyToSeat: 'К рассадке',
      seated: 'Рассажены',
      allGroupsSeated: 'Все группы рассажены',
      noSeatedGroups: 'Нет рассаженных групп',
      dragToTable: 'перетащите на стол',
      
      // Group statuses
      readyForSeating: 'готовы к рассадке',
      allSeated: 'Все группы рассажены',
      
      // Person modal
      guestName: 'Имя гостя',
      enterName: 'Введите имя',
      group: 'Группа',
      noGroup: 'Без группы',
      selectFromGroups: 'Выбрать из групп',
      addNew: 'Добавить нового',
      save: 'Сохранить',
      removeGuest: 'Убрать гостя',
      cancel: 'Отмена',
      seatPerson: 'Посадить',
      
      // Group creation
      createNewGroup: 'Создать новую группу',
      groupName: 'Название группы',
      groupMembers: 'Участники группы',
      selectFromList: 'Выбрать из списка',
      orEnterName: 'Или введите имя',
      add: 'Добавить',
      members: 'Участники',
      noMembersAdded: 'Участники не добавлены',
      createGroupBtn: 'Создать группу',
      
      // Table details
      totalSeats: 'Всего мест',
      occupiedSeats: 'Занято мест',
      freeSeats: 'Свободно мест',
      seatedGuests: 'Рассаженные гости',
      seatGroup: 'Рассадить группу',
      noGroupsToSeat: 'Нет групп для рассадки',
      tableFullyOccupied: 'Стол полностью занят',
      noFreeSeatsAtTable: 'За этим столом нет свободных мест',
      close: 'Закрыть',
      
      // Errors and warnings
      enterNameError: 'Введите имя!',
      notEnoughSeats: 'За этим столом недостаточно свободных мест!',
      groupEmpty: 'Группа пустая!',
      noFreeSeatsAtTable: 'За этим столом нет свободных мест!',
      
      // File operations
      errorReadingFile: 'Ошибка при чтении JSON файла. Проверьте формат файла.',
      
      // Common
      table: 'Стол',
      seat: 'Место',
      people: 'чел.',
      person: 'человек',
      of: 'из',
      
      // Mobile hints
      dragGroupToTable: 'Перетащите группу на стол для рассадки',
      tapGroupToSelectTable: 'Нажмите на группу чтобы выбрать стол',
      
      // Additional translations
      editGroup: 'Редактировать группу',
      deleteGroup: 'Удалить группу',
      releaseGroup: 'Освободить группу',
      selectTable: 'Выбрать стол',
      details: 'Подробнее',
      edit: 'Изменить',
      family: 'Семья',
      friends: 'Друзья',
      colleagues: 'Коллеги',
      vipGuests: 'VIP гости',
      fullySeated: 'Полностью рассаженные',
      readyToSeatGroup: 'Готовы к рассадке',
      seatedMembers: 'рассажены',
      selectMembers: 'Выберите участников',
      notEnoughSeatsWarning: 'Недостаточно мест за столом!',
      onlyFreeSeats: 'За этим столом свободно только',
      inGroup: 'а в группе',
      seatSelectedMembers: 'Рассадить выбранных',
      selectedOf: 'Выбрано',
      required: 'из',
      necessary: 'необходимых',
      groupReadyToSeat: 'Группа готова к рассадке',
      groupSeated: 'Группа рассажена',
      waitingForSeating: 'участников ожидают рассадки',
      allMembersSeated: 'Все участники группы размещены за столами',
      groupMembers: 'Участники группы',
      seatedMembers: 'Рассаженные участники',
      editGroupAction: 'Редактировать',
      selectTableAction: 'Выбрать стол',
      releaseGroupAction: 'Освободить группу',
      deleteGroupAction: 'Удалить группу',
      releaseGroupConfirm: 'Освободить группу',
      returnMembersForReSeating: 'и вернуть участников для повторной рассадки?',
      deleteGroupConfirm: 'Удалить группу',
      membersNotFound: 'Участники группы не найдены',
      dataMaybeChanged: 'Возможно данные были изменены',
      availableSeats: 'доступно',
      needSeats: 'Нужно',
      seatGroupHere: 'Рассадить группу здесь',
      notEnoughSeatsShort: 'Недостаточно мест',
      selectParticipants: 'Выбрать участников',
      enterGroupName: 'Введите название группы!',
      enterMemberName: 'Введите имя участника!',
      saveChanges: 'Сохранить изменения',
      selectPersonFromList: 'Выберите человека из списка',
      available: 'Доступно',
      outOf: 'из',
      people: 'человек',
      orEnterOwnName: 'Или введите свое имя',
      noOneFound: 'Никого не найдено',
      allPeopleUsed: 'Все люди уже использованы',
      enterYourName: 'Введите свое имя выше или удалите кого-то из групп',
      selectTableForGroup: 'Выберите стол для группы',
      availableTables: 'Доступные столы',
      totalSeatsColon: 'Всего мест:',
      needColon: 'Нужно:',
      seatAtTable: 'Место',
      seatNumber: '#',
      createFirstGroup: 'Создайте первую группу',
      tapOnGroupToSelectTable: 'Нажмите на группу чтобы выбрать стол',
      seats: 'мест',
      selectAtLeastOne: 'Выберите хотя бы одного участника!',
      groupNamePlaceholder: 'Например: Семья Ивановых',
      searchByName: 'Поиск по имени...',
      orEnterNamePlaceholder: 'Или введите имя',
      system: 'Система рассадки гостей',
      loadHallPlan: 'Загрузите план зала для начала работы',
      loadHallPlanBtn: 'Загрузить план зала'
    },
    hy: {
      // Header
      guestSeating: 'Հյուրերի տեղադրում',
      loadPlan: 'Բեռնել պլան',
      loading: 'Բեռնում...',
      

      // Menu

       settings: 'Կարգավորումներ',
    language: 'Լեզու',
    planLoaded: 'Պլանը բեռնված է',
    tables: 'սեղաններ' ,
      // Groups
      createGroup: 'Ստեղծել խումբ',
      groups: 'Խմբեր',
      readyToSeat: 'Տեղադրելու համար',
      seated: 'Տեղադրված',
      allGroupsSeated: 'Բոլոր խմբերը տեղադրված են',
      noSeatedGroups: 'Չկան տեղադրված խմբեր',
      dragToTable: 'քաշեք սեղանի վրա',
      
      // Group statuses
      readyForSeating: 'պատրաստ են տեղադրման',
      allSeated: 'Բոլոր խմբերը տեղադրված են',
      
      // Person modal
      guestName: 'Հյուրի անուն',
      enterName: 'Մուտքագրեք անունը',
      group: 'Խումբ',
      noGroup: 'Առանց խմբի',
      selectFromGroups: 'Ընտրել խմբերից',
      addNew: 'Ավելացնել նոր',
      save: 'Պահպանել',
      removeGuest: 'Հեռացնել հյուրին',
      cancel: 'Չեղարկել',
      seatPerson: 'Նստեցնել',
      
      // Group creation
      createNewGroup: 'Ստեղծել նոր խումբ',
      groupName: 'Խմբի անվանումը',
      groupMembers: 'Խմբի անդամներ',
      selectFromList: 'Ընտրել ցանկից',
      orEnterName: 'Կամ մուտքագրեք անունը',
      add: 'Ավելացնել',
      members: 'Անդամներ',
      noMembersAdded: 'Անդամներ չեն ավելացվել',
      createGroupBtn: 'Ստեղծել խումբ',
      
      // Table details
      totalSeats: 'Ընդամենը տեղեր',
      occupiedSeats: 'Զբաղված տեղեր',
      freeSeats: 'Ազատ տեղեր',
      seatedGuests: 'Տեղադրված հյուրեր',
      seatGroup: 'Տեղադրել խումբը',
      noGroupsToSeat: 'Չկան խմբեր տեղադրման համար',
      tableFullyOccupied: 'Սեղանը լիովին զբաղված է',
      noFreeSeatsAtTable: 'Այս սեղանի մոտ ազատ տեղեր չկան',
      close: 'Փակել',
      
      // Errors and warnings
      enterNameError: 'Մուտքագրեք անունը։',
      notEnoughSeats: 'Այս սեղանի մոտ բավարար ազատ տեղեր չկան։',
      groupEmpty: 'Խումբը դատարկ է։',
      noFreeSeatsAtTable: 'Այս սեղանի մոտ ազատ տեղեր չկան։',
      
      // File operations
      errorReadingFile: 'Սխալ JSON ֆայլը կարդալիս։ Ստուգեք ֆայլի ֆորմատը։',
      
      // Common
      table: 'Սեղան',
      seat: 'Տեղ',
      people: 'մարդ',
      person: 'մարդ',
      of: '-ից',
      
      // Mobile hints
      dragGroupToTable: 'Քաշեք խումբը սեղանի վրա տեղադրման համար',
      tapGroupToSelectTable: 'Սեղմեք խմբի վրա՝ սեղան ընտրելու համար',
      
      // Additional translations
      editGroup: 'Խմբագրել խումբը',
      deleteGroup: 'Ջնջել խումբը',
      releaseGroup: 'Ազատել խումբը',
      selectTable: 'Ընտրել սեղան',
      details: 'Մանրամասներ',
      edit: 'Փոփոխել',
      family: 'Ընտանիք',
      friends: 'Ընկերներ',
      colleagues: 'Գործընկերներ',
      vipGuests: 'VIP հյուրեր',
      fullySeated: 'Լիովին տեղադրված',
      readyToSeatGroup: 'Պատրաստ տեղադրման',
      seatedMembers: 'տեղադրված',
      selectMembers: 'Ընտրեք անդամներին',
      notEnoughSeatsWarning: 'Սեղանի մոտ բավարար տեղեր չկան։',
      onlyFreeSeats: 'Այս սեղանի մոտ ազատ է միայն',
      inGroup: 'իսկ խմբում',
      seatSelectedMembers: 'Տեղադրել ընտրվածներին',
      selectedOf: 'Ընտրված է',
      required: '-ից',
      necessary: 'անհրաժեշտից',
      groupReadyToSeat: 'Խումբը պատրաստ է տեղադրման',
      groupSeated: 'Խումբը տեղադրված է',
      waitingForSeating: 'անդամներ սպասում են տեղադրման',
      allMembersSeated: 'Խմբի բոլոր անդամները տեղադրված են սեղանների մոտ',
      groupMembers: 'Խմբի անդամներ',
      seatedMembers: 'Տեղադրված անդամներ',
      editGroupAction: 'Խմբագրել',
      selectTableAction: 'Ընտրել սեղան',
      releaseGroupAction: 'Ազատել խումբը',
      deleteGroupAction: 'Ջնջել խումբը',
      releaseGroupConfirm: 'Ազատել խումբը',
      returnMembersForReSeating: 'և վերադարձնել անդամներին կրկնակի տեղադրման համար։',
      deleteGroupConfirm: 'Ջնջել խումբը',
      membersNotFound: 'Խմբի անդամները չեն գտնվել',
      dataMaybeChanged: 'Հնարավոր է տվյալները փոխվել են',
      availableSeats: 'մատչելի',
      needSeats: 'Անհրաժեշտ է',
      seatGroupHere: 'Տեղադրել խումբը այստեղ',
      notEnoughSeatsShort: 'Բավարար տեղեր չկան',
      selectParticipants: 'Ընտրել մասնակիցներին',
      enterGroupName: 'Մուտքագրեք խմբի անվանումը։',
      enterMemberName: 'Մուտքագրեք անդամի անունը։',
      saveChanges: 'Պահպանել փոփոխությունները',
      selectPersonFromList: 'Ընտրեք մարդու ցանկից',
      available: 'Մատչելի',
      outOf: '-ից',
      people: 'մարդ',
      orEnterOwnName: 'Կամ մուտքագրեք ձեր անունը',
      noOneFound: 'Ոչ ոք չի գտնվել',
      allPeopleUsed: 'Բոլոր մարդիկ արդեն օգտագործվել են',
      enterYourName: 'Մուտքագրեք ձեր անունը վերևում կամ ջնջեք մեկին խմբերից',
      selectTableForGroup: 'Ընտրեք սեղան խմբի համար',
      availableTables: 'Մատչելի սեղաններ',
      totalSeatsColon: 'Ընդամենը տեղեր՝',
      needColon: 'Անհրաժեշտ է՝',
      seatAtTable: 'Տեղ',
      seatNumber: '#',
      createFirstGroup: 'Ստեղծեք առաջին խումբը',
      tapOnGroupToSelectTable: 'Սեղմեք խմբի վրա՝ սեղան ընտրելու համար',
      seats: 'տեղեր',
      selectAtLeastOne: 'Ընտրեք գոնե մեկ մասնակցի։',
      groupNamePlaceholder: 'Օրինակ՝ Պետրոսյանների ընտանիք',
      searchByName: 'Որոնում անունով...',
      orEnterNamePlaceholder: 'Կամ մուտքագրեք անունը',
      system: 'Հյուրերի տեղադրման համակարգ',
      loadHallPlan: 'Բեռնեք դահլիճի պլանը աշխատանքը սկսելու համար',
      loadHallPlanBtn: 'Բեռնել դահլիճի պլանը'
    }
  };

  // Function to get translation
  const t = (key) => translations[language][key] || key;

  const [hallData, setHallData] = useState(null);
  const [scale, setScale] = useState(1);
  const [zoom, setZoom] = useState(0.2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
const [isBurgerOpen, setIsBurgerOpen] = useState(false);

  // Простые состояния для рассадки
  const [selectedChair, setSelectedChair] = useState(null); // {tableId, chairIndex}
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [personName, setPersonName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groups, setGroups] = useState([
    {
      id: 'family',
      name: t('family'),
      color: '#e74c3c',
      members: ['Анна Петрова', 'Михаил Петров']
    },
    {
      id: 'friends',
      name: t('friends'),
      color: '#3498db',
      members: ['Елена Козлова', 'Дмитрий Волков']
    },
    {
      id: 'colleagues',
      name: t('colleagues'),
      color: '#2ecc71',
      members: []
    },
    {
      id: 'vip',
      name: t('vipGuests'),
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

  // Enhanced touch state for mobile pinch zoom
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
      alert(t('groupEmpty'));
      return;
    }

    const availableSeats = getAvailableSeats(selectedTable.id);

    if (availableSeats.length === 0) {
      alert(t('noFreeSeatsAtTable'));
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
      alert(t('groupEmpty'));
      return;
    }

    const peopleToSeat = selectedPeople || group.members;

    if (peopleToSeat.length === 0) {
      alert(t('groupEmpty'));
      return;
    }

    const availableSeats = getAvailableSeats(tableId);

    if (availableSeats.length < peopleToSeat.length) {
      alert(`${t('notEnoughSeats')} ${t('needSeats')}: ${peopleToSeat.length}, ${t('availableSeats')}: ${availableSeats.length}`);
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

  // Drag & Drop функции
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
      alert(t('groupEmpty'));
      return;
    }

    if (availableSeats.length === 0) {
      alert(t('noFreeSeatsAtTable'));
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

  // Загрузка данных
  useEffect(() => {
    const savedHallData = localStorage.getItem('hallData');
    const savedGroups = localStorage.getItem('seatingGroups');
    const savedLanguage = localStorage.getItem('seatingLanguage');

    if (savedLanguage && (savedLanguage === 'ru' || savedLanguage === 'hy')) {
      setLanguage(savedLanguage);
    }

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

  // Save language to localStorage
  useEffect(() => {
    localStorage.setItem('seatingLanguage', language);
  }, [language]);

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
        setError(t('errorReadingFile'));
        setIsLoading(false);
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  // Функции для работы с рассадкой
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
      alert(t('enterNameError'));
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

  // Функции для работы с участниками групп при создании
  const addMemberToGroup = () => {
    if (!newMemberName.trim()) {
      alert(t('enterMemberName'));
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
      alert(t('enterMemberName'));
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

  // Функции для работы с группами
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
    const isInScrollArea = e.target.closest('.groups-scroll');

    if (e.ctrlKey && !isInScrollArea) {
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

  const handleTouchStart = (e) => {
    const isInScrollArea = e.target.closest('.groups-scroll');

    if (e.touches.length === 2 && !isInScrollArea) {
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
    } else if (e.touches.length === 1 && !isInScrollArea) {
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
    const isInScrollArea = e.target.closest('.groups-scroll');

    if (e.touches.length === 2 && touchDistanceRef.current && !isInScrollArea) {
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
    } else if (e.touches.length === 1 && isDraggingView && !isInScrollArea) {
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

  // RENDER TABLE COMPONENT
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
                  {table.name || `${t('table')} ${table.id}`}<br />
                  {chairCount} {t('seats')}
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
  {/* Desktop Header */}
  {windowWidth > 768 ? (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
        <div style={{
          fontSize: '20px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap'
        }}>
          {hallData?.name || t('guestSeating')}
        </div>

        {/* Import button */}
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
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
            }}
          >
            📁 {t('loadPlan')}
          </label>
          {isLoading && <div style={{
            position: 'absolute',
            top: '70px',
            left: '0',
            color: 'white',
            fontSize: '12px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: '5px 10px',
            borderRadius: '4px'
          }}>{t('loading')}</div>}
          {error && <div style={{
            position: 'absolute',
            top: '70px',
            left: '0',
            color: '#ff6b6b',
            fontSize: '12px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: '5px 10px',
            borderRadius: '4px',
            maxWidth: '200px'
          }}>{error}</div>}
        </div>
      </div>

      {/* Language switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => setLanguage(language === 'ru' ? 'hy' : 'ru')}
          style={{
            backgroundImage: `url(${language === 'ru'
              ? 'https://flagcdn.com/am.svg'
              : 'https://flagcdn.com/ru.svg'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: 'white',
            border: '3px solid white',
            borderRadius: '8px',
            padding: '10px 15px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            minWidth: '110px',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
          }}
        >
          <span style={{
            fontSize: '14px',
            letterSpacing: '0.5px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '4px',
            padding: '2px 6px',
            color: 'white',
            zIndex: 1
          }}>
            {language === 'ru' ? 'Հայ' : 'Рус'}
          </span>
        </button>
      </div>
    </>
  ) : (
    /* Mobile Header */
    <>
      <div style={{
        fontSize: '18px',
        fontWeight: 'bold',
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {hallData?.name || t('guestSeating')}
      </div>

      {/* Mobile burger menu button */}
      <button
        onClick={() => {
          setShowMobileMenu(!showMobileMenu);
          setIsBurgerOpen(!isBurgerOpen);
        }}
        style={{
          background: 'none',
          border: '2px solid white',
          color: 'white',
          borderRadius: '8px',
          padding: '8px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          transition: 'all 0.2s ease',
          position: 'relative'
        }}
        onTouchStart={(e) => {
          e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
          e.target.style.transform = 'scale(0.95)';
        }}
        onTouchEnd={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.transform = 'scale(1)';
        }}
      >
        {/* Animated burger lines */}
        <div style={{
          width: '18px',
          height: '2px',
          backgroundColor: 'white',
          borderRadius: '1px',
          transition: 'all 0.3s ease',
          transform: isBurgerOpen ? 'rotate(45deg) translate(6px, 6px)' : 'none',
          transformOrigin: 'center'
        }}></div>
        <div style={{
          width: '18px',
          height: '2px',
          backgroundColor: 'white',
          borderRadius: '1px',
          transition: 'all 0.3s ease',
          opacity: isBurgerOpen ? '0' : '1',
          transform: isBurgerOpen ? 'scale(0)' : 'scale(1)'
        }}></div>
        <div style={{
          width: '18px',
          height: '2px',
          backgroundColor: 'white',
          borderRadius: '1px',
          transition: 'all 0.3s ease',
          transform: isBurgerOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'none',
          transformOrigin: 'center'
        }}></div>
        
        {/* Notification dots for loaded plan and groups */}
        {(hallData || groups.length > 0) && !isBurgerOpen && (
          <div style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '8px',
            height: '8px',
            backgroundColor: hallData ? '#2ecc71' : '#f39c12',
            borderRadius: '50%',
            border: '1px solid #0a0a1d',
            animation: hallData ? 'none' : 'pulse 2s infinite',
            transition: 'opacity 0.3s ease',
            opacity: isBurgerOpen ? 0 : 1
          }}></div>
        )}
      </button>
    </>
  )}
</header>
{showMobileMenu && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '20px',
    boxSizing: 'border-box'
  }}>
    <div style={{
      backgroundColor: '#0a0a1d',
      borderRadius: '12px',
      padding: '25px',
      width: '100%',
      maxWidth: '400px',
      marginTop: '60px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
      color: 'white',
      animation: 'slideDown 0.3s ease-out'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px',
        borderBottom: '2px solid rgba(255,255,255,0.1)',
        paddingBottom: '15px'
      }}>
        <h2 style={{ margin: 0, color: 'white', fontSize: '20px' }}>
          ⚙️ {t('settings') || 'Настройки'}
        </h2>
        <button
          onClick={() => {
            setShowMobileMenu(false);
            setIsBurgerOpen(false);
          }}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            fontWeight: 'bold',
            cursor: 'pointer',
            color: 'white',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
      </div>

      {/* Language Selection */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ 
          margin: '0 0 15px 0', 
          color: 'white', 
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🌐 {t('language') || 'Язык'}
        </h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setLanguage('ru')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: language === 'ru' ? '#3498db' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: `2px solid ${language === 'ru' ? '#3498db' : 'rgba(255,255,255,0.3)'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ 
              width: '20px',
              height: '15px',
              backgroundImage: 'url(https://flagcdn.com/ru.svg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '2px'
            }}></span>
            <span>Русский</span>
          </button>
          <button
            onClick={() => setLanguage('hy')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: language === 'hy' ? '#3498db' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: `2px solid ${language === 'hy' ? '#3498db' : 'rgba(255,255,255,0.3)'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ 
              width: '20px',
              height: '15px',
              backgroundImage: 'url(https://flagcdn.com/am.svg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '2px'
            }}></span>
            <span>Հայերեն</span>
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ 
          margin: '0 0 15px 0', 
          color: 'white', 
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📁 {t('loadPlan')}
        </h3>
        
        <input
          type="file"
          accept=".json"
          onChange={(e) => {
            handleFileUpload(e);
            setShowMobileMenu(false);
            setIsBurgerOpen(false);
          }}
          id="mobile-import-file"
          style={{ display: 'none' }}
        />
        
        <label
          htmlFor="mobile-import-file"
          style={{
            display: 'block',
            padding: '12px 16px',
            backgroundColor: '#2ecc71',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}
          onTouchStart={(e) => {
            e.target.style.transform = 'scale(0.95)';
          }}
          onTouchEnd={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          📂 {t('loadHallPlanBtn') || 'Загрузить план зала'}
        </label>

        {isLoading && (
          <div style={{
            marginTop: '10px',
            padding: '8px 12px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '6px',
            fontSize: '12px',
            textAlign: 'center',
            color: '#74b9ff'
          }}>
            ⏳ {t('loading')}
          </div>
        )}

        {error && (
          <div style={{
            marginTop: '10px',
            padding: '8px 12px',
            backgroundColor: 'rgba(231, 76, 60, 0.2)',
            border: '1px solid #e74c3c',
            borderRadius: '6px',
            fontSize: '12px',
            textAlign: 'center',
            color: '#ff6b6b'
          }}>
            ❌ {error}
          </div>
        )}
      </div>

      {/* Current Status */}
      {hallData && (
        <div style={{
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          border: '1px solid rgba(46, 204, 113, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ 
            fontSize: '12px', 
            color: '#2ecc71',
            fontWeight: 'bold',
            marginBottom: '5px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            ✅ {t('planLoaded') || 'План загружен'}
          </div>
          <div style={{ fontSize: '11px', color: '#bdc3c7' }}>
            {hallData.name || t('guestSeating')}
          </div>
          {hallData.tables && (
            <div style={{ fontSize: '11px', color: '#bdc3c7', marginTop: '2px' }}>
              📊 {hallData.tables.length} {t('tables') || 'столов'}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => {
          setShowMobileMenu(false);
          setIsBurgerOpen(false);
        }}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          color: 'white',
          border: '2px solid rgba(255,255,255,0.3)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        {t('close')}
      </button>
    </div>
  </div>
)}

      {/* Groups Panel */}
      {window.innerWidth > 768 ? (
        // Desktop version
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
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
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
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
              e.target.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = isGroupsExpanded ? 'rgba(255,255,255,0.1)' : 'transparent';
              e.target.style.transform = 'scale(1)';
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

          {isGroupsExpanded && (
            <div style={{
              flex: 1,
              position: 'relative',
              minWidth: 0,
              maxWidth: '100%'
            }}>
              <div
                className="groups-scroll"
                style={{
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  paddingBottom: '8px',
                  paddingTop: '5px',
                  height: '80px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255,255,255,0.6) rgba(255,255,255,0.2)',
                  whiteSpace: 'nowrap'
                }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  paddingRight: '20px',
                  width: 'max-content'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      fontSize: '10px',
                      color: '#bdc3c7',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      minWidth: '80px'
                    }}>
                      📋 {t('readyToSeat')}:
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center'
                    }}>
                      {groups.filter(group => group.members.length > 0).length > 0 ? (
                        groups.filter(group => group.members.length > 0).map((group) => (
                          <div
                            key={group.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, group)}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => handleGroupClick(e, group)}
                            style={{
                              backgroundColor: group.color,
                              color: 'white',
                              padding: '6px 12px',
                              borderRadius: '15px',
                              border: '1px solid rgba(255,255,255,0.3)',
                              cursor: 'grab',
                              whiteSpace: 'nowrap',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              transition: 'all 0.2s',
                              minWidth: '100px',
                              textAlign: 'center',
                              position: 'relative',
                              flexShrink: 0,
                              userSelect: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'scale(1.05)';
                              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'scale(1)';
                              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                            }}
                          >
                            <span style={{ fontSize: '10px' }}>👥</span>
                            <span>{group.name}</span>
                            <span style={{
                              backgroundColor: 'rgba(255,255,255,0.2)',
                              borderRadius: '8px',
                              padding: '1px 4px',
                              fontSize: '9px'
                            }}>
                              {group.members.length}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div style={{
                          color: '#95a5a6',
                          fontStyle: 'italic',
                          fontSize: '10px',
                          padding: '6px 12px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          borderRadius: '12px',
                          border: '1px dashed rgba(255,255,255,0.2)',
                          flexShrink: 0
                        }}>
                          {t('allGroupsSeated')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      fontSize: '10px',
                      color: '#95a5a6',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      minWidth: '80px'
                    }}>
                      ✅ {t('seated')}:
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center'
                    }}>
                      {groups.filter(group => group.members.length === 0).length > 0 ? (
                        groups.filter(group => group.members.length === 0).map((group) => {
                          const tableWithGroup = hallData?.tables?.find(table =>
                            table.people?.some(person => person?.groupId === group.id)
                          );

                          return (
                            <div
                              key={group.id}
                              onClick={(e) => handleGroupClick(e, group)}
                              style={{
                                backgroundColor: group.color,
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '15px',
                                border: '1px solid rgba(255,255,255,0.3)',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                transition: 'all 0.2s',
                                minWidth: '100px',
                                textAlign: 'center',
                                position: 'relative',
                                flexShrink: 0,
                                userSelect: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                opacity: 0.8
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.05)';
                                e.target.style.opacity = '1';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.opacity = '0.8';
                              }}
                            >
                              <span style={{ fontSize: '10px' }}>🎯</span>
                              <span>{group.name}</span>
                              {tableWithGroup && (
                                <span style={{
                                  backgroundColor: 'rgba(255,255,255,0.2)',
                                  borderRadius: '8px',
                                  padding: '1px 4px',
                                  fontSize: '8px'
                                }}>
                                  {tableWithGroup.name || `${t('table')} ${tableWithGroup.id}`}
                                </span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div style={{
                          color: '#95a5a6',
                          fontStyle: 'italic',
                          fontSize: '10px',
                          padding: '6px 12px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          borderRadius: '12px',
                          border: '1px dashed rgba(255,255,255,0.2)',
                          flexShrink: 0
                        }}>
                          {t('noSeatedGroups')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isGroupsExpanded && groups.length > 0 && (
            <div style={{
              color: '#bdc3c7',
              fontSize: '11px',
              opacity: 0.8,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>📊</span>
              <span>
                {groups.filter(g => g.members.length > 0).length > 0
                  ? `${groups.filter(g => g.members.length > 0).length} ${t('readyForSeating')}`
                  : t('allSeated')
                }
              </span>
              {groups.filter(g => g.members.length > 0).length > 0 && (
                <>
                  <span>•</span>
                  <span>🖱️ {t('dragToTable')}</span>
                </>
              )}
            </div>
          )}

          {isGroupsExpanded && groups.length > 3 && (
            <div style={{
              color: '#bdc3c7',
              fontSize: '10px',
              opacity: 0.6,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>⬅️➡️</span>
            </div>
          )}
        </div>
      ) : (
        // Mobile version
        <div style={{
          backgroundColor: '#34495e',
          padding: '12px 15px',
          borderBottom: '2px solid #2c3e50',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 50
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <button
              onClick={() => setShowAddGroupModal(true)}
              style={{
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span style={{ fontSize: '14px' }}>+</span>
              <span>{t('createGroup')}</span>
            </button>

            <button
              onClick={() => setIsMobileGroupsExpanded(!isMobileGroupsExpanded)}
              style={{
                backgroundColor: isMobileGroupsExpanded ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '18px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.3s ease'
              }}
            >
              <span style={{
                transition: 'transform 0.3s ease',
                transform: isMobileGroupsExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                fontSize: '10px'
              }}>
                ▶
              </span>
              <span>{t('groups')} ({groups.length})</span>
              <div style={{
                display: 'flex',
                gap: '3px',
                fontSize: '9px'
              }}>
                {groups.filter(g => getGroupStatus(g).isReadyToSeat).length > 0 && (
                  <span style={{
                    backgroundColor: '#f39c12',
                    color: 'white',
                    borderRadius: '6px',
                    padding: '1px 3px'
                  }}>
                    {groups.filter(g => getGroupStatus(g).isReadyToSeat).length}
                  </span>
                )}
                {groups.filter(g => getGroupStatus(g).isFullySeated).length > 0 && (
                  <span style={{
                    backgroundColor: '#2ecc71',
                    color: 'white',
                    borderRadius: '6px',
                    padding: '1px 3px'
                  }}>
                    ✓{groups.filter(g => getGroupStatus(g).isFullySeated).length}
                  </span>
                )}
              </div>
            </button>
          </div>

          {isMobileGroupsExpanded && (
            <div style={{
              marginTop: '12px',
              animation: 'slideDown 0.3s ease-out'
            }}>
              {groups.filter(g => getGroupStatus(g).isReadyToSeat).length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    color: '#f39c12',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>📋</span>
                    <span>{t('readyToSeat')} ({groups.filter(g => getGroupStatus(g).isReadyToSeat).length})</span>
                  </div>
                  <div 
                    className="mobile-groups-carousel"
                    style={{
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      display: 'flex',
                      gap: '8px',
                      padding: '5px 0 8px 0',
                      scrollSnapType: 'x mandatory',
                      WebkitOverflowScrolling: 'touch',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                  >
                    {groups.filter(g => getGroupStatus(g).isReadyToSeat).map((group) => {
                      const status = getGroupStatus(group);
                      
                      return (
                        <div
                          key={group.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleGroupClick(e, group);
                          }}
                          onTouchStart={(e) => {
                            e.currentTarget.style.transform = 'scale(0.95)';
                          }}
                          onTouchEnd={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          style={{
                            backgroundColor: group.color,
                            color: 'white',
                            padding: '8px 10px',
                            borderRadius: '12px',
                            minWidth: '100px',
                            maxWidth: '130px',
                            scrollSnapAlign: 'start',
                            flexShrink: 0,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            textAlign: 'center',
                            border: status.isPartiallySeated ? '2px solid #f39c12' : '1px solid rgba(255,255,255,0.3)'
                          }}
                        >
                          <div style={{
                            fontSize: '16px',
                            marginBottom: '4px'
                          }}>
                            {status.isPartiallySeated ? '⚠️' : '👥'}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: 'bold',
                            marginBottom: '4px',
                            lineHeight: 1.1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {group.name}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            opacity: 0.85,
                            marginBottom: '4px',
                            lineHeight: 1.1
                          }}>
                            {status.isPartiallySeated 
                              ? `${status.availableMembers} ${t('of')} ${status.totalMembers}` 
                              : `${status.availableMembers} ${t('people')}`
                            }
                          </div>
                          {status.isPartiallySeated && (
                            <div style={{
                              fontSize: '8px',
                              opacity: 0.7,
                              marginBottom: '4px'
                            }}>
                              {status.seatedMembers} {t('seatedMembers')} {status.seatedAtTable}
                            </div>
                          )}
                          <div style={{
                            backgroundColor: 'rgba(255,255,255,0.25)',
                            borderRadius: '8px',
                            padding: '2px 6px',
                            fontSize: '9px',
                            fontWeight: 'bold'
                          }}>
                            🎯 {t('selectTable')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {groups.filter(g => getGroupStatus(g).isFullySeated).length > 0 && (
                <div>
                  <div style={{
                    color: '#2ecc71',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>✅</span>
                    <span>{t('fullySeated')} ({groups.filter(g => getGroupStatus(g).isFullySeated).length})</span>
                  </div>
                  <div 
                    className="mobile-groups-carousel"
                    style={{
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      display: 'flex',
                      gap: '8px',
                      padding: '5px 0 8px 0',
                      scrollSnapType: 'x mandatory',
                      WebkitOverflowScrolling: 'touch',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                  >
                    {groups.filter(g => getGroupStatus(g).isFullySeated).map((group) => {
                      const status = getGroupStatus(group);
                      const tableWithGroup = hallData?.tables?.find(table => 
                        table.people?.some(person => person?.groupId === group.id)
                      );

                      return (
                        <div
                          key={group.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleGroupClick(e, group);
                          }}
                          onTouchStart={(e) => {
                            e.currentTarget.style.transform = 'scale(0.95)';
                          }}
                          onTouchEnd={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          style={{
                            backgroundColor: group.color,
                            color: 'white',
                            padding: '8px 10px',
                            borderRadius: '12px',
                            minWidth: '100px',
                            maxWidth: '130px',
                            scrollSnapAlign: 'start',
                            flexShrink: 0,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            textAlign: 'center',
                            opacity: 0.85,
                            border: '1px solid rgba(255,255,255,0.3)'
                          }}
                        >
                          <div style={{
                            fontSize: '16px',
                            marginBottom: '4px'
                          }}>
                            🎯
                          </div>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: 'bold',
                            marginBottom: '4px',
                            lineHeight: 1.1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {group.name}
                          </div>
                          <div style={{
                            fontSize: '9px',
                            opacity: 0.9,
                            marginBottom: '4px',
                            lineHeight: 1.1
                          }}>
                            {status.seatedMembers} {t('people')} {t('seatedMembers')}
                          </div>
                          <div style={{
                            backgroundColor: 'rgba(255,255,255,0.25)',
                            borderRadius: '8px',
                            padding: '2px 6px',
                            fontSize: '9px',
                            fontWeight: 'bold'
                          }}>
                            👁️ {t('details')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {groups.length === 0 && (
                <div style={{
                  color: '#95a5a6',
                  fontStyle: 'italic',
                  fontSize: '13px',
                  padding: '15px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  border: '1px dashed rgba(255,255,255,0.2)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📝</div>
                  <div>{t('createFirstGroup')}</div>
                </div>
              )}

              {groups.filter(g => g.members.length > 0).length > 0 && (
                <div style={{
                  backgroundColor: 'rgba(52, 152, 219, 0.1)',
                  border: '1px solid rgba(52, 152, 219, 0.3)',
                  borderRadius: '10px',
                  padding: '6px 10px',
                  fontSize: '10px',
                  color: '#74b9ff',
                  textAlign: 'center',
                  marginTop: '8px'
                }}>
                  💡 {t('tapOnGroupToSelectTable')}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main content area */}
      <div className="main-content" style={{
        flex: 1,
        width: '100%',
        height: window.innerWidth > 768 
          ? 'calc(100vh - 190px)'
          : isMobileGroupsExpanded 
            ? 'calc(100vh - 200px)'
            : 'calc(100vh - 110px)',
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
                        <h2 style={{ marginTop: 0 }}>{t('system')}</h2>
                        <p>{t('loadHallPlan')}</p>
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
                          {t('loadHallPlanBtn')}
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

      {/* CSS для скроллбара групп */}
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

        .mobile-groups-carousel {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }

        @keyframes slideDown {
          0% { 
            opacity: 0;
            transform: translateY(-10px);
            max-height: 0;
          }
          100% { 
            opacity: 1;
            transform: translateY(0);
            max-height: 200px;
          }
        }
        .mobile-groups-carousel::-webkit-scrollbar {
          display: none !important;
        }

        @media (max-width: 768px) {
          .mobile-groups-carousel {
            scroll-behavior: smooth !important;
            -webkit-overflow-scrolling: touch !important;
            overscroll-behavior-x: contain !important;
          }
          
          .mobile-groups-carousel > div {
            -webkit-transform: translateZ(0) !important;
            transform: translateZ(0) !important;
          }
        }

        @keyframes pulse {
          0% { 
            opacity: 0.6;
            transform: scale(1);
          }
          50% { 
            opacity: 1;
            transform: scale(1.2);
          }
          100% { 
            opacity: 0.6;
            transform: scale(1);
          }
        }

        @media (hover: none) and (pointer: coarse) {
          .mobile-groups-carousel > div {
            transition: transform 0.1s ease-out !important;
          }
          
          .mobile-groups-carousel > div:active {
            transform: scale(0.95) !important;
          }
        }

        @media (max-width: 768px) {
          .mobile-groups-carousel {
            position: relative;
          }
          
          .mobile-groups-carousel::before {
            content: '';
            position: absolute;
            right: 0;
            top: 0;
            width: 30px;
            height: 100%;
            background: linear-gradient(to left, rgba(52, 73, 94, 0.8), transparent);
            pointer-events: none;
            z-index: 1;
            border-radius: 0 20px 20px 0;
          }
          
          .mobile-groups-carousel::after {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            width: 30px;
            height: 100%;
            background: linear-gradient(to right, rgba(52, 73, 94, 0.8), transparent);
            pointer-events: none;
            z-index: 1;
            border-radius: 20px 0 0 20px;
          }
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

      {/* Member Selection Modal */}
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
              {t('selectMembers')} {pendingSeating.availableSeats} {t('members')} {t('for')} {t('seating')}
            </h3>

            <div style={{
              backgroundColor: '#fff3cd',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #ffeaa7'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                ⚠️ {t('notEnoughSeatsWarning')}
              </div>
              <div style={{ fontSize: '14px' }}>
                {t('onlyFreeSeats')} {pendingSeating.availableSeats} {t('seats')},
                {t('inGroup')} {groups.find(g => g.id === pendingSeating.groupId)?.members.length} {t('person')}.
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
              {t('selectedOf')}: {selectedMembers.length} {t('of')} {pendingSeating.availableSeats} {t('necessary')}
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
                {t('seatSelectedMembers')}
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

            {groups.some(group => group.members.length > 0) && (
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{
                  margin: '0 0 15px 0',
                  fontSize: '18px',
                  color: '#333',
                  borderBottom: '2px solid #eee',
                  paddingBottom: '10px'
                }}>
                  🎯 {t('selectFromGroups')}
                </h3>
                
                <div style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#f8f9fa',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {groups.filter(group => group.members.length > 0).map((group) => (
                    <div key={group.id} style={{
                      borderBottom: '1px solid #eee',
                      padding: '15px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '10px'
                      }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          backgroundColor: group.color,
                          borderRadius: '50%'
                        }}></div>
                        <span style={{
                          fontWeight: 'bold',
                          fontSize: '14px',
                          color: '#333'
                        }}>
                          {group.name} ({group.members.length})
                        </span>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        {group.members.map((member, index) => (
                          <button
                            key={index}
                            onClick={() => selectPersonFromGroup(member, group.id)}
                            style={{
                              backgroundColor: selectedPersonFromGroup?.name === member ? group.color : 'white',
                              color: selectedPersonFromGroup?.name === member ? 'white' : '#333',
                              border: `2px solid ${group.color}`,
                              borderRadius: '20px',
                              padding: '6px 12px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              transition: 'all 0.2s',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                              if (selectedPersonFromGroup?.name !== member) {
                                e.target.style.backgroundColor = group.color;
                                e.target.style.color = 'white';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedPersonFromGroup?.name !== member) {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.color = '#333';
                              }
                            }}
                          >
                            {member}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedPersonFromGroup && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#e8f5e8',
                    border: '1px solid #4caf50',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#2e7d32'
                  }}>
                    ✅ {t('selected')}: <strong>{selectedPersonFromGroup.name}</strong> {t('from')} {t('group')} "
                    {groups.find(g => g.id === selectedPersonFromGroup.groupId)?.name}"
                  </div>
                )}
              </div>
            )}

            {groups.some(group => group.members.length > 0) && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '20px 0',
                fontSize: '14px',
                color: '#666'
              }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
                <span style={{ padding: '0 15px', backgroundColor: 'white' }}>{t('or')}</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#ddd' }}></div>
              </div>
            )}

            <div>
              <h3 style={{
                margin: '0 0 15px 0',
                fontSize: '18px',
                color: '#333',
                borderBottom: '2px solid #eee',
                paddingBottom: '10px'
              }}>
                ➕ {t('addNew')}
              </h3>

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
                  <option value="">{t('noGroup')}</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
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
                {selectedPersonFromGroup ? `${t('seatPerson')} ${selectedPersonFromGroup.name}` : t('save')}
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
                placeholder={t('groupNamePlaceholder')}
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
                  placeholder={t('orEnterNamePlaceholder')}
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
                    {t('members')} ({groupMembers.length}):
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
                  {t('noMembersAdded')}
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
                {t('createGroupBtn')}
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

      {/* Edit Group Modal */}
      {showEditGroupModal && editingGroup && (
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
              {t('editGroup')} "{editingGroup.name}"
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                {t('groupName')}:
              </label>
              <input
                type="text"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                placeholder={t('groupName')}
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
                  onClick={() => openPeopleSelector(true)}
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
                  placeholder={t('orEnterNamePlaceholder')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: '2px solid #ddd',
                    fontSize: '14px'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addMemberToEditGroup();
                    }
                  }}
                />
                <button
                  onClick={addMemberToEditGroup}
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

              {editGroupMembers.length > 0 && (
                <div style={{
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  backgroundColor: '#f8f9fa',
                  padding: '10px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#666' }}>
                    {t('members')} ({editGroupMembers.length}):
                  </div>
                  {editGroupMembers.map((member, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '5px 0',
                      borderBottom: index < editGroupMembers.length - 1 ? '1px solid #eee' : 'none'
                    }}>
                      <span style={{ fontSize: '14px' }}>• {member}</span>
                      <button
                        onClick={() => removeMemberFromEditGroup(index)}
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

              {editGroupMembers.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  color: '#666',
                  fontStyle: 'italic',
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #ddd'
                }}>
                  {t('noMembersAdded')}
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              gap: '10px'
            }}>
              <button
                onClick={updateGroup}
                disabled={!editGroupName.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: editGroupName.trim() ? '#2ecc71' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: editGroupName.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                {t('saveChanges')}
              </button>

              <button
                onClick={resetEditGroupModal}
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

      {/* People Selector Modal */}
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
                {t('available')}: {getFilteredPeople().length} {t('outOf')} {TEST_PEOPLE.length} {t('people')}
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
                  placeholder={t('orEnterOwnName')}
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
                      {t('enterYourName')}
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

      {/* Seating Modal */}
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
              <h4 style={{ margin: '0 0 10px 0' }}>{t('availableTables')}:</h4>

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
                        {availableSeats.length} {t('freeSeats')}
                      </div>
                    </div>

                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                      {t('totalSeatsColon')} {table.chairCount || 12} | {t('needColon')} {selectedGroupForSeating.members.length}
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
                      {canSeatGroup ? t('seatGroupHere') : t('notEnoughSeatsShort')}
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

      {/* Table Details Modal */}
      {showTableDetailsModal && selectedTable && (
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
          zIndex: 1400,
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '2px solid #eee',
              paddingBottom: '15px'
            }}>
              <h2 style={{ margin: 0, color: '#333' }}>
                {selectedTable.name || `${t('table')} ${selectedTable.id}`}
              </h2>
              <button
                onClick={closeTableDetailsModal}
                style={{
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
            </div>

            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>{t('totalSeats')}:</span>
                <span>{selectedTable.chairCount || 12}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>{t('occupiedSeats')}:</span>
                <span>{(selectedTable.chairCount || 12) - getAvailableSeats(selectedTable.id).length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold', color: '#2ecc71' }}>{t('freeSeats')}:</span>
                <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>{getAvailableSeats(selectedTable.id).length}</span>
              </div>
            </div>

            {selectedTable.people && selectedTable.people.some(person => person) && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>{t('seatedGuests')}:</h4>
                <div style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#f8f9fa',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {selectedTable.people.map((person, index) => {
                    if (!person) return null;
                    const group = groups.find(g => g.id === person.groupId);
                    return (
                      <div key={index} style={{
                        padding: '10px 15px',
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{t('seatAtTable')} {index + 1}: {person.name}</div>
                          {group && (
                            <div style={{
                              fontSize: '12px',
                              color: 'white',
                              backgroundColor: group.color,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              display: 'inline-block',
                              marginTop: '3px'
                            }}>
                              {group.name}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChairClick(selectedTable.id, index);
                            closeTableDetailsModal();
                          }}
                          style={{
                            backgroundColor: '#3498db',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '5px 10px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ✏️ {t('edit')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {getAvailableSeats(selectedTable.id).length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>{t('seatGroup')}:</h4>

                {groups.filter(group => group.members.length > 0).length > 0 ? (
                  <div style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa'
                  }}>
                    {groups.filter(group => group.members.length > 0).map(group => {
                      const availableSeats = getAvailableSeats(selectedTable.id);
                      const canSeatAll = availableSeats.length >= group.members.length;

                      return (
                        <div key={group.id} style={{
                          padding: '15px',
                          borderBottom: '1px solid #eee',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              marginBottom: '5px'
                            }}>
                              <div style={{
                                width: '12px',
                                height: '12px',
                                backgroundColor: group.color,
                                borderRadius: '50%'
                              }}></div>
                              <span style={{ fontWeight: 'bold' }}>{group.name}</span>
                              <span style={{
                                fontSize: '12px',
                                color: canSeatAll ? '#2ecc71' : '#e74c3c',
                                fontWeight: 'bold'
                              }}>
                                ({group.members.length} {t('people')})
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {group.members.slice(0, 3).join(', ')}
                              {group.members.length > 3 && ` ${t('and')} ${group.members.length - 3} ${t('more')}...`}
                            </div>
                            {!canSeatAll && (
                              <div style={{
                                fontSize: '11px',
                                color: '#e74c3c',
                                marginTop: '3px'
                              }}>
                                ⚠️ {t('needSeats')} {group.members.length} {t('seats')}, {t('availableSeats')} {availableSeats.length}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => seatGroupAtTableFromModal(group.id)}
                            style={{
                              backgroundColor: '#2ecc71',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '8px 15px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: 'bold'
                            }}
                          >
                            {canSeatAll ? t('seatGroup') : t('selectParticipants')}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    color: '#666',
                    fontStyle: 'italic',
                    padding: '20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px dashed #ddd'
                  }}>
                    {t('noGroupsToSeat')}
                  </div>
                )}
              </div>
            )}

            {getAvailableSeats(selectedTable.id).length === 0 && (
              <div style={{
                backgroundColor: '#fff3cd',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #ffeaa7',
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  🏁 {t('tableFullyOccupied')}
                </div>
                <div style={{ fontSize: '14px', color: '#856404' }}>
                  {t('noFreeSeatsAtTable')}
                </div>
              </div>
            )}

            <button
              onClick={closeTableDetailsModal}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#f1f1f1',
                color: '#333',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {/* Group Details Modal */}
      {showGroupDetailsModal && selectedGroupForDetails && (
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
          zIndex: 1500,
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '2px solid #eee',
              paddingBottom: '15px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: selectedGroupForDetails.color,
                  borderRadius: '50%'
                }}></div>
                <h2 style={{ margin: 0, color: '#333' }}>
                  {selectedGroupForDetails.name}
                </h2>
              </div>
              <button
                onClick={closeGroupDetailsModal}
                style={{
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
            </div>

            <div style={{
              backgroundColor: selectedGroupForDetails.members.length > 0 ? '#fff3cd' : '#d4edda',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: `1px solid ${selectedGroupForDetails.members.length > 0 ? '#ffeaa7' : '#c3e6cb'}`
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                {selectedGroupForDetails.members.length > 0
                  ? `📋 ${t('groupReadyToSeat')}`
                  : `✅ ${t('groupSeated')}`
                }
              </div>
              <div style={{ fontSize: '14px' }}>
                {selectedGroupForDetails.members.length > 0
                  ? `${selectedGroupForDetails.members.length} ${t('waitingForSeating')}`
                  : t('allMembersSeated')
                }
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <h4 style={{ margin: 0, color: '#333' }}>
                  {selectedGroupForDetails.members.length > 0
                    ? `${t('groupMembers')} (${selectedGroupForDetails.members.length}):`
                    : `${t('seatedMembers')}:`
                  }
                </h4>
                <button
                  onClick={() => {
                    setEditingGroup(selectedGroupForDetails);
                    setEditGroupName(selectedGroupForDetails.name);
                    setEditGroupMembers([...selectedGroupForDetails.members]);
                    setIsEditMode(true);
                    setShowEditGroupModal(true);
                    closeGroupDetailsModal();
                  }}
                  style={{
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  ✏️ {t('editGroupAction')}
                </button>
              </div>

              {selectedGroupForDetails.members.length > 0 ? (
                <div style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: '#f8f9fa',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {selectedGroupForDetails.members.map((member, index) => (
                    <div key={index} style={{
                      padding: '12px 15px',
                      borderBottom: index < selectedGroupForDetails.members.length - 1 ? '1px solid #eee' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: selectedGroupForDetails.color,
                        borderRadius: '50%'
                      }}></div>
                      <span style={{ fontSize: '14px', flex: 1 }}>
                        {member}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: '#666',
                        backgroundColor: '#e9ecef',
                        padding: '2px 8px',
                        borderRadius: '10px'
                      }}>
                        {t('seatNumber')}{index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                (() => {
                  const seatedMembers = [];
                  hallData?.tables?.forEach(table => {
                    table.people?.forEach((person, seatIndex) => {
                      if (person && person.groupId === selectedGroupForDetails.id) {
                        seatedMembers.push({
                          name: person.name,
                          tableName: table.name || `${t('table')} ${table.id}`,
                          seatNumber: seatIndex + 1
                        });
                      }
                    });
                  });

                  return seatedMembers.length > 0 ? (
                    <div style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      backgroundColor: '#f8f9fa',
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }}>
                      {seatedMembers.map((member, index) => (
                        <div key={index} style={{
                          padding: '12px 15px',
                          borderBottom: index < seatedMembers.length - 1 ? '1px solid #eee' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: selectedGroupForDetails.color,
                            borderRadius: '50%'
                          }}></div>
                          <span style={{ fontSize: '14px', flex: 1 }}>
                            {member.name}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            color: '#666',
                            backgroundColor: '#e3f2fd',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>🎯</span>
                            <span>{member.tableName}</span>
                            <span style={{
                              backgroundColor: 'rgba(0,0,0,0.1)',
                              borderRadius: '6px',
                              padding: '1px 4px',
                              fontSize: '9px'
                            }}>
                              {t('seatNumber')}{member.seatNumber}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      color: '#666',
                      fontStyle: 'italic',
                      padding: '30px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px dashed #ddd'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '10px' }}>❓</div>
                      <div>{t('membersNotFound')}</div>
                      <div style={{ fontSize: '12px', marginTop: '5px', color: '#999' }}>
                        {t('dataMaybeChanged')}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            <div style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              {selectedGroupForDetails.members.length > 0 ? (
                <button
                  onClick={() => {
                    openSeatingModal(selectedGroupForDetails);
                    closeGroupDetailsModal();
                  }}
                  style={{
                    flex: 1,
                    minWidth: '150px',
                    padding: '12px',
                    backgroundColor: '#2ecc71',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  🎯 {t('selectTableAction')}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (window.confirm(`${t('releaseGroupConfirm')} "${selectedGroupForDetails.name}" ${t('returnMembersForReSeating')}`)) {
                      releaseGroup(selectedGroupForDetails.id);
                      closeGroupDetailsModal();
                    }
                  }}
                  style={{
                    flex: 1,
                    minWidth: '150px',
                    padding: '12px',
                    backgroundColor: '#f39c12',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  🔄 {t('releaseGroupAction')}
                </button>
              )}

              <button
                onClick={() => {
                  if (window.confirm(`${t('deleteGroupConfirm')} "${selectedGroupForDetails.name}"?`)) {
                    removeGroup(selectedGroupForDetails.id);
                    closeGroupDetailsModal();
                  }
                }}
                style={{
                  flex: 1,
                  minWidth: '150px',
                  padding: '12px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                🗑️ {t('deleteGroupAction')}
              </button>

              <button
                onClick={closeGroupDetailsModal}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#f1f1f1',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleSeatingApp;