import React, { useState, useEffect } from 'react';
import './CollapsiblePanel.css';

/**
 * Компонент для создания складывающейся панели в стиле Photoshop
 * 
 * @param {Object} props - Свойства компонента
 * @param {string} props.title - Заголовок панели
 * @param {ReactNode} props.children - Содержимое панели
 * @param {boolean} props.defaultExpanded - По умолчанию развернута или свернута
 * @param {string} props.className - Дополнительные CSS классы
 * @param {boolean} props.expanded - Внешнее управление состоянием развёрнутости
 * @param {Function} props.onToggle - Функция обратного вызова при переключении состояния
 * @returns {JSX.Element}
 */
const CollapsiblePanel = ({ 
  title, 
  children, 
  defaultExpanded = false,
  className = '',
  expanded, // Внешнее управление состоянием
  onToggle // Callback при изменении состояния
}) => {
  // Используем локальное состояние, если не предоставлено внешнее
  const [isExpanded, setIsExpanded] = useState(
    expanded !== undefined ? expanded : defaultExpanded
  );

  // Обновляем локальное состояние, когда изменяется внешнее
  useEffect(() => {

    if (expanded !== undefined) {
      setIsExpanded(expanded);
    }
  }, [expanded]);

  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    
    // Обновляем локальное состояние, если не управляется извне
    if (expanded === undefined) {
      setIsExpanded(newExpandedState);
    }
    
    // Вызываем callback, если он предоставлен
    if (onToggle) {
      onToggle(newExpandedState);
    }
  };
  return (
    <div className={`collapsible-panel ${className}`}>
      <div className="panel-header" onClick={toggleExpand}>
        <div className="header-content">
          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▶</span>
          <h3 className="panel-title">{title}</h3>
        </div>
      </div>
      
      <div className={`panel-content ${isExpanded ? 'expanded' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default CollapsiblePanel;