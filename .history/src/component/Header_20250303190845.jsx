const Header = () => {
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [showHallModal, setShowHallModal] = useState(false);
    
    // State for people management
    const [peopleInput, setPeopleInput] = useState('');
    const [groupInput, setGroupInput] = useState('');
    const [showGroupDropdown, setShowGroupDropdown] = useState(false);
    const [isCustomGroup, setIsCustomGroup] = useState(false);
    const [people, setPeople] = useState([]);
    
    // State for table management
    const [chairCount, setChairCount] = useState(4);
    const [tableCount, setTableCount] = useState(1);
    
    const groupDropdownRef = useRef(null);
    const dropdownRefs = useRef([]);
    
    // Close dropdowns when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (activeDropdown && !dropdownRefs.current[activeDropdown]?.contains(event.target)) {
          setActiveDropdown(null);
        }
        
        if (showGroupDropdown && groupDropdownRef.current && !groupDropdownRef.current.contains(event.target)) {
          setShowGroupDropdown(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeDropdown, showGroupDropdown]);
    
    // Navigation sections
    const navSections = [
      {
        id: 'hall',
        title: 'Դահլիճի կառավարում',
        content: <HallManagement showModal={() => setShowHallModal(true)} />
      },
      {
        id: 'people',
        title: 'Մարդկանց կառավարում',
        content: (
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
                    onChange={(e) => setGroupInput(e.target.value)}
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
        )
      },
      {
        id: 'tables',
        title: 'Սեղանների կառավարում',
        content: (
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
                    onChange={(e) => setChairCount(parseInt(e.target.value))}
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
                    onChange={(e) => setTableCount(parseInt(e.target.value))}
                    min="1"
                    className="table-count-input"
                  />
                </div>
                <button
                  className="primary-btn add-multiple-tables-btn"
                  onClick={handleAddMultipleTables}
                >
                  Ավելացնել {tableCount} սեղան
                </button>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'groups',
        title: 'Խմբերի կառավարում',
        content: (
          <div className="dropdown-content groups-section">
            <div className="groups-header">
              <div className="data-management">
                <div className="data-buttons">
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
        )
      }
    ];
    
    // Placeholder functions to be implemented
    const getExistingGroups = () => {
      // Get unique groups from people
      return [...new Set(people.map(person => person.group))].filter(Boolean);
    };
    
    const handleSelectGroup = (group) => {
      setGroupInput(group);
      setShowGroupDropdown(false);
    };
    
    const handleAddPerson = () => {
      if (peopleInput.trim() && groupInput.trim()) {
        setPeople([...people, { name: peopleInput.trim(), group: groupInput.trim() }]);
        setPeopleInput('');
        // Keep group input for adding multiple people to same group
      }
    };
    
    const handleAddMultipleTables = () => {
      console.log(`Adding ${tableCount} tables with ${chairCount} chairs each`);
      // Implementation would go here
    };
    
    const getSeedData = () => {
      // Return sample data
      return [
        { name: 'Անի Հակոբյան', group: 'Ընտանիք' },
        { name: 'Վահե Պետրոսյան', group: 'Ընտանիք' },
        { name: 'Գարիկ Սարգսյան', group: 'Ընկերներ' },
        { name: 'Լիլիթ Գրիգորյան', group: 'Ընկերներ' },
        { name: 'Արամ Հարությունյան', group: 'Աշխատանք' }
      ];
    };
    
    const createTablesForAllGroups = () => {
      console.log('Auto-arranging all groups');
      // Implementation would go here
    };
    
    const renderGroups = () => {
      const groups = getExistingGroups();
      if (groups.length === 0) {
        return <div className="no-groups">Չկան հասանելի խմբեր</div>;
      }
      
      return groups.map(group => {
        const groupMembers = people.filter(person => person.group === group);
        return (
          <div key={group} className="group-card">
            <div className="group-name">{group}</div>
            <div className="group-count">{groupMembers.length} անդամ</div>
          </div>
        );
      });
    };
    
    return (
      <div className="app-container">
        <header className="app-header">
          <div className="header-top">
            <div className="logo">Նստատեղերի դասավորություն</div>
            <nav className="main-nav">
              <ul className="nav-list">
                {navSections.map((section, index) => (
                  <li 
                    key={section.id} 
                    className={`nav-item ${activeDropdown === index ? 'active' : ''}`}
                    onMouseEnter={() => setActiveDropdown(index)}
                    ref={el => dropdownRefs.current[index] = el}
                  >
                    <a 
                      href={`#${section.id}`} 
                      className="nav-link"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveDropdown(activeDropdown === index ? null : index);
                      }}
                    >
                      {section.title}
                    </a>
                    {activeDropdown === index && (
                      <div className="dropdown-menu">
                        {section.content}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>
        
        <main className="app-main">
          {/* Main content area where the actual seating arrangement would be displayed */}
          <div className="seating-area">
            {/* Tables and chairs would be rendered here */}
          </div>
        </main>
        
        {showHallModal && <HallModal onClose={() => setShowHallModal(false)} />}
      </div>
    );
  };
  
  // Placeholder component - replace with your actual implementation
  const HallManagement = ({ showModal }) => (
    <div className="hall-management">
      <h3>Դահլիճի կառավարում</h3>
      <button className="secondary-btn" onClick={showModal}>
        Փոխել դահլիճի չափերը
      </button>
    </div>
  );
  
  // Placeholder component - replace with your actual implementation
  const HallModal = ({ onClose }) => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Դահլիճի չափերի կարգավորում</h2>
        <button className="close-btn" onClick={onClose}>×</button>
        {/* Modal content here */}
      </div>
    </div>
  );