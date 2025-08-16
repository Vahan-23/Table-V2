import { useCallback } from 'react';
import { useSeating } from './SeatingContext';
import { useTranslations } from './useTranslations';
import { useGroups } from './useGroups';

export const useTables = () => {
  const { state, dispatch, actions } = useSeating();
  const { hallData } = state;
  const { t } = useTranslations();
  const { getGroupStatus } = useGroups();

  // Получение доступных мест за столом
  const getAvailableSeats = useCallback((tableId) => {
    const table = hallData?.tables?.find(t => t.id === tableId);
    if (!table) return 0;

    // Проверяем, включен ли стол
    if (table.enabled === false) return 0;

    const chairCount = table.chairCount || (table.chairs ? table.chairs.length : 12);
    const occupiedSeats = table.people ? table.people.filter(person => person !== null && person !== undefined).length : 0;
    
    return chairCount - occupiedSeats;
  }, [hallData]);

  // Рассадка группы за столом
  const seatGroupAtTable = useCallback((groupId, tableId, selectedPeople = null) => {
    console.log('seatGroupAtTable вызвана с:', { groupId, tableId, selectedPeople });
    
    const group = state.groups.find(g => g.id === groupId);
    console.log('Найденная группа:', group);
    
    if (!group) {
      alert('Группа не найдена');
      return;
    }

    // Получаем только нерассаженных людей из группы
    const getUnseatedPeopleFromGroup = (groupId) => {
      const seatedPeople = [];
      hallData?.tables?.forEach(table => {
        if (table.people) {
          table.people.forEach(person => {
            if (person && person.groupId === groupId) {
              seatedPeople.push(person.name);
            }
          });
        }
      });
      
      return group.members.filter(member => !seatedPeople.includes(member));
    };

    const peopleToSeat = selectedPeople || getUnseatedPeopleFromGroup(groupId);

    if (peopleToSeat.length === 0) {
      alert('Группа пустая!');
      return;
    }

    // Проверяем, включен ли стол
    const table = hallData?.tables?.find(t => t.id === tableId);
    if (table && table.enabled === false) {
      alert(t('tableDisabledError'));
      return;
    }

    const availableSeatsCount = getAvailableSeats(tableId);

    if (availableSeatsCount < peopleToSeat.length) {
      // Открываем модальное окно для выбора людей
      dispatch({ type: actions.SET_SHOW_SEATING_MODAL, payload: true });
      dispatch({ type: actions.SET_SELECTED_GROUP_FOR_SEATING, payload: groupId });
      dispatch({ type: actions.SET_TARGET_TABLE_FOR_SEATING, payload: tableId });
      dispatch({ type: actions.SET_AVAILABLE_SEATS_FOR_SEATING, payload: availableSeatsCount });
      return;
    }

    // Обновление людей за столом
    const updatedTables = hallData.tables.map(table => {
      if (table.id === tableId) {
        const updatedPeople = [...(table.people || [])];
        let seatIndex = 0;

        peopleToSeat.forEach((memberName) => {
          // Находим свободное место
          while (seatIndex < updatedPeople.length && updatedPeople[seatIndex] !== null && updatedPeople[seatIndex] !== undefined) {
            seatIndex++;
          }
          
          if (seatIndex < updatedPeople.length) {
            updatedPeople[seatIndex] = {
              name: memberName,
              groupId: groupId,
              isMainGuest: true
            };
            seatIndex++;
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
      ...hallData,
      tables: updatedTables
    };

    dispatch({ type: actions.SET_HALL_DATA, payload: updatedHallData });
    localStorage.setItem('hallData', JSON.stringify(updatedHallData));

    // Удаляем рассаженных людей из группы
    const updatedGroups = state.groups.map(g => {
      if (g.id === groupId) {
        const newMembers = g.members.filter(member => !peopleToSeat.includes(member));
        console.log(`🪑 РАССАЖАЕМ: ${g.name} - было ${g.members.length} людей, стало ${newMembers.length}`);
        return {
          ...g,
          members: newMembers
        };
      }
      return g;
    });

    dispatch({ type: actions.SET_GROUPS, payload: updatedGroups });
    localStorage.setItem('seatingGroups', JSON.stringify(updatedGroups));
    // localStorage.setItem('seatingGroups', JSON.stringify(updatedGroups));

    // Сброс модальных окон
    dispatch({ type: actions.RESET_MODALS });
  }, [state.groups, hallData, getAvailableSeats, dispatch, actions]);

  // Обработка клика по стулу
  const handleChairClick = useCallback((tableId, chairIndex) => {
    dispatch({ 
      type: actions.SET_SELECTED_CHAIR, 
      payload: { tableId, chairIndex } 
    });

    const table = hallData?.tables?.find(t => t.id === tableId);
    if (table && table.people && table.people[chairIndex]) {
      // Если стул занят - показываем данные существующего гостя
      dispatch({ 
        type: actions.SET_PERSON_NAME, 
        payload: table.people[chairIndex].name || '' 
      });
      dispatch({ 
        type: actions.SET_SELECTED_GROUP, 
        payload: table.people[chairIndex].groupId || '' 
      });
    } else {
      // Если стул свободен - готовим для добавления нового гостя
      dispatch({ type: actions.SET_PERSON_NAME, payload: '' });
      dispatch({ type: actions.SET_SELECTED_GROUP, payload: '' });
    }

    dispatch({ type: actions.SET_SHOW_PERSON_MODAL, payload: true });
  }, [hallData, dispatch, actions]);

  // Обработка клика по столу
  const handleTableClick = useCallback((e, table) => {
    e.stopPropagation();
    
    // Проверяем, находимся ли мы в режиме выбора стола для рассадки группы
    if (state.isTableSelectionMode && state.selectedGroupForSeating) {
      const group = state.groups.find(g => g.id === state.selectedGroupForSeating);
      if (group) {
        // Проверяем, есть ли свободные места за столом
        const occupiedSeats = table.people?.filter(person => person).length || 0;
        const availableSeats = table.chairCount - occupiedSeats;
        
        if (availableSeats === 0) {
          dispatch({ 
            type: actions.SET_NOTIFICATION, 
            payload: {
              type: 'error',
              message: t('tableFullyOccupied')
            }
          });
          return;
        }

        if (availableSeats < group.members.length) {
          // Открываем модаль для выбора людей вместо показа ошибки
          dispatch({ type: actions.SET_SHOW_SEATING_MODAL, payload: true });
          dispatch({ type: actions.SET_SELECTED_GROUP_FOR_SEATING, payload: group.id });
          dispatch({ type: actions.SET_TARGET_TABLE_FOR_SEATING, payload: table.id });
          dispatch({ type: actions.SET_AVAILABLE_SEATS_FOR_SEATING, payload: availableSeats });
          return;
        }
        
        // Проверяем, не рассажена ли уже вся группа
        const status = getGroupStatus(group);
        if (status.isFullySeated) {
          dispatch({ 
            type: actions.SET_NOTIFICATION, 
            payload: {
              type: 'warning',
              message: t('groupAlreadyFullySeated')
            }
          });
          return;
        }

        // Автоматически рассаживаем всю группу за выбранный стол
        seatGroupAtTable(state.selectedGroupForSeating, table.id, group.members);
        
        // Отключаем режим выбора стола
        dispatch({ type: actions.SET_TABLE_SELECTION_MODE, payload: false });
        dispatch({ type: actions.SET_SELECTED_GROUP_FOR_SEATING, payload: null });
        
        // Показываем красивое уведомление об успешной рассадке
        dispatch({ 
          type: actions.SET_NOTIFICATION, 
          payload: {
            type: 'success',
            message: `${t('groupSeatedSuccessfully')} "${group.name}" ${t('atTable')} ${table.name || table.id}`
          }
        });
        return;
      }
    }
    
    // Обычная логика для показа деталей стола
    dispatch({ type: actions.SET_SELECTED_TABLE, payload: table });
    dispatch({ type: actions.SET_SHOW_TABLE_DETAILS_MODAL, payload: true });
  }, [dispatch, actions, state.isTableSelectionMode, state.selectedGroupForSeating, state.groups, seatGroupAtTable, t, getGroupStatus]);

  // Сохранение человека за столом
  const savePerson = useCallback(() => {
    if (!state.personName.trim()) {
      dispatch({ 
        type: actions.SET_NOTIFICATION, 
        payload: {
          type: 'error',
          message: 'Введите имя!'
        }
      });
      return;
    }

    const { tableId, chairIndex } = state.selectedChair;
    const currentPersonOnChair = hallData?.tables?.find(t => t.id === tableId)?.people?.[chairIndex];

    // НЕ обновляем группы при сохранении человека
    // Это позволяет правильно отслеживать статус группы
    // const updatedGroups = state.groups.map(group => {
    //   let updatedGroup = { ...group };

    //   if (currentPersonOnChair &&
    //     currentPersonOnChair.groupId === group.id &&
    //     currentPersonOnChair.name !== state.personName.trim()) {
    //     updatedGroup = {
    //       ...updatedGroup,
    //       members: [...updatedGroup.members, currentPersonOnChair.name]
    //     };
    //   }

    //   if (state.selectedPersonFromGroup && state.selectedPersonFromGroup.groupId === group.id) {
    //     updatedGroup = {
    //       ...updatedGroup,
    //       members: updatedGroup.members.filter(member => member !== state.selectedPersonFromGroup.name)
    //     };
    //   }

    //   return updatedGroup;
    // });

    // dispatch({ type: actions.SET_GROUPS, payload: updatedGroups });
    // localStorage.setItem('seatingGroups', JSON.stringify(updatedGroups));

    // Обновление людей за столом
    const updatedTables = hallData.tables.map(t => {
      if (t.id === tableId) {
        const tablePeople = [...(t.people || [])];

        tablePeople[chairIndex] = {
          name: state.personName.trim(),
          groupId: state.selectedGroup,
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
      ...hallData,
      tables: updatedTables
    };

    dispatch({ type: actions.SET_HALL_DATA, payload: updatedHallData });
    localStorage.setItem('hallData', JSON.stringify(updatedHallData));

    // Сброс модального окна
    dispatch({ type: actions.RESET_MODALS });
  }, [state, hallData, dispatch, actions]);

  // Удаление человека со стола
  const removePerson = useCallback(() => {
    const { tableId, chairIndex } = state.selectedChair;
    const currentPerson = hallData?.tables?.find(t => t.id === tableId)?.people?.[chairIndex];

    // Возвращаем человека в группу
    if (currentPerson && currentPerson.groupId) {
      const updatedGroups = state.groups.map(group => {
        if (group.id === currentPerson.groupId) {
          return {
            ...group,
            members: [...group.members, currentPerson.name]
          };
        }
        return group;
      });

      dispatch({ type: actions.SET_GROUPS, payload: updatedGroups });
      localStorage.setItem('seatingGroups', JSON.stringify(updatedGroups));
    }

    // Удаление человека со стола
    const updatedTables = hallData.tables.map(t => {
      if (t.id === tableId) {
        const tablePeople = [...(t.people || [])];
        tablePeople[chairIndex] = null;

        return {
          ...t,
          people: tablePeople
        };
      }
      return t;
    });

    const updatedHallData = {
      ...hallData,
      tables: updatedTables
    };

    dispatch({ type: actions.SET_HALL_DATA, payload: updatedHallData });
    localStorage.setItem('hallData', JSON.stringify(updatedHallData));

    // Сброс модального окна
    dispatch({ type: actions.RESET_MODALS });
  }, [state, hallData, dispatch, actions]);

  // Обработка drag & drop
  const handleTableDragOver = useCallback((e, tableId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dispatch({ type: actions.SET_DRAG_OVER_TABLE, payload: tableId });
  }, [dispatch, actions]);

  const handleTableDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      dispatch({ type: actions.SET_DRAG_OVER_TABLE, payload: null });
    }
  }, [dispatch, actions]);

  const handleTableDrop = useCallback((e, tableId) => {
    e.preventDefault();
    dispatch({ type: actions.SET_DRAG_OVER_TABLE, payload: null });

    console.log('handleTableDrop вызвана для стола:', tableId);
    console.log('draggedGroup:', state.draggedGroup);

    if (!state.draggedGroup) return;

    const availableSeatsCount = getAvailableSeats(tableId);

    if (state.draggedGroup.members.length === 0) {
      dispatch({ 
        type: actions.SET_NOTIFICATION, 
        payload: {
          type: 'error',
          message: 'Группа пустая!'
        }
      });
      return;
    }

    if (availableSeatsCount === 0) {
      dispatch({ 
        type: actions.SET_NOTIFICATION, 
        payload: {
          type: 'error',
          message: 'За этим столом нет свободных мест!'
        }
      });
      return;
    }

    if (state.draggedGroup.members.length > availableSeatsCount) {
      dispatch({
        type: actions.SET_PENDING_SEATING,
        payload: {
          groupId: state.draggedGroup.id,
          tableId: tableId,
          availableSeats: availableSeatsCount
        }
      });
      dispatch({ type: actions.SET_SELECTED_MEMBERS, payload: [] });
      dispatch({ type: actions.SET_SHOW_MEMBER_SELECTION_MODAL, payload: true });
    } else {
      seatGroupAtTable(state.draggedGroup.id, tableId);
    }
  }, [state.draggedGroup, getAvailableSeats, seatGroupAtTable, dispatch, actions]);

  // Переключение состояния стола (включить/отключить)
  const toggleTableEnabled = useCallback((tableId) => {
    dispatch({ type: actions.TOGGLE_TABLE_ENABLED, payload: tableId });
  }, [dispatch, actions]);

  // Установка состояния стола
  const setTableEnabled = useCallback((tableId, enabled) => {
    dispatch({ 
      type: actions.SET_TABLE_ENABLED, 
      payload: { tableId, enabled } 
    });
  }, [dispatch, actions]);

  // Получение активных столов (только включенные)
  const getActiveTables = useCallback(() => {
    if (!hallData?.tables) return [];
    return hallData.tables.filter(table => table.enabled !== false);
  }, [hallData]);

  // Получение отключенных столов
  const getDisabledTables = useCallback(() => {
    if (!hallData?.tables) return [];
    return hallData.tables.filter(table => table.enabled === false);
  }, [hallData]);

  // Удаление всех людей со всех столов и возврат их в группы
  const clearAllTables = useCallback(() => {
    if (!hallData?.tables) return;

    // Собираем всех людей со всех столов
    const peopleToReturn = [];
    hallData.tables.forEach(table => {
      if (table.people) {
        table.people.forEach(person => {
          if (person && person.name && person.groupId) {
            peopleToReturn.push({
              name: person.name,
              groupId: person.groupId
            });
          }
        });
      }
    });

    // Очищаем все столы
    const updatedTables = hallData.tables.map(table => ({
      ...table,
      people: table.people ? table.people.map(() => null) : []
    }));

    const updatedHallData = {
      ...hallData,
      tables: updatedTables
    };

    // Обновляем группы - возвращаем людей в их группы
    const updatedGroups = state.groups.map(group => {
      const peopleFromThisGroup = peopleToReturn.filter(p => p.groupId === group.id);
      const peopleNames = peopleFromThisGroup.map(p => p.name);
      
      // Добавляем людей обратно в группу, избегая дубликатов
      const updatedMembers = [...group.members];
      peopleNames.forEach(name => {
        if (!updatedMembers.includes(name)) {
          updatedMembers.push(name);
        }
      });

      return {
        ...group,
        members: updatedMembers
      };
    });

    // Сохраняем обновленные данные
    dispatch({ type: actions.SET_HALL_DATA, payload: updatedHallData });
    dispatch({ type: actions.SET_GROUPS, payload: updatedGroups });
    
    localStorage.setItem('hallData', JSON.stringify(updatedHallData));
    localStorage.setItem('seatingGroups', JSON.stringify(updatedGroups));

    // Показываем уведомление о количестве возвращенных людей
    if (peopleToReturn.length > 0) {
      dispatch({ 
        type: actions.SET_NOTIFICATION, 
        payload: {
          type: 'success',
          message: t('peopleReturnedToGroups').replace('{count}', peopleToReturn.length)
        }
      });
    }
  }, [hallData, state.groups, dispatch, actions]);

  return {
    hallData,
    getAvailableSeats,
    seatGroupAtTable,
    handleChairClick,
    handleTableClick,
    savePerson,
    removePerson,
    handleTableDragOver,
    handleTableDragLeave,
    handleTableDrop,
    toggleTableEnabled,
    setTableEnabled,
    getActiveTables,
    getDisabledTables,
    clearAllTables
  };
}; 