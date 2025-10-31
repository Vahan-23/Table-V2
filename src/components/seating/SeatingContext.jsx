import React, { createContext, useContext, useReducer, useEffect } from 'react';
import persistentStorage from './persistentStorage';

// Типы действий
const ACTIONS = {
  SET_HALL_DATA: 'SET_HALL_DATA',
  SET_GROUPS: 'SET_GROUPS',
  SET_LANGUAGE: 'SET_LANGUAGE',
  SET_ZOOM: 'SET_ZOOM',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_SELECTED_CHAIR: 'SET_SELECTED_CHAIR',
  SET_SHOW_PERSON_MODAL: 'SET_SHOW_PERSON_MODAL',
  SET_SHOW_ADD_GROUP_MODAL: 'SET_SHOW_ADD_GROUP_MODAL',
  SET_SHOW_EDIT_GROUP_MODAL: 'SET_SHOW_EDIT_GROUP_MODAL',
  SET_SHOW_TABLE_DETAILS_MODAL: 'SET_SHOW_TABLE_DETAILS_MODAL',
  SET_SHOW_GROUP_DETAILS_MODAL: 'SET_SHOW_GROUP_DETAILS_MODAL',
  SET_SHOW_MEMBER_SELECTION_MODAL: 'SET_SHOW_MEMBER_SELECTION_MODAL',
  SET_SHOW_SEATING_MODAL: 'SET_SHOW_SEATING_MODAL',
  SET_SHOW_PEOPLE_SELECTOR: 'SET_SHOW_PEOPLE_SELECTOR',
  SET_DRAGGED_GROUP: 'SET_DRAGGED_GROUP',
  SET_DRAG_OVER_TABLE: 'SET_DRAG_OVER_TABLE',
  SET_PENDING_SEATING: 'SET_PENDING_SEATING',
  SET_SELECTED_MEMBERS: 'SET_SELECTED_MEMBERS',
  SET_SELECTED_TABLE: 'SET_SELECTED_TABLE',
  SET_SELECTED_GROUP_FOR_DETAILS: 'SET_SELECTED_GROUP_FOR_DETAILS',
  SET_SELECTED_GROUP_FOR_SEATING: 'SET_SELECTED_GROUP_FOR_SEATING',
  SET_EDITING_GROUP: 'SET_EDITING_GROUP',
  SET_PERSON_NAME: 'SET_PERSON_NAME',
  SET_PERSON_FULL_NAME: 'SET_PERSON_FULL_NAME',
  SET_PERSON_GENDER: 'SET_PERSON_GENDER',
  SET_SELECTED_GROUP: 'SET_SELECTED_GROUP',
  SET_NEW_GROUP_NAME: 'SET_NEW_GROUP_NAME',
  SET_GROUP_MEMBERS: 'SET_GROUP_MEMBERS',
  SET_NEW_MEMBER_NAME: 'SET_NEW_MEMBER_NAME',
  SET_EDIT_GROUP_NAME: 'SET_EDIT_GROUP_NAME',
  SET_EDIT_GROUP_MEMBERS: 'SET_EDIT_GROUP_MEMBERS',
  SET_SEARCH_TERM: 'SET_SEARCH_TERM',
  SET_USED_PEOPLE: 'SET_USED_PEOPLE',
  SET_IS_EDIT_MODE: 'SET_IS_EDIT_MODE',
  SET_SHOW_MOBILE_MENU: 'SET_SHOW_MOBILE_MENU',
  SET_IS_BURGER_OPEN: 'SET_IS_BURGER_OPEN',
  SET_IS_GROUPS_EXPANDED: 'SET_IS_GROUPS_EXPANDED',
  SET_IS_MOBILE_GROUPS_EXPANDED: 'SET_IS_MOBILE_GROUPS_EXPANDED',
  SET_SELECTED_PERSON_FROM_GROUP: 'SET_SELECTED_PERSON_FROM_GROUP',
  SET_WINDOW_WIDTH: 'SET_WINDOW_WIDTH',
  SET_PERSON_SEARCH_TERM: 'SET_PERSON_SEARCH_TERM',
  SET_SHOW_PERSON_SEARCH: 'SET_SHOW_PERSON_SEARCH',
  SET_IS_DRAGGING_VIEW: 'SET_IS_DRAGGING_VIEW',
  SET_DRAG_START_POSITION: 'SET_DRAG_START_POSITION',
  SET_INITIAL_SCROLL_POSITION: 'SET_INITIAL_SCROLL_POSITION',
  SET_SHAPES: 'SET_SHAPES',
  UPDATE_TABLE_PEOPLE: 'UPDATE_TABLE_PEOPLE',
  UPDATE_GROUP_MEMBERS: 'UPDATE_GROUP_MEMBERS',
  ADD_GROUP: 'ADD_GROUP',
  REMOVE_GROUP: 'REMOVE_GROUP',
  UPDATE_GROUP: 'UPDATE_GROUP',
  RELEASE_GROUP: 'RELEASE_GROUP',
  SEAT_GROUP_AT_TABLE: 'SEAT_GROUP_AT_TABLE',
  RESET_MODALS: 'RESET_MODALS',
  SET_SHOW_ADD_GROUP_MODAL: 'SET_SHOW_ADD_GROUP_MODAL',
  SET_SHOW_EDIT_GROUP_MODAL: 'SET_SHOW_EDIT_GROUP_MODAL',
  SET_SHOW_GROUP_DETAILS_MODAL: 'SET_SHOW_GROUP_DETAILS_MODAL',
  SET_SHOW_SEATING_MODAL: 'SET_SHOW_SEATING_MODAL',
  SET_SELECTED_GROUP_FOR_DETAILS: 'SET_SELECTED_GROUP_FOR_DETAILS',
  SET_SELECTED_GROUP_FOR_SEATING: 'SET_SELECTED_GROUP_FOR_SEATING',
  SET_EDITING_GROUP: 'SET_EDITING_GROUP',
  SET_EDIT_GROUP_NAME: 'SET_EDIT_GROUP_NAME',
  SET_EDIT_GROUP_MEMBERS: 'SET_EDIT_GROUP_MEMBERS',
  SET_NEW_GROUP_NAME: 'SET_NEW_GROUP_NAME',
  SET_GROUP_MEMBERS: 'SET_GROUP_MEMBERS',
  SET_NEW_MEMBER_NAME: 'SET_NEW_MEMBER_NAME',
  SET_SEARCH_TERM: 'SET_SEARCH_TERM',
  SET_USED_PEOPLE: 'SET_USED_PEOPLE',
  SET_IS_MOBILE_GROUPS_EXPANDED: 'SET_IS_MOBILE_GROUPS_EXPANDED',
  TOGGLE_TABLE_ENABLED: 'TOGGLE_TABLE_ENABLED',
  SET_TABLE_ENABLED: 'SET_TABLE_ENABLED',
  SET_SHOW_TABLE_CONTROLS: 'SET_SHOW_TABLE_CONTROLS',
  SET_TARGET_TABLE_FOR_SEATING: 'SET_TARGET_TABLE_FOR_SEATING',
  SET_AVAILABLE_SEATS_FOR_SEATING: 'SET_AVAILABLE_SEATS_FOR_SEATING',
  SET_SHOW_STATISTICS: 'SET_SHOW_STATISTICS',
  SET_SHOW_GROUPS_PANEL: 'SET_SHOW_GROUPS_PANEL',
  SET_SHOW_MOBILE_SEATING_CANVAS: 'SET_SHOW_MOBILE_SEATING_CANVAS',
  SET_TABLE_SELECTION_MODE: 'SET_TABLE_SELECTION_MODE',
  SET_SHOW_IMPORT_JSON_MODAL: 'SET_SHOW_IMPORT_JSON_MODAL',
  SET_NOTIFICATION: 'SET_NOTIFICATION',
  CLEAR_NOTIFICATION: 'CLEAR_NOTIFICATION',
  CREATE_TEST_GROUPS: 'CREATE_TEST_GROUPS',
  CLEAR_ALL_GROUPS: 'CLEAR_ALL_GROUPS'
};

