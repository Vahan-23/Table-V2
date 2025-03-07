import React, { useState } from 'react';

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

export default PeopleSection;