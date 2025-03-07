import React, { useState, useEffect, useRef } from 'react';

const HallModal = ({ setShowHallModal, createNewHall }) => {
    const nameInputRef = useRef(null);
    const [hallName, setHallName] = useState('');
    const [tableCount, setTableCount] = useState(10);
    const [chairCount, setChairCount] = useState(12);

    useEffect(() => {
        if (nameInputRef.current) {
            nameInputRef.current.focus();
        }
    }, []);

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

export default HallModal;