// Начальное состояние
const initialState = {
  // Основные данные
  hallData: null,
  groups: [],
  language: 'ru',
  zoom: 0.2,
  isLoading: false,
  error: null,
  
  // UI состояния
  selectedChair: null,
  showPersonModal: false,
  showAddGroupModal: false,
  showEditGroupModal: false,
  showTableDetailsModal: false,
  showGroupDetailsModal: false,
  showMemberSelectionModal: false,
  showSeatingModal: false,
  showPeopleSelector: false,
  
  // Drag & Drop
  draggedGroup: null,
  dragOverTable: null,
  pendingSeating: null,
  selectedMembers: [],
  
  // Выбранные элементы
  selectedTable: null,
  selectedGroupForDetails: null,
  selectedGroupForSeating: null,
  editingGroup: null,
  
  // Формы
  personName: '',
  personFullName: '',
  personGender: '',
  selectedGroup: '',
  newGroupName: '',
  groupMembers: [],
  newMemberName: '',
  editGroupName: '',
  editGroupMembers: [],
  searchTerm: '',
  usedPeople: [],
  isEditMode: false,
  
  // Мобильные состояния
  showMobileMenu: false,
  isBurgerOpen: false,
  isGroupsExpanded: false,
  isMobileGroupsExpanded: false,
  selectedPersonFromGroup: null,
  windowWidth: window.innerWidth,
  personSearchTerm: '',
  showPersonSearch: true,
  
  // Навигация
  isDraggingView: false,
  dragStartPosition: { x: 0, y: 0 },
  initialScrollPosition: { x: 0, y: 0 },
  
  // Дополнительные данные
  shapes: [],
  
  // Управление столами
  showTableControls: false,
  
  // Данные для рассадки при недостатке мест
  targetTableForSeating: null,
  availableSeatsForSeating: 0,
  
  // Показ статистики
  showStatistics: false,
  
  // Показ панели групп
  showGroupsPanel: false,
  
  // Мобильная рассадка
  showMobileSeatingCanvas: false,
  
  // Режим выбора стола для рассадки группы
  isTableSelectionMode: false,
  
  // Модальное окно импорта JSON
  showImportJsonModal: false,
  
  // Уведомления
  notification: null
};

