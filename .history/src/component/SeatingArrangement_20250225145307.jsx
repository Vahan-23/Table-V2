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
        setTables([...tables, { id: Date.now(), people: [] }]);
    };

    const handleDeleteTable = (tableId) => {
        setTables(tables.filter((table) => table.id !== tableId));
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
                groupName={`Группа ${index + 1}`}
                setDraggingGroup={setDraggingGroup}
            />
        ));
    };


    return (
        <DndProvider backend={HTML5Backend}>
            <div className="container">
                <div className="left-panel">
                    <div className="controls">
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

                                <h3>Группы для перетаскивания:</h3>
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
                        />

                    ))}

                    {draggingGroup && (
                        <NewTable
                            draggingGroup={draggingGroup}
                            setTables={setTables}
                            setDraggingGroup={setDraggingGroup}
                        />
                    )}
                </div>
            </div>
        </DndProvider>
    );
};

const Table = ({ table, setTables, handleDeleteTable, draggingGroup, setDraggingGroup }) => {
    const [, drop] = useDrop({
        accept: 'GROUP',
        drop: (item) => {
            if (table.people.length + item.group.length <= 12) {
                // Добавляем людей в текущий стол
                setTables((prevTables) =>
                    prevTables.map((t) =>
                        t.id === table.id
                            ? { ...t, people: [...t.people, ...item.group] }
                            : t
                    )
                );
                setDraggingGroup(null); // Сбрасываем перетаскиваемую группу
            } else {
                alert('На столе не может быть больше 12 человек!');
            }
        },
    });

    const chairs = [];
    const maxChairs = 12;
    const angleStep = 360 / maxChairs;
    const radius = 140;

    // Генерация стульев для стола
    for (let i = 0; i < maxChairs; i++) {
        const angle = angleStep * i;

        // Рассчитываем координаты для стула относительно центра стола
        const xPosition = radius * Math.cos((angle * Math.PI) / 180);
        const yPosition = radius * Math.sin((angle * Math.PI) / 180);

        const chairStyle = {
            position: 'absolute',
            top: '50%', // Центр стола
            left: '50%', // Центр стола
            transformOrigin: 'center', // Ориентируем вращение на центре
            width: '60px',
            height: '60px',
            // backgroundColor: table.people[i] ? '#ccc0' : '#ccc0',
            backgroundImage: table.people[i] ? "url('/red.png')" : "url('/green.png')", // Правильный путь для public
            backgroundSize: 'cover', // Растягивает картинку на всю область
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            color: 'white',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '50%',
            fontSize: '12px',
            textAlign: 'center',
            left: `calc(50% + ${xPosition}px)`, // Смещаем стулья по оси X
            top: `calc(50% + ${yPosition}px)`,  // Смещаем стулья по оси Y
        };

        // Переворачиваем стулья в зависимости от их положения:
        if (angle >= 0 && angle < 90) {
            chairStyle.transform = `rotate(${angle + 90}deg)`;; // Верхняя половина стола (0-90°)
        } else if (angle >= 90 && angle < 180) {
            chairStyle.transform = `rotate(${angle + 90}deg)`;; // Правая часть стола (90-180°)
        } else if (angle >= 180 && angle < 270) {
            chairStyle.transform = `rotate(${angle + 90}deg)`; // Нижняя половина стола (180-270°)
        } else {
            chairStyle.transform = `rotate(${angle + 90}deg)`; // Левая часть стола (270-360°)
        }

        chairs.push(
            <div key={i} className="chair" style={chairStyle}>
                {table.people[i] ? table.people[i].name : ''}
            </div>
        );
    }

    return (
        <div ref={drop} className="tableContainer">
            <h3>Стол {table.id}</h3>
            <div className="table">
                <div className="table-top">
                    {chairs}
                    chairs.push(
                    <div key={i} className="chair" style={chairStyle}>
                        {table.people[i] ? table.people[i].name : ''}
                    </div>
                    );
                </div>
            </div>
            <button onClick={() => handleDeleteTable(table.id)}>Удалить стол</button>
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




const NewTable = ({ draggingGroup, setTables, setDraggingGroup }) => {
    const [, drop] = useDrop({
        accept: 'GROUP',
        drop: (item) => {
            if (item.group.length <= 12) {
                const newTable = {
                    id: Date.now(),
                    people: item.group,
                };
                setTables((prevTables) => [...prevTables, newTable]);
            } else {
                alert('Новый стол не может содержать больше 12 человек!');
            }
            setDraggingGroup(null);
        },
    });

    return (
        <div ref={drop} className="new-table">
            Перетащите группу сюда, чтобы создать новый стол
        </div>
    );
};

export default SeatingArrangement;