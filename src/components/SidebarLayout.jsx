import React from 'react';
import './SidebarLayout.css';

/**
 * Компонент для создания боковой панели с фиксированным положением
 * 
 * @param {Object} props - Свойства компонента
 * @param {ReactNode} props.children - Содержимое боковой панели
 * @param {string} props.position - Позиция ('left' или 'right')
 * @param {string} props.width - Ширина панели (в px или %)
 * @param {string} props.className - Дополнительные CSS классы
 * @returns {JSX.Element}
 */
const SidebarLayout = ({ 
  children, 
  position = 'right', 
  className = '' 
}) => {
  return (
    <div 
      className={`sidebar-layout ${position} ${className}`}
    >
      {children}
    </div>
  );
};

export default SidebarLayout;