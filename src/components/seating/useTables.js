import { useCallback } from 'react';
import { useSeating } from './SeatingContext';
import { useTranslations } from './useTranslations';

export const useTables = () => {
  const { state, dispatch, actions } = useSeating();
  const { hallData } = state;
  const { t } = useTranslations();

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
    const group = state.groups.find(g => g.id === groupId);
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
      // Вместо alert открываем модальное окно для выбора людей
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

    // НЕ удаляем людей из группы после рассадки
    // Это позволяет правильно отслеживать статус группы
    // const updatedGroups = state.groups.map(g => {
    //   if (g.id === groupId) {
    //     return {
    //       ...g,
    //       members: g.members.filter(member => !peopleToSeat.includes(member))
    //     };
    //   }
    //   return g;
    // });

    // dispatch({ type: actions.SET_GROUPS, payload: updatedGroups });
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
    dispatch({ type: actions.SET_SELECTED_TABLE, payload: table });
    dispatch({ type: actions.SET_SHOW_TABLE_DETAILS_MODAL, payload: true });
  }, [dispatch, actions]);

  // Сохранение человека за столом
  const savePerson = useCallback(() => {
    if (!state.personName.trim()) {
      alert('Введите имя!');
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

    // НЕ возвращаем человека в группу, так как группа остается неизменной
    // if (currentPerson && currentPerson.groupId) {
    //   const updatedGroups = state.groups.map(group => {
    //     if (group.id === currentPerson.groupId) {
    //       return {
    //         ...group,
    //         members: [...group.members, currentPerson.name]
    //       };
    //     }
    //     return group;
    //   });

    //   dispatch({ type: actions.SET_GROUPS, payload: updatedGroups });
    //   localStorage.setItem('seatingGroups', JSON.stringify(updatedGroups));
    // }

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

    if (!state.draggedGroup) return;

    const availableSeats = getAvailableSeats(tableId);

    if (state.draggedGroup.members.length === 0) {
      alert('Группа пустая!');
      return;
    }

    if (availableSeats.length === 0) {
      alert('За этим столом нет свободных мест!');
      return;
    }

    if (state.draggedGroup.members.length > availableSeats.length) {
      dispatch({
        type: actions.SET_PENDING_SEATING,
        payload: {
          groupId: state.draggedGroup.id,
          tableId: tableId,
          availableSeats: availableSeats.length
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

  // Удаление всех людей со всех столов
  const clearAllTables = useCallback(() => {
    if (!hallData?.tables) return;

    const updatedTables = hallData.tables.map(table => ({
      ...table,
      people: table.people ? table.people.map(() => null) : []
    }));

    const updatedHallData = {
      ...hallData,
      tables: updatedTables
    };

    dispatch({ type: actions.SET_HALL_DATA, payload: updatedHallData });
    localStorage.setItem('hallData', JSON.stringify(updatedHallData));
  }, [hallData, dispatch, actions]);

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