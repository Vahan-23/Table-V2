import React, { useState, useRef, useEffect } from 'react';

const FigmaStyleCanvas = ({ 
  externalTables = [], // New prop for receiving external tables
  onTableUpdate, // Optional callback to communicate table changes back
}) => {
  // Состояния для управления канвасом
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tables, setTables] = useState(externalTables);
  const [people, setPeople] = useState([]);
  const [draggingGroup, setDraggingGroup] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  
  const canvasRef = useRef(null);
  
  // Обработчики масштабирования
  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(prevZoom * 1.2, 3));
  };
  
  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(prevZoom / 1.2, 0.3));
  };
  
  // Обработка зума колесиком мыши
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.3, Math.min(3, zoom * delta));
      
      // Вычисляем позицию курсора относительно канваса
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Корректируем позицию канваса при зуме вокруг точки курсора
      const newX = mouseX - (mouseX - position.x) * (newZoom / zoom);
      const newY = mouseY - (mouseY - position.y) * (newZoom / zoom);
      
      setZoom(newZoom);
      setPosition({ x: newX, y: newY });
    }
  };
  
  // Обработчики перетаскивания канваса (панорамирование)
  const handleCanvasMouseDown = (e) => {
    // Проверяем, что нажата средняя кнопка мыши или зажат пробел + левая кнопка мыши
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      e.preventDefault();
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleCanvasMouseMove = (e) => {
    if (isDraggingCanvas) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      setPosition({
        x: position.x + dx,
        y: position.y + dy
      });
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleCanvasMouseUp = () => {
    if (isDraggingCanvas) {
      setIsDraggingCanvas(false);
    }
  };
  
  // Обработчик для добавления стола
  const handleAddTable = () => {
    const newTable = {
      id: Date.now(),
      x: 100,
      y: 100,
      width: 120,
      height: 80,
      chairs: [
        { position: 'top', occupied: false },
        { position: 'right', occupied: false },
        { position: 'bottom', occupied: false },
        { position: 'left', occupied: false }
      ]
    };
    
    setTables([...tables, newTable]);
  };
  
  // Обработчик удаления стола
  const handleDeleteTable = (tableId) => {
    setTables(tables.filter(table => table.id !== tableId));
    
    // Также удаляем людей, привязанных к этому столу
    setPeople(people.filter(person => person.tableId !== tableId));
  };
  
  // Обработчик клика по стулу
  const handleChairClick = (tableId, chairIndex) => {
    setTables(tables.map(table => {
      if (table.id === tableId) {
        const updatedChairs = [...table.chairs];
        updatedChairs[chairIndex].occupied = !updatedChairs[chairIndex].occupied;
        
        if (updatedChairs[chairIndex].occupied) {
          // Добавляем человека
          const newPerson = {
            id: Date.now(),
            tableId,
            chairIndex,
            name: `Гость ${people.length + 1}`
          };
          setPeople([...people, newPerson]);
        } else {
          // Удаляем человека
          setPeople(people.filter(
            person => !(person.tableId === tableId && person.chairIndex === chairIndex)
          ));
        }
        
        return { ...table, chairs: updatedChairs };
      }
      return table;
    }));
  };
  
  // Эффект для обработки нажатия клавиш
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Space + перетаскивание = панорамирование
      if (e.code === 'Space') {
        document.body.style.cursor = 'grab';
      }
      
      // Ctrl/Cmd + '+' = увеличение масштаба
      if ((e.ctrlKey || e.metaKey) && e.code === 'Equal') {
        e.preventDefault();
        handleZoomIn();
      }
      
      // Ctrl/Cmd + '-' = уменьшение масштаба
      if ((e.ctrlKey || e.metaKey) && e.code === 'Minus') {
        e.preventDefault();
        handleZoomOut();
      }
      
      // Ctrl/Cmd + '0' = сброс масштаба
      if ((e.ctrlKey || e.metaKey) && e.code === 'Digit0') {
        e.preventDefault();
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      }
      
      // 'G' = показать/скрыть сетку
      if (e.code === 'KeyG') {
        setShowGrid(!showGrid);
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        document.body.style.cursor = 'default';
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [zoom, showGrid]);
  
  return (
    <div className="figma-style-editor">
      <div className="editor-toolbar">
        <div className="zoom-controls">
          <label>Масштаб:</label>
          <div className="zoom-buttons">
            <button
              className="zoom-btn zoom-out-btn"
              onClick={handleZoomOut}
            >−</button>
            <span className="zoom-percentage">
              {Math.round(zoom * 100)}%
            </span>
            <button
              className="zoom-btn zoom-in-btn"
              onClick={handleZoomIn}
            >+</button>
          </div>
        </div>
        
        <div className="toolbar-actions">
          <button className="add-table-btn" onClick={handleAddTable}>
            Добавить стол
          </button>
          <button 
            className="toggle-grid-btn" 
            onClick={() => setShowGrid(!showGrid)}
          >
            {showGrid ? 'Скрыть сетку' : 'Показать сетку'}
          </button>
        </div>
      </div>
      
      <div 
        className="tables-area-container" 
        style={{
          position: 'relative',
          width: '100%',
          height: 'calc(100vh - 60px)',
          overflow: 'hidden',
          backgroundColor: '#f5f5f5',
          cursor: isDraggingCanvas ? 'grabbing' : 'default'
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={handleWheel}
        ref={canvasRef}
      >
        {/* Сетка в стиле Figma */}
        {showGrid && (
          <div 
            className="grid-background" 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'linear-gradient(#ddd 1px, transparent 1px), linear-gradient(90deg, #ddd 1px, transparent 1px)',
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              transform: `translate(${position.x}px, ${position.y}px)`,
              transformOrigin: '0 0',
              pointerEvents: 'none'
            }}
          />
        )}
        
        {/* Область со столами */}
        <div 
          className="tables-area" 
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
            minWidth: '5000px',
            minHeight: '5000px'
          }}
        >
          {/* Новый стол при перетаскивании */}
          {draggingGroup && (
            <NewTable
              draggingGroup={draggingGroup}
              setTables={setTables}
              setDraggingGroup={setDraggingGroup}
              setPeople={setPeople}
            />
          )}

          {/* Существующие столы */}
          {tables.map((table) => (
            <Table
              key={table.id}
              table={table}
              setTables={setTables}
              handleDeleteTable={handleDeleteTable}
              draggingGroup={draggingGroup}
              setDraggingGroup={setDraggingGroup}
              people={people}
              setPeople={setPeople}
              onChairClick={(chairIndex) => handleChairClick(table.id, chairIndex)}
              zoom={zoom}
            />
          ))}
        </div>
      </div>
      
      {/* Мини-карта (опционально) */}
      <div className="minimap" style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        width: '150px',
        height: '100px',
        border: '1px solid #ccc',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        <div style={{
          transform: `scale(${0.03})`,
          transformOrigin: '0 0',
          width: '5000px',
          height: '5000px',
          position: 'relative'
        }}>
          {tables.map((table) => (
            <div key={`minimap-${table.id}`} style={{
              position: 'absolute',
              left: table.x,
              top: table.y,
              width: table.width,
              height: table.height,
              backgroundColor: '#3498db'
            }} />
          ))}
        </div>
        <div style={{
          position: 'absolute',
          border: '1px solid red',
          width: `${Math.min(100, 100 / zoom)}%`,
          height: `${Math.min(100, 100 / zoom)}%`,
          transform: `translate(${-position.x / (50 * zoom)}%, ${-position.y / (50 * zoom)}%)`,
          maxWidth: '100%',
          maxHeight: '100%'
        }} />
      </div>
    </div>
  );
};

