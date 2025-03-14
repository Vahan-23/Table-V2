import React, { useState, useEffect, useRef, useMemo } from 'react';
import './MiniMap.css';

const MiniMap = ({ tables, tablesAreaRef, zoom }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 20, y: 20 });
    const [viewportRect, setViewportRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const miniMapRef = useRef(null);
    const dragStartPos = useRef(null);
    const dragStartViewport = useRef(null);
    const contentBounds = useRef({
        minX: 0,
        minY: 0,
        maxX: 5000, // Default large value
        maxY: 5000  // Default large value
    });
    
    // Calculate the actual bounds based on all tables
    useEffect(() => {
        if (tables.length === 0) return;
        
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        
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
        
        // Add padding to ensure we capture everything including scrollable areas
        minX = Math.max(0, minX - 500);
        minY = Math.max(0, minY - 500);
        maxX = maxX + 500;
        maxY = maxY + 500;
        
        // Ensure we have a minimum viewing area even with no tables
        if (maxX - minX < 2000) maxX = minX + 2000;
        if (maxY - minY < 2000) maxY = minY + 2000;
        
        contentBounds.current = { minX, minY, maxX, maxY };
    }, [tables]);
    
    // Calculate dynamic scale factor based on content bounds
    const scaleFactor = useMemo(() => {
        const miniMapWidth = 200; // Width of our minimap content area
        const miniMapHeight = 150; // Height of our minimap content area
        
        const contentWidth = contentBounds.current.maxX - contentBounds.current.minX;
        const contentHeight = contentBounds.current.maxY - contentBounds.current.minY;
        
        // Calculate scale factors for both dimensions and use the smaller one
        const scaleX = miniMapWidth / contentWidth;
        const scaleY = miniMapHeight / contentHeight;
        
        return Math.min(scaleX, scaleY, 0.05); // Lower cap to 0.05 to ensure we see everything
    }, [tables]);
    
    // Update viewport rectangle when tables area changes
    useEffect(() => {
        const updateViewportRect = () => {
            if (!tablesAreaRef.current || !miniMapRef.current) return;
            
            const container = tablesAreaRef.current;
            const miniMapContainer = miniMapRef.current;
            
            // Get container dimensions
            const containerRect = container.getBoundingClientRect();
            const scrollLeft = container.scrollLeft;
            const scrollTop = container.scrollTop;
            
            // Calculate visible area within the tables area
            const visibleWidth = containerRect.width / zoom;
            const visibleHeight = containerRect.height / zoom;
            
            // Calculate viewport rectangle in the minimap
            setViewportRect({
                x: (scrollLeft - contentBounds.current.minX) * scaleFactor,
                y: (scrollTop - contentBounds.current.minY) * scaleFactor,
                width: visibleWidth * scaleFactor,
                height: visibleHeight * scaleFactor
            });
        };

        // Set up scroll and resize event listeners
        const container = tablesAreaRef.current;
        if (container) {
            container.addEventListener('scroll', updateViewportRect);
            window.addEventListener('resize', updateViewportRect);
            updateViewportRect();
        }

        return () => {
            if (container) {
                container.removeEventListener('scroll', updateViewportRect);
                window.removeEventListener('resize', updateViewportRect);
            }
        };
    }, [tablesAreaRef, zoom]);

    // Toggle minimap visibility
    const toggleVisibility = () => {
        setIsVisible(!isVisible);
    };

    // Handle drag to move the minimap
    const handleMouseDown = (e) => {
        if (e.target === miniMapRef.current || e.target.classList.contains('minimap-header')) {
            setIsDragging(true);
            dragStartPos.current = { x: e.clientX, y: e.clientY };
            setPosition(prevPosition => {
                dragStartViewport.current = { ...prevPosition };
                return prevPosition;
            });
            e.preventDefault();
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - dragStartPos.current.x;
        const deltaY = e.clientY - dragStartPos.current.y;
        
        setPosition({
            x: dragStartViewport.current.x + deltaX,
            y: dragStartViewport.current.y + deltaY
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        dragStartPos.current = null;
        dragStartViewport.current = null;
    };

    // Handle click on minimap to navigate
    const handleMiniMapClick = (e) => {
        if (e.target === miniMapRef.current.querySelector('.minimap-content') ||
            e.target.classList.contains('minimap-table') ||
            e.target.classList.contains('minimap-table-label')) {
            
            const rect = miniMapRef.current.querySelector('.minimap-content').getBoundingClientRect();
            const clickX = (e.clientX - rect.left) / scaleFactor + contentBounds.current.minX;
            const clickY = (e.clientY - rect.top) / scaleFactor + contentBounds.current.minY;
            
            // Calculate center point for the viewport
            const centerX = clickX - (viewportRect.width / scaleFactor / 2);
            const centerY = clickY - (viewportRect.height / scaleFactor / 2);
            
            // Scroll the main container to this position
            if (tablesAreaRef.current) {
                tablesAreaRef.current.scrollLeft = centerX;
                tablesAreaRef.current.scrollTop = centerY;
            }
        }
    };

    // Set up global mouse event listeners for dragging
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    if (!isVisible) {
        return (
            <button 
                className="minimap-toggle-button minimized"
                onClick={toggleVisibility}
                title="Show MiniMap"
            >
                <span>🗺️</span>
            </button>
        );
    }

    return (
        <div 
            className={`minimap-container ${isDragging ? 'dragging' : ''}`}
            style={{ 
                left: `${position.x}px`, 
                top: `${position.y}px` 
            }}
            ref={miniMapRef}
            onMouseDown={handleMouseDown}
        >
            <div className="minimap-header">
                <span>MiniMap (Все столы)</span>
                <button className="minimap-close-btn" onClick={toggleVisibility}>×</button>
            </div>
            
            <div 
                className="minimap-content"
                onClick={handleMiniMapClick}
            >
                {/* Draw tables */}
                {tables.map(table => (
                    <div
                        key={table.id}
                        className="minimap-table"
                        style={{
                            left: `${((table.x || 0) - contentBounds.current.minX) * scaleFactor}px`,
                            top: `${((table.y || 0) - contentBounds.current.minY) * scaleFactor}px`,
                            width: `${(table.width || 300) * scaleFactor}px`,
                            height: `${(table.height || 300) * scaleFactor}px`
                        }}
                    >
                        <span className="minimap-table-label">{table.id}</span>
                    </div>
                ))}
                
                {/* Draw viewport rectangle */}
                <div
                    className="minimap-viewport"
                    style={{
                        left: `${viewportRect.x}px`,
                        top: `${viewportRect.y}px`,
                        width: `${viewportRect.width}px`,
                        height: `${viewportRect.height}px`
                    }}
                />
            </div>
        </div>
    );
};

export default MiniMap;