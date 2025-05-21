import React, { useState, useRef, useEffect, memo, useMemo } from 'react';
import { useDrag , useDrop} from 'react-dnd';

// Define item types for drag-and-drop
const ItemTypes = {
    HALL_ELEMENT: 'HALL_ELEMENT',
};

// PNG image paths instead of emoji
const ElementIcons = {
    entrance: 'elements\\open.png',
    exit: 'elements\\exit.png',
    stairs: 'elements\\stairs.png',
    stage: 'elements\\scene.png',
    dj: 'elements\\dj.png',
    dancefloor: 'elements\\dance.png',
    bar: 'elements\\bar.png',
    // buffet: 'elements\\bufet.png',
    wardrobe: 'elements\\garderob.png',
    toilet: 'elements\\wc.png',
    reception: 'elements\\reception.png',
    column: 'elements\\column.png',
    wall: 'elements\\pat.png',
    // plant: 'elements\\flower.png',
    vip: 'elements\\vip.png',
    // technical: 'elements\\technic.png',
};

// Memoized individual catalog item
const DraggableCatalogItem = memo(({ elementType }) => {
    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes.HALL_ELEMENT,
        item: () => ({
            type: elementType.id,
            elementData: elementType,
        }),
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
            <div className="element-icon" style={{ marginRight: '10px' }}>
                <img 
                    src={elementType.icon} 
                    alt={elementType.name}
                    style={{ 
                        width: '24px', 
                        height: '24px',
                        objectFit: 'contain' 
                    }} 
                />
            </div>
            <div className="element-name">{elementType.name}</div>
        </div>
    );
});

// Create the element list just once - outside the component
const elementTypes = [
    { id: 'entrance', name: 'Вход', icon: ElementIcons.entrance, fontSize: 340 },
    { id: 'exit', name: 'Выход', icon: ElementIcons.exit, fontSize: 340 },
    { id: 'stairs', name: 'Лестница', icon: ElementIcons.stairs, fontSize: 340 },
    { id: 'stage', name: 'Сцена', icon: ElementIcons.stage, fontSize: 340 },
    { id: 'dj', name: 'DJ зона', icon: ElementIcons.dj, fontSize: 340 },
    { id: 'dancefloor', name: 'Танцпол', icon: ElementIcons.dancefloor, fontSize: 340 },
    { id: 'bar', name: 'Бар', icon: ElementIcons.bar, fontSize: 340 },
    // { id: 'buffet', name: 'Буфет', icon: ElementIcons.buffet, fontSize: 24 },
    { id: 'wardrobe', name: 'Гардероб', icon: ElementIcons.wardrobe, fontSize: 340 },
    { id: 'toilet', name: 'Туалет', icon: ElementIcons.toilet, fontSize: 340 },
    { id: 'reception', name: 'Ресепшн', icon: ElementIcons.reception, fontSize: 340 },
    { id: 'column', name: 'Колонна', icon: ElementIcons.column, fontSize: 340 },
    // { id: 'wall', name: 'Стена', icon: ElementIcons.wall, fontSize: 24 },
    // { id: 'plant', name: 'Растение', icon: ElementIcons.plant, fontSize: 24 },
    { id: 'vip', name: 'VIP зона', icon: ElementIcons.vip, fontSize: 340 },
    // { id: 'technical', name: 'Техническое помещение', icon: ElementIcons.technical, fontSize: 24 },
];

