import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Line, Arrow, Text, Ellipse, Star, Path } from 'react-konva';

const KonvaDrawingBoard = ({ 
  width, 
  height, 
  onShapesChange,
  initialShapes = [],
  selectedColor = '#000000',
  selectedStrokeWidth = 3,
  zIndex = 50,
  allowedTools = ['rect', 'circle', 'line', 'arrow', 'text', 'ellipse', 'star', 'freehand', 'eraser']
}) => {
  const [shapes, setShapes] = useState(initialShapes);
  const [activeTool, setActiveTool] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState(null);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [freehandPoints, setFreehandPoints] = useState([]);
  const [textValue, setTextValue] = useState('');
  const [textEditVisible, setTextEditVisible] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  
  const stageRef = useRef(null);
  const textInputRef = useRef(null);

  // Effect to notify parent component of shape changes
  useEffect(() => {
    if (onShapesChange) {
      onShapesChange(shapes);
    }
  }, [shapes, onShapesChange]);

  // Focus text input when text tool is activated
  useEffect(() => {
    if (textEditVisible && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [textEditVisible]);

  const handleDrawingMouseDown = (e) => {
    if (!activeTool || !stageRef.current) return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;
    
    // Start drawing
    setIsDrawing(true);
    setStartPoint({ x: pointerPos.x, y: pointerPos.y });
    
    // Handle different tools
    switch (activeTool) {
      case 'freehand':
        setFreehandPoints([pointerPos.x, pointerPos.y]);
        const newPath = {
          id: Date.now(),
          type: 'path',
          points: [pointerPos.x, pointerPos.y],
          color: selectedColor,
          strokeWidth: selectedStrokeWidth
        };
        setCurrentShape(newPath);
        break;
        
      case 'text':
        // For text, show input at click position
        setTextPosition({ x: pointerPos.x, y: pointerPos.y });
        setTextEditVisible(true);
        setIsDrawing(false); // Text doesn't use drag behavior
        return; // Exit early for text
        
      default:
        // Create initial shape based on tool type
        const newShape = {
          id: Date.now(),
          type: activeTool,
          x: pointerPos.x,
          y: pointerPos.y,
          width: 0,
          height: 0,
          radius: 0,
          radiusX: 0,
          radiusY: 0,
          points: activeTool === 'line' || activeTool === 'arrow' 
            ? [pointerPos.x, pointerPos.y, pointerPos.x, pointerPos.y]
            : [],
          color: selectedColor,
          strokeWidth: selectedStrokeWidth,
          fill: 'transparent',
          numPoints: activeTool === 'star' ? 5 : 0,
          innerRadius: activeTool === 'star' ? 20 : 0,
          outerRadius: activeTool === 'star' ? 40 : 0,
        };
        setCurrentShape(newShape);
        break;
    }
  };

  const handleDrawingMouseMove = (e) => {
    if (!isDrawing || !activeTool) return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos || !currentShape) return;
    
    // Handle different tools during mousemove
    switch (activeTool) {
      case 'freehand':
        // Add points to freehand drawing
        const newPoints = [...freehandPoints, pointerPos.x, pointerPos.y];
        setFreehandPoints(newPoints);
        setCurrentShape({
          ...currentShape,
          points: newPoints
        });
        break;
        
      case 'rect':
        // Calculate width and height
        const width = pointerPos.x - startPoint.x;
        const height = pointerPos.y - startPoint.y;
        
        // Update rectangle properties
        setCurrentShape({
          ...currentShape,
          width: Math.abs(width),
          height: Math.abs(height),
          x: width < 0 ? pointerPos.x : startPoint.x,
          y: height < 0 ? pointerPos.y : startPoint.y
        });
        break;
        
      case 'circle':
        // Calculate radius from center to cursor
        const dx = pointerPos.x - startPoint.x;
        const dy = pointerPos.y - startPoint.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        
        setCurrentShape({
          ...currentShape,
          radius: radius
        });
        break;
        
      case 'ellipse':
        // Calculate radiusX and radiusY
        const radiusX = Math.abs(pointerPos.x - startPoint.x);
        const radiusY = Math.abs(pointerPos.y - startPoint.y);
        
        setCurrentShape({
          ...currentShape,
          radiusX: radiusX,
          radiusY: radiusY
        });
        break;
        
      case 'star':
        // Update star radius based on distance
        const starDistance = Math.sqrt(
          Math.pow(pointerPos.x - startPoint.x, 2) + 
          Math.pow(pointerPos.y - startPoint.y, 2)
        );
        
        setCurrentShape({
          ...currentShape,
          outerRadius: starDistance,
          innerRadius: starDistance / 2
        });
        break;
        
      case 'line':
      case 'arrow':
        // Update line/arrow endpoints
        setCurrentShape({
          ...currentShape,
          points: [startPoint.x, startPoint.y, pointerPos.x, pointerPos.y]
        });
        break;
        
      case 'eraser':
        // Find shapes that intersect with the eraser
        // This is simplified - a real eraser would require more complex collision detection
        const shapesToKeep = shapes.filter(shape => {
          // Simple distance-based check for demonstration
          // A real implementation would use proper hit testing based on shape geometry
          const shapeX = shape.x || (shape.points ? shape.points[0] : 0);
          const shapeY = shape.y || (shape.points ? shape.points[1] : 0);
          const distance = Math.sqrt(
            Math.pow(pointerPos.x - shapeX, 2) + 
            Math.pow(pointerPos.y - shapeY, 2)
          );
          return distance > 20; // Arbitrary distance threshold
        });
        
        if (shapesToKeep.length !== shapes.length) {
          setShapes(shapesToKeep);
        }
        break;
        
      default:
        break;
    }
  };

  const handleDrawingMouseUp = () => {
    if (!isDrawing) return;
    
    // Finalize the shape
    if (currentShape && 
        (currentShape.width > 2 || 
         currentShape.height > 2 || 
         currentShape.radius > 2 || 
         currentShape.radiusX > 2 || 
         currentShape.radiusY > 2 ||
         (currentShape.points && currentShape.points.length > 4))) {
      
      // Add the completed shape
      setShapes([...shapes, currentShape]);
    }
    
    // Reset drawing state
    setIsDrawing(false);
    setCurrentShape(null);
    setFreehandPoints([]);
  };

  // Handle text input submission
  const handleTextSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      // Only add text if there's content
      if (textValue.trim()) {
        const newText = {
          id: Date.now(),
          type: 'text',
          x: textPosition.x,
          y: textPosition.y,
          text: textValue,
          color: selectedColor,
          fontSize: selectedStrokeWidth * 8, // Scale font size relative to stroke width
        };
        
        setShapes([...shapes, newText]);
      }
      
      // Reset text state
      setTextValue('');
      setTextEditVisible(false);
    }
  };

  // Render different shapes based on their type
  const renderShape = (shape) => {
    switch (shape.type) {
      case 'rect':
        return (
          <Rect
            key={shape.id}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            stroke={shape.color}
            strokeWidth={shape.strokeWidth}
            fill={shape.fill}
          />
        );
        
      case 'circle':
        return (
          <Circle
            key={shape.id}
            x={shape.x}
            y={shape.y}
            radius={shape.radius}
            stroke={shape.color}
            strokeWidth={shape.strokeWidth}
            fill={shape.fill}
          />
        );
        
      case 'ellipse':
        return (
          <Ellipse
            key={shape.id}
            x={shape.x}
            y={shape.y}
            radiusX={shape.radiusX}
            radiusY={shape.radiusY}
            stroke={shape.color}
            strokeWidth={shape.strokeWidth}
            fill={shape.fill}
          />
        );
        
      case 'line':
        return (
          <Line
            key={shape.id}
            points={shape.points}
            stroke={shape.color}
            strokeWidth={shape.strokeWidth}
            lineCap="round"
            lineJoin="round"
          />
        );
        
      case 'arrow':
        return (
          <Arrow
            key={shape.id}
            points={shape.points}
            stroke={shape.color}
            strokeWidth={shape.strokeWidth}
            fill={shape.color}
            pointerLength={10}
            pointerWidth={10}
          />
        );
        
      case 'path':
        return (
          <Line
            key={shape.id}
            points={shape.points}
            stroke={shape.color}
            strokeWidth={shape.strokeWidth}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />
        );
        
      case 'star':
        return (
          <Star
            key={shape.id}
            x={shape.x}
            y={shape.y}
            numPoints={shape.numPoints}
            innerRadius={shape.innerRadius}
            outerRadius={shape.outerRadius}
            stroke={shape.color}
            strokeWidth={shape.strokeWidth}
            fill={shape.fill}
          />
        );
        
      case 'text':
        return (
          <Text
            key={shape.id}
            x={shape.x}
            y={shape.y}
            text={shape.text}
            fill={shape.color}
            fontSize={shape.fontSize}
          />
        );
        
      default:
        return null;
    }
  };

  // Toolbar component
  const DrawingToolbar = () => (
    <div className="drawing-toolbar">
      {allowedTools.includes('rect') && (
        <button 
          className={`tool-btn ${activeTool === 'rect' ? 'active' : ''}`}
          onClick={() => setActiveTool(activeTool === 'rect' ? null : 'rect')}
        >
          Rectangle
        </button>
      )}
      
      {allowedTools.includes('circle') && (
        <button 
          className={`tool-btn ${activeTool === 'circle' ? 'active' : ''}`}
          onClick={() => setActiveTool(activeTool === 'circle' ? null : 'circle')}
        >
          Circle
        </button>
      )}
      
      {allowedTools.includes('line') && (
        <button 
          className={`tool-btn ${activeTool === 'line' ? 'active' : ''}`}
          onClick={() => setActiveTool(activeTool === 'line' ? null : 'line')}
        >
          Line
        </button>
      )}
      
      {allowedTools.includes('arrow') && (
        <button 
          className={`tool-btn ${activeTool === 'arrow' ? 'active' : ''}`}
          onClick={() => setActiveTool(activeTool === 'arrow' ? null : 'arrow')}
        >
          Arrow
        </button>
      )}
      
      {allowedTools.includes('ellipse') && (
        <button 
          className={`tool-btn ${activeTool === 'ellipse' ? 'active' : ''}`}
          onClick={() => setActiveTool(activeTool === 'ellipse' ? null : 'ellipse')}
        >
          Ellipse
        </button>
      )}
      
      {allowedTools.includes('star') && (
        <button 
          className={`tool-btn ${activeTool === 'star' ? 'active' : ''}`}
          onClick={() => setActiveTool(activeTool === 'star' ? null : 'star')}
        >
          Star
        </button>
      )}
      
      {allowedTools.includes('freehand') && (
        <button 
          className={`tool-btn ${activeTool === 'freehand' ? 'active' : ''}`}
          onClick={() => setActiveTool(activeTool === 'freehand' ? null : 'freehand')}
        >
          Freehand
        </button>
      )}
      
      {allowedTools.includes('text') && (
        <button 
          className={`tool-btn ${activeTool === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTool(activeTool === 'text' ? null : 'text')}
        >
          Text
        </button>
      )}
      
      {allowedTools.includes('eraser') && (
        <button 
          className={`tool-btn ${activeTool === 'eraser' ? 'active' : ''}`}
          onClick={() => setActiveTool(activeTool === 'eraser' ? null : 'eraser')}
        >
          Eraser
        </button>
      )}
      
      <button 
        className="clear-btn"
        onClick={() => setShapes([])}
      >
        Clear All
      </button>
      
      {activeTool && (
        <button 
          className="cancel-btn"
          onClick={() => setActiveTool(null)}
        >
          Cancel Tool
        </button>
      )}
    </div>
  );

  // Export the drawing as an image
  const exportAsImage = () => {
    if (stageRef.current) {
      const uri = stageRef.current.toDataURL();
      const link = document.createElement('a');
      link.download = 'drawing.png';
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="konva-drawing-board">
      <DrawingToolbar />
      
      <div className="drawing-area" style={{ position: 'relative' }}>
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          onMouseDown={handleDrawingMouseDown}
          onMouseMove={handleDrawingMouseMove}
          onMouseUp={handleDrawingMouseUp}
          onTouchStart={handleDrawingMouseDown}
          onTouchMove={handleDrawingMouseMove}
          onTouchEnd={handleDrawingMouseUp}
          style={{
            cursor: activeTool ? 'crosshair' : 'default',
            zIndex: zIndex
          }}
        >
          <Layer>
            {/* Render all existing shapes */}
            {shapes.map(renderShape)}
            
            {/* Render the current shape being drawn */}
            {isDrawing && currentShape && renderShape(currentShape)}
          </Layer>
        </Stage>
        
        {/* Text input overlay */}
        {textEditVisible && (
          <div 
            style={{
              position: 'absolute',
              left: textPosition.x,
              top: textPosition.y,
              zIndex: zIndex + 1
            }}
          >
            <input
              ref={textInputRef}
              type="text"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTextSubmit(e);
                if (e.key === 'Escape') {
                  setTextEditVisible(false);
                  setTextValue('');
                }
              }}
              onBlur={handleTextSubmit}
              style={{
                background: 'transparent',
                border: '1px dashed ' + selectedColor,
                color: selectedColor,
                fontSize: selectedStrokeWidth * 8 + 'px'
              }}
              autoFocus
            />
          </div>
        )}
      </div>
      
      <div className="drawing-controls">
        <button 
          className="export-btn"
          onClick={exportAsImage}
        >
          Export as Image
        </button>
      </div>
    </div>
  );
};

export default KonvaDrawingBoard;