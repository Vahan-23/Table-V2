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

    const UnseatedPeopleList = ({ people, tables }) => {
        // Фильтруем людей, которые не сидят за столами
        const unseatedPeople = people.filter((person) => {
            return !tables.some((table) => table.people.some((tablePerson) => tablePerson && tablePerson.name === person.name));
        });
    
        return (
            <div className="unseated-people-list">
                <h3>Люди без столов</h3>
                <div className="unseated-people-grid">
                    {unseatedPeople.map((person, index) => (
                        <div key={index} className="unseated-person-card">
                            {person.name} <span className="group-tag">Группа {person.group}</span>
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
    
    const saveTables = () => {
        localStorage.setItem('tables', JSON.stringify(tables));
    };

    const loadSavedTables = () => {
        const savedTables = JSON.parse(localStorage.getItem('tables'));
        if (savedTables) setTables(savedTables);
    };

    const savePeople = () => {
        localStorage.setItem('people', JSON.stringify(people));
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
        setSelectedTableId(tableId);
        setSelectedChairIndex(chairIndex);
        setIsPopupVisible(true);
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
                const newTables = [...prevTables];
                newTables.splice(currentTableIndex, 1); // Remove the current table
                return [updatedTable, ...newTables]; // Add the updated table at the front
            });
    
            setPeople((prevPeople) =>
                prevPeople.filter((p) => p.name !== person.name)
            );
    
            setIsPopupVisible(false);
            setSelectedTableId(null);
            setSelectedChairIndex(null);
        }
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
                        <div className="logo">Планировщик рассадки</div>
                        
                        <div className="header-controls">
                            <div className="control-group">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        value={peopleInput}
                                        onChange={(e) => setPeopleInput(e.target.value)}
                                        placeholder="Имя"
                                    />
                                    <input
                                        type="text"
                                        value={groupInput}
                                        onChange={(e) => setGroupInput(e.target.value)}
                                        placeholder="Группа"
                                    />
                                    <button className="primary-btn" onClick={handleAddPerson}>Добавить человека</button>
                                </div>
                                
                                <div className="table-controls">
                                    <input
                                        type="number"
                                        value={chairCount}
                                        onChange={handleChairCountChange}
                                        min="1"
                                        placeholder="Кол-во стульев"
                                    />
                                    <button className="primary-btn" onClick={handleAddTable}>Добавить стол</button>
                                </div>
                                
                                <div className="save-controls">
                                    <button className="secondary-btn" onClick={loadSavedTables}>Загрузить столы</button>
                                    <button className="secondary-btn" onClick={saveTables}>Сохранить столы</button>
                                    <button className="secondary-btn" onClick={savePeople}>Сохранить людей</button>
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
                            <h3>Все люди</h3>
                            <div className="people-grid">
                                {people.map((person, index) => (
                                    <div key={index} className="person-card">
                                        <span className="person-name">{person.name}</span>
                                        <span className="person-group">Группа {person.group}</span>
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
                    <div className="fullscreen-popup">
                        <div className="fullscreen-popup-overlay">
                            <div className="fullscreen-popup-content">
                                <h3>Выберите человека для стула</h3>
                                <div className="person-selection-grid">
                                    {getAvailablePeople().length > 0 ? (
                                        getAvailablePeople().map((person) => (
                                            <div 
                                                key={person.name} 
                                                className="person-selection-item"
                                                onClick={() => handleSelectPerson(person)}
                                            >
                                                <span className="person-name">{person.name}</span>
                                                <span className="person-group">Группа {person.group}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-people-message">Нет доступных людей</div>
                                    )}
                                </div>
                                <button onClick={() => setIsPopupVisible(false)} className="close-popup-btn">Закрыть</button>
                            </div>
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
                setTables((prevTables) => {
                    // Find the current table
                    const currentTableIndex = prevTables.findIndex(t => t.id === table.id);
                    if (currentTableIndex === -1) return prevTables;
                    
                    // Create a new table with updated people
                    const updatedTable = {
                        ...prevTables[currentTableIndex],
                        people: [...prevTables[currentTableIndex].people, ...item.group]
                    };
                    
                    // Create a new array with the updated table at the front
                    const newTables = [...prevTables];
                    newTables.splice(currentTableIndex, 1); // Remove the current table
                    return [updatedTable, ...newTables]; // Add the updated table at the front
                });
                
                setDraggingGroup(null);
                setPeople((prevPeople) =>
                    prevPeople.filter((person) => 
                        !item.group.some((groupPerson) => groupPerson.name === person.name)
                    )
                );
            } else {
                alert(`На столе не может быть больше ${table.chairCount} человек!`);
            }
        },
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
            color: 'white',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '50%',
            fontSize: '12px',
            textAlign: 'center',
            left: `calc(50% + ${xPosition}px)`,
            top: `calc(50% + ${yPosition}px)`,
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
            >
                {peopleOnTable[i] ? peopleOnTable[i].name : ''}
            </div>
        );
    }

    return (
        <div ref={drop} className="table-container">
            <div className="table-header">
                <h3>Стол {table.id} (Стульев: {table.chairCount})</h3>
                <button onClick={() => handleDeleteTable(table.id)} className="delete-table-btn">Удалить</button>
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
            <div className="group-name">Группа {groupName}</div>
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