// --- Default groups/people logic start ---
const GROUP_COLORS = [
  '#e74c3c', '#c0392b', '#3498db', '#2980b9', '#2ecc71', '#27ae60',
  '#f39c12', '#d35400', '#9b59b6', '#8e44ad', '#1abc9c', '#16a085',
  '#e67e22', '#f1c40f', '#f39c12', '#34495e', '#2c3e50', '#ecf0f1',
  '#bdc3c7', '#95a5a6'
];

function generateDefaultGroupsAndPeople() {
  const totalPeople = 200;
  const totalGroups = 50;
  // Generate people names
  const people = Array.from({ length: totalPeople }, (_, i) => `Person ${i + 1}`);
  // Distribute people randomly into groups (each group 1-10 people, all unique)
  let remaining = totalPeople;
  let indices = [...Array(totalPeople).keys()];
  let groups = [];
  for (let g = 0; g < totalGroups; g++) {
    // If last group, take all remaining
    let maxForGroup = Math.min(10, remaining - (totalGroups - g - 1));
    let minForGroup = 1;
    let count = g === totalGroups - 1 ? remaining : Math.floor(Math.random() * (maxForGroup - minForGroup + 1)) + minForGroup;
    if (remaining - count < (totalGroups - g - 1)) count = remaining - (totalGroups - g - 1); // Ensure at least 1 per group
    // Pick random indices
    let groupIndices = [];
    for (let j = 0; j < count; j++) {
      let idx = Math.floor(Math.random() * indices.length);
      groupIndices.push(indices[idx]);
      indices.splice(idx, 1);
    }
    groups.push({
      id: `group_${Date.now()}_${g + 1}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Group ${g + 1}`,
      color: GROUP_COLORS[g % GROUP_COLORS.length],
      members: groupIndices.map(i => people[i])
    });
    remaining -= count;
  }
  return { groups, people };
}

