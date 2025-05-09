import React, { createContext, useContext, useState } from 'react';

// Создаем контекст для управления панелями
const PanelContext = createContext();

export function PanelProvider({ children }) {
  // Глобальное состояние для всех панелей
  const [allPanelsOpen, setAllPanelsOpen] = useState(false);
  
  // Функция для закрытия всех панелей
  const closeAllPanels = () => {
    setAllPanelsOpen(false);
  };

  return (
    <PanelContext.Provider value={{ allPanelsOpen, closeAllPanels }}>
      {children}
    </PanelContext.Provider>
  );
}

// Хук для использования контекста панелей
export function usePanelContext() {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error('usePanelContext должен использоваться внутри PanelProvider');
  }
  return context;
}