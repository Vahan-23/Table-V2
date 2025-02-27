import React, { useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './App.css';

const SeatingArrangement = () => {
    const [tables, setTables] = useState([]);
    const [people, setPeople] = useState([]);
    const [groupInput, setGroupInput] = useState('');
    const [peopleInput, setPeopleInput] = useState('');
    const [showGroups, setShowGroups] = useState(true);
    const [draggingGroup, setDraggingGroup] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [chairCount, setChairCount] = useState(12);
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [selectedChairIndex, setSelectedChairIndex] = useState(null);
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const [isRemoveMode, setIsRemoveMode] = useState(false);
    const [personToRemove, setPersonToRemove] = useState(null);


    // Функция для генерации препопуляции 20 групп (от 2 до 7 человек в каждой)
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
                let newZoom = prevZoom + (e.deltaY > 0 ? -0.1 : 0.1);
                return Math.min(Math.max(newZoom, 0.5), 2); // Ограничиваем от 0.5x до 2x
            });
        }
    };

    useEffect(() => {
        const savedTables = JSON.parse(localStorage.getItem('tables'));
        if (savedTables) setTables(savedTables);
        const savedPeople = JSON.parse(localStorage.getItem('people'));
        if (savedPeople) setPeople(savedPeople);
    }, []);

    const handleAddPerson = () => {
        if (peopleInput && groupInput) {
            const newPerson = { name: peopleInput, group: groupInput };
            setPeople([...people, newPerson]);
            setPeopleInput('');
            setGroupInput('');
        } else {
            alert('Пожалуйста, заполните все поля.');
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
            alert('Все группы уже рассажены за столами или нет доступных людей.');
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

                // Create a new array with the updated table at the front
                // const newTables = [...prevTables];
                // newTables.splice(currentTableIndex, 1); // Remove the current table
                
                // return [updatedTable, ...newTables]; // Add the updated table at the front

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
                                    />
                                    <input
                                        type="text"
                                        value={groupInput}
                                        onChange={(e) => setGroupInput(e.target.value)}
                                        placeholder="Խումբ"
                                    />
                                    <button className="primary-btn" onClick={handleAddPerson}>Ավելացնել մարդ</button>
                                </div>

                                <div className="table-controls">
                                    <input
                                        type="number"
                                        value={chairCount}
                                        onChange={handleChairCountChange}
                                        min="1"
                                        placeholder="Кол-во стульев"
                                    />
                                    <button className="primary-btn" onClick={handleAddTable}>Ավելացնել սեղան</button>
                                    <button className="primary-btn" onClick={createTablesForAllGroups}>Ստեղծել սեղաններ բոլոր խմբերի համար</button>
                                </div>

                                <div className="save-controls">
                                    <button className="secondary-btn" onClick={() => setPeople(getSeedData())}>SEED DATA</button>
                                    <button className="secondary-btn" onClick={() => setPeople([])}>CLEAR DATA</button>
                                </div>

                                <div className="zoom-controls">
                                    <button onClick={() => setZoom((z) => Math.min(z + 0.1, 2))}>+</button>
                                    <span>{Math.round(zoom * 100)}%</span>
                                    <button onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))}>-</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="groups-container">
                        <div className="groups-header">
                            <h3>Группы для перетаскивания</h3>
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
                        {/* Add the new table drop zone at the top */}
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

                {/* Fullscreen popup that appears regardless of scroll position */}
                {isPopupVisible && (
                    <div
                        className="fullscreen-popup"
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            zIndex: 1000,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onClick={closePopup}  // Close popup when clicking on the overlay
                    >
                        <div
                            className="fullscreen-popup-content"
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                padding: '20px',
                                maxWidth: '600px',
                                width: '90%',
                                maxHeight: '80vh',
                                overflowY: 'auto'
                            }}
                            onClick={(e) => e.stopPropagation()}  // Prevent closing when clicking inside the content area
                        >
                            {isRemoveMode ? (
                                // Remove Person Modal
                                <div className="remove-person-popup">
                                    <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Удалить человека со стула</h3>

                                    <div style={{
                                        backgroundColor: '#f9f9f9',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        marginBottom: '20px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                        <p style={{
                                            textAlign: 'center',
                                            fontSize: '18px',
                                            margin: '0 0 10px 0',
                                            fontWeight: 'bold'
                                        }}>
                                            {personToRemove?.name}
                                        </p>
                                        <p style={{
                                            textAlign: 'center',
                                            margin: '0',
                                            color: '#666'
                                        }}>
                                            Խումբ {personToRemove?.group}
                                        </p>
                                    </div>

                                    <p style={{
                                        textAlign: 'center',
                                        marginBottom: '20px',
                                        color: '#555'
                                    }}>
                                        Вы уверены, что хотите удалить этого человека со стула?
                                    </p>

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: '15px'
                                    }}>
                                        <button
                                            onClick={handleRemovePerson}
                                            style={{
                                                padding: '10px 20px',
                                                backgroundColor: '#e74c3c',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            Удалить
                                        </button>

                                        <button
                                            onClick={closePopup}
                                            style={{
                                                padding: '10px 20px',
                                                backgroundColor: '#7f8c8d',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Add Person Modal
                                <>
                                    <h3>Выберите человека для стула</h3>
                                    <div
                                        className="person-selection-grid"
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                            gap: '10px',
                                            marginTop: '20px',
                                            marginBottom: '20px'
                                        }}
                                    >
                                        {getAvailablePeople().length > 0 ? (
                                            getAvailablePeople().map((person) => (
                                                <div
                                                    key={person.name}
                                                    className="person-selection-item"
                                                    style={{
                                                        padding: '12px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        transition: 'background-color 0.2s',
                                                        backgroundColor: '#f9f9f9'
                                                    }}
                                                    onClick={() => handleSelectPerson(person)}
                                                >
                                                    <span
                                                        className="person-name"
                                                        style={{
                                                            display: 'block',
                                                            fontWeight: 'bold',
                                                            marginBottom: '4px'
                                                        }}
                                                    >{person.name}</span>
                                                    <span
                                                        className="person-group"
                                                        style={{
                                                            display: 'block',
                                                            fontSize: '0.9em',
                                                            color: '#666'
                                                        }}
                                                    >Խումբ {person.group}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div
                                                className="no-people-message"
                                                style={{
                                                    gridColumn: '1 / -1',
                                                    padding: '20px',
                                                    textAlign: 'center',
                                                    color: '#666'
                                                }}
                                            >Нет доступных людей</div>
                                        )}
                                    </div>
                                    <button
                                        onClick={closePopup}
                                        className="close-popup-btn"
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#3498db',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            display: 'block',
                                            margin: '0 auto'
                                        }}
                                    >Закрыть</button>
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
                alert(`На столе не может быть больше ${table.chairCount} человек!`);
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
                <h3>Стол {table.id} (Стульев: {table.chairCount})</h3>
                <button onClick={() => handleDeleteTable(table.id)} className="delete-table-btn">Հեռացնել սեղանը</button>
            </div>
            <div className="table">
                <div className="table-top">
                    {chairs}
                </div>
            </div>
        </div>
    );
};