// Only use if no groups in localStorage
let DEFAULT_GROUPS = [];
let TEST_PEOPLE = [];
if (!localStorage.getItem('seatingGroups')) {
  const generated = generateDefaultGroupsAndPeople();
  TEST_PEOPLE = generated.people;
  // Не создаем группы по умолчанию
  initialState.groups = [];
}
// --- Default groups/people logic end ---

// Редьюсер
function seatingReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_HALL_DATA:
      return { ...state, hallData: action.payload };
      
    case ACTIONS.SET_GROUPS:
      return { ...state, groups: action.payload };
      
    case ACTIONS.SET_LANGUAGE:
      return { ...state, language: action.payload };
      
    case ACTIONS.SET_ZOOM:
      return { ...state, zoom: action.payload };
      
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
      
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
      
    case ACTIONS.SET_SELECTED_CHAIR:
      return { ...state, selectedChair: action.payload };
      
    case ACTIONS.SET_SHOW_PERSON_MODAL:
      return { ...state, showPersonModal: action.payload };
      
    case ACTIONS.SET_SHOW_ADD_GROUP_MODAL:
      return { ...state, showAddGroupModal: action.payload };
      
    case ACTIONS.SET_SHOW_EDIT_GROUP_MODAL:
      return { ...state, showEditGroupModal: action.payload };
      
    case ACTIONS.SET_SHOW_TABLE_DETAILS_MODAL:
      return { ...state, showTableDetailsModal: action.payload };
      
    case ACTIONS.SET_SHOW_GROUP_DETAILS_MODAL:
      return { ...state, showGroupDetailsModal: action.payload };
      
    case ACTIONS.SET_SHOW_MEMBER_SELECTION_MODAL:
      return { ...state, showMemberSelectionModal: action.payload };
      
    case ACTIONS.SET_SHOW_SEATING_MODAL:
      return { ...state, showSeatingModal: action.payload };
      
    case ACTIONS.SET_SHOW_PEOPLE_SELECTOR:
      return { ...state, showPeopleSelector: action.payload };
      
    case ACTIONS.SET_DRAGGED_GROUP:
      return { ...state, draggedGroup: action.payload };
      
    case ACTIONS.SET_DRAG_OVER_TABLE:
      return { ...state, dragOverTable: action.payload };
      
    case ACTIONS.SET_PENDING_SEATING:
      return { ...state, pendingSeating: action.payload };
      
    case ACTIONS.SET_SELECTED_MEMBERS:
      return { ...state, selectedMembers: action.payload };
      
    case ACTIONS.SET_SELECTED_TABLE:
      return { ...state, selectedTable: action.payload };
      
    case ACTIONS.SET_SELECTED_GROUP_FOR_DETAILS:
      return { ...state, selectedGroupForDetails: action.payload };
      
    case ACTIONS.SET_SELECTED_GROUP_FOR_SEATING:
      return { ...state, selectedGroupForSeating: action.payload };
      
    case ACTIONS.SET_EDITING_GROUP:
      return { ...state, editingGroup: action.payload };
      
    case ACTIONS.SET_PERSON_NAME:
      return { ...state, personName: action.payload };
      
    case ACTIONS.SET_PERSON_FULL_NAME:
      return { ...state, personFullName: action.payload };
      
    case ACTIONS.SET_PERSON_GENDER:
      return { ...state, personGender: action.payload };
      
    case ACTIONS.SET_SELECTED_GROUP:
      return { ...state, selectedGroup: action.payload };
      
    case ACTIONS.SET_NEW_GROUP_NAME:
      return { ...state, newGroupName: action.payload };
      
    case ACTIONS.SET_GROUP_MEMBERS:
      return { ...state, groupMembers: action.payload };
      
    case ACTIONS.SET_NEW_MEMBER_NAME:
      return { ...state, newMemberName: action.payload };
      
    case ACTIONS.SET_EDIT_GROUP_NAME:
      return { ...state, editGroupName: action.payload };
      
    case ACTIONS.SET_EDIT_GROUP_MEMBERS:
      return { ...state, editGroupMembers: action.payload };
      
    case ACTIONS.SET_SEARCH_TERM:
      return { ...state, searchTerm: action.payload };
      
    case ACTIONS.SET_USED_PEOPLE:
      return { ...state, usedPeople: action.payload };
      
    case ACTIONS.SET_IS_EDIT_MODE:
      return { ...state, isEditMode: action.payload };
      
    case ACTIONS.SET_SHOW_MOBILE_MENU:
      return { ...state, showMobileMenu: action.payload };
      
    case ACTIONS.SET_IS_BURGER_OPEN:
      return { ...state, isBurgerOpen: action.payload };
      
    case ACTIONS.SET_IS_GROUPS_EXPANDED:
      return { ...state, isGroupsExpanded: action.payload };
      
    case ACTIONS.SET_IS_MOBILE_GROUPS_EXPANDED:
      return { ...state, isMobileGroupsExpanded: action.payload };
      
    case ACTIONS.SET_SELECTED_PERSON_FROM_GROUP:
      return { ...state, selectedPersonFromGroup: action.payload };
      
    case ACTIONS.SET_WINDOW_WIDTH:
      return { ...state, windowWidth: action.payload };
      
    case ACTIONS.SET_PERSON_SEARCH_TERM:
      return { ...state, personSearchTerm: action.payload };
      
    case ACTIONS.SET_SHOW_PERSON_SEARCH:
      return { ...state, showPersonSearch: action.payload };
      
    case ACTIONS.SET_IS_DRAGGING_VIEW:
      return { ...state, isDraggingView: action.payload };
      
    case ACTIONS.SET_DRAG_START_POSITION:
      return { ...state, dragStartPosition: action.payload };
      
    case ACTIONS.SET_INITIAL_SCROLL_POSITION:
      return { ...state, initialScrollPosition: action.payload };
      
    case ACTIONS.SET_SHAPES:
      return { ...state, shapes: action.payload };
      
    case ACTIONS.UPDATE_TABLE_PEOPLE:
      const { tableId, people } = action.payload;
      return {
        ...state,
        hallData: {
          ...state.hallData,
          tables: state.hallData.tables.map(table =>
            table.id === tableId ? { ...table, people } : table
          )
        }
      };
      
    case ACTIONS.UPDATE_GROUP_MEMBERS:
      const { groupId, members } = action.payload;
      return {
        ...state,
        groups: state.groups.map(group =>
          group.id === groupId ? { ...group, members } : group
        )
      };
      
    case ACTIONS.ADD_GROUP:
      return {
        ...state,
        groups: [...state.groups, action.payload]
      };
      
    case ACTIONS.REMOVE_GROUP:
      return {
        ...state,
        groups: state.groups.filter(group => group.id !== action.payload)
      };
      
    case ACTIONS.UPDATE_GROUP:
      const { id, ...groupData } = action.payload;
      return {
        ...state,
        groups: state.groups.map(group =>
          group.id === id ? { ...group, ...groupData } : group
        )
      };
      
    case ACTIONS.RELEASE_GROUP:
      // Логика освобождения группы
      return state;
      
    case ACTIONS.SEAT_GROUP_AT_TABLE:
      // Логика рассадки группы
      return state;
      
    case ACTIONS.SET_SHOW_ADD_GROUP_MODAL:
      return { ...state, showAddGroupModal: action.payload };
      
    case ACTIONS.SET_SHOW_EDIT_GROUP_MODAL:
      return { ...state, showEditGroupModal: action.payload };
      
    case ACTIONS.SET_SHOW_GROUP_DETAILS_MODAL:
      return { ...state, showGroupDetailsModal: action.payload };
      
    case ACTIONS.SET_SHOW_SEATING_MODAL:
      return { ...state, showSeatingModal: action.payload };
      
    case ACTIONS.SET_SELECTED_GROUP_FOR_DETAILS:
      return { ...state, selectedGroupForDetails: action.payload };
      
    case ACTIONS.SET_SELECTED_GROUP_FOR_SEATING:
      return { ...state, selectedGroupForSeating: action.payload };
      
    case ACTIONS.SET_EDITING_GROUP:
      return { ...state, editingGroup: action.payload };
      
    case ACTIONS.SET_EDIT_GROUP_NAME:
      return { ...state, editGroupName: action.payload };
      
    case ACTIONS.SET_EDIT_GROUP_MEMBERS:
      return { ...state, editGroupMembers: action.payload };
      
    case ACTIONS.SET_NEW_GROUP_NAME:
      return { ...state, newGroupName: action.payload };
      
    case ACTIONS.SET_GROUP_MEMBERS:
      return { ...state, groupMembers: action.payload };
      
    case ACTIONS.SET_NEW_MEMBER_NAME:
      return { ...state, newMemberName: action.payload };
      
    case ACTIONS.SET_SEARCH_TERM:
      return { ...state, searchTerm: action.payload };
      
    case ACTIONS.SET_USED_PEOPLE:
      return { ...state, usedPeople: action.payload };
      
    case ACTIONS.SET_IS_MOBILE_GROUPS_EXPANDED:
      return { ...state, isMobileGroupsExpanded: action.payload };
      
    case ACTIONS.TOGGLE_TABLE_ENABLED:
      if (!state.hallData?.tables) return state;
      
      const updatedTables = state.hallData.tables.map(table => {
        if (table.id === action.payload) {
          return {
            ...table,
            enabled: !table.enabled
          };
        }
        return table;
      });
      
      const updatedHallData = {
        ...state.hallData,
        tables: updatedTables
      };
      
      persistentStorage.save('hallData', updatedHallData);
      return { ...state, hallData: updatedHallData };
      
    case ACTIONS.SET_TABLE_ENABLED:
      if (!state.hallData?.tables) return state;
      
      const tablesWithEnabled = state.hallData.tables.map(table => {
        if (table.id === action.payload.tableId) {
          return {
            ...table,
            enabled: action.payload.enabled
          };
        }
        return table;
      });
      
      const hallDataWithEnabled = {
        ...state.hallData,
        tables: tablesWithEnabled
      };
      
      persistentStorage.save('hallData', hallDataWithEnabled);
      return { ...state, hallData: hallDataWithEnabled };
      
    case ACTIONS.SET_SHOW_TABLE_CONTROLS:
      return { ...state, showTableControls: action.payload };
      
    case ACTIONS.SET_TARGET_TABLE_FOR_SEATING:
      return { ...state, targetTableForSeating: action.payload };
      
    case ACTIONS.SET_AVAILABLE_SEATS_FOR_SEATING:
      return { ...state, availableSeatsForSeating: action.payload };
      
    case ACTIONS.SET_SHOW_STATISTICS:
      return { ...state, showStatistics: action.payload };
      
    case ACTIONS.SET_SHOW_GROUPS_PANEL:
      return { ...state, showGroupsPanel: action.payload };
      
    case ACTIONS.SET_SHOW_IMPORT_JSON_MODAL:
      return { ...state, showImportJsonModal: action.payload };
      
    case ACTIONS.SET_SHOW_MOBILE_SEATING_CANVAS:
      return { ...state, showMobileSeatingCanvas: action.payload };
      
    case ACTIONS.SET_TABLE_SELECTION_MODE:
      return { ...state, isTableSelectionMode: action.payload };
      
    case ACTIONS.SET_NOTIFICATION:
      return { ...state, notification: action.payload };
      
    case ACTIONS.CLEAR_NOTIFICATION:
      return { ...state, notification: null };
      
    case ACTIONS.RESET_MODALS:
      return {
        ...state,
        showPersonModal: false,
        showAddGroupModal: false,
        showEditGroupModal: false,
        showTableDetailsModal: false,
        showGroupDetailsModal: false,
        showMemberSelectionModal: false,
        showSeatingModal: false,
        showPeopleSelector: false,
        showImportJsonModal: false,
        selectedChair: null,
        selectedTable: null,
        selectedGroupForDetails: null,
        selectedGroupForSeating: null,
        editingGroup: null,
        pendingSeating: null,
        selectedMembers: [],
        personName: '',
        personFullName: '',
        personGender: '',
        selectedGroup: '',
        newGroupName: '',
        groupMembers: [],
        newMemberName: '',
        editGroupName: '',
        editGroupMembers: [],
        searchTerm: '',
        personSearchTerm: '',
        showPersonSearch: true,
        selectedPersonFromGroup: null
      };
      
    case ACTIONS.CREATE_TEST_GROUPS:
      const generated = generateDefaultGroupsAndPeople();
      persistentStorage.save('seatingGroups', generated.groups);
      return { 
        ...state, 
        groups: generated.groups,
        notification: {
          type: 'success',
          message: `Создано ${generated.groups.length} тестовых групп с ${generated.people.length} участниками`
        }
      };
      
    case ACTIONS.CLEAR_ALL_GROUPS:
      persistentStorage.remove('seatingGroups');
      return { 
        ...state, 
        groups: [],
        notification: {
          type: 'success',
          message: 'Все группы удалены'
        }
      };
      
    default:
      return state;
  }
}

