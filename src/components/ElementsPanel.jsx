import React, { useState, useEffect, useRef } from 'react';
import { useDrag } from 'react-dnd';
import CollapsiblePanel from './CollapsiblePanel';
import './ElementsPanel.css';

// Константа для типа перетаскивания
const ITEM_TYPE = 'HALL_ELEMENT';

// Иконки элементов зала
const ElementIcons = {
  entrance: 'elements/open.png',
  exit: 'elements/exit.png',
  stairs: 'elements/stairs.png',
  stage: 'elements/scene.png',
  dj: 'elements/dj.png',
  dancefloor: 'elements/dance.png',
  bar: 'elements/bar.png',
  wardrobe: 'elements/garderob.png',
  toilet: 'elements/wc.png',
  reception: 'elements/reception.png',
  column: 'elements/column.png',
  vip: 'elements/vip.png',
};

// Список типов элементов
const elementTypes = [
  { id: 'entrance', name: 'Вход', icon: ElementIcons.entrance, fontSize: 340 },
  { id: 'exit', name: 'Выход', icon: ElementIcons.exit, fontSize: 340 },
  { id: 'stairs', name: 'Лестница', icon: ElementIcons.stairs, fontSize: 340 },
  { id: 'stage', name: 'Сцена', icon: ElementIcons.stage, fontSize: 340 },
  { id: 'dj', name: 'DJ зона', icon: ElementIcons.dj, fontSize: 340 },
  { id: 'dancefloor', name: 'Танцпол', icon: ElementIcons.dancefloor, fontSize: 340 },
  { id: 'bar', name: 'Бар', icon: ElementIcons.bar, fontSize: 340 },
  { id: 'wardrobe', name: 'Гардероб', icon: ElementIcons.wardrobe, fontSize: 340 },
  { id: 'toilet', name: 'Туалет', icon: ElementIcons.toilet, fontSize: 340 },
  { id: 'reception', name: 'Ресепшн', icon: ElementIcons.reception, fontSize: 340 },
  { id: 'column', name: 'Колонна', icon: ElementIcons.column, fontSize: 340 },
  { id: 'vip', name: 'VIP зона', icon: ElementIcons.vip, fontSize: 340 },
];

// Компонент элемента, который можно перетаскивать
const DraggableElement = ({ elementType, onDragStart }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: () => {
      // Вызываем функцию для закрытия всех панелей при начале перетаскивания
      if (onDragStart) {
        onDragStart();
      }
      
      return {
        type: elementType.id,
        elementData: elementType,
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`element-item ${isDragging ? 'dragging' : ''}`}
    >
      <div className="ep-element-icon">
        <img
          src={elementType.icon}
          alt={elementType.name}
          draggable="false"
        />
      </div>
      <div className="element-name">
        {elementType.name}
      </div>
    </div>
  );
};

// Группы элементов
const elementGroups = [
  {
    title: 'Входы и выходы',
    elements: ['entrance', 'exit', 'stairs'],
  },
  {
    title: 'Развлечения',
    elements: ['stage', 'dj', 'dancefloor'],
  },
  {
    title: 'Обслуживание',
    elements: ['bar', 'wardrobe', 'toilet', 'reception'],
  },
  {
    title: 'Интерьер',
    elements: ['column', 'vip'],
  },
];

// Основной компонент панели элементов
const ElementsPanel = ({ onAddElement, onDragStart }) => {
  // Состояние для отслеживания раскрытых панелей
  const [isMainPanelExpanded, setIsMainPanelExpanded] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  
  // Реф для sidebar
  const sidebarRef = useRef(null);
  
  // Функция для получения данных элемента по ID
  const getElementById = (id) => elementTypes.find(element => element.id === id);
  
  // Функция для закрытия всех панелей
  const closeAllPanels = () => {
    setIsMainPanelExpanded(false);
    setExpandedGroups({});
  };
  
  // Обработчик клика вне sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Проверяем, находится ли sidebar в DOM и был ли клик вне его
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        // Если клик был вне sidebar, закрываем все панели
        closeAllPanels();
      }
    };
    
    // Добавляем обработчик клика на документ
    document.addEventListener('mousedown', handleClickOutside);
    
    // Удаляем обработчик при размонтировании компонента
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Функция, которая будет вызываться при начале перетаскивания
  const handleDragStart = () => {
    closeAllPanels();
    // Если передана внешняя функция onDragStart, вызываем её
    if (onDragStart) {
      onDragStart();
    }
  };
  
  // Обработчик изменения состояния главной панели
  const handleMainPanelToggle = (isExpanded) => {
    setIsMainPanelExpanded(isExpanded);
  };
  
  // Обработчик изменения состояния группы
  const handleGroupToggle = (groupIndex, isExpanded) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupIndex]: isExpanded
    }));
  };

  return (
    <div className="elements-panel" ref={sidebarRef}>
      <CollapsiblePanel 
        title="Элементы зала" 
        defaultExpanded={false}
        className="main-elements-panel"
        expanded={isMainPanelExpanded}
        onToggle={handleMainPanelToggle}
      >
        <div className="elements-panel-content">
          {/* Разбиваем элементы по категориям */}
          {elementGroups.map((group, groupIndex) => (
            <CollapsiblePanel
              key={`group-${groupIndex}`}
              title={group.title}
              defaultExpanded={false}
              className="elements-sub-panel"
              expanded={expandedGroups[groupIndex] || false}
              onToggle={(isExpanded) => handleGroupToggle(groupIndex, isExpanded)}
            >
              <div className="elements-group">
                {group.elements.map((elementId) => {
                  const element = getElementById(elementId);
                  if (!element) return null;
                  
                  return (
                    <DraggableElement
                      key={element.id}
                      elementType={element}
                      onDragStart={handleDragStart}
                    />
                  );
                })}
              </div>
            </CollapsiblePanel>
          ))}
        </div>
      </CollapsiblePanel>
    </div>
  );
};

export default ElementsPanel;