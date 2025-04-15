import React, { useState, useRef, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { useDrop } from 'react-dnd';
// Определяем типы элементов для drag-and-drop
const ItemTypes = {
    HALL_ELEMENT: 'HALL_ELEMENT',
};

// Иконки для элементов (используем простые Unicode символы, в реальном приложении лучше использовать SVG)
const ElementIcons = {
    entrance: '🚪',
    exit: '↪️',
    stairs: '🔃',
    stage: '🎭',
    dj: '🎧',
    dancefloor: '💃',
    bar: '🍹',
    buffet: '🍽️',
    wardrobe: '🧥',
    toilet: '🚻',
    reception: '📋',
    column: '🏛️',
    wall: '🧱',
    plant: '🌿',
    vip: '⭐',
    technical: '🔧',
};

// Компонент каталога элементов зала (отображается в сайдбаре)
export const HallElementsCatalog = ({ onAddElement }) => {
    // Список всех доступных элементов
    const elementTypes = [
        { id: 'entrance', name: 'Вход', icon: ElementIcons.entrance, width: 80, height: 60 },
        { id: 'exit', name: 'Выход', icon: ElementIcons.exit, width: 80, height: 60 },
        { id: 'stairs', name: 'Лестница', icon: ElementIcons.stairs, width: 70, height: 100 },
        { id: 'stage', name: 'Сцена', icon: ElementIcons.stage, width: 200, height: 150 },
        { id: 'dj', name: 'DJ зона', icon: ElementIcons.dj, width: 100, height: 80 },
        { id: 'dancefloor', name: 'Танцпол', icon: ElementIcons.dancefloor, width: 200, height: 200 },
        { id: 'bar', name: 'Бар', icon: ElementIcons.bar, width: 150, height: 80 },
        { id: 'buffet', name: 'Буфет', icon: ElementIcons.buffet, width: 150, height: 80 },
        { id: 'wardrobe', name: 'Гардероб', icon: ElementIcons.wardrobe, width: 120, height: 60 },
        { id: 'toilet', name: 'Туалет', icon: ElementIcons.toilet, width: 80, height: 80 },
        { id: 'reception', name: 'Ресепшн', icon: ElementIcons.reception, width: 150, height: 60 },
        { id: 'column', name: 'Колонна', icon: ElementIcons.column, width: 40, height: 40 },
        { id: 'wall', name: 'Стена', icon: ElementIcons.wall, width: 200, height: 20 },
        { id: 'plant', name: 'Растение', icon: ElementIcons.plant, width: 50, height: 50 },
        { id: 'vip', name: 'VIP зона', icon: ElementIcons.vip, width: 150, height: 150 },
        { id: 'technical', name: 'Техническое помещение', icon: ElementIcons.technical, width: 100, height: 100 },
    ];


    // Функция для создания нового элемента при перетаскивании
    const handleAddElement = (elementType) => {
        onAddElement({
            id: Date.now(), // Генерируем уникальный ID
            type: elementType.id,
            name: elementType.name,
            icon: elementType.icon,
            width: elementType.width,
            height: elementType.height,
            x: 100, // Начальная позиция по X
            y: 100, // Начальная позиция по Y
            rotation: 0, // Начальный угол поворота (в градусах)
            customName: elementType.name, // Настраиваемое имя (по умолчанию равно типу)
            color: '#1e90ff', // Цвет по умолчанию
        });
    };

    // Компонент для элемента каталога (с поддержкой перетаскивания)
    const DraggableCatalogItem = ({ elementType }) => {
        const [{ isDragging }, drag] = useDrag({
            type: ItemTypes.HALL_ELEMENT,
            item: () => ({
                type: elementType.id,
                elementData: elementType,
            }),
            end: (item, monitor) => {
                // Если элемент был успешно перетащен в зону зала, добавляем его
            },
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
        });

        return (
            <div
                ref={drag}
                className="hall-element-catalog-item"
                style={{
                    opacity: isDragging ? 0.5 : 1,
                    cursor: 'move',
                    padding: '8px',
                    margin: '5px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
            >
                <div className="element-icon" style={{ fontSize: '24px', marginRight: '10px' }}>
                    {elementType.icon}
                </div>
                <div className="element-name">{elementType.name}</div>
            </div>
        );
    };

    return (
        <div className="hall-elements-catalog">
            <h3 className="catalog-title">Элементы зала</h3>
            <div className="catalog-items">
                {elementTypes.map((elementType) => (
                    <DraggableCatalogItem key={elementType.id} elementType={elementType} />
                ))}
            </div>
        </div>
    );
};

// Компонент для отображения и управления элементами зала на холсте
export const HallElement = ({
    element,
    selected,
    onSelect,
    onUpdate,
    onDelete,
    zoom,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(element.customName);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState('');
    const elementRef = useRef(null);
    const wasDragged = useRef(false);
    // Обработчики перетаскивания элемента
    const handleMouseDown = (e) => {
        e.stopPropagation();
        // --- УБИРАЕМ ВЫЗОВ onSelect ОТСЮДА ---
        // onSelect(element.id); // <--- УБРАТЬ ЭТУ СТРОКУ
        setIsDragging(true);
        wasDragged.current = false; // Сбрасываем флаг перетаскивания
        setDragStart({
            x: e.clientX,
            y: e.clientY,
        });
    };


    const handleMouseMove = (e) => {
        if (isDragging && !isResizing) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;

            // Если было существенное смещение, считаем это перетаскиванием
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                wasDragged.current = true;
            }

            onUpdate({
                ...element,
                x: element.x + (dx / zoom),
                y: element.y + (dy / zoom),
            });

            setDragStart({
                x: e.clientX,
                y: e.clientY,
            });
        } else if (isResizing) {
             wasDragged.current = true; // Ресайз - это тоже своего рода перетаскивание
            // ... (существующая логика ресайза) ...
            const dx = (e.clientX - dragStart.x) / zoom;
            const dy = (e.clientY - dragStart.y) / zoom;

            let newWidth = element.width;
            let newHeight = element.height;
            let newX = element.x;
            let newY = element.y;

            if (resizeDirection.includes('right')) {
                newWidth = Math.max(20, element.width + dx);
            }
            if (resizeDirection.includes('bottom')) {
                newHeight = Math.max(20, element.height + dy);
            }
            if (resizeDirection.includes('left')) {
                newWidth = Math.max(20, element.width - dx);
                newX = element.x + dx;
            }
            if (resizeDirection.includes('top')) {
                newHeight = Math.max(20, element.height - dy);
                newY = element.y + dy;
            }

            onUpdate({
                ...element,
                width: newWidth,
                height: newHeight,
                x: newX,
                y: newY,
            });

            setDragStart({
                x: e.clientX,
                y: e.clientY,
            });
        }
    };

    const handleMouseUp = () => {
        // Если кнопка мыши отпущена, и НЕ было перетаскивания, значит это клик
        if (isDragging && !wasDragged.current) {
            onSelect(element.id); // Вызываем onSelect (setSelectedElementId) только здесь
        }
        setIsDragging(false);
        setIsResizing(false);
        // Сбрасываем флаг на всякий случай
        wasDragged.current = false;
    };

    // Обработчики для изменения размера элемента
    const handleResizeStart = (e, direction) => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeDirection(direction);
        setDragStart({
            x: e.clientX,
            y: e.clientY,
        });
    };

    // Обработчик двойного клика для редактирования названия
    const handleDoubleClick = (e) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditName(element.customName);
    };

    // Обработчик изменения имени
    const handleNameChange = (e) => {
        setEditName(e.target.value);
    };

    // Обработчик сохранения имени
    const handleNameSave = () => {
        onUpdate({
            ...element,
            customName: editName,
        });
        setIsEditing(false);
    };

    // Обработчик нажатия Enter при редактировании
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleNameSave();
        }
    };

    // Обработчик поворота элемента
    const handleRotate = (clockwise = true) => {
        const newRotation = element.rotation + (clockwise ? 90 : -90);
        onUpdate({
            ...element,
            rotation: newRotation % 360,
        });
    };

    // Обработчик удаления элемента
    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(element.id);
    };

    // Подключаем обработчики к window при dragging/resizing
    React.useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp); // handleMouseUp теперь обрабатывает и клик, и конец перетаскивания
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, dragStart, zoom]); // Зависимости


    return (
        <div
            ref={elementRef}
            className={`hall-element ${selected ? 'selected' : ''}`}
            style={{
                position: 'absolute',
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: `${element.width}px`,
                height: `${element.height}px`,
                transform: `rotate(${element.rotation}deg)`,
                backgroundColor: element.color,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: selected ? '2px solid #2196F3' : '1px solid #aaa',
                borderRadius: '4px',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                zIndex: selected ? 1000 : 1,
                boxShadow: selected ? '0 0 8px rgba(33, 150, 243, 0.5)' : 'none',
            }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
        >
            <div
                className="element-icon"
                style={{
                    fontSize: '24px',
                    marginBottom: '5px',
                }}
            >
                {element.icon}
            </div>

            {isEditing ? (
                <input
                    type="text"
                    value={editName}
                    onChange={handleNameChange}
                    onBlur={handleNameSave}
                    onKeyPress={handleKeyPress}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    style={{
                        width: '90%',
                        textAlign: 'center',
                        border: '1px solid #ccc',
                        borderRadius: '2px',
                        padding: '2px',
                    }}
                />
            ) : (
                <div className="element-name" style={{ fontSize: '12px', textAlign: 'center' }}>
                    {element.customName}
                </div>
            )}

            {/* Кнопки управления (отображаются только при выделении) */}
            {selected && (
                <div className="element-controls" style={{
                    position: 'absolute',
                    top: '-30px',
                    left: '0',
                    right: '0',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '5px'
                }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRotate(false);
                        }}
                        style={{
                            border: 'none',
                            background: '#fff',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }}
                    >
                        ↺
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRotate(true);
                        }}
                        style={{
                            border: 'none',
                            background: '#fff',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }}
                    >
                        ↻
                    </button>
                    <button
                        onClick={handleDelete}
                        style={{
                            border: 'none',
                            background: '#f44336',
                            color: 'white',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Маркеры изменения размера (отображаются только при выделении) */}
            {selected && (
                <>
                    <div
                        className="resize-handle top-left"
                        style={{
                            position: 'absolute',
                            top: '-5px',
                            left: '-5px',
                            width: '10px',
                            height: '10px',
                            backgroundColor: '#2196F3',
                            borderRadius: '50%',
                            cursor: 'nwse-resize',
                        }}
                        onMouseDown={(e) => handleResizeStart(e, 'top-left')}
                    ></div>
                    <div
                        className="resize-handle top-right"
                        style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            width: '10px',
                            height: '10px',
                            backgroundColor: '#2196F3',
                            borderRadius: '50%',
                            cursor: 'nesw-resize',
                        }}
                        onMouseDown={(e) => handleResizeStart(e, 'top-right')}
                    ></div>
                    <div
                        className="resize-handle bottom-left"
                        style={{
                            position: 'absolute',
                            bottom: '-5px',
                            left: '-5px',
                            width: '10px',
                            height: '10px',
                            backgroundColor: '#2196F3',
                            borderRadius: '50%',
                            cursor: 'nesw-resize',
                        }}
                        onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
                    ></div>
                    <div
                        className="resize-handle bottom-right"
                        style={{
                            position: 'absolute',
                            bottom: '-5px',
                            right: '-5px',
                            width: '10px',
                            height: '10px',
                            backgroundColor: '#2196F3',
                            borderRadius: '50%',
                            cursor: 'nwse-resize',
                        }}
                        onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
                    ></div>
                </>
            )}
        </div>
    );
};

