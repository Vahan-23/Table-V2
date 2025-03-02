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
    const groupDropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (groupDropdownRef.current && !groupDropdownRef.current.contains(event.target)) {
                setShowGroupDropdown(false);
            }
        }

        if (showGroupDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showGroupDropdown]);

    // Existing functions remain the same
    // ... (other function implementations)

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="app-container">
                <header className="app-header">
                    <div className="header-content">
                        <div className="logo">
                            <h1>Նստատեղերի դասավորություն</h1>
                            <p className="app-subtitle">Drag & drop խմբերը սեղանների դասավորման համար</p>
                        </div>
                        
                        <div className="zoom-controls">
                            <button
                                className="zoom-btn"
                                onClick={handleZoomOut}
                                title="Փոքրացնել"
                            >−</button>
                            <span className="zoom-percentage">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button
                                className="zoom-btn"
                                onClick={handleZoomIn}
                                title="Մեծացնել"
                            >+</button>
                        </div>
                    </div>
                </header>

                <div className="main-content">
                    <div className="control-sidebar">
                        <div className="panel">
                            <h2 className="panel-title">Ավելացնել մարդ</h2>
                            <div className="input-row">
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
                                                        >
                                                            {group}
                                                        </div>
                                                    ))}
                                                    <div
                                                        className="dropdown-item dropdown-item-new"
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
                                    className="primary-btn"
                                    onClick={handleAddPerson}
                                >
                                    Ավելացնել
                                </button>
                            </div>
                        </div>

                        <div className="panel">
                            <h2 className="panel-title">Ավելացնել սեղան</h2>
                            <div className="input-row">
                                <div className="chair-input-container">
                                    <label htmlFor="chair-count">Աթոռների քանակ</label>
                                    <input
                                        id="chair-count"
                                        type="number"
                                        value={chairCount}
                                        onChange={handleChairCountChange}
                                        min="1"
                                        max="24"
                                        className="chair-count-input"
                                    />
                                </div>
                                <button
                                    className="primary-btn"
                                    onClick={handleAddTable}
                                >
                                    Ավելացնել սեղան
                                </button>
                            </div>
                            <button
                                className="secondary-btn full-width-btn"
                                onClick={createTablesForAllGroups}
                            >
                                Ստեղծել սեղաններ բոլոր խմբերի համար
                            </button>
                        </div>
                        
                        <div className="panel">
                            <h2 className="panel-title">Խմբեր</h2>
                            <div className="groups-container">
                                <div className="groups-wrapper">
                                    {renderGroups()}
                                </div>
                                <p className="drag-instruction">Քաշեք խումբը սեղանի վրա կամ նոր սեղան ստեղծելու տարածք</p>
                            </div>
                        </div>

                        <div className="panel data-controls">
                            <button
                                className="action-btn seed-btn"
                                onClick={() => setPeople(getSeedData())}
                                title="Ավելացնել թեստային տվյալներ"
                            >
                                Ավելացնել թեստային տվյալներ
                            </button>
                            <button
                                className="action-btn clear-btn"
                                onClick={() => setPeople([])}
                                title="Մաքրել բոլոր տվյալները"
                            >
                                Մաքրել
                            </button>
                        </div>

                        <PeopleSection
                            people={people}
                            tables={tables}
                            handleDeletePerson={handleDeletePerson}
                            setPeople={setPeople}
                            setTables={setTables}
                        />
                    </div>

                    <div className="tables-content-area">
                        <div className="tables-area-container">
                            <div className="tables-area" style={{
                                transform: `scale(${zoom})`,
                                transformOrigin: 'top left',
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '30px',
                                padding: '30px',
                                width: `${100 / zoom}%`,
                                minHeight: `${100 / zoom}%`,
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
                </div>

                {/* Popup remains mostly the same with styling improvements */}
                {isPopupVisible && (
                    <div className="fullscreen-popup" onClick={closePopup}>
                        <div className="fullscreen-popup-content" onClick={(e) => e.stopPropagation()}>
                            {isRemoveMode ? (
                                <div className="remove-person-popup">
                                    <h3 className="popup-title">Հեռացնե՞լ աթոռից:</h3>

                                    <div className="person-info-card">
                                        <p className="person-info-name">{personToRemove?.name}</p>
                                        <p className="person-info-group">Խումբ {personToRemove?.group}</p>
                                    </div>

                                    <p className="confirmation-text">
                                        Վստա՞հ եք, որ ցանկանում եք հեռացնել այս անձին աթոռից:
                                    </p>

                                    <div className="popup-buttons">
                                        <button onClick={handleRemovePerson} className="remove-btn">
                                            Հեռացնել
                                        </button>
                                        <button onClick={closePopup} className="cancel-btn">
                                            Չեղարկել
                                        </button>
                                    </div>
                                </div>
                            ) : (
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
                                    <button onClick={closePopup} className="close-popup-btn">Փակել</button>
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
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            boxShadow: peopleOnTable[i] ? '0 3px 8px rgba(220, 50, 50, 0.3)' : '0 3px 8px rgba(50, 180, 50, 0.2)',
        };

        const nameOverlayStyle = {
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '3px 6px',
            color: "#211812",
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 'bold',
            maxWidth: '55px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            zIndex: 5,
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        };

        chairStyle.transform = `rotate(${angle + 90}deg)`;

        chairs.push(
            <div
                key={i}
                className="chair"
                style={chairStyle}
                onClick={() => onChairClick(i)}
                title={peopleOnTable[i] ? `Սեղմեք ${peopleOnTable[i].name}-ին հեռացնելու համար` : "Սեղմեք մարդ ավելացնելու համար"}
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
                <h3>Սեղան {table.id} ({table.chairCount} աթոռ)</h3>
                <button 
                    onClick={() => handleDeleteTable(table.id)} 
                    className="delete-table-btn"
                    title="Հեռացնել սեղանը"
                >
                    ×
                </button>
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
        item: () => {
            setDraggingGroup(group);
            return { group };
        },
        end: () => {
            setDraggingGroup(null);
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    return (
        <div 
            ref={drag} 
            className={`group-card ${isDragging ? 'dragging' : ''}`}
            style={{ opacity: isDragging ? 0.5 : 1 }}
        >
            <div className="group-name">Խումբ {groupName}</div>
            <div className="group-count">{group.length} մարդ</div>
        </div>
    );
};

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
        >
            <div className="dropzone-content">
                <div className="dropzone-icon">+</div>
                <div className="dropzone-text">Քաշեք խումբը այստեղ՝ նոր սեղան ստեղծելու համար</div>
            </div>
        </div>
    );
};