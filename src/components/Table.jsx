import React from 'react';
import { useDrop } from 'react-dnd';

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
            // top: '50%',
            // left: '50%',
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

        // For displaying the name directly on the chair
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
    // ... (остальные функции и логика)

    return (
        <div ref={drop} className="table-container">
            <div className="table-header">
                <h3>Սեղան {table.id} (Աթոռներ: {table.chairCount})</h3>
                <button onClick={() => handleDeleteTable(table.id)} className="delete-table-btn">X</button>
            </div>
            <div className="table">
                <div className="table-top">
                    {chairs}
                </div>
            </div>
        </div>
    );
};

export default Table;