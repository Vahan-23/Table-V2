import React, { useEffect, useRef, useState } from 'react';

const MiniMap = ({ tables, tablesAreaRef, zoom, setZoom }) => {
    const miniMapRef = useRef(null);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [mapSize, setMapSize] = useState({ width: 200, height: 160 });
    const [viewportRect, setViewportRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

    // Calculate the available tables area dimensions
    useEffect(() => {
        if (!tablesAreaRef.current || !miniMapRef.current) return;

        // Function to update the viewport rectangle
        const updateViewportRect = () => {
            const container = tablesAreaRef.current;
            if (!container) return;

            // Calculate the full content area including all tables (not just the container)
            let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
            
            // Iterate through all tables to find the extremes
            tables.forEach(table => {
                const tableX = table.x || 0;
                const tableY = table.y || 0;
                const tableWidth = table.width || 300;
                const tableHeight = table.height || 300;
                
                minX = Math.min(minX, tableX);
                minY = Math.min(minY, tableY);
                maxX = Math.max(maxX, tableX + tableWidth);
                maxY = Math.max(maxY, tableY + tableHeight);
            });
            
            // Add some padding
            minX = Math.max(0, minX - 100);
            minY = Math.max(0, minY - 100);
            maxX = maxX + 100;
            maxY = maxY + 100;
            
            // Calculate total content dimensions
            const contentWidth = Math.max(container.scrollWidth, maxX);
            const contentHeight = Math.max(container.scrollHeight, maxY);

            // Get the visible viewport dimensions
            const viewportWidth = container.clientWidth;
            const viewportHeight = container.clientHeight;

            // Calculate the visible portion as a rectangle in the minimap
            const mapWidth = miniMapRef.current.clientWidth;
            const mapHeight = miniMapRef.current.clientHeight;

            // Calculate the scale factors
            const scaleX = mapWidth / contentWidth;
            const scaleY = mapHeight / contentHeight;

            // Use the smaller scale to ensure aspect ratio is maintained
            const scale = Math.min(scaleX, scaleY);

            // Calculate viewport position in the minimap
            const viewportX = container.scrollLeft * scale;
            const viewportY = container.scrollTop * scale;
            
            // Calculate viewport size in the minimap
            const scaledViewportWidth = viewportWidth * scale / zoom;
            const scaledViewportHeight = viewportHeight * scale / zoom;

            setViewportRect({
                x: viewportX,
                y: viewportY,
                width: scaledViewportWidth,
                height: scaledViewportHeight
            });
        };

        // Initial update
        updateViewportRect();

        // Add scroll event listener to update the viewport rectangle when scrolling
        const container = tablesAreaRef.current;
        if (container) {
            container.addEventListener('scroll', updateViewportRect);
        }

        // Add resize observer to update the viewport rectangle when resizing
        const resizeObserver = new ResizeObserver(updateViewportRect);
        resizeObserver.observe(container);

        return () => {
            if (container) {
                container.removeEventListener('scroll', updateViewportRect);
            }
            resizeObserver.disconnect();
        };
    }, [tablesAreaRef, zoom, tables]);

    // Handle minimap click to navigate
    const handleMiniMapClick = (e) => {
        if (!tablesAreaRef.current || !miniMapRef.current) return;

        // Get the minimap dimensions
        const rect = miniMapRef.current.getBoundingClientRect();
        
        // Calculate the click position relative to the minimap
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        // Get the container
        const container = tablesAreaRef.current;
        
        // Calculate total content dimensions based on tables
        let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
        
        // Iterate through all tables to find the extremes
        tables.forEach(table => {
            const tableX = table.x || 0;
            const tableY = table.y || 0;
            const tableWidth = table.width || 300;
            const tableHeight = table.height || 300;
            
            minX = Math.min(minX, tableX);
            minY = Math.min(minY, tableY);
            maxX = Math.max(maxX, tableX + tableWidth);
            maxY = Math.max(maxY, tableY + tableHeight);
        });
        
        // Add some padding
        minX = Math.max(0, minX - 50);
        minY = Math.max(0, minY - 50);
        maxX = maxX + 50;
        maxY = maxY + 50;
        
        // Calculate content dimensions (use container size if larger)
        const contentWidth = Math.max(container.scrollWidth, maxX);
        const contentHeight = Math.max(container.scrollHeight, maxY);
        
        // Get scale factors from real dimensions to minimap
        const { scale } = calculateScale();
        
        // Calculate new scroll position for the main container
        const newScrollX = clickX / scale - (container.clientWidth / zoom / 2);
        const newScrollY = clickY / scale - (container.clientHeight / zoom / 2);
        
        // Apply the scroll position with smooth animation
        container.scrollTo({
            left: newScrollX,
            top: newScrollY,
            behavior: 'smooth'
        });
    };

    // Handle table click to navigate
    const handleTableClick = (table) => {
        if (!tablesAreaRef.current) return;
        
        const container = tablesAreaRef.current;
        
        // Calculate center position of the table
        const tableCenterX = table.x + (table.width || 300) / 2;
        const tableCenterY = table.y + (table.height || 300) / 2;
        
        // Calculate new scroll position to center on the table
        const newScrollX = tableCenterX - (container.clientWidth / zoom / 2);
        const newScrollY = tableCenterY - (container.clientHeight / zoom / 2);
        
        // Apply the scroll position with smooth animation
        container.scrollTo({
            left: newScrollX,
            top: newScrollY,
            behavior: 'smooth'
        });
    };

    // Handle minimap drag
    const handleMiniMapDragStart = (e) => {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMiniMapDragMove = (e) => {
        if (!isDragging) return;

        // Calculate new position
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        // Get window dimensions
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Ensure minimap stays within window bounds
        const boundedX = Math.max(0, Math.min(windowWidth - mapSize.width, newX));
        const boundedY = Math.max(0, Math.min(windowHeight - mapSize.height, newY));

        setPosition({
            x: boundedX,
            y: boundedY
        });
    };

    const handleMiniMapDragEnd = () => {
        setIsDragging(false);
    };

    // Add event listeners for dragging
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMiniMapDragMove);
            window.addEventListener('mouseup', handleMiniMapDragEnd);
        } else {
            window.removeEventListener('mousemove', handleMiniMapDragMove);
            window.removeEventListener('mouseup', handleMiniMapDragEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleMiniMapDragMove);
            window.removeEventListener('mouseup', handleMiniMapDragEnd);
        };
    }, [isDragging, dragStart]);

    // Toggle minimap expansion
    const toggleExpand = (e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    // Calculate minimap scale based on all tables
    const calculateScale = () => {
        if (!tablesAreaRef.current || !miniMapRef.current) return { scaleX: 1, scaleY: 1, scale: 1 };

        const container = tablesAreaRef.current;
        const miniMap = miniMapRef.current;

        // Calculate the full content area including all tables (not just the container)
        let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
        
        // Iterate through all tables to find the extremes
        tables.forEach(table => {
            const tableX = table.x || 0;
            const tableY = table.y || 0;
            const tableWidth = table.width || 300;
            const tableHeight = table.height || 300;
            
            minX = Math.min(minX, tableX);
            minY = Math.min(minY, tableY);
            maxX = Math.max(maxX, tableX + tableWidth);
            maxY = Math.max(maxY, tableY + tableHeight);
        });
        
        // Add some padding
        minX = Math.max(0, minX - 50);
        minY = Math.max(0, minY - 50);
        maxX = maxX + 50;
        maxY = maxY + 50;
        
        // Calculate total content dimensions (use max of container and calculated dimensions)
        const contentWidth = Math.max(container.scrollWidth, maxX);
        const contentHeight = Math.max(container.scrollHeight, maxY);

        // Get minimap dimensions
        const miniMapWidth = miniMap.clientWidth;
        const miniMapHeight = miniMap.clientHeight;

        // Calculate scale factors
        const scaleX = miniMapWidth / contentWidth;
        const scaleY = miniMapHeight / contentHeight;
        
        // Use the smaller scale to ensure aspect ratio is maintained
        const scale = Math.min(scaleX, scaleY);

        return { scaleX: scale, scaleY: scale, scale };
    };

    return (
        <div 
            className={`mini-map ${isExpanded ? 'expanded' : 'collapsed'}`}
            ref={miniMapRef}
            style={{
                position: 'fixed',
                width: mapSize.width + 'px',
                height: isExpanded ? mapSize.height + 'px' : '30px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                overflow: 'hidden',
                zIndex: 1000,
                left: position.x + 'px',
                top: position.y + 'px',
                transition: 'height 0.3s ease'
            }}
        >
            {/* Minimap header/drag handle */}
            <div 
                className="mini-map-header"
                onMouseDown={handleMiniMapDragStart}
                style={{
                    padding: '5px 10px',
                    backgroundColor: '#4682B4',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'move',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none'
                }}
            >
                <span>Մինի քարտեզ</span>
                <button 
                    onClick={toggleExpand}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    {isExpanded ? '▼' : '▲'}
                </button>
            </div>

            {/* Minimap content */}
            {isExpanded && (
                <div 
                    className="mini-map-content"
                    onClick={handleMiniMapClick}
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: 'calc(100% - 30px)',
                        backgroundColor: '#f0f0f0'
                    }}
                >
                    {/* Tables */}
                    {tables.map(table => {
                        const { scale } = calculateScale();
                        
                        // Calculate table position and size in minimap
                        const tableX = (table.x || 0) * scale;
                        const tableY = (table.y || 0) * scale;
                        const tableWidth = ((table.width || 300) * scale);
                        const tableHeight = ((table.height || 300) * scale);
                        
                        // Determine if this table has people seated
                        const hasSeatedPeople = table.people && table.people.some(person => person);
                        
                        return (
                            <div
                                key={table.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleTableClick(table);
                                }}
                                style={{
                                    position: 'absolute',
                                    left: tableX + 'px',
                                    top: tableY + 'px',
                                    width: Math.max(5, tableWidth) + 'px', // Ensure minimum size for visibility
                                    height: Math.max(5, tableHeight) + 'px',
                                    backgroundColor: hasSeatedPeople ? '#3CB371' : '#4682B4', // Green if has people, blue if empty
                                    border: '1px solid #2c5d7c',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontSize: '8px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    color: 'white',
                                    overflow: 'hidden',
                                    zIndex: 5
                                }}
                                title={`Table ${table.id} (${table.people ? table.people.filter(Boolean).length : 0}/${table.chairCount} seats filled)`}
                            >
                                {tableWidth > 20 && tableHeight > 15 ? table.id : ''}
                            </div>
                        );
                    })}

                    {/* Viewport rectangle */}
                    <div
                        className="viewport-indicator"
                        style={{
                            position: 'absolute',
                            left: viewportRect.x + 'px',
                            top: viewportRect.y + 'px',
                            width: viewportRect.width + 'px',
                            height: viewportRect.height + 'px',
                            border: '2px solid red',
                            backgroundColor: 'rgba(255, 0, 0, 0.1)',
                            pointerEvents: 'none'
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default MiniMap;