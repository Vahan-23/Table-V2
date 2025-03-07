import React, { useState, useRef, useEffect } from 'react';

const TablesAreaComponent = () => {
  // State for tables, people, zoom, and dragging
  const [tables, setTables] = useState([]);
  const [people, setPeople] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [draggingGroup, setDraggingGroup] = useState(null);
  const [isDraggingTable, setIsDraggingTable] = useState(false);
  const [draggedTableId, setDraggedTableId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizingTableId, setResizingTableId] = useState(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollStartPos, setScrollStartPos] = useState({ x: 0, y: 0 });
  const tablesAreaRef = useRef(null);
  const containerRef = useRef(null);

  // Handle zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  // Handle table deletion
  const handleDeleteTable = (tableId) => {
    setTables(prev => prev.filter(table => table.id !== tableId));
    // Also remove people assigned to this table
    setPeople(prev => prev.filter(person => person.tableId !== tableId));
  };

  // Handle chair click for assigning people
  const handleChairClick = (tableId, chairIndex) => {
    // Implementation depends on your people assignment logic
    console.log(`Clicked chair ${chairIndex} at table ${tableId}`);
    // Add logic to assign/unassign people to chairs
  };

  // Start dragging a table
  const handleTableDragStart = (e, tableId) => {
    if (isScrolling) return;
    
    setIsDraggingTable(true);
    setDraggedTableId(tableId);
    
    const table = tables.find(t => t.id === tableId);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    // Prevent default to avoid browser's drag behavior
    e.preventDefault();
  };

  // Handle table resizing
  const handleResizeStart = (e, tableId) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizingTableId(tableId);
  };

  // Start area scrolling (when not dragging tables)
  const handleAreaMouseDown = (e) => {
    if (e.target === tablesAreaRef.current) {
      setIsScrolling(true);
      setScrollStartPos({
        x: e.clientX + containerRef.current.scrollLeft,
        y: e.clientY + containerRef.current.scrollTop
      });
      e.preventDefault();
    }
  };

  // Handle mouse move for dragging, resizing, or scrolling
  const handleMouseMove = (e) => {
    if (isDraggingTable && draggedTableId) {
      // Update table position
      setTables(prev => prev.map(table => {
        if (table.id === draggedTableId) {
          const container = tablesAreaRef.current.getBoundingClientRect();
          const newX = (e.clientX - container.left - dragOffset.x) / zoom;
          const newY = (e.clientY - container.top - dragOffset.y) / zoom;
          return { ...table, x: newX, y: newY };
        }
        return table;
      }));
    } else if (isResizing && resizingTableId) {
      // Update table size
      setTables(prev => prev.map(table => {
        if (table.id === resizingTableId) {
          const container = tablesAreaRef.current.getBoundingClientRect();
          const newWidth = Math.max(100, (e.clientX - container.left - table.x * zoom) / zoom);
          const newHeight = Math.max(100, (e.clientY - container.top - table.y * zoom) / zoom);
          return { ...table, width: newWidth, height: newHeight };
        }
        return table;
      }));
    } else if (isScrolling) {
      // Handle scrolling the container
      containerRef.current.scrollLeft = scrollStartPos.x - e.clientX;
      containerRef.current.scrollTop = scrollStartPos.y - e.clientY;
    }
  };

  // Handle mouse up to stop all dragging/resizing operations
  const handleMouseUp = () => {
    setIsDraggingTable(false);
    setDraggedTableId(null);
    setIsResizing(false);
    setResizingTableId(null);
    setIsScrolling(false);
  };

  // Add a new table
  const addNewTable = () => {
    const newTable = {
      id: `table-${Date.now()}`,
      x: 200,
      y: 200,
      width: 150,
      height: 100,
      shape: 'rectangle',
      chairs: 8
    };
    setTables(prev => [...prev, newTable]);
  };

  // Effect to add window event listeners
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingTable, draggedTableId, isResizing, resizingTableId, isScrolling]);

  return (
    <div 
      className="tables-area-container"
      style={{
        position: 'relative',
        width: '100%',
        height: '500px', // Set a fixed height
        overflow: 'hidden'
      }}
      ref={containerRef}
    >
      {/* Zoom Controls */}
      <div className="zoom-controls" style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        background: 'white',
        padding: '5px',
        borderRadius: '4px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
      }}>
        <label>Մասշտաբ:</label>
        <div className="zoom-buttons" style={{ display: 'flex', alignItems: 'center', marginLeft: '5px' }}>
          <button
            className="zoom-btn zoom-out-btn"
            onClick={handleZoomOut}
            style={{ width: '28px', height: '28px', cursor: 'pointer' }}
          >−</button>
          <span className="zoom-percentage" style={{ margin: '0 5px' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            className="zoom-btn zoom-in-btn"
            onClick={handleZoomIn}
            style={{ width: '28px', height: '28px', cursor: 'pointer' }}
          >+</button>
        </div>
      </div>
      
      {/* Add Table Button */}
      <button 
        onClick={addNewTable} 
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 100
        }}
      >
        Add Table
      </button>
      
      {/* Tables Area */}
      <div 
        className="tables-area" 
        ref={tablesAreaRef}
        onMouseDown={handleAreaMouseDown}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          width: '2000px', // Make this larger than the container for scrolling
          height: '2000px',
          position: 'relative',
          cursor: isScrolling ? 'grabbing' : 'default'
        }}
      >
        {tables.map((table) => (
          <div
            key={table.id}
            className="table"
            onMouseDown={(e) => handleTableDragStart(e, table.id)}
            style={{
              position: 'absolute',
              left: `${table.x}px`,
              top: `${table.y}px`,
              width: `${table.width}px`,
              height: `${table.height}px`,
              backgroundColor: draggedTableId === table.id ? '#f0f0f0' : '#d9d9d9',
              border: '1px solid #888',
              borderRadius: table.shape === 'circle' ? '50%' : '4px',
              cursor: isDraggingTable && draggedTableId === table.id ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
          >
            {/* Table Header with Delete Button */}
            <div style={{ padding: '5px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTable(table.id);
                }}
                style={{ cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            
            {/* Chair placeholders */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around' }}>
              {Array.from({ length: table.chairs || 0 }).map((_, idx) => (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChairClick(table.id, idx);
                  }}
                  style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    margin: '5px',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
            
            {/* Resize handle */}
            <div
              className="resize-handle"
              onMouseDown={(e) => handleResizeStart(e, table.id)}
              style={{
                position: 'absolute',
                right: '0',
                bottom: '0',
                width: '10px',
                height: '10px',
                cursor: 'nwse-resize',
                backgroundColor: '#888'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TablesAreaComponent;