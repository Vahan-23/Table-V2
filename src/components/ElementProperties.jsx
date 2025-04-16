import React, { useState, useEffect } from 'react';

// Компонент для редактирования свойств элемента зала
const ElementProperties = ({ element, onUpdate, onClose, onDelete }) => {
    // Состояния для всех редактируемых свойств
    const [name, setName] = useState(element?.customName || '');
    const [fontSize, setFontSize] = useState(element?.fontSize || 24); // Новое свойство для размера шрифта
    const [rotation, setRotation] = useState(element?.rotation || 0);
    const [opacity, setOpacity] = useState(element?.opacity || 1);
    const [zIndex, setZIndex] = useState(element?.zIndex || 1);

    // Обновляем состояния при изменении выбранного элемента
    useEffect(() => {
        if (element) {
            setName(element.customName || element.name || '');
            setFontSize(element.fontSize || 24); // Используем fontSize вместо width/height
            setRotation(element.rotation || 0);
            setOpacity(element.opacity || 1);
            setZIndex(element.zIndex || 1);
        }
    }, [element]);

    // Применяем все изменения к элементу
    const applyChanges = () => {
        if (!element) return;

        onUpdate({
            ...element,
            customName: name,
            fontSize: Number(fontSize), // Заменяем width/height на fontSize
            rotation: Number(rotation),
            opacity: Number(opacity),
            zIndex: Number(zIndex)
        });
    };

    // Применяем изменения при изменении любого свойства
    useEffect(() => {
        if (element) {
            applyChanges();
        }
    }, [name, fontSize, rotation, opacity, zIndex]); // Удалено color из зависимостей

    // Если элемент не выбран, не отображаем панель
    if (!element) return null;

    return (
        <div className="element-properties" onClick={(e) => e.stopPropagation()}>
            <div className="properties-header">
                <h3>Свойства элемента</h3>
                <button className="close-properties-btn" onClick={onClose}>×</button>
            </div>

            <div className="properties-content">
                <div className="property-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <label htmlFor="element-name">Название:</label>
                        <button 
                            onClick={() => {
                                if (window.confirm('Вы уверены, что хотите удалить этот элемент?')) {
                                    onDelete(element.id);
                                    onClose();
                                }
                            }} 
                            className="delete-element-btn"
                            style={{
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            Удалить элемент
                        </button>
                    </div>
                    <input
                        id="element-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="property-input"
                    />
                </div>

                <div className="property-group">
                    <label htmlFor="element-font-size">Размер шрифта:</label>
                    <div className="font-size-control">
                        <input
                            id="element-font-size"
                            type="range"
                            min="10"
                            max="200"
                            value={fontSize}
                            onChange={(e) => setFontSize(Number(e.target.value))}
                            className="font-size-slider"
                            style={{
                                background: 'linear-gradient(to right, #3498db, #3498db ' + (fontSize-10)/190*100 + '%, #ddd ' + (fontSize-10)/190*100 + '%, #ddd)',
                                height: '6px',
                                borderRadius: '3px'
                            }}
                        />
                        <input
                            type="number"
                            min="10"
                            max="200"
                            step="1"
                            value={fontSize}
                            onChange={(e) => setFontSize(Math.max(10, Math.min(200, Number(e.target.value))))}
                            className="font-size-input"
                        />
                    </div>
                    <div className="font-size-preview" style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                        Текущий размер: {fontSize}px
                    </div>
                </div>

                <div className="property-group">
                    <label htmlFor="element-rotation">Поворот (градусы):</label>
                    <div className="rotation-control">
                        <input
                            id="element-rotation"
                            type="range"
                            min="0"
                            max="359"
                            value={rotation}
                            onChange={(e) => setRotation(Number(e.target.value))}
                            className="rotation-slider"
                        />
                        <input
                            type="number"
                            min="0"
                            max="359"
                            value={rotation}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val >= 0 && val <= 359) {
                                    setRotation(val);
                                }
                            }}
                            className="rotation-input"
                        />
                    </div>
                </div>



                <div className="property-group">
                    <label htmlFor="element-opacity">Прозрачность:</label>
                    <div className="opacity-control">
                        <input
                            id="element-opacity"
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.1"
                            value={opacity}
                            onChange={(e) => setOpacity(Number(e.target.value))}
                            className="opacity-slider"
                        />
                        <span className="opacity-value">{Math.round(opacity * 100)}%</span>
                    </div>
                </div>

                <div className="property-group">
                    <label htmlFor="element-zindex">Порядок (Z-index):</label>
                    <div className="zindex-control">
                        <button
                            className="zindex-btn"
                            onClick={() => setZIndex(Math.max(1, zIndex - 1))}
                        >
                            -
                        </button>
                        <span className="zindex-value">{zIndex}</span>
                        <button
                            className="zindex-btn"
                            onClick={() => setZIndex(zIndex + 1)}
                        >
                            +
                        </button>
                    </div>
                </div>

                <div className="property-group element-type">
                    <span className="type-label">Тип: </span>
                    <span className="type-value">{element.name}</span>
                </div>
            </div>

            <div className="rotation-presets">
                <button
                    className="rotate-btn"
                    onClick={() => setRotation(0)}
                >
                    0°
                </button>
                <button
                    className="rotate-btn"
                    onClick={() => setRotation(90)}
                >
                    90°
                </button>
                <button
                    className="rotate-btn"
                    onClick={() => setRotation(180)}
                >
                    180°
                </button>
                <button
                    className="rotate-btn"
                    onClick={() => setRotation(270)}
                >
                    270°
                </button>
            </div>
        </div>
    );
};

export default ElementProperties;