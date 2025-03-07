import React, { useState, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import HallManagement from './components/HallManagement';
import PeopleSection from './components/PeopleSection';
import Table from './components/Table';
import Group from './components/Group';
import NewTable from './components/NewTable';
import HallModal from './components/HallModal';

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
    const [showGroupDropdown, setShowGroupDropdown] = useState(false);
    const [isCustomGroup, setIsCustomGroup] = useState(false);
    const tablesAreaRef = useRef(null);
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

    // ... (остальные функции и логика)

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
                                                <HallManagement
                                                    halls={halls}
                                                    currentHall={currentHall}
                                                    setCurrentHall={setCurrentHall}
                                                    setTables={setTables}
                                                    setShowHallModal={setShowHallModal}
                                                    saveHall={saveHall}
                                                    deleteHall={deleteHall}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </li>
                                {/* ... (остальные элементы навигации) */}
                            </ul>
                        </nav>
                    </div>

                    {showHallModal && <HallModal />}
                </header>
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
                    <div className="tables-area-container">
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
                        <div className="tables-area" style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top left',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '20px',
                            padding: '20px',
                            width: `${100 / zoom}%`,
                            minHeight: `${100 / zoom}%`,
                            justifyContent: "center"
                        }}>
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
                                />
                            ))}
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
            </div>
        </DndProvider>
    );
};

export default SeatingArrangement;