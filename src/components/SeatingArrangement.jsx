import React, { useState, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import './App.css';
import TablesAreaComponent from './newhall';

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
    const [showGroupDropdown, setShowGroupDropdown] = useState(false);
    const [isCustomGroup, setIsCustomGroup] = useState(false);
    const [tableCount, setTableCount] = useState(1);
    const groupDropdownRef = useRef(null);
    const [halls, setHalls] = useState([]);
    const [currentHall, setCurrentHall] = useState(null);
    const [showHallModal, setShowHallModal] = useState(false);
    const [newHallName, setNewHallName] = useState('');
    const [newHallTableCount, setNewHallTableCount] = useState(10);
    const [newHallChairCount, setNewHallChairCount] = useState(12);
    const [activeNavSection, setActiveNavSection] = useState(null);
    const [hoveredSection, setHoveredSection] = useState(null);
    const navRefs = useRef({});
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);
    const tablesAreaRef = useRef(null);

    window.currentDraggedGroup = null;

    const [detailsTableId, setDetailsTableId] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Handler to show table details
    const handleShowTableDetails = (tableId) => {
        setDetailsTableId(tableId);
        setIsDetailsOpen(true);
    };

    // Handler to close table details
    const handleCloseTableDetails = () => {
        setIsDetailsOpen(false);

        // Add a small delay before clearing the table ID to allow for smooth transition
        setTimeout(() => {
            setDetailsTableId(null);
        }, 300);
    };

    // Function to get the current table for details
    const getDetailsTable = () => {
        return tables.find(table => table.id === detailsTableId);
    };

    // Function to highlight a table when showing its details
    const isTableHighlighted = (tableId) => {
        return detailsTableId === tableId && isDetailsOpen;
    };

    const handleTableDrop = (e, tableId) => {
        // If there's drag data in the global variable, use it
        if (window.currentDraggedGroup) {
            const data = window.currentDraggedGroup;
            processGroupTransfer(data, tableId, tables, setTables);
            return;
        }

        // If not, try to get data from dataTransfer
        try {
            // First try to get the type identifier
            const typeId = e.dataTransfer.getData('text/plain');

            if (typeId === 'SEATED_GROUP') {
                // Then try to get the JSON data
                try {
                    const jsonData = e.dataTransfer.getData('application/json');
                    if (jsonData) {
                        const data = JSON.parse(jsonData);
                        processGroupTransfer(data, tableId, tables, setTables);
                    } else {
                        console.error('Failed to get JSON data about the dragged group');
                    }
                } catch (jsonError) {
                    console.error('Error parsing JSON data:', jsonError);
                }
            } else {
                console.log('Dragged element type is not SEATED_GROUP:', typeId);
            }
        } catch (error) {
            console.error('Error getting drag data:', error);
        }
    };

    // Process group transfer between tables
    const processGroupTransfer = (data, targetTableId, tables, setTables) => {
        const sourceTableId = data.tableId;
        const groupName = data.groupName;

        // Don't process if dropped on the same table
        if (sourceTableId === targetTableId) return;

        // Find source and target tables
        const sourceTable = tables.find(t => t.id === sourceTableId);
        const targetTable = tables.find(t => t.id === targetTableId);

        if (!sourceTable || !targetTable) {
            console.error('Source or target table not found');
            return;
        }

        // Get people from this group in the source table
        const groupPeople = sourceTable.people.filter(p => p && p.group === groupName);

        if (groupPeople.length === 0) {
            console.error('No people found to move');
            return;
        }

        // Check if target table has enough free seats
        const targetFreeSeats = targetTable.chairCount - targetTable.people.filter(Boolean).length;

        if (targetFreeSeats < groupPeople.length) {
            alert(`Not enough free seats at the table (need ${groupPeople.length}, available ${targetFreeSeats})`);
            return;
        }

        // Update tables
        setTables(prevTables => {
            return prevTables.map(table => {
                if (table.id === sourceTableId) {
                    // Remove people from source table
                    return {
                        ...table,
                        people: table.people.map(person =>
                            (person && person.group === groupName) ? null : person
                        )
                    };
                } else if (table.id === targetTableId) {
                    // Add people to target table
                    const newPeople = [...table.people];
                    let peopleAdded = 0;

                    // Fill empty seats first
                    for (let i = 0; i < newPeople.length && peopleAdded < groupPeople.length; i++) {
                        if (!newPeople[i]) {
                            newPeople[i] = groupPeople[peopleAdded];
                            peopleAdded++;
                        }
                    }

                    // If there are still people to add, append them
                    while (peopleAdded < groupPeople.length) {
                        newPeople.push(groupPeople[peopleAdded]);
                        peopleAdded++;
                    }

                    return {
                        ...table,
                        people: newPeople
                    };
                }
                return table;
            });
        });

        // Show transfer notification
        showTransferNotification(groupName, targetTableId);
    };

    // Function to display transfer notification
    const showTransferNotification = (groupName, tableId) => {
        const notification = document.createElement('div');
        notification.className = 'transfer-notification';
        notification.textContent = `Group ${groupName} moved to table ${tableId}`;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 2000);
        }, 100);
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.1, 2));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.1, 0.5));
    };

    const handleCanvasMouseDown = (e) => {
        // Только если клик был на самом холсте, а не на столах
        if (e.target === tablesAreaRef.current) {
            setIsDraggingCanvas(true);
            setDragStartPos({
                x: e.clientX + tablesAreaRef.current.scrollLeft,
                y: e.clientY + tablesAreaRef.current.scrollTop
            });
            e.preventDefault();
        }
    };
    const handleMouseMove = (e) => {
        if (isDraggingCanvas) {
            tablesAreaRef.current.scrollLeft = dragStartPos.x - e.clientX;
            tablesAreaRef.current.scrollTop = dragStartPos.y - e.clientY;
        }
    };

    const handleMouseUp = () => {
        setIsDraggingCanvas(false);
    }

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingCanvas]);
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeNavSection && navRefs.current[activeNavSection] && !navRefs.current[activeNavSection].contains(event.target)) {
                setActiveNavSection(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeNavSection]);
    useEffect(() => {
        const savedHalls = JSON.parse(localStorage.getItem('halls')) || [];
        if (savedHalls.length) setHalls(savedHalls);
    }, []);

    // Save hall configuration
    const saveHall = () => {
        if (!currentHall) {
            alert('Խնդրում ենք նախ ընտրել դահլիճը');
            return;
        }

        const updatedHalls = halls.map(hall =>
            hall.id === currentHall.id
                ? { ...hall, tables: tables }
                : hall
        );

        setHalls(updatedHalls);
        localStorage.setItem('halls', JSON.stringify(updatedHalls));
        alert(`Դահլիճը "${currentHall.name}" հաջողությամբ պահպանվել է`);
    };

    // Create a new hall
    const createNewHall = (hallName, tableCount, chairCount) => {
        if (!hallName || !hallName.trim()) {
            alert('Խնդրում ենք մուտքագրել դահլիճի անունը');
            return;
        }

        // Generate tables based on settings
        const newTables = [];
        const numTables = Math.max(1, parseInt(tableCount) || 10);
        const numChairs = Math.max(1, parseInt(chairCount) || 12);

        for (let i = 0; i < numTables; i++) {
            newTables.push({
                id: Date.now() + i,
                people: [],
                chairCount: numChairs
            });
        }

        const newHall = {
            id: Date.now(),
            name: hallName.trim(),
            tables: newTables
        };

        // Update halls state and localStorage
        const updatedHalls = [...halls, newHall];
        setHalls(updatedHalls);
        localStorage.setItem('halls', JSON.stringify(updatedHalls));

        // Set as current hall
        setCurrentHall(newHall);
        setTables(newTables);

        // Close the modal
        setShowHallModal(false);
    };

    // Load a hall configuration
    const loadHall = (hall) => {
        setCurrentHall(hall);
        setTables(hall.tables);
    };

    // Delete a hall
    const deleteHall = (hallId) => {
        if (window.confirm('Վստա՞հ եք, որ ցանկանում եք ջնջել այս դահլիճը:')) {
            const updatedHalls = halls.filter(hall => hall.id !== hallId);
            setHalls(updatedHalls);
            localStorage.setItem('halls', JSON.stringify(updatedHalls));

            // If current hall is deleted, reset current hall
            if (currentHall && currentHall.id === hallId) {
                setCurrentHall(null);
                setTables([]);
            }
        }
    };

    const HallModal = () => {
        const nameInputRef = useRef(null);

        useEffect(() => {
            if (nameInputRef.current) {
                nameInputRef.current.focus();
            }
        }, []);

        const [hallName, setHallName] = useState('');
        const [tableCount, setTableCount] = useState(10);
        const [chairCount, setChairCount] = useState(12);

        const handleTableCountChange = (e) => {
            const value = e.target.value;
            setTableCount(value === '' ? '' : Math.max(1, parseInt(value) || 1));
        };

        const handleChairCountChange = (e) => {
            const value = e.target.value;
            setChairCount(value === '' ? '' : Math.max(1, parseInt(value) || 1));
        };

        return (
            <div className="fullscreen-popup">
                <div className="fullscreen-popup-content">
                    <h3 className="popup-title">Ստեղծել նոր դահլիճ</h3>

                    <div className="hall-form">
                        <div className="form-group">
                            <label htmlFor="hallName">Դահլիճի անունը:</label>
                            <input
                                id="hallName"
                                type="text"
                                ref={nameInputRef}
                                value={hallName}
                                onChange={(e) => setHallName(e.target.value)}
                                placeholder="Օր․՝ Dvin Hall"
                                className="input-field"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="tableCount">Սեղանների քանակը:</label>
                            <input
                                id="tableCount"
                                type="number"
                                min="1"
                                value={tableCount}
                                onChange={handleTableCountChange}
                                className="input-field"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="chairCount">Աթոռների քանակը մեկ սեղանի համար:</label>
                            <input
                                id="chairCount"
                                type="number"
                                min="1"
                                value={chairCount}
                                onChange={handleChairCountChange}
                                className="input-field"
                            />
                        </div>

                        <div className="popup-buttons">
                            <button
                                type="button"
                                className="primary-btn"
                                onClick={() => createNewHall(hallName, tableCount, chairCount)}
                            >
                                Ստեղծել դահլիճ
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowHallModal(false)}
                                className="cancel-btn"
                            >
                                Չեղարկել
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };


    // Hall Management UI component
    const HallManagement = () => {
        return (
            <div className="hall-management">
                <h3 className="section-main-title">Դահլիճների կառավարում</h3>

                <div className="hall-controls">
                    <div className="hall-dropdown-container">
                        <select
                            value={currentHall ? currentHall.id : ""}
                            onChange={(e) => {
                                const selectedHall = halls.find(h => h.id === parseInt(e.target.value));
                                if (selectedHall) loadHall(selectedHall);
                            }}
                            className="hall-select"
                        >
                            <option value="">Ընտրեք դահլիճը</option>
                            {halls.map(hall => (
                                <option key={hall.id} value={hall.id}>
                                    {hall.name} ({hall.tables.length} սեղան)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="hall-buttons">
                        <button
                            className="primary-btn create-hall-btn"
                            onClick={() => setShowHallModal(true)}
                        >
                            Ստեղծել նոր դահլիճ
                        </button>

                        <button
                            className="primary-btn save-hall-btn"
                            onClick={saveHall}
                            disabled={!currentHall}
                        >
                            Պահպանել դահլիճը
                        </button>

                        {currentHall && (
                            <button
                                className="secondary-btn delete-hall-btn"
                                onClick={() => deleteHall(currentHall.id)}
                            >
                                Ջնջել դահլիճը
                            </button>
                        )}
                    </div>
                </div>

                {currentHall && (
                    <div className="current-hall-info">
                        <h4>Ընթացիկ դահլիճ: {currentHall.name}</h4>
                        <p>{currentHall.tables.length} սեղաններ</p>
                    </div>
                )}
            </div>
        );
    };

    { showHallModal && <HallModal /> }
    const handleTableCountChange = (e) => {
        setTableCount(parseInt(e.target.value, 10) || 1);
    };

    const handleAddMultipleTables = () => {
        const newTables = [];
        const currentTime = Date.now();

        for (let i = 0; i < tableCount; i++) {
            newTables.push({
                id: currentTime + i, // Ensure unique IDs
                people: [],
                chairCount
            });
        }

        setTables(prevTables => [...newTables, ...prevTables]);
    };

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
    const totalPeople = people.length;
    // const seatedCount = seatedPeople.length;
    const unseatedCount = totalPeople;

    const PeopleSection = ({ people, tables, handleDeletePerson, setPeople, setTables }) => {
        // States for controlling collapse/expand for both sections
        const [isSeatedExpanded, setIsSeatedExpanded] = useState(true);
        const [isUnseatedExpanded, setIsUnseatedExpanded] = useState(true);

        // State for the removal confirmation popup
        const [showRemovalPopup, setShowRemovalPopup] = useState(false);
        const [personToHandle, setPersonToHandle] = useState(null);

        // Toggle functions
        const toggleSeatedExpand = () => {
            setIsSeatedExpanded(!isSeatedExpanded);
        };

        const toggleUnseatedExpand = () => {
            setIsUnseatedExpanded(!isUnseatedExpanded);
        };

        // Filter seated and unseated people
        const seatedPeople = [];
        tables.forEach(table => {
            table.people.forEach(person => {
                if (person) seatedPeople.push(person);
            });
        });

        const unseatedPeople = people.filter(person =>
            !seatedPeople.some(seated => seated.name === person.name)
        );

        // Calculate counts
        const totalPeople = unseatedPeople.length + seatedPeople.length;
        const seatedCount = seatedPeople.length;
        const unseatedCount = unseatedPeople.length;

        // Handle deletion with confirmation for seated people
        const handleSeatedPersonDelete = (event, person) => {
            event.stopPropagation();
            setPersonToHandle(person);
            setShowRemovalPopup(true);
        };

        // Handle direct deletion for unseated people
        const handleUnseatedPersonDelete = (event, personName) => {
            event.stopPropagation();
            handleDeletePerson(personName);
        };

        // Function to completely delete a person
        const handleCompleteDelete = () => {
            if (personToHandle) {
                // Remove person from tables
                setTables(prevTables => {
                    return prevTables.map(table => {
                        const updatedPeople = table.people.map(p =>
                            p && p.name === personToHandle.name ? null : p
                        );
                        return { ...table, people: updatedPeople };
                    });
                });

                // Remove person from people list
                handleDeletePerson(personToHandle.name);
                setShowRemovalPopup(false);
                setPersonToHandle(null);
            }
        };

        // Function to just unseat a person
        const handleUnseat = () => {
            if (personToHandle) {
                // Remove person from tables but add to unseated list
                setTables(prevTables => {
                    return prevTables.map(table => {
                        const updatedPeople = table.people.map(p =>
                            p && p.name === personToHandle.name ? null : p
                        );
                        return { ...table, people: updatedPeople };
                    });
                });

                // Make sure the person is in the people list
                setPeople(prevPeople => {
                    // Only add if not already in the list
                    if (!prevPeople.some(p => p.name === personToHandle.name)) {
                        return [...prevPeople, personToHandle];
                    }
                    return prevPeople;
                });

                setShowRemovalPopup(false);
                setPersonToHandle(null);
            }
        };

        // Close the popup
        const closePopup = () => {
            setShowRemovalPopup(false);
            setPersonToHandle(null);
        };

        return (
            <div className="people-section">
                <div className="total-people-counter">
                    <h3>Ընդհանուր մարդիկ: {totalPeople}</h3>
                </div>

                {/* Seated People Box */}
                <div className="people-box">
                    <div className="people-header" onClick={toggleSeatedExpand}>
                        <h3>Նստած մարդիկ ({seatedCount})</h3>
                        <div className={`expand-arrow ${isSeatedExpanded ? 'expanded' : ''}`}>
                            ▼
                        </div>
                    </div>

                    {isSeatedExpanded && (
                        <div className="people-grid-container">
                            <div className="people-grid">
                                {seatedPeople.length > 0 ? (
                                    seatedPeople.map((person, index) => (
                                        <div key={index} className="person-card seated">
                                            <span className="person-name">{person.name}</span>
                                            <span className="person-group">Խումբ {person.group}</span>
                                            <button
                                                onClick={(e) => handleSeatedPersonDelete(e, person)}
                                                className="delete-btn"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-message">Չկան նստած մարդիկ</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Unseated People Box */}
                <div className="people-box">
                    <div className="people-header" onClick={toggleUnseatedExpand}>
                        <h3>Մարդիկ առանց սեղանների ({unseatedCount})</h3>
                        <div className={`expand-arrow ${isUnseatedExpanded ? 'expanded' : ''}`}>
                            ▼
                        </div>
                    </div>

                    {isUnseatedExpanded && (
                        <div className="people-grid-container">
                            <div className="people-grid">
                                {unseatedPeople.length > 0 ? (
                                    unseatedPeople.map((person, index) => (
                                        <div key={index} className="person-card unseated">
                                            <span className="person-name">{person.name}</span>
                                            <span className="person-group">Խումբ {person.group}</span>
                                            <button
                                                onClick={(e) => handleUnseatedPersonDelete(e, person.name)}
                                                className="delete-btn"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-message">Բոլոր մարդիկ նստած են</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Removal confirmation popup */}
                {showRemovalPopup && personToHandle && (
                    <div className="fullscreen-popup" onClick={closePopup}>
                        <div className="fullscreen-popup-content" onClick={(e) => e.stopPropagation()}>
                            <h3 className="popup-title">Ի՞նչ եք ուզում անել այս անձի հետ:</h3>

                            <div className="person-info-card">
                                <p className="person-info-name">{personToHandle.name}</p>
                                <p className="person-info-group">Խումբ {personToHandle.group}</p>
                            </div>

                            <div className="popup-buttons">
                                <button onClick={handleCompleteDelete} className="remove-btn">
                                    Ամբողջությամբ հեռացնել
                                </button>

                                <button onClick={handleUnseat} className="unseat-btn">
                                    Հեռացնել աթոռից միայն
                                </button>

                                <button onClick={closePopup} className="cancel-btn">
                                    Չեղարկել
                                </button>
                            </div>
                        </div>
                    </div>
                )}
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
                return Math.min(Math.max(newZoom, 0.2), 1.5);
            });
        }
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

        let anyGroupsSeated = false;

        // Create a new tables state
        const updatedTables = [...tables];

        // Try to seat each group at existing tables
        Object.entries(unseatedGrouped).forEach(([groupName, groupMembers]) => {
            if (groupMembers.length === 0) return;

            // Find tables with enough free seats
            for (const table of updatedTables) {
                const emptySeats = table.chairCount - table.people.filter(Boolean).length;

                if (emptySeats >= groupMembers.length) {
                    // This table has enough space for the group
                    const newPeople = [...table.people];

                    // Find empty spots and fill them
                    let groupIndex = 0;
                    for (let i = 0; i < newPeople.length && groupIndex < groupMembers.length; i++) {
                        if (!newPeople[i]) {
                            newPeople[i] = groupMembers[groupIndex];
                            groupIndex++;
                        }
                    }

                    // If we haven't filled all spots (which shouldn't happen given our check),
                    // add remaining people
                    while (groupIndex < groupMembers.length) {
                        newPeople.push(groupMembers[groupIndex]);
                        groupIndex++;
                    }

                    table.people = newPeople;
                    anyGroupsSeated = true;

                    // Remove these people from unseatedGrouped
                    unseatedGrouped[groupName] = [];
                    break;
                }
            }
        });

        // If there are still unseated groups, create new tables for them
        const remainingGroups = Object.values(unseatedGrouped).filter(group => group.length > 0);

        if (remainingGroups.length > 0) {
            const newTables = remainingGroups.map(group => ({
                id: Date.now() + Math.random(), // Ensure unique ID
                people: group,
                chairCount: group.length // Set chair count to match group size
            }));

            updatedTables.push(...newTables);
            anyGroupsSeated = true;
        }

        if (!anyGroupsSeated) {
            alert('Բոլոր խմբերն արդեն նստած են սեղանների մոտ կամ հասանելի մարդիկ չկան:');
            return;
        }

        // Update the tables state
        setTables(updatedTables);

        // Remove the seated people from the people list
        setPeople(prevPeople =>
            prevPeople.filter(person =>
                !updatedTables.some(table =>
                    table.people.some(seatedPerson =>
                        seatedPerson && seatedPerson.name === person.name
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
                    <div className="header-top">
                        <div className="logo">Նստատեղերի դասավորություն</div>
                        <nav className="main-nav">
                            <ul className="nav-list">
                                <li
                                    className={`nav-item ${activeNavSection === 'hall' ? 'active' : ''}`}
                                    onMouseEnter={() => setHoveredSection('hall')}
                                    onMouseLeave={() => setHoveredSection(null)}
                                    ref={el => navRefs.current['hall'] = el}
                                >
                                    <a
                                        href="#hall"
                                        className="nav-link"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setActiveNavSection(activeNavSection === 'hall' ? null : 'hall');
                                        }}
                                    >
                                        Դահլիճի կառավարում
                                    </a>
                                    {(hoveredSection === 'hall' || activeNavSection === 'hall') && (
                                        <div className="dropdown-menu">
                                            <div className="dropdown-content hall-section">
                                                <HallManagement />
                                            </div>
                                        </div>
                                    )}
                                </li>
                                <li
                                    className={`nav-item ${activeNavSection === 'people' ? 'active' : ''}`}
                                    onMouseEnter={() => setHoveredSection('people')}
                                    onMouseLeave={() => setHoveredSection(null)}
                                    ref={el => navRefs.current['people'] = el}
                                >
                                    <a
                                        href="#people"
                                        className="nav-link"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setActiveNavSection(activeNavSection === 'people' ? null : 'people');
                                        }}
                                    >
                                        Մարդկանց կառավարում
                                    </a>
                                    {(hoveredSection === 'people' || activeNavSection === 'people') && (
                                        <div className="dropdown-menu">
                                            <div className="dropdown-content people-section">
                                                <h3 className="section-title">Մարդկանց կառավարում</h3>
                                                <div className="input-group">
                                                    <div className="input-row">
                                                        <input
                                                            type="text"
                                                            value={peopleInput}
                                                            onChange={(e) => setPeopleInput(e.target.value)}
                                                            placeholder="Մուտքագրեք անուն"
                                                            className="input-field"
                                                        />
                                                        <div className="group-input-container" ref={groupDropdownRef}>
                                                            <input
                                                                type="text"
                                                                value={groupInput}
                                                                onChange={handleGroupInputChange}
                                                                placeholder="Խմբի համար"
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
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </li>
                                <li
                                    className={`nav-item ${activeNavSection === 'tables' ? 'active' : ''}`}
                                    onMouseEnter={() => setHoveredSection('tables')}
                                    onMouseLeave={() => setHoveredSection(null)}
                                    ref={el => navRefs.current['tables'] = el}
                                >
                                    <a
                                        href="#tables"
                                        className="nav-link"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setActiveNavSection(activeNavSection === 'tables' ? null : 'tables');
                                        }}
                                    >
                                        Սեղանների կառավարում
                                    </a>
                                    {(hoveredSection === 'tables' || activeNavSection === 'tables') && (
                                        <div className="dropdown-menu">
                                            <div className="dropdown-content tables-section">
                                                <h3 className="section-title">Սեղանների կառավարում</h3>
                                                <div className="table-controls">
                                                    <div className="table-controls-row">
                                                        <div className="chair-count-container">
                                                            <label htmlFor="chair-count">Աթոռների քանակ:</label>
                                                            <input
                                                                id="chair-count"
                                                                type="number"
                                                                value={chairCount}
                                                                onChange={handleChairCountChange}
                                                                min="1"
                                                                className="chair-count-input"
                                                            />
                                                        </div>
                                                        <div className="table-count-container">
                                                            <label htmlFor="table-count">Սեղանների քանակ:</label>
                                                            <input
                                                                id="table-count"
                                                                type="number"
                                                                value={tableCount}
                                                                onChange={handleTableCountChange}
                                                                min="1"
                                                                className="table-count-input"
                                                            />
                                                        </div>
                                                        <button
                                                            className="primary-btn add-multiple-tables-btn chair-count-container"
                                                            onClick={handleAddMultipleTables}
                                                        >
                                                            Ավելացնել {tableCount} սեղան
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </li>
                                <li
                                    className={`nav-item ${activeNavSection === 'groups' ? 'active' : ''}`}
                                    onMouseEnter={() => setHoveredSection('groups')}
                                    onMouseLeave={() => setHoveredSection(null)}
                                    ref={el => navRefs.current['groups'] = el}
                                >
                                    <a
                                        href="#groups"
                                        className="nav-link"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setActiveNavSection(activeNavSection === 'groups' ? null : 'groups');
                                        }}
                                    >
                                        Խմբերի կառավարում
                                    </a>
                                    {(hoveredSection === 'groups' || activeNavSection === 'groups') && (
                                        <div className="dropdown-menu">
                                            <div className="dropdown-content groups-section">
                                                <button
                                                    className="secondary-btn seed-data-btn"
                                                    onClick={() => setPeople(getSeedData())}
                                                >
                                                    Ավելացնել փորձնական տվյալներ
                                                </button>
                                                <button
                                                    className="secondary-btn clear-data-btn"
                                                    onClick={() => setPeople([])}
                                                >
                                                    Մաքրել բոլոր տվյալները
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </li>
                            </ul>
                        </nav>
                    </div>

                    {showHallModal && <HallModal />}
                </header>
                <div className="groups-container">
                    <div className="groups-header">
                        <div className="data-management">
                            <div className="data-buttons">

                                <button
                                    className="secondary-btn create-all-tables-btn"
                                    onClick={createTablesForAllGroups}
                                >
                                    Ավտոմատ դասավորել խմբերը
                                </button>
                            </div>
                        </div>
                        <h3 className="groups-title">Հասանելի խմբեր (քաշեք համապատասխան սեղանի վրա)</h3>
                        <div className="groups-wrapper">
                            {renderGroups()}
                        </div>
                    </div>
                </div>
                <div className="main-content">
                    <div className="sidebar">
                        <PeopleSection
                            people={people}
                            tables={tables}
                            handleDeletePerson={handleDeletePerson}
                            setPeople={setPeople}
                            setTables={setTables}
                        />
                    </div>
                    <TableDetailsPopup
                        table={getDetailsTable()}
                        tables={tables}
                        setTables={setTables}
                        isOpen={isDetailsOpen}
                        onClose={handleCloseTableDetails}
                        setPeople={setPeople}
                    />
                    <div className="figmaContainer">
                        <div className="zoom-controls">
                            <label>Մասշտաբ:</label>
                            <div className="zoom-buttons">
                                <button
                                    className="zoom-btn zoom-out-btn"
                                    onClick={handleZoomOut}
                                >−</button>
                                <span className="zoom-percentage">
                                    {Math.round(zoom * 100)}%
                                </span>
                                <button
                                    className="zoom-btn zoom-in-btn"
                                    onClick={handleZoomIn}
                                >+</button>
                            </div>
                        </div>

                        <div
                            className="tables-area"
                            ref={tablesAreaRef}
                            onMouseDown={handleCanvasMouseDown}
                            style={{
                                transform: `scale(${zoom})`,
                                transformOrigin: 'top left',
                                display: 'flex',
                                overflow: 'auto',
                                flexWrap: 'wrap',
                                gap: '20px',
                                padding: '20px',
                                width: `${100 / zoom}%`,
                                minHeight: `${100 / zoom}%`,
                                justifyContent: "center",
                                position: 'relative',
                                cursor: isDraggingCanvas ? 'grabbing' : 'default'
                            }}
                        >
                            {draggingGroup && (
                                <NewTable
                                    draggingGroup={draggingGroup}
                                    setTables={setTables}
                                    setDraggingGroup={setDraggingGroup}
                                    setPeople={setPeople}
                                />
                            )}

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
                                    isDraggable={true}
                                    onShowDetails={handleShowTableDetails}
                                    onDrop={(e) => handleTableDrop(e, table.id)}
                                    isTableHighlighted={isTableHighlighted(table.id)}
                                    tables={tables} // Pass all tables for the drop handler
                                />
                            ))}
                        </div>
                    </div>
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
        </DndProvider >
    )
};


const Table = ({ table, setTables, handleDeleteTable, draggingGroup, setDraggingGroup, people, setPeople, onChairClick, isDraggable, onShowDetails, onDrop, isTableHighlighted }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const tableRef = useRef(null);

    const handleDragStart = (e) => {
        if (!isDraggable) return;

        setIsDragging(true);
        const rect = tableRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        e.stopPropagation();
    };

    const handleResizeStart = (e) => {
        setIsResizing(true);
        e.stopPropagation();
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            const container = tableRef.current.parentElement.getBoundingClientRect();
            const zoom = parseFloat(tableRef.current.parentElement.style.transform.match(/scale\(([^)]+)\)/)[1] || 1);

            const newX = (e.clientX - container.left - dragOffset.x) / zoom;
            const newY = (e.clientY - container.top - dragOffset.y) / zoom;

            setTables(prev => prev.map(t =>
                t.id === table.id ? { ...t, x: newX, y: newY } : t
            ));
        } else if (isResizing) {
            const container = tableRef.current.parentElement.getBoundingClientRect();
            const zoom = parseFloat(tableRef.current.parentElement.style.transform.match(/scale\(([^)]+)\)/)[1] || 1);

            const newWidth = Math.max(100, (e.clientX - container.left - table.x * zoom) / zoom);
            const newHeight = Math.max(100, (e.clientY - container.top - table.y * zoom) / zoom);

            setTables(prev => prev.map(t =>
                t.id === table.id ? { ...t, width: newWidth, height: newHeight } : t
            ));
        }
    };

    const handleMouseUp = (e) => {
        setIsDragging(false);
        setIsResizing(false);

        const rect = tableRef.current.getBoundingClientRect();
        tableRef.current.x = e.clientX - rect.left;
        tableRef.current.y = e.clientY - rect.top;
    };

    React.useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing]);

    // Add a handler for the details button
    const handleShowDetails = (e) => {
        e.stopPropagation(); // Prevent triggering drag start
        onShowDetails(table.id);
    };

    // Enhanced drop target to handle both regular group drops and seated group transfers
    const [{ isOver }, drop] = useDrop({
        accept: ['GROUP', 'SEATED_GROUP'],
        drop: (item, monitor) => {
            const itemType = monitor.getItemType();

            if (itemType === 'GROUP') {
                // Handle regular group drop (from the people sidebar)
                if (table.people.filter(Boolean).length + item.group.length <= table.chairCount) {
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
                    alert(`The table cannot have more than ${table.chairCount} people`);
                }
            } else if (itemType === 'SEATED_GROUP') {
                // Pass the drop event to the parent component's handler
                onDrop && onDrop(monitor.getDropResult());
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver()
        })
    });

    // Отдельная функция для обработки перетаскивания группы с сидячих мест
    const handleSeatedGroupDrop = (groupData) => {
        const sourceTableId = groupData.tableId;
        const groupName = groupData.groupName;
        const targetTableId = table.id;

        // Не обрабатываем, если перетаскивание на тот же стол
        if (sourceTableId === targetTableId) return;

        // Получаем исходный и целевой столы
        const sourceTable = table.find(t => t.id === sourceTableId);
        const targetTable = table.find(t => t.id === targetTableId);

        if (!sourceTable || !targetTable) {
            console.error('Не удалось найти исходный или целевой стол');
            return;
        }

        // Получаем людей из этой группы на исходном столе
        const groupPeople = sourceTable.people.filter(p => p && p.group === groupName);

        if (groupPeople.length === 0) {
            console.error('Не найдены люди в группе для перемещения');
            return;
        }

        // Проверяем, достаточно ли свободных мест на целевом столе
        const targetFreeSeats = targetTable.chairCount - targetTable.people.filter(Boolean).length;

        if (targetFreeSeats < groupPeople.length) {
            alert(`На столе недостаточно свободных мест для этой группы (нужно ${groupPeople.length}, доступно ${targetFreeSeats})`);
            return;
        }

        // Обновляем столы
        setTables(prevTables => {
            return prevTables.map(t => {
                if (t.id === sourceTableId) {
                    // Удаляем людей с исходного стола
                    return {
                        ...t,
                        people: t.people.map(person =>
                            (person && person.group === groupName) ? null : person
                        )
                    };
                } else if (t.id === targetTableId) {
                    // Добавляем людей на целевой стол
                    const newPeople = [...t.people];
                    let peopleAdded = 0;

                    // Сначала заполняем пустые места
                    for (let i = 0; i < newPeople.length && peopleAdded < groupPeople.length; i++) {
                        if (!newPeople[i]) {
                            newPeople[i] = groupPeople[peopleAdded];
                            peopleAdded++;
                        }
                    }

                    // Если еще остались люди, добавляем их
                    while (peopleAdded < groupPeople.length) {
                        newPeople.push(groupPeople[peopleAdded]);
                        peopleAdded++;
                    }

                    return {
                        ...t,
                        people: newPeople
                    };
                }
                return t;
            });
        });

        // Показываем уведомление об успешном перемещении
        const notification = document.createElement('div');
        notification.className = 'transfer-notification';
        notification.textContent = `Группа ${groupName} перемещена на стол ${targetTableId}`;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 2000);
        }, 100);
    };

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
        <div
            ref={node => {
                tableRef.current = node;
                drop(node);
            }}
            className={`table-container ${isOver ? 'drop-target' : ''} ${isTableHighlighted ? 'highlighted-table' : ''}`}
            onDrop={(e) => onDrop && onDrop(e)}
            onDragOver={(e) => e.preventDefault()}
            style={{
                position: 'absolute',
                left: `${table.x || 0}px`,
                top: `${table.y || 0}px`,
                cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleDragStart}
        >
            <div className="table-header">
                <h3>Սեղան {table.id} (Աթոռներ: {table.chairCount})</h3>
                <div className="table-buttons">
                    {/* Add details button */}
                    <button
                        onClick={handleShowDetails}
                        className="details-table-btn"
                        title="Տեսնել սեղանի մանրամասները"
                    >
                        ℹ
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTable(table.id);
                        }}
                        className="delete-table-btn"
                    >
                        X
                    </button>
                </div>
            </div>
            <div className="table">
                <div className="table-top">
                    {chairs}
                </div>
            </div>
        </div>
    );
};

const TableDetailsPopup = ({ table, tables, setTables, isOpen, onClose, setPeople }) => {
    // Group people by their group
    const getTableGroups = () => {
        if (!table) return [];

        // Get all seated people at this table
        const tablePeople = table.people.filter(Boolean);

        // Group them by group
        const groups = {};
        tablePeople.forEach(person => {
            if (!groups[person.group]) {
                groups[person.group] = [];
            }
            groups[person.group].push(person);
        });

        // Convert to array format for rendering
        return Object.entries(groups).map(([groupName, people]) => ({
            groupName,
            people
        }));
    };

    const tableGroups = getTableGroups();

    // Handler to remove a group from the table
    const handleRemoveGroup = (groupName) => {
        if (window.confirm(`Are you sure you want to remove group ${groupName} from this table?`)) {
            // Find people with this group at the table
            const groupPeople = table.people.filter(person => person && person.group === groupName);

            // Update the table by removing these people
            setTables(prevTables =>
                prevTables.map(t => {
                    if (t.id === table.id) {
                        return {
                            ...t,
                            people: t.people.map(person =>
                                (person && person.group === groupName) ? null : person
                            )
                        };
                    }
                    return t;
                })
            );

            // Add these people back to the people list
            setPeople(prevPeople => [...prevPeople, ...groupPeople]);
        }
    };

    // Function to handle drag start for group - FIXED VERSION
    const handleGroupDragStart = (e, group) => {
        // Set data on global variable
        window.currentDraggedGroup = {
            tableId: table.id,
            groupName: group.groupName,
            people: group.people
        };
        
        // Add dragging class for visual feedback
        e.currentTarget.classList.add('dragging');

        try {
            // Try to set data in dataTransfer
            e.dataTransfer.setData('text/plain', 'SEATED_GROUP');
            e.dataTransfer.setData('application/json', JSON.stringify({
                tableId: table.id,
                groupName: group.groupName,
                people: group.people
            }));
            
            // Set drag effect
            e.dataTransfer.effectAllowed = 'move';
        } catch (error) {
            console.error('Error setting drag data:', error);
        }
    };

    // Handle drag end
    const handleDragEnd = (e) => {
        e.currentTarget.classList.remove('dragging');
        // Clear the global variable after a small delay to allow for drop processing
        setTimeout(() => {
            window.currentDraggedGroup = null;
        }, 100);
    };

    return (
        <div className={`table-details-popup ${isOpen ? 'open' : ''}`}>
            <div className="table-details-header">
                <h3>Table Details {table ? `${table.id}` : ''}</h3>
                <button className="close-details-btn" onClick={onClose}>×</button>
            </div>

            <div className="table-details-content">
                {table ? (
                    <>
                        <div className="table-stats">
                            <p>Total Chairs: {table.chairCount}</p>
                            <p>Occupied Chairs: {table.people.filter(Boolean).length}</p>
                            <p>Free Chairs: {table.chairCount - table.people.filter(Boolean).length}</p>
                        </div>

                        <div className="groups-section-header">
                            <h4>Groups at this table</h4>
                            <div className="group-count-badge">
                                {tableGroups.length}
                            </div>
                        </div>

                        {tableGroups.length > 0 ? (
                            <div className="table-groups-list">
                                {tableGroups.map((group, index) => (
                                    <div
                                        key={index}
                                        className="table-group-item"
                                        draggable="true"
                                        onDragStart={(e) => handleGroupDragStart(e, group)}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <div className="group-info">
                                            <span className="group-name">Group {group.groupName}</span>
                                            <span className="group-count">{group.people.length} people</span>
                                        </div>

                                        <div className="group-people">
                                            {group.people.map((person, personIndex) => (
                                                <div key={personIndex} className="group-person">
                                                    {person.name}
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            className="remove-group-btn"
                                            onClick={() => handleRemoveGroup(group.groupName)}
                                            title="Remove this group from the table"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-groups-message">
                                <div className="empty-icon">👥</div>
                                <p>No groups at this table</p>
                                <p className="empty-hint">Drag groups here to place them</p>
                            </div>
                        )}
                    </>
                ) : (
                    <p>No table selected</p>
                )}
            </div>

            <div className="table-details-footer">
                <div className="footer-tip">
                    <div className="tip-icon">💡</div>
                    <p>Drag groups to other tables to move them</p>
                </div>
                {tableGroups.length > 0 && (
                    <button
                        className="remove-all-groups-btn"
                        onClick={() => {
                            if (window.confirm('Are you sure you want to remove all groups from this table?')) {
                                // Get all people at this table
                                const tablePeople = table.people.filter(Boolean);

                                // Update table by removing all people
                                setTables(prevTables =>
                                    prevTables.map(t =>
                                        t.id === table.id ? { ...t, people: t.people.map(() => null) } : t
                                    )
                                );

                                // Add people back to the people list
                                setPeople(prevPeople => [...prevPeople, ...tablePeople]);
                            }
                        }}
                    >
                        Remove All Groups
                    </button>
                )}
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

const NewTable = ({ draggingGroup, setTables, setDraggingGroup, setPeople }) => {
    const [{ isOver }, drop] = useDrop({
        accept: 'GROUP',
        drop: (item) => {
            const newTable = {
                id: `table-${Date.now()}`,
                x: 200,
                y: 200,
                width: 200,
                height: 150,
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

export default SeatingArrangement;