const Group = ({ group, groupName, setDraggingGroup }) => {
    const [{ isDragging }, drag] = useDrag({
        type: 'GROUP',
        item: { group },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    useEffect(() => {
        if (isDragging) {
            setDraggingGroup(group);
        }
    }, [isDragging, group, setDraggingGroup]);

    return (
        <div ref={drag} className="group-card" style={{ opacity: isDragging ? 0.5 : 1 }}>
            <div className="group-name">Խումբ {groupName}</div>
            <div className="group-count">{group.length} чел.</div>
        </div>
    );
};

const NewTable = ({ draggingGroup, setTables, setDraggingGroup, setPeople }) => {
    const [{ isOver }, drop] = useDrop({
        accept: 'GROUP',
        drop: (item) => {
            // Here's the key change: use exactly the group size for chair count
            const newTable = {
                id: Date.now(),
                people: item.group,
                chairCount: item.group.length, // Set chair count to match group size exactly
            };

            setTables((prevTables) => [newTable, ...prevTables]); // Add new table to the beginning
            setPeople((prevPeople) =>
                prevPeople.filter((person) => !item.group.some((groupPerson) => groupPerson.name === person.name))
            );

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
                backgroundColor: isOver ? 'rgba(52, 152, 219, 0.1)' : 'rgba(52, 152, 219, 0.05)',
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
                }}>Перетащите группу сюда для создания нового стола</div>
            </div>
        </div>
    );
};

export default SeatingArrangement;