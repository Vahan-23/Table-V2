import React from 'react';

const HallManagement = ({ halls, currentHall, setCurrentHall, setTables, setShowHallModal, saveHall, deleteHall }) => {
    return (
        <div className="hall-management">
            <h3 className="section-main-title">Դահլիճների կառավարում</h3>

            <div className="hall-controls">
                <div className="hall-dropdown-container">
                    <select
                        value={currentHall ? currentHall.id : ""}
                        onChange={(e) => {
                            const selectedHall = halls.find(h => h.id === parseInt(e.target.value));
                            if (selectedHall) setCurrentHall(selectedHall);
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

export default HallManagement;