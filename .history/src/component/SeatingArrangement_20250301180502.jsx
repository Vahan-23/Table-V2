import React, { useState, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './App.css';
import './AppCss.css'

const SeatingArrangement = () => {
    const [tables, setTables] = useState([]);
    const [people, setPeople] = useState([]);
    const [groupInput, setGroupInput] = useState('');
    const [peopleInput, setPeopleInput] = useState('');
    const [showGroups, setShowGroups] = useState(true);
    const [draggingGroup, setDraggingGroup] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
    const tablesAreaRef = useRef(null);
    const [chairCount, setChairCount] = useState(12);
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [selectedChairIndex, setSelectedChairIndex] = useState(null);
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const [isRemoveMode, setIsRemoveMode] = useState(false);
    const [personToRemove, setPersonToRemove] = useState(null);
    const [showGroupDropdown, setShowGroupDropdown] = useState(false);
    const [isCustomGroup, setIsCustomGroup] = useState(false);

    // Add this new ref for the dropdown
    const groupDropdownRef = useRef(null);


    useEffect(() => {
        const updateDimensions = () => {
          if (tablesAreaRef.current) {
            setContainerDimensions({
              width: tablesAreaRef.current.clientWidth,
              height: tablesAreaRef.current.clientHeight
            });
          }
        };
        
        // Initial measurement
        updateDimensions();
        
        // Update on window resize
        window.addEventListener('resize', updateDimensions);
        
        // Clean up
        return () => window.removeEventListener('resize', updateDimensions);
      }, []);

    useEffect(() => {
        function handleClickOutside(event) {
            if (groupDropdownRef.current && !groupDropdownRef.current.contains(event.target)) {
                setShowGroupDropdown(false);
            }
        }

        // Add event listener when dropdown is visible
        if (showGroupDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        // Clean up the event listener
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showGroupDropdown]);

    // Функция для генерации препопуляции 20 групп (от 2 до 7 человек в каждой)
    const getSeedData = () => {
        const newPeople = [];
        for (let group = 1; group <= 20; group++) {
            // Генерируем случайное число людей для группы от 2 до 7
            const groupSize = Math.floor(Math.random() * 6) + 2;
            for (let i = 1; i <= groupSize; i++) {
                newPeople.push({
                    name: `Человек ${group}-${i}`,
                    group: group.toString(), // группа в виде строки
                });
            }
        }
        return newPeople;
    };

    // Get existing group names
    const getExistingGroups = () => {
        const groups = people.map(person => person.group);
        return [...new Set(groups)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    };

    const UnseatedPeopleList = ({ people, tables }) => {
        // Фильтруем людей, которые не сидят за столами
        const unseatedPeople = people.filter((person) => {
            return !tables.some((table) => table.people.some((tablePerson) => tablePerson && tablePerson.name === person.name));
        });

        return (
            <div className="unseated-people-list">
                <h3>Մարդիկ առանց սեղանների</h3>
                <div className="unseated-people-grid">
                    {unseatedPeople.map((person, index) => (
                        <div key={index} className="unseated-person-card">
                            {person.name} <span className="group-tag">Խումբ {person.group}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    useEffect(() => {
        window.addEventListener("wheel", handleWheel, { passive: false });
        return () => window.removeEventListener("wheel", handleWheel);
    }, []);

  const handleWheel = (e) => {
  if (e.ctrlKey) {
    e.preventDefault();
    setZoom((prevZoom) => {
      const tablesArea = tablesAreaRef.current;
      const contentWidth = tablesArea?.scrollWidth || 0;
      const contentHeight = tablesArea?.scrollHeight || 0;
      const containerWidth = containerDimensions.width;
      const containerHeight = containerDimensions.height;
      
      // Calculate the new zoom level
      let newZoom = prevZoom + (e.deltaY > 0 ? -0.1 : 0.1);
      
      // Make sure zoom doesn't go below 0.5
      newZoom = Math.max(newZoom, 0.5);
      
      // Calculate if the scaled content would fit in the container
      const scaledWidth = contentWidth * newZoom;
      const scaledHeight = contentHeight * newZoom;
      
      // Limit zoom to prevent content from exceeding container boundaries
      // Add a small margin to prevent content from touching the edges
      const maxZoomWidth = (containerWidth * 0.9) / contentWidth;
      const maxZoomHeight = (containerHeight * 0.9) / contentHeight;
      const maxZoom = Math.min(maxZoomWidth, maxZoomHeight, 2);
      
      return Math.min(newZoom, maxZoom);
    });
  }
};
const handleZoomIn = () => {
    setZoom((prevZoom) => {
      const tablesArea = tablesAreaRef.current;
      const contentWidth = tablesArea?.scrollWidth || 0;
      const contentHeight = tablesArea?.scrollHeight || 0;
      const containerWidth = containerDimensions.width;
      const containerHeight = containerDimensions.height;
      
      // Calculate the new zoom level
      let newZoom = prevZoom + 0.1;
      
      // Calculate if the scaled content would fit in the container
      const scaledWidth = contentWidth * newZoom;
      const scaledHeight = contentHeight * newZoom;
      
      // Limit zoom to prevent content from exceeding container boundaries
      const maxZoomWidth = (containerWidth * 0.9) / contentWidth;
      const maxZoomHeight = (containerHeight * 0.9) / contentHeight;
      const maxZoom = Math.min(maxZoomWidth, maxZoomHeight, 2);
      
      return Math.min(newZoom, maxZoom);
    });
  };
  
  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.1, 0.5));
  };

    useEffect(() => {
        const savedTables = JSON.parse(localStorage.getItem('tables'));
        if (savedTables) setTables(savedTables);
        const savedPeople = JSON.parse(localStorage.getItem('people'));
        if (savedPeople) setPeople(savedPeople);
    }, []);

    const handleGroupInputChange = (e) => {
        setGroupInput(e.target.value);
        setIsCustomGroup(true);
    };

    const handleSelectGroup = (group) => {
        setGroupInput(group);
        setShowGroupDropdown(false);
        setIsCustomGroup(false);
    };

    const handleAddPerson = () => {
        if (peopleInput && groupInput) {
            const newPerson = { name: peopleInput, group: groupInput };
            setPeople([...people, newPerson]);
            setPeopleInput('');
            // Don't reset group input if we're adding multiple people to the same group
        } else {
            alert('Խնդրում ենք լրացնել բոլոր դաշտերը։');
        }
    };

    // Check if person already exists in the people array
    const personExists = (personName) => {
        return people.some(person => person.name === personName);
    };

    const handleDeletePerson = (personName) => {
        setPeople(people.filter((person) => person.name !== personName));
    };

    const handleAddTable = () => {
        setTables([{ id: Date.now(), people: [], chairCount }, ...tables]);
    };

    const handleChairCountChange = (e) => {
        setChairCount(parseInt(e.target.value, 10));
    };

    const handleDeleteTable = (tableId) => {
        setTables((prevTables) => {
            const tableToRemove = prevTables.find((t) => t.id === tableId);

            if (tableToRemove) {
                setPeople((prevPeople) => {
                    const peopleToReturn = tableToRemove.people.filter((p) => p && p.name);

                    const newPeople = [...prevPeople];
                    peopleToReturn.forEach((person) => {
                        if (person && !newPeople.some((p) => p.name === person.name)) {
                            newPeople.push(person);
                        }
                    });
                    return newPeople;
                });
            }

            return prevTables.filter((t) => t.id !== tableId);
        });
    };

    // Function to automatically create tables for all groups
    const createTablesForAllGroups = () => {
        // Group people by their group
        const groupedPeople = people.reduce((acc, person) => {
            if (!acc[person.group]) acc[person.group] = [];
            acc[person.group].push(person);
            return acc;
        }, {});

        // Get people who are not already seated
        const unseatedPeople = people.filter((person) => {
            return !tables.some((table) =>
                table.people.some((tablePerson) =>
                    tablePerson && tablePerson.name === person.name
                )
            );
        });

        // Group the unseated people
        const unseatedGrouped = unseatedPeople.reduce((acc, person) => {
            if (!acc[person.group]) acc[person.group] = [];
            acc[person.group].push(person);
            return acc;
        }, {});

        // Create a table for each group of unseated people
        const newTables = Object.values(unseatedGrouped)
            .filter(group => group.length > 0)
            .map(group => ({
                id: Date.now() + Math.random(), // Ensure unique ID
                people: group,
                chairCount: group.length // Set chair count to match group size
            }));

        if (newTables.length === 0) {
            alert('Բոլոր խմբերն արդեն նստած են սեղանների մոտ կամ հասանելի մարդիկ չկան:');
            return;
        }

        // Add the new tables to the state
        setTables(prevTables => [...newTables, ...prevTables]);

        // Remove the seated people from the people list
        setPeople(prevPeople =>
            prevPeople.filter(person =>
                !newTables.some(table =>
                    table.people.some(seatedPerson =>
                        seatedPerson.name === person.name
                    )
                )
            )
        );
    };

    const renderGroups = () => {
        const groupedPeople = people.reduce((acc, person) => {
            if (!acc[person.group]) acc[person.group] = [];
            acc[person.group].push(person);
            return acc;
        }, {});

        return Object.entries(groupedPeople).map(([groupName, group], index) => (
            <Group
                key={index}
                group={group}
                groupName={groupName}
                setDraggingGroup={setDraggingGroup}
            />
        ));
    };

    const handleChairClick = (tableId, chairIndex) => {
        const table = tables.find(t => t.id === tableId);
        const person = table?.people[chairIndex];

        if (person) {
            // If there's a person in the chair, show removal popup
            setSelectedTableId(tableId);
            setSelectedChairIndex(chairIndex);
            setPersonToRemove(person);
            setIsRemoveMode(true);
            setIsPopupVisible(true);
        } else {
            // If chair is empty, show popup to add a person
            setSelectedTableId(tableId);
            setSelectedChairIndex(chairIndex);
            setIsRemoveMode(false);
            setIsPopupVisible(true);
        }
    };

    const handleRemovePerson = () => {
        if (selectedTableId !== null && selectedChairIndex !== null && personToRemove) {
            setTables(prevTables => {
                const tableIndex = prevTables.findIndex(t => t.id === selectedTableId);
                if (tableIndex === -1) return prevTables;

                const updatedTable = { ...prevTables[tableIndex] };
                const updatedPeople = [...updatedTable.people];

                // Remove the person from the chair
                updatedPeople[selectedChairIndex] = null;
                updatedTable.people = updatedPeople;

                // Update tables
                const newTables = [...prevTables];
                newTables[tableIndex] = updatedTable;
                return newTables;
            });

            // Only add the person back to the people list if they don't already exist there
            setPeople(prev => {
                if (!prev.some(p => p.name === personToRemove.name)) {
                    return [...prev, personToRemove];
                }
                return prev;
            });

            setIsPopupVisible(false);
            setSelectedTableId(null);
            setSelectedChairIndex(null);
            setPersonToRemove(null);
            setIsRemoveMode(false);
        }
    };

    const handleSelectPerson = (person) => {
        if (selectedTableId !== null && selectedChairIndex !== null) {
            setTables((prevTables) => {
                // Find the current table
                const currentTableIndex = prevTables.findIndex(t => t.id === selectedTableId);
                if (currentTableIndex === -1) return prevTables;

                // Create a copy of the table's people array
                const updatedPeople = [...prevTables[currentTableIndex].people];
                updatedPeople[selectedChairIndex] = person;

                // Create a new table with updated people
                const updatedTable = {
                    ...prevTables[currentTableIndex],
                    people: updatedPeople
                };

                const newTables = [...prevTables];
                newTables.splice(currentTableIndex, 1, updatedTable);
                return newTables;
            });

            setPeople((prevPeople) =>
                prevPeople.filter((p) => p.name !== person.name)
            );

            setIsPopupVisible(false);
            setSelectedTableId(null);
            setSelectedChairIndex(null);
        }
    };

    const closePopup = () => {
        setIsPopupVisible(false);
        setSelectedTableId(null);
        setSelectedChairIndex(null);
        setPersonToRemove(null);
        setIsRemoveMode(false);
    };

    // Get available people that aren't already seated at tables
    const getAvailablePeople = () => {
        return people.filter((person) => {
            return !tables.some((table) =>
                table.people.some((tablePerson) =>
                    tablePerson && tablePerson.name === person.name
                )
            );
        });
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="app-container">
                <header className="app-header">
                    <div className="header-content">
                        <div className="logo">Նստատեղերի դասավորություն</div>

                        <div className="header-controls">
                            <div className="control-group">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        value={peopleInput}
                                        onChange={(e) => setPeopleInput(e.target.value)}
                                        placeholder="Անուն"
                                        className="input-field"
                                    />
                                    <div className="group-input-container" ref={groupDropdownRef}>
                                        <input
                                            type="text"
                                            value={groupInput}
                                            onChange={handleGroupInputChange}
                                            placeholder="Խումբ"
                                            onFocus={() => setShowGroupDropdown(true)}
                                            className="input-field"
                                        />
                                        {showGroupDropdown && (
                                            <div className="group-dropdown">
                                                {getExistingGroups().length > 0 ? (
                                                    <>
                                                        {getExistingGroups().map((group) => (
                                                            <div
                                                                key={group}
                                                                onClick={() => handleSelectGroup(group)}
                                                                className="dropdown-item"
                                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                                                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                                            >
                                                                {group}
                                                            </div>
                                                        ))}
                                                        <div
                                                            className="dropdown-item-new"
                                                            onClick={() => {
                                                                setIsCustomGroup(true);
                                                                setShowGroupDropdown(false);
                                                            }}
                                                        >
                                                            Նոր խումբ...
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="dropdown-empty">
                                                        Առկա խմբեր չկան
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        className="primary-btn add-person-btn"
                                        onClick={handleAddPerson}
                                    >
                                        Ավելացնել մարդ
                                    </button>
                                </div>

                                <div className="table-controls">
                                    <input
                                        type="number"
                                        value={chairCount}
                                        onChange={handleChairCountChange}
                                        min="1"
                                        placeholder="Кол-во стульев"
                                        className="chair-count-input"
                                    />
                                    <button
                                        className="primary-btn add-table-btn"
                                        onClick={handleAddTable}
                                    >
                                        Ավելացնել սեղան
                                    </button>

                                    <button
                                        className="primary-btn create-all-tables-btn"
                                        onClick={createTablesForAllGroups}
                                    >
                                        Ստեղծել սեղաններ բոլոր խմբերի համար
                                    </button>
                                </div>

                                <div className="bottom-controls">
                                    <div className="save-controls">
                                        <button
                                            className="secondary-btn seed-data-btn"
                                            onClick={() => setPeople(getSeedData())}
                                        >
                                            SEED DATA
                                        </button>
                                        <button
                                            className="secondary-btn clear-data-btn"
                                            onClick={() => setPeople([])}
                                        >
                                            CLEAR DATA
                                        </button>
                                    </div>

                                    <div className="zoom-controls">
    <button 
        className="zoom-btn zoom-in-btn"
        onClick={handleZoomIn}
    >+</button>
    <span className="zoom-percentage">
        {Math.round(zoom * 100)}%
    </span>
    <button 
        className="zoom-btn zoom-out-btn"
        onClick={handleZoomOut}
    >-</button>
</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="groups-container">
                        <div className="groups-header">
                            <h3 className="groups-title">Խմբեր</h3>
                            <div className="groups-wrapper">
                                {renderGroups()}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="main-content">
                    <div className="sidebar">
                        <UnseatedPeopleList people={people} tables={tables} />

                        <div className="people-list">
                            <h3>Բոլոր մարդիկ</h3>
                            <div className="people-grid">
                                {people.map((person, index) => (
                                    <div key={index} className="person-card">
                                        <span className="person-name">{person.name}</span>
                                        <span className="person-group">Խումբ {person.group}</span>
                                        <button
                                            onClick={() => handleDeletePerson(person.name)}
                                            className="delete-btn"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="tables-area" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
                        {/* Show NewTable component only when a group is being dragged */}
                        {draggingGroup && (
                            <NewTable
                                draggingGroup={draggingGroup}
                                setTables={setTables}
                                setDraggingGroup={setDraggingGroup}
                                setPeople={setPeople}
                            />
                        )}

                        {/* Render existing tables */}
                        {tables.map((table) => (
                            <Table
                                key={table.id}
                                table={table}
                                setTables={setTables}
                                handleDeleteTable={handleDeleteTable}
                                draggingGroup={draggingGroup}
                                setDraggingGroup={setDraggingGroup}
                                people={people}
                                setPeople={setPeople}
                                onChairClick={(chairIndex) => handleChairClick(table.id, chairIndex)}
                            />
                        ))}
                    </div>
                </div>

                {/* Fullscreen popup */}
                {isPopupVisible && (
                    <div
                        className="fullscreen-popup"
                        onClick={closePopup}
                    >
                        <div
                            className="fullscreen-popup-content"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {isRemoveMode ? (
                                // Remove Person Modal
                                <div className="remove-person-popup">
                                    <h3 className="popup-title">Հեռացնե՞լ աթոռից:</h3>

                                    <div className="person-info-card">
                                        <p className="person-info-name">
                                            {personToRemove?.name}
                                        </p>
                                        <p className="person-info-group">
                                            Խումբ {personToRemove?.group}
                                        </p>
                                    </div>

                                    <p className="confirmation-text">
                                        Վստա՞հ եք։, որ ցանկանում եք հեռացնել այս անձին աթոռից:
                                    </p>

                                    <div className="popup-buttons">
                                        <button
                                            onClick={handleRemovePerson}
                                            className="remove-btn"
                                        >
                                            Հեռացնել
                                        </button>

                                        <button
                                            onClick={closePopup}
                                            className="cancel-btn"
                                        >
                                            Չեղարկել
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Add Person Modal
                                <>
                                    <h3 className="popup-title">Ընտրեք մարդ աթոռի համար</h3>
                                    <div className="person-selection-grid">
                                        {getAvailablePeople().length > 0 ? (
                                            getAvailablePeople().map((person) => (
                                                <div
                                                    key={person.name}
                                                    className="person-selection-item"
                                                    onClick={() => handleSelectPerson(person)}
                                                >
                                                    <span className="person-selection-name">{person.name}</span>
                                                    <span className="person-selection-group">Խումբ {person.group}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="no-people-message">Հասանելի մարդիկ չկան</div>
                                        )}
                                    </div>
                                    <button
                                        onClick={closePopup}
                                        className="close-popup-btn"
                                    >Փակել</button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DndProvider>
    );
};

const Table = ({ table, setTables, handleDeleteTable, draggingGroup, setDraggingGroup, people, setPeople, onChairClick }) => {
    const [, drop] = useDrop({
        accept: 'GROUP',
        drop: (item) => {
            if (table.people.length + item.group.length <= table.chairCount) {
                setTables((prevTables) =>
                    prevTables.map(t =>
                        t.id === table.id
                            ? { ...t, people: [...t.people, ...item.group] }
                            : t
                    )
                );

                setDraggingGroup(null);
                setPeople((prevPeople) =>
                    prevPeople.filter((person) =>
                        !item.group.some((groupPerson) => groupPerson.name === person.name)
                    )
                );
            } else {
                alert(`Սեղանին չի կարող լինել ավելի քան ${table.chairCount} մարդ:`);

            }
        }
    });

    const chairs = [];
    const angleStep = 360 / table.chairCount;
    const radius = 140;

    const peopleOnTable = table.people || [];

    for (let i = 0; i < table.chairCount; i++) {
        const angle = angleStep * i;
        const xPosition = radius * Math.cos((angle * Math.PI) / 180);
        const yPosition = radius * Math.sin((angle * Math.PI) / 180);

        const chairStyle = {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transformOrigin: 'center',
            width: '60px',
            height: '60px',
            backgroundImage: peopleOnTable[i] ? "url('/red1.png')" : "url('/green2.png')",
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
            cursor: 'pointer'
        };

        // For displaying the name directly on the chair
        const nameOverlayStyle = {
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: '2px 6px',
            color: "#211812",
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
            maxWidth: '55px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            zIndex: 5
        };

        if (angle >= 0 && angle < 90) {
            chairStyle.transform = `rotate(${angle + 90}deg)`;
        } else if (angle >= 90 && angle < 180) {
            chairStyle.transform = `rotate(${angle + 90}deg)`;
        } else if (angle >= 180 && angle < 270) {
            chairStyle.transform = `rotate(${angle + 90}deg)`;
        } else {
            chairStyle.transform = `rotate(${angle + 90}deg)`;
        }

        chairs.push(
            <div
                key={i}
                className="chair"
                style={chairStyle}
                onClick={() => onChairClick(i)}
                title={peopleOnTable[i] ? `Нажмите чтобы удалить ${peopleOnTable[i].name}` : "Нажмите чтобы добавить человека"}
            >
                {peopleOnTable[i] && (
                    <div
                        className="person-name-overlay"
                        style={nameOverlayStyle}
                    >
                        {peopleOnTable[i].name}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div ref={drop} className="table-container">
            <div className="table-header">
                <h3>Սեղան {table.id} (Աթոռներ: {table.chairCount})</h3>
                <button onClick={() => handleDeleteTable(table.id)} className="delete-table-btn">X</button>
            </div>
            <div className="table">
                <div className="table-top">
                    {chairs}
                </div>
            </div>
        </div>
    );
};

// Group component with proper end callback to clear dragging state
const Group = ({ group, groupName, setDraggingGroup }) => {
    const [{ isDragging }, drag] = useDrag({
        type: 'GROUP',
        item: () => {
            // Set dragging state when drag begins
            setDraggingGroup(group);
            return { group };
        },
        end: () => {
            // Clear dragging state when drag operation ends
            setDraggingGroup(null);
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    return (
        <div ref={drag} className="group-card" style={{ opacity: isDragging ? 0.5 : 1 }}>
            <div className="group-name">Խումբ {groupName}</div>
            <div className="group-count">{group.length} чел.</div>
        </div>
    );
};

// NewTable component that will only show when a group is being dragged
const NewTable = ({ draggingGroup, setTables, setDraggingGroup, setPeople }) => {
    const [{ isOver }, drop] = useDrop({
        accept: 'GROUP',
        drop: (item) => {
            const newTable = {
                id: Date.now(),
                people: item.group,
                chairCount: item.group.length,
            };

            setTables((prevTables) => [newTable, ...prevTables]);
            setPeople((prevPeople) =>
                prevPeople.filter((person) =>
                    !item.group.some((groupPerson) => groupPerson.name === person.name)
                )
            );

            // Clear dragging state after successful drop
            setDraggingGroup(null);
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    return (
        <div
            ref={drop}
            className={`new-table-dropzone ${isOver ? 'hovered' : ''}`}
            style={{
                marginBottom: '20px',
                padding: '15px',
                border: '2px dashed #3498db',
                borderRadius: '8px',
                backgroundColor: isOver ? 'rgba(52, 152, 219, 0.47)' : 'rgba(52, 152, 219, 0.05)',
                transition: 'all 0.3s ease'
            }}
        >
            <div className="dropzone-content" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '20px'
            }}>
                <div className="dropzone-icon" style={{
                    fontSize: '32px',
                    color: '#3498db',
                    marginBottom: '10px'
                }}>+</div>
                <div className="dropzone-text" style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#333'
                }}>Քաշեք խումբը այստեղ՝ նոր սեղան ստեղծելու համար</div>
            </div>
        </div>
    );
};

{/*part 5*/ }

export default SeatingArrangement;