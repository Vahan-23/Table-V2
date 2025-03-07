import React from 'react';
import { useDrag } from 'react-dnd';

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
        <div ref={drag} className="group-card" style={{ opacity: isDragging ? 0.5 : 1 }}>
            <div className="group-name">Խումբ {groupName}</div>
            <div className="group-count">{group.length} чел.</div>
        </div>
    );
};

export default Group;