// Главный компонент управления элементами зала
export const HallElementsManager = ({
    tablesAreaRef,
    zoom,
    elements,
    setElements,
    selectedElementId,
    setSelectedElementId,
    activeMode
}) => {
    const [, drop] = useDrop({
        accept: ItemTypes.HALL_ELEMENT,
        drop: (item, monitor) => {
            console.log("Drop event detected!", item); // Отладочный лог

            const offset = monitor.getClientOffset();
            if (offset && tablesAreaRef.current) {
                const containerRect = tablesAreaRef.current.getBoundingClientRect();
                const x = (offset.x - containerRect.left + tablesAreaRef.current.scrollLeft) / zoom;
                const y = (offset.y - containerRect.top + tablesAreaRef.current.scrollTop) / zoom;

                console.log("Calculated position:", x, y); // Отладочный лог

                // Создаем элемент с правильной позицией
                const elementData = item.elementData;
                const newElement = {
                    id: Date.now(),
                    type: elementData.id,
                    name: elementData.name,
                    icon: elementData.icon,
                    width: elementData.width,
                    height: elementData.height,
                    x: x - (elementData.width / 2), // Центрируем элемент по курсору
                    y: y - (elementData.height / 2),
                    rotation: 0,
                    customName: elementData.name,
                    color: '#1e90ff',
                };

                console.log("Adding new element:", newElement); // Отладочный лог

                // Добавляем элемент
                setElements(prevElements => [...prevElements, newElement]);
                setSelectedElementId(newElement.id);
            }

            return { success: true };
        }
    });

    useEffect(() => {
        // Применяем ref drop к tablesAreaRef.current при монтировании компонента
        if (tablesAreaRef.current) {
            drop(tablesAreaRef.current);
            console.log("Drop ref applied to canvas"); // Отладочный лог
        }

        // Это выполнится при размонтировании компонента или изменении зависимостей
        return () => {
            drop(null); // Убираем привязку ref
        };
    }, [drop, tablesAreaRef]); // Зависимости для useEffect
    // Добавление нового элемента
    const handleAddElement = (element) => {
        setElements((prevElements) => [...prevElements, element]);
        setSelectedElementId(element.id);
    };

    // Обновление элемента
    const handleUpdateElement = (updatedElement) => {
        setElements((prevElements) =>
            prevElements.map((el) =>
                el.id === updatedElement.id ? updatedElement : el
            )
        );
    };

    // Удаление элемента
    const handleDeleteElement = (elementId) => {
        setElements((prevElements) =>
            prevElements.filter((el) => el.id !== elementId)
        );
        if (selectedElementId === elementId) {
            setSelectedElementId(null);
        }
    };

    // Снятие выделения при клике на пустую область
    const handleAreaClick = () => {
        setSelectedElementId(null);
    };

    return (
        <>
            {/* Применяем drop к родительскому контейнеру через ref из props */}
            <div
                ref={drop}
                className="hall-elements-layer"
                onClick={handleAreaClick}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none'
                }}
            />

            {/* Рендерим все элементы зала */}
            {elements.map((element) => (
                <HallElement
                    key={element.id}
                    element={element}
                    selected={selectedElementId === element.id}
                    onSelect={setSelectedElementId}
                    onUpdate={handleUpdateElement}
                    onDelete={handleDeleteElement}
                    zoom={zoom}
                />
            ))}
        </>
    );
};

export default HallElementsManager;