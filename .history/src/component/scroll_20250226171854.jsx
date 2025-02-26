import React, { useEffect, useRef } from 'react';

const ScrollPositionManager = ({ children }) => {
  const scrollPos = useRef({ x: 0, y: 0 });

  // Сохраняем позицию прокрутки перед обновлением
  useEffect(() => {
    const savePosition = () => {
      scrollPos.current = {
        x: window.pageXOffset,
        y: window.pageYOffset
      };
    };

    // Восстанавливаем позицию прокрутки после обновления
    const restorePosition = () => {
      window.scrollTo(scrollPos.current.x, scrollPos.current.y);
    };

    window.addEventListener('scroll', savePosition);
    
    // Функция будет вызвана после рендеринга компонента
    const timeoutId = setTimeout(restorePosition, 0);
    
    return () => {
      window.removeEventListener('scroll', savePosition);
      clearTimeout(timeoutId);
    };
  }, [children]); // Перезапускаем эффект при изменении дочерних элементов

  return <>{children}</>;
};

export default ScrollPositionManager;