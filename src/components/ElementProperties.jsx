import React, { useState, useEffect } from 'react';

// Компонент для редактирования свойств элемента зала
const ElementProperties = ({ element, onUpdate, onClose }) => {
    // Состояния для всех редактируемых свойств
    const [name, setName] = useState(element?.customName || '');
    const [width, setWidth] = useState(element?.width || 100);
    const [height, setHeight] = useState(element?.height || 100);
    const [color, setColor] = useState(element?.color || '#1e90ff');
    const [rotation, setRotation] = useState(element?.rotation || 0);
    const [opacity, setOpacity] = useState(element?.opacity || 1);
    const [zIndex, setZIndex] = useState(element?.zIndex || 1);

    // Обновляем состояния при изменении выбранного элемента
    useEffect(() => {
        if (element) {
            setName(element.customName || element.name || '');
            setWidth(element.width || 100);
            setHeight(element.height || 100);
            setColor(element.color || '#1e90ff');
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
            width: Number(width),
            height: Number(height),
            color: color,
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
    }, [name, width, height, color, rotation, opacity, zIndex]);

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
                    <label htmlFor="element-name">Название:</label>
                    <input
                        id="element-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="property-input"
                    />
                </div>

                <div className="property-group dimensions">
                    <div>
                        <label htmlFor="element-width">Ширина:</label>
                        <input
                            id="element-width"
                            type="number"
                            min="10"
                            step="1"
                            value={width}
                            onChange={(e) => setWidth(Math.max(10, Number(e.target.value)))}
                            className="property-input"
                        />
                    </div>
                    <div>
                        <label htmlFor="element-height">Высота:</label>
                        <input
                            id="element-height"
                            type="number"
                            min="10"
                            step="1"
                            value={height}
                            onChange={(e) => setHeight(Math.max(10, Number(e.target.value)))}
                            className="property-input"
                        />
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
                    <label htmlFor="element-color">Цвет:</label>
                    <div className="color-picker">
                        <input
                            id="element-color"
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="color-input"
                        />
                        <input
                            type="text"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="color-text"
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