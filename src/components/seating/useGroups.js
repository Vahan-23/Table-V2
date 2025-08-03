import { useCallback, useMemo } from 'react';
import { useSeating, TEST_PEOPLE } from './SeatingContext';

export const useGroups = () => {
  const { state, dispatch, actions } = useSeating();
  const { groups, hallData, usedPeople } = state;



  // Получение количества рассаженных участников группы
  const getSeatedMembersCount = useCallback((groupId) => {
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
  }, [hallData]);

  // Получение статуса группы
  const getGroupStatus = useCallback((group) => {
    const availableMembers = group.members.length;
    const seatedMembers = getSeatedMembersCount(group.id);

    let seatedAtTable = null;
    if (seatedMembers > 0) {
      hallData?.tables?.forEach(table => {
        const groupMembersAtTable = table.people?.filter(person =>
          person && person.groupId === group.id
        ).length || 0;

        if (groupMembersAtTable > 0) {
          seatedAtTable = table.name || `Стол ${table.id}`;
        }
      });
    }

    return {
      availableMembers,
      seatedMembers,
      totalMembers: availableMembers + seatedMembers,
      seatedAtTable,
      isFullySeated: seatedMembers > 0 && availableMembers === 0,
      isPartiallySeated: seatedMembers > 0 && availableMembers > 0,
      isReadyToSeat: availableMembers > 0
    };
  }, [hallData, getSeatedMembersCount]);

  // Получение цвета группы
  const getGroupColor = useCallback((groupId) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.color : '#95a5a6';
  }, [groups]);

  // Фильтрация людей для выбора
  const getFilteredPeople = useCallback(() => {
    const availablePeople = TEST_PEOPLE.filter(person => !usedPeople.includes(person));
    if (!state.searchTerm) return availablePeople;
    return availablePeople.filter(person =>
      person.toLowerCase().includes(state.searchTerm.toLowerCase())
    );
  }, [usedPeople, state.searchTerm]);

  // Фильтрация людей для персоны
  const getFilteredPeopleForPerson = useCallback(() => {
    const peopleFromGroups = [];
    
    // Получаем список уже рассаженных людей
    const seatedPeople = [];
    hallData?.tables?.forEach(table => {
      if (table.people) {
        table.people.forEach(person => {
          if (person && person.name) {
            seatedPeople.push(person.name);
          }
        });
      }
    });

    groups.forEach(group => {
      if (group.members && group.members.length > 0) {
        group.members.forEach(member => {
          // Проверяем, не рассажен ли уже этот человек
          if (!seatedPeople.includes(member)) {
            peopleFromGroups.push({
              name: member,
              groupId: group.id,
              groupName: group.name,
              groupColor: group.color
            });
          }
        });
      }
    });

    if (!state.personSearchTerm) return peopleFromGroups;
    return peopleFromGroups.filter(person =>
      person.name.toLowerCase().includes(state.personSearchTerm.toLowerCase()) ||
      person.groupName.toLowerCase().includes(state.personSearchTerm.toLowerCase())
    );
  }, [groups, state.personSearchTerm, hallData]);

  // Добавление группы
  const addGroup = useCallback((groupName, groupMembers) => {
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
      name: groupName.trim(),
      color: availableColor,
      members: [...groupMembers]
    };

    dispatch({ type: actions.ADD_GROUP, payload: newGroup });
    
    // Сохранение в localStorage
    const updatedGroups = [...groups, newGroup];
    localStorage.setItem('seatingGroups', JSON.stringify(updatedGroups));
  }, [groups, dispatch, actions]);

  // Обновление группы
  const updateGroup = useCallback((groupId, groupName, groupMembers) => {
    const updatedGroup = {
      id: groupId,
      name: groupName,
      members: groupMembers
    };
    
    dispatch({ type: actions.UPDATE_GROUP, payload: updatedGroup });
    
    // Сохранение в localStorage
    const updatedGroups = groups.map(group =>
      group.id === groupId ? { ...group, name: groupName, members: groupMembers } : group
    );
    localStorage.setItem('seatingGroups', JSON.stringify(updatedGroups));
  }, [groups, dispatch, actions]);

  // Удаление группы
  const removeGroup = useCallback((groupId) => {
    const groupToRemove = groups.find(g => g.id === groupId);

    if (groupToRemove && groupToRemove.members) {
      const peopleToFree = groupToRemove.members.filter(member =>
        TEST_PEOPLE.includes(member)
      );
      dispatch({ 
        type: actions.SET_USED_PEOPLE, 
        payload: usedPeople.filter(person => !peopleToFree.includes(person))
      });
    }

    dispatch({ type: actions.REMOVE_GROUP, payload: groupId });
    
    // Удаление участников группы из столов
    if (hallData) {
      const updatedTables = hallData.tables.map(table => {
        const updatedPeople = (table.people || []).map(person => {
          if (person && person.groupId === groupId) {
            return null;
          }
          return person;
        });

        return { ...table, people: updatedPeople };
      });

      const updatedHallData = {
        ...hallData,
        tables: updatedTables
      };

      dispatch({ type: actions.SET_HALL_DATA, payload: updatedHallData });
      localStorage.setItem('hallData', JSON.stringify(updatedHallData));
    }

    // Сохранение в localStorage
    const updatedGroups = groups.filter(g => g.id !== groupId);
    localStorage.setItem('seatingGroups', JSON.stringify(updatedGroups));
  }, [groups, hallData, usedPeople, dispatch, actions]);

  // Освобождение группы
  const releaseGroup = useCallback((groupId) => {
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

    // Удаление участников из столов
    const updatedTables = hallData.tables.map(table => {
      const updatedPeople = (table.people || []).map(person => {
        if (person && person.groupId === groupId) {
          return null;
        }
        return person;
      });

      return { ...table, people: updatedPeople };
    });

    const updatedHallData = {
      ...hallData,
      tables: updatedTables
    };

    dispatch({ type: actions.SET_HALL_DATA, payload: updatedHallData });
    localStorage.setItem('hallData', JSON.stringify(updatedHallData));

    // Возврат участников в группу
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

    dispatch({ type: actions.SET_GROUPS, payload: updatedGroups });
    localStorage.setItem('seatingGroups', JSON.stringify(updatedGroups));
  }, [groups, hallData, dispatch, actions]);

  // Функции для работы с модальными окнами
  const createGroup = useCallback((groupName, groupMembers) => {
    addGroup(groupName, groupMembers);
    dispatch({ type: actions.SET_SHOW_ADD_GROUP_MODAL, payload: false });
  }, [addGroup, dispatch, actions]);

  const editGroup = useCallback((groupId, groupName, groupMembers) => {
    updateGroup(groupId, groupName, groupMembers);
    dispatch({ type: actions.SET_SHOW_EDIT_GROUP_MODAL, payload: false });
    dispatch({ type: actions.SET_EDITING_GROUP, payload: null });
  }, [updateGroup, dispatch, actions]);

  const deleteGroup = useCallback((groupId) => {
    removeGroup(groupId);
  }, [removeGroup]);

  const showGroupDetails = useCallback((group) => {
    dispatch({ type: actions.SET_SELECTED_GROUP_FOR_DETAILS, payload: group });
    dispatch({ type: actions.SET_SHOW_GROUP_DETAILS_MODAL, payload: true });
  }, [dispatch, actions]);

  // Группы готовые к рассадке
  const readyToSeatGroups = useMemo(() => {
    return groups.filter(group => group.members.length > 0);
  }, [groups]);

  // Полностью рассаженные группы
  const fullySeatedGroups = useMemo(() => {
    return groups.filter(group => group.members.length === 0);
  }, [groups]);

  return {
    groups,
    readyToSeatGroups,
    fullySeatedGroups,
    getSeatedMembersCount,
    getGroupStatus,
    getGroupColor,
    getFilteredPeople,
    getFilteredPeopleForPerson,
    addGroup,
    updateGroup,
    removeGroup,
    releaseGroup,
    createGroup,
    editGroup,
    deleteGroup,
    showGroupDetails,
    TEST_PEOPLE
  };
}; 