// Создание контекста
const SeatingContext = createContext();

// Провайдер контекста
export const SeatingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(seatingReducer, initialState);

  // Загрузка данных из backend/localStorage при инициализации
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load language
        const savedLanguage = await persistentStorage.load('seatingLanguage', 'ru');
        if (savedLanguage && (savedLanguage === 'ru' || savedLanguage === 'hy')) {
          dispatch({ type: ACTIONS.SET_LANGUAGE, payload: savedLanguage });
        }

        // Load hall data
        const savedHallData = await persistentStorage.load('hallData', null);
        if (savedHallData) {
          dispatch({ type: ACTIONS.SET_HALL_DATA, payload: savedHallData });
          
          if (savedHallData.shapes && Array.isArray(savedHallData.shapes)) {
            dispatch({ type: ACTIONS.SET_SHAPES, payload: savedHallData.shapes });
          }
        }

        // Load groups
        const savedGroups = await persistentStorage.load('seatingGroups', []);
        if (savedGroups && Array.isArray(savedGroups)) {
          dispatch({ type: ACTIONS.SET_GROUPS, payload: savedGroups });
        }
      } catch (error) {
        console.error("Error loading initial seating data:", error);
      }
    };

    loadInitialData();
  }, []);

  // Сохранение языка в backend/localStorage
  useEffect(() => {
    persistentStorage.save('seatingLanguage', state.language);
  }, [state.language]);

  // Автоматическое очищение уведомлений
  useEffect(() => {
    if (state.notification) {
      const timer = setTimeout(() => {
        dispatch({ type: ACTIONS.CLEAR_NOTIFICATION });
      }, 3000); // Уведомление исчезает через 3 секунды
      
      return () => clearTimeout(timer);
    }
  }, [state.notification, dispatch]);

  // Обработчик изменения размера окна
  useEffect(() => {
    const handleResize = () => {
      dispatch({ type: ACTIONS.SET_WINDOW_WIDTH, payload: window.innerWidth });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const value = {
    state,
    dispatch,
    actions: ACTIONS
  };

  return (
    <SeatingContext.Provider value={value}>
      {children}
    </SeatingContext.Provider>
  );
};

// Вспомогательная функция для определения пола
export const isFemaleGender = (gender) => {
  return gender === 'женский';
};

// Хук для использования контекста
export const useSeating = () => {
  const context = useContext(SeatingContext);
  if (!context) {
    throw new Error('useSeating must be used within a SeatingProvider');
  }
  return context;
};

export default SeatingContext; 
export { TEST_PEOPLE }; 