// Heavily memoized catalog component
export const HallElementsCatalog = memo(({ onAddElement }) => {
    // Pre-render catalog items just once with useMemo
    const catalogItems = useMemo(() => 
        elementTypes.map((elementType) => (
            <DraggableCatalogItem key={elementType.id} elementType={elementType} />
        )),
    []);

    return (
        <div className="hall-elements-catalog">
            {/* <h3 className="catalog-title">Элементы зала</h3>
            <div className="catalog-items">
                {catalogItems}
            </div> */}
        </div>
    );
});



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
    const elementRef = useRef(null);
    
    // Новый подход: используем refs для всех состояний drag and resize
    // это предотвращает ненужные ререндеры во время операций
    const dragInfo = useRef({
        isDragging: false,
        startX: 0,
        startY: 0,
        origX: 0,
        origY: 0,
        wasDragged: false
    });
    
    const resizeInfo = useRef({
        isResizing: false,
        direction: '',
        startX: 0,
        startY: 0,
        origFontSize: 0
    });

    // Обработчик начала перетаскивания
    const handleMouseDown = (e) => {
        if (e.button !== 0) return; // Только левая кнопка мыши
        e.stopPropagation();
        
        // Запоминаем начальное состояние
        dragInfo.current = {
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY, 
            origX: element.x,
            origY: element.y,
            wasDragged: false
        };
        
        // Предотвращаем выделение текста
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
        
        // Добавляем слушателей событий на window
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    // Обработчик движения мыши при перетаскивании
    const handleMouseMove = (e) => {
        // Если мы перетаскиваем элемент
        if (dragInfo.current.isDragging) {
            // Вычисляем смещение от начальной точки
            const dx = e.clientX - dragInfo.current.startX;
            const dy = e.clientY - dragInfo.current.startY;
            
            // Если было значительное смещение, помечаем как перетаскивание
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                dragInfo.current.wasDragged = true;
            }
            
            // Вычисляем новые координаты
            const newX = dragInfo.current.origX + (dx / zoom);
            const newY = dragInfo.current.origY + (dy / zoom);
            
            // Обновляем позицию элемента через CSS transform для плавности
            if (elementRef.current) {
                elementRef.current.style.left = `${newX}px`;
                elementRef.current.style.top = `${newY}px`;
            }
        }
        // Если изменяем размер
        else if (resizeInfo.current.isResizing) {
            // Вычисляем смещение от начальной точки
            const dx = (e.clientX - resizeInfo.current.startX) / zoom;
            const dy = (e.clientY - resizeInfo.current.startY) / zoom;
            
            // Коэффициент для плавного изменения размера
            const fontSizeChangeFactor = 0.2;
            let newFontSize = resizeInfo.current.origFontSize;
            
            // Применяем изменение размера в зависимости от направления
            if (resizeInfo.current.direction.includes('right')) {
                newFontSize = Math.max(10, resizeInfo.current.origFontSize + dx * fontSizeChangeFactor);
            } else if (resizeInfo.current.direction.includes('left')) {
                newFontSize = Math.max(10, resizeInfo.current.origFontSize - dx * fontSizeChangeFactor);
            }
            
            if (resizeInfo.current.direction.includes('bottom')) {
                newFontSize = Math.max(10, newFontSize + dy * fontSizeChangeFactor);
            } else if (resizeInfo.current.direction.includes('top')) {
                newFontSize = Math.max(10, newFontSize - dy * fontSizeChangeFactor);
            }
            
            // Применяем новый размер через DOM для плавности
            if (elementRef.current) {
                const iconElement = elementRef.current.querySelector('.element-icon img');
                if (iconElement) {
                    iconElement.style.width = `${newFontSize}px`;
                    iconElement.style.height = `${newFontSize}px`;
                }
                
                const nameElement = elementRef.current.querySelector('.element-name');
                if (nameElement) {
                    nameElement.style.fontSize = `${Math.max(12, newFontSize / 8)}px`;
                }
            }
            
            dragInfo.current.wasDragged = true; // помечаем, что было перетаскивание/ресайз
        }
    };

    // Обработчик окончания перетаскивания
    const handleMouseUp = (e) => {
        // Если было перетаскивание и значительное смещение
        if (dragInfo.current.isDragging && dragInfo.current.wasDragged) {
            const dx = e.clientX - dragInfo.current.startX;
            const dy = e.clientY - dragInfo.current.startY;
            
            // Вычисляем финальные координаты
            const newX = Math.round(dragInfo.current.origX + (dx / zoom));
            const newY = Math.round(dragInfo.current.origY + (dy / zoom));
            
            // Обновляем состояние через колбэк
            onUpdate({
                ...element,
                x: newX,
                y: newY
            });
        }
        // Если было изменение размера
        else if (resizeInfo.current.isResizing && dragInfo.current.wasDragged) {
            const dx = (e.clientX - resizeInfo.current.startX) / zoom;
            const dy = (e.clientY - resizeInfo.current.startY) / zoom;
            
            const fontSizeChangeFactor = 0.2;
            let newFontSize = resizeInfo.current.origFontSize;
            
            if (resizeInfo.current.direction.includes('right')) {
                newFontSize = Math.max(10, resizeInfo.current.origFontSize + dx * fontSizeChangeFactor);
            } else if (resizeInfo.current.direction.includes('left')) {
                newFontSize = Math.max(10, resizeInfo.current.origFontSize - dx * fontSizeChangeFactor);
            }
            
            if (resizeInfo.current.direction.includes('bottom')) {
                newFontSize = Math.max(10, newFontSize + dy * fontSizeChangeFactor);
            } else if (resizeInfo.current.direction.includes('top')) {
                newFontSize = Math.max(10, newFontSize - dy * fontSizeChangeFactor);
            }
            
            newFontSize = Math.round(newFontSize);
            
            // Обновляем состояние через колбэк
            onUpdate({
                ...element,
                fontSize: newFontSize
            });
        }
        // Если был просто клик (нажали и отпустили без движения)
        else if (dragInfo.current.isDragging && !dragInfo.current.wasDragged) {
            onSelect(element.id);
        }
        
        // Сбрасываем состояния
        dragInfo.current.isDragging = false;
        dragInfo.current.wasDragged = false;
        resizeInfo.current.isResizing = false;
        
        // Восстанавливаем стили документа
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        
        // Удаляем слушателей событий
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    // Обработчик начала изменения размера
    const handleResizeStart = (e, direction) => {
        e.stopPropagation();
        e.preventDefault();
        
        // Запоминаем начальное состояние
        resizeInfo.current = {
            isResizing: true,
            direction: direction,
            startX: e.clientX,
            startY: e.clientY,
            origFontSize: element.fontSize
        };
        
        // Предотвращаем выделение текста
        document.body.style.userSelect = 'none';
        document.body.style.cursor = direction === 'top-left' || direction === 'bottom-right' ? 'nwse-resize' : 'nesw-resize';
        
        // Добавляем слушателей событий на window
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    // Обработчик двойного клика для редактирования названия
    const handleDoubleClick = (e) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditName(element.customName);
    };

    // Обработчики для редактирования имени
    const handleNameChange = (e) => {
        setEditName(e.target.value);
    };

    const handleNameSave = () => {
        onUpdate({
            ...element,
            customName: editName,
        });
        setIsEditing(false);
    };

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

    return (
        <div
            ref={elementRef}
            className={`hall-element ${selected ? 'selected' : ''}`}
            style={{
                position: 'absolute',
                left: `${element.x}px`,
                top: `${element.y}px`,
                padding: '10px',
                transform: `rotate(${element.rotation}deg)`,
                backgroundColor: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                // border: selected ? '2px solid #2196F3' : '1px dashed rgba(170, 170, 170, 0.5)',
                borderRadius: '4px',
                cursor: dragInfo.current.isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                // zIndex: selected ? 1000 : element.zIndex || 1,
                boxShadow: 'none',
                opacity: element.opacity || 1,
                touchAction: 'none', // Отключаем стандартную обработку тач-событий
            }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
        >
            <div className="element-icon" style={{ marginBottom: '5px' }}>
                <img 
                    src={element.icon} 
                    alt={element.customName}
                    style={{ 
                        width: `${element.fontSize}px`, 
                        height: `${element.fontSize}px`,
                        objectFit: 'contain',
                        pointerEvents: 'none' // Предотвращает захват перетаскивания картинкой
                    }} 
                    draggable="false"
                />
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
                        fontSize: `${Math.max(12, element.fontSize / 2)}px`,
                    }}
                />
            ) : (
                <div className="element-name" style={{ 
                    fontSize: `${Math.max(12, element.fontSize / 8)}px`,
                    textAlign: 'center',
                    pointerEvents: 'none' // Предотвращает захват перетаскивания текстом
                }}>
                    {element.customName}
                </div>
            )}

            {/* Кнопки управления (отображаются только при выделении) */}
            {selected && (
                <div className="element-controls" style={{
                    position: 'absolute',
                    top: `-${Math.max(30, element.fontSize * 0.6)}px`,
                    left: '0',
                    right: '0',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '5px',
                    pointerEvents: 'auto' // Обеспечиваем работу кнопок
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
                            width: `${Math.max(24, element.fontSize * 0.5)}px`,
                            height: `${Math.max(24, element.fontSize * 0.5)}px`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            fontSize: `${Math.max(16, element.fontSize * 0.3)}px`
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
                            width: `${Math.max(24, element.fontSize * 0.5)}px`,
                            height: `${Math.max(24, element.fontSize * 0.5)}px`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            fontSize: `${Math.max(16, element.fontSize * 0.3)}px`
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
                            width: `${Math.max(24, element.fontSize * 0.5)}px`,
                            height: `${Math.max(24, element.fontSize * 0.5)}px`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            fontSize: `${Math.max(16, element.fontSize * 0.3)}px`
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
                            width: `${Math.max(10, element.fontSize * 0.2)}px`,
                            height: `${Math.max(10, element.fontSize * 0.2)}px`,
                            backgroundColor: '#2196F3',
                            borderRadius: '50%',
                            cursor: 'nwse-resize',
                            pointerEvents: 'auto' // Обеспечиваем работу маркеров
                        }}
                        onMouseDown={(e) => handleResizeStart(e, 'top-left')}
                    ></div>
                    <div
                        className="resize-handle top-right"
                        style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            width: `${Math.max(10, element.fontSize * 0.2)}px`,
                            height: `${Math.max(10, element.fontSize * 0.2)}px`,
                            backgroundColor: '#2196F3',
                            borderRadius: '50%',
                            cursor: 'nesw-resize',
                            pointerEvents: 'auto' // Обеспечиваем работу маркеров
                        }}
                        onMouseDown={(e) => handleResizeStart(e, 'top-right')}
                    ></div>
                    <div
                        className="resize-handle bottom-left"
                        style={{
                            position: 'absolute',
                            bottom: '-5px',
                            left: '-5px',
                            width: `${Math.max(10, element.fontSize * 0.2)}px`,
                            height: `${Math.max(10, element.fontSize * 0.2)}px`,
                            backgroundColor: '#2196F3',
                            borderRadius: '50%',
                            cursor: 'nesw-resize',
                            pointerEvents: 'auto' // Обеспечиваем работу маркеров
                        }}
                        onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
                    ></div>
                    <div
                        className="resize-handle bottom-right"
                        style={{
                            position: 'absolute',
                            bottom: '-5px',
                            right: '-5px',
                            width: `${Math.max(10, element.fontSize * 0.2)}px`,
                            height: `${Math.max(10, element.fontSize * 0.2)}px`,
                            backgroundColor: '#2196F3',
                            borderRadius: '50%',
                            cursor: 'nwse-resize',
                            pointerEvents: 'auto' // Обеспечиваем работу маркеров
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
    // Отдельный ref для слоя элементов
    const elementsLayerRef = useRef(null);
    
    // Используем useDrop для приема перетаскиваемых элементов
    const [, drop] = useDrop({
        accept: ItemTypes.HALL_ELEMENT,
        drop: (item, monitor) => {
            const offset = monitor.getClientOffset();
            if (offset && tablesAreaRef.current) {
                const containerRect = tablesAreaRef.current.getBoundingClientRect();
                const scrollLeft = tablesAreaRef.current.scrollLeft || 0;
                const scrollTop = tablesAreaRef.current.scrollTop || 0;
                
                // Вычисляем позицию с учетом скролла и зума
                const x = Math.round((offset.x - containerRect.left + scrollLeft) / zoom);
                const y = Math.round((offset.y - containerRect.top + scrollTop) / zoom);
                
                // Создаем новый элемент
                const elementData = item.elementData;
                const newElement = {
                    id: Date.now(),
                    type: elementData.id,
                    name: elementData.name,
                    icon: elementData.icon,
                    fontSize: elementData.fontSize,
                    x: x,
                    y: y,
                    rotation: 0,
                    customName: elementData.name,
                    color: 'transparent',
                    zIndex: Math.max(0, ...elements.map(el => el.zIndex || 0)) + 1, // Ставим поверх других
                };
                
                // Добавляем элемент и выделяем его
                setElements(prevElements => [...prevElements, newElement]);
                setSelectedElementId(newElement.id);
                
                return { success: true };
            }
            return { success: false };
        }
    });
    
    // Применяем ref drop к tablesAreaRef при монтировании компонента
    useEffect(() => {
        if (tablesAreaRef.current) {
            drop(tablesAreaRef.current);
        }
    }, [drop, tablesAreaRef]);
    
    // Снятие выделения при клике на пустую область
    const handleAreaClick = (e) => {
        // Проверяем, что клик был на самой области, а не на элементе
        if (e.target === elementsLayerRef.current || e.target === tablesAreaRef.current) {
            setSelectedElementId(null);
        }
    };
    
    // Обновление элемента
    const handleUpdateElement = (updatedElement) => {
        setElements(prevElements =>
            prevElements.map(el =>
                el.id === updatedElement.id ? updatedElement : el
            )
        );
    };
    
    // Удаление элемента
    const handleDeleteElement = (elementId) => {
        setElements(prevElements =>
            prevElements.filter(el => el.id !== elementId)
        );
        if (selectedElementId === elementId) {
            setSelectedElementId(null);
        }
    };

    return (
        <>
            {/* Слой для элементов зала с обработчиком клика */}
            {/* <div
                ref={elementsLayerRef}
                className="tables-area"
                onClick={handleAreaClick}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none' // Обеспечиваем работу кликов
                }}
            /> */}

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