// Компонент стола
const Table = ({ 
  table, 
  setTables, 
  handleDeleteTable, 
  people,
  setPeople,
  onChairClick,
  zoom 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  
  const tableRef = useRef(null);
  
  // Обработчик начала перетаскивания
  const handleMouseDown = (e) => {
    if (e.button === 0) { // левая кнопка мыши
      e.stopPropagation();
      setIsDragging(true);
      
      // Захватываем смещение между позицией мыши и верхним левым
      // углом стола, учитывая текущий масштаб
      const rect = tableRef.current.getBoundingClientRect();
      setDragOffset({
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom
      });
    }
  };
  
  // Обработчик перемещения стола
  // Обработчик перемещения стола
const handleMouseMove = (e) => {
  if (isDragging && !isResizing) {
    e.stopPropagation();
    e.preventDefault();
    
    // Get parent container rect
    const containerRect = e.currentTarget.getBoundingClientRect();
    
    // Calculate new position accounting for zoom and offset
    const newX = (e.clientX - containerRect.left) / zoom - dragOffset.x;
    const newY = (e.clientY - containerRect.top) / zoom - dragOffset.y;
    
    // Update table position with boundary constraints
    setTables(prevTables => prevTables.map(t => {
      if (t.id === table.id) {
        // Get container dimensions
        const containerWidth = 5000; // Match your tables-area minWidth
        const containerHeight = 5000; // Match your tables-area minHeight
        
        // Apply boundaries - ensure table stays completely within container
        const boundedX = Math.max(0, Math.min(containerWidth - t.width, newX));
        const boundedY = Math.max(0, Math.min(containerHeight - t.height, newY));
        
        return {
          ...t,
          x: boundedX,
          y: boundedY
        };
      }
      return t;
    }));
  } else if (isResizing) {
    e.stopPropagation();
    e.preventDefault();
    
    // Get parent container rect
    const containerRect = e.currentTarget.getBoundingClientRect();
    
    // Process resizing with boundary constraints
    setTables(prevTables => prevTables.map(t => {
      if (t.id === table.id) {
        let newWidth = t.width;
        let newHeight = t.height;
        let newX = t.x;
        let newY = t.y;
        
        // Calculate mouse position relative to container with zoom
        const mouseX = (e.clientX - containerRect.left) / zoom;
        const mouseY = (e.clientY - containerRect.top) / zoom;
        
        // Container dimensions
        const containerWidth = 5000;
        const containerHeight = 5000;
        
        // Apply resize logic with boundaries
        if (resizeDirection.includes('e')) {
          // Right resize - limit to container edge
          newWidth = Math.max(80, Math.min(containerWidth - t.x, mouseX - t.x));
        }
        if (resizeDirection.includes('w')) {
          // Left resize - limit to container edge and ensure minimum width
          const maxDeltaX = Math.min(t.x, t.width - 80);
          const deltaX = Math.max(0, Math.min(maxDeltaX, t.x - mouseX));
          newWidth = t.width + deltaX;
          newX = t.x - deltaX;
        }
        if (resizeDirection.includes('s')) {
          // Bottom resize - limit to container edge
          newHeight = Math.max(60, Math.min(containerHeight - t.y, mouseY - t.y));
        }
        if (resizeDirection.includes('n')) {
          // Top resize - limit to container edge and ensure minimum height
          const maxDeltaY = Math.min(t.y, t.height - 60);
          const deltaY = Math.max(0, Math.min(maxDeltaY, t.y - mouseY));
          newHeight = t.height + deltaY;
          newY = t.y - deltaY;
        }
        
        return {
          ...t,
          width: newWidth,
          height: newHeight,
          x: newX,
          y: newY
        };
      }
      return t;
    }));
  }
};
  // Обработчик окончания перетаскивания/ресайзинга
  const handleMouseUp = (e) => {
    if (isDragging || isResizing) {
      e.stopPropagation();
      setIsDragging(false);
      setIsResizing(false);
    }
  };
  
  // Запускаем общий обработчик mouseup на документе
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging || isResizing) {
        setIsDragging(false);
        setIsResizing(false);
      }
    };
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing]);
  
  // Запуск изменения размера
  const handleResizeStart = (e, direction) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
  };
  
  // Обработчик контекстного меню (правый клик)
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };
  
  // Закрытие контекстного меню при клике вне его
  useEffect(() => {
    const closeContextMenu = () => {
      setShowContextMenu(false);
    };
    
    if (showContextMenu) {
      window.addEventListener('click', closeContextMenu);
      window.addEventListener('contextmenu', closeContextMenu);
    }
    
    return () => {
      window.removeEventListener('click', closeContextMenu);
      window.removeEventListener('contextmenu', closeContextMenu);
    };
  }, [showContextMenu]);
  
  return (
    <>
      <div
        ref={tableRef}
        className="table-element"
        style={{
          position: 'absolute',
          left: table.x,
          top: table.y,
          width: table.width,
          height: table.height,
          backgroundColor: '#3498db',
          borderRadius: '4px',
          cursor: isDragging ? 'grabbing' : 'grab',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          userSelect: 'none'
        }}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
      >
        <div className="table-content" style={{ padding: '8px', color: 'white', textAlign: 'center' }}>
          Стол {table.id}
        </div>
        
        {/* Стулья */}
        {table.chairs.map((chair, index) => {
          // Определяем позицию стула относительно стола
          let chairStyle = {};
          switch(chair.position) {
            case 'top':
              chairStyle = {
                top: '-20px',
                left: '50%',
                transform: 'translateX(-50%)'
              };
              break;
            case 'right':
              chairStyle = {
                top: '50%',
                right: '-20px',
                transform: 'translateY(-50%)'
              };
              break;
            case 'bottom':
              chairStyle = {
                bottom: '-20px',
                left: '50%',
                transform: 'translateX(-50%)'
              };
              break;
            case 'left':
              chairStyle = {
                top: '50%',
                left: '-20px',
                transform: 'translateY(-50%)'
              };
              break;
            default:
              break;
          }
          
          return (
            <div
              key={`chair-${index}`}
              className="chair"
              style={{
                position: 'absolute',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: chair.occupied ? '#e74c3c' : '#2ecc71',
                cursor: 'pointer',
                ...chairStyle
              }}
              onClick={(e) => {
                e.stopPropagation();
                onChairClick(index);
              }}
            />
          );
        })}
        
        {/* Маркеры для изменения размера */}
        <div
          className="resize-handle resize-n"
          style={{ position: 'absolute', top: '-4px', left: '0', right: '0', height: '8px', cursor: 'ns-resize' }}
          onMouseDown={(e) => handleResizeStart(e, 'n')}
        />
        <div
          className="resize-handle resize-e"
          style={{ position: 'absolute', top: '0', right: '-4px', bottom: '0', width: '8px', cursor: 'ew-resize' }}
          onMouseDown={(e) => handleResizeStart(e, 'e')}
        />
        <div
          className="resize-handle resize-s"
          style={{ position: 'absolute', bottom: '-4px', left: '0', right: '0', height: '8px', cursor: 'ns-resize' }}
          onMouseDown={(e) => handleResizeStart(e, 's')}
        />
        <div
          className="resize-handle resize-w"
          style={{ position: 'absolute', top: '0', left: '-4px', bottom: '0', width: '8px', cursor: 'ew-resize' }}
          onMouseDown={(e) => handleResizeStart(e, 'w')}
        />
        <div
          className="resize-handle resize-ne"
          style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', cursor: 'nesw-resize' }}
          onMouseDown={(e) => handleResizeStart(e, 'ne')}
        />
        <div
          className="resize-handle resize-se"
          style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '8px', height: '8px', cursor: 'nwse-resize' }}
          onMouseDown={(e) => handleResizeStart(e, 'se')}
        />
        <div
          className="resize-handle resize-sw"
          style={{ position: 'absolute', bottom: '-4px', left: '-4px', width: '8px', height: '8px', cursor: 'nesw-resize' }}
          onMouseDown={(e) => handleResizeStart(e, 'sw')}
        />
        <div
          className="resize-handle resize-nw"
          style={{ position: 'absolute', top: '-4px', left: '-4px', width: '8px', height: '8px', cursor: 'nwse-resize' }}
          onMouseDown={(e) => handleResizeStart(e, 'nw')}
        />
      </div>
      
      {/* Обработчик движения и отпускания при перетаскивании или ресайзе */}
      {(isDragging || isResizing) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            cursor: isDragging ? 'grabbing' : (
              resizeDirection === 'n' || resizeDirection === 's' ? 'ns-resize' :
              resizeDirection === 'e' || resizeDirection === 'w' ? 'ew-resize' :
              resizeDirection === 'ne' || resizeDirection === 'sw' ? 'nesw-resize' :
              resizeDirection === 'nw' || resizeDirection === 'se' ? 'nwse-resize' : 'move'
            )
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      )}
      
      {/* Контекстное меню */}
      {showContextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenuPos.y,
            left: contextMenuPos.x,
            backgroundColor: 'white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            borderRadius: '4px',
            padding: '8px 0',
            zIndex: 1000
          }}
        >
          <div 
            className="context-menu-item"
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              hover: { backgroundColor: '#f5f5f5' }
            }}
            onClick={() => {
              const newTable = { ...table };
              newTable.width = 120;
              newTable.height = 80;
              setTables(prevTables => 
                prevTables.map(t => t.id === table.id ? newTable : t)
              );
              setShowContextMenu(false);
            }}
          >
            Сбросить размер
          </div>
          <div 
            className="context-menu-item"
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              color: '#e74c3c',
              hover: { backgroundColor: '#f5f5f5' }
            }}
            onClick={() => {
              handleDeleteTable(table.id);
              setShowContextMenu(false);
            }}
          >
            Удалить стол
          </div>
        </div>
      )}
    </>
  );
};

// Компонент для нового стола при перетаскивании
const NewTable = ({
  draggingGroup,
  setTables,
  setDraggingGroup,
  setPeople
}) => {
  return (
    <div
      className="new-table-preview"
      style={{
        position: 'absolute',
        left: draggingGroup.x,
        top: draggingGroup.y,
        width: 120,
        height: 80,
        backgroundColor: 'rgba(52, 152, 219, 0.5)',
        borderRadius: '4px',
        border: '2px dashed #3498db',
        pointerEvents: 'none'
      }}
    />
  );
};

export default FigmaStyleCanvas;