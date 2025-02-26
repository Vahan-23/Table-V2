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
    const [showGroups, setShowGroups] = useState(false);
    const [draggingGroup, setDraggingGroup] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [chairCount, setChairCount] = useState(12);


    const UnseatedPeopleList = ({ people, tables }) => {
        // Фильтруем людей, которые не сидят за столами
        const unseatedPeople = people.filter((person) => {
            return !tables.some((table) => table.people.some((tablePerson) => tablePerson && tablePerson.name === person.name));
        });
    
        return (
            <div className="unseated-people-list">
                <h3>Люди без столов</h3>
                <ul>
                    {unseatedPeople.map((person, index) => (
                        <li key={index}>
                            {person.name} (Группа {person.group})
                        </li>
                    ))}
                </ul>
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

    const handleAddPerson = (tableId, person) => {
        if (peopleInput && groupInput) {
            const newPerson = { name: peopleInput, group: groupInput };
            setPeople([...people, newPerson]);
            setPeopleInput('');
            setGroupInput('');
            setTables((prevTables) =>
                prevTables.map((table) =>
                  table.id === tableId
                    ? { ...table, people: [...table.people, person] } // Добавление нового человека
                    : table
                )
              );
        } else {
            alert('Пожалуйста, заполните все поля.');
        }
    };

    const handleDeletePerson = (personName) => {
        setPeople(people.filter((person) => person.name !== personName));
    };

    const handleAddTable = () => {
        setTables([...tables, { id: Date.now(),  people: [], chairCount }]); // Передаем количество стульев в таблицу
    };


    const handleChairCountChange = (e) => {
        setChairCount(parseInt(e.target.value, 10)); // Изменяем количество стульев
    };

    const handleDeleteTable = (tableId) => {
        setTables((prevTables) => {
            const tableToRemove = prevTables.find((t) => t.id === tableId);
    
            if (tableToRemove) {
                setPeople((prevPeople) => {
                    const peopleToReturn = tableToRemove.people.filter((p) => p && p.name); // Проверка на пустые или невалидные объекты
    
                    const newPeople = [...prevPeople];
                    peopleToReturn.forEach((person) => {
                        // Проверка на наличие такого человека в новом списке людей
                        if (person && !newPeople.some((p) => p.name === person.name)) {
                            newPeople.push(person);
                        }
                    });
                    return newPeople;
                });
            }
    
            // Удаляем стол
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

        return Object.values(groupedPeople).map((group, index) => (
            <Group
                key={index}
                group={group}
                groupName={`Группа ${index + 1 + group.name}`}
                setDraggingGroup={setDraggingGroup}
            />
        ));
    };


    return (
        <DndProvider backend={HTML5Backend}>
            <div className="container">
                <div className="left-panel">
                <UnseatedPeopleList people={people} tables={tables} />
                    <div className="controls">
                    <input
                            type="number"
                            value={chairCount}
                            onChange={handleChairCountChange}
                            min="1"
                            placeholder="Количество стульев на столе"
                        />
                        <button onClick={handleAddTable}>Добавить стол</button>
                        <button onClick={loadSavedTables}>Загрузить сохранённые группы</button>
                        <button onClick={saveTables}>Сохранить группы</button>
                        <button onClick={savePeople}>Сохранить людей</button>
                    </div>

                    <div className="person-input">
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
                        <button onClick={handleAddPerson}>Добавить</button>
                    </div>

                    <div className="people-list">
                        <h3>Добавленные люди</h3>
                        <ul>
                            {people.map((person, index) => (
                                <li key={index}>
                                    {person.name} (Группа {person.group})
                                    <button
                                        onClick={() => handleDeletePerson(person.name)}
                                        className="delete-btn"
                                    >
                                        Удалить
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="toggle-groups">
                        <button onClick={() => setShowGroups(!showGroups)}>
                            {showGroups ? 'Скрыть группы' : 'Показать группы'}
                        </button>
                        {showGroups && (
                            <div className="group-list">

                                <h3>Группы для перетаскивания: </h3>
                                {renderGroups()}
                                <div className="controls">
                                    <button onClick={() => setZoom((z) => Math.min(z + 0.1, 2))}>+</button>
                                    <button onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))}>-</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="right-panel" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
            {tables.map((table) => (
                <Table
                    key={table.id}
                    table={table}
                    setTables={setTables}
                    handleDeleteTable={handleDeleteTable}
                    draggingGroup={draggingGroup}
                    setDraggingGroup={setDraggingGroup}
                    people={people} // Pass the `people` prop here
                    setPeople={setPeople}
                    
                />
            ))}

            {draggingGroup && (
                <NewTable
                    draggingGroup={draggingGroup}
                    setTables={setTables}
                    setDraggingGroup={setDraggingGroup}
                    setPeople={setPeople}
                />
            )}
        </div>
            </div>
        </DndProvider>
    );
    
};

const Popup = ({ people, onSelectPerson, onClose }) => {
    return (
        <div className="popup-overlay" onClick={onClose}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                <h3>Выберите человека</h3>
                <ul>
                    {people.map((person, index) => (
                        <li key={index}>
                            <button onClick={() => onSelectPerson(person)}>
                                {person.name}
                            </button>
                        </li>
                    ))}
                </ul>
                <button onClick={onClose}>Закрыть</button>
            </div>
        </div>
    );
};

// Компонент Table
const Table = ({ table, setTables, handleDeleteTable, draggingGroup, setDraggingGroup, people ,setPeople }) => {
    const [selectedChairIndex, setSelectedChairIndex] = useState(null);
    const [isPopupVisible, setIsPopupVisible] = useState(false);

    const [, drop] = useDrop({
        accept: 'GROUP',
        drop: (item) => {
            if (table.people.length + item.group.length <= table.chairCount) { // Используем chairCount стола
                setTables((prevTables) =>
                    prevTables.map((t) =>
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
                ); }
                else {
                alert(`На столе не может быть больше ${table.chairCount} человек!`);
            }
        },
    });

    const handleChairClick = (index) => {
        setSelectedChairIndex(index);
        setIsPopupVisible(true); // Показываем попап
    };

    const handleSelectPerson = (person) => {
        if (selectedChairIndex !== null) {
            // Копируем текущие данные стола и людей
            const updatedPeople = [...table.people];
            updatedPeople[selectedChairIndex] = person;
    
            // Обновляем столы с изменением людей
            setTables((prevTables) =>
                prevTables.map((t) =>
                    t.id === table.id ? { ...t, people: updatedPeople } : t
                )
            );
    
            // Обновляем список людей, удаляя выбранного человека
            setPeople((prevPeople) =>
                prevPeople.filter((p) => p.name !== person.name)
            );
    
            // Закрываем попап и сбрасываем выбранный стул
            setIsPopupVisible(false);
            setSelectedChairIndex(null);
        }
    };
    

    const filteredPeople = people.filter((person) => {
        return !table.people.some((tablePerson) => tablePerson && tablePerson.name === person.name);
    });

    const chairs = [];
    const angleStep = 360 / table.chairCount; // Используем chairCount стола
    const radius = 140;
    
    const peopleOnTable = table.people || [];

    for (let i = 0; i < table.chairCount; i++) { // Здесь также используем chairCount
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
                onClick={() => handleChairClick(i)}
            >
                {peopleOnTable[i] ? peopleOnTable[i].name : ''}
            </div>
        );
    }
    

    return (
        <div ref={drop} className="tableContainer">
            <h3>Стол {table.id} (Стульев: {table.chairCount})</h3> {/* Отображаем количество стульев */}
            <div className="table">
                <div className="table-top">
                    {chairs}
                </div>
            </div>
            <button onClick={() => handleDeleteTable(table.id)}>Удалить стол</button>

            {isPopupVisible && (
                <div className="popup-overlay">
                    <div className="popup">
                        <h3>Выберите человека</h3>
                        <ul>
                            {filteredPeople.map((person) => (
                                <li key={person.name} onClick={() => handleSelectPerson(person)}>
                                    {person.name}
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => setIsPopupVisible(false)}>Закрыть</button>
                    </div>
                </div>
            )}
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
        <div ref={drag} className="group" style={{ opacity: isDragging ? 0.5 : 1 }}>
            <h4>{groupName}</h4>
        </div>
    );
};




const NewTable = ({ draggingGroup, setTables, setDraggingGroup , setPeople }) => {
    const [{ isOver }, drop] = useDrop({
        accept: 'GROUP',
        drop: (item) => {
            // Ensure the group isn't too large
            if (item.group.length <= 12) {
                const newTable = {
                    id: Date.now(), // Unique ID for the table
                    people: item.group, // Assign the dropped group to the table
                    chairCount: item.group.length, // Number of chairs is equal to the group size
                };

                // Add the new table to the state
                setTables((prevTables) => [...prevTables, newTable]);
                setPeople((prevPeople) =>
                    prevPeople.filter((person) => !item.group.some((groupPerson) => groupPerson.name === person.name))
                );
            
            } else {
                alert('Новый стол не может содержать больше 12 человек!');
            }

            // Reset the dragging group after the drop
            setDraggingGroup(null);
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(), // Determine if the area is being hovered
        }),
    });

    return (
        <div
            ref={drop}
            className={`new-table ${isOver ? 'hovered' : ''}`} // Add a visual effect when hovered
            style={{
                border: '2px dashed gray',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: isOver ? '#e0e0e0' : '#f5f5f5',
            }}
        >
            Перетащите группу сюда, чтобы создать новый стол
        </div>
    );
};


export default SeatingArrangement;