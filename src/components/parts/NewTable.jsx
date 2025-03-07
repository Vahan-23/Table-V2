import React from 'react';
import { useDrop } from 'react-dnd';

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

export default NewTable;