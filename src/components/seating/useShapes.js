import { useCallback } from 'react';
import { useSeating } from './SeatingContext';

// Функция для обработки позиции элемента
const processShapePosition = (shape) => {
  let displayX, displayY;

  switch (shape.type) {
    case 'rect':
      if (shape.centerX !== undefined && shape.centerY !== undefined) {
        displayX = shape.centerX - (shape.width || 100) / 2;
        displayY = shape.centerY - (shape.height || 50) / 2;
      } else {
        displayX = shape.x || 0;
        displayY = shape.y || 0;
      }
      break;

    case 'circle':
      if (shape.centerX !== undefined && shape.centerY !== undefined) {
        displayX = shape.centerX - (shape.radius || 50);
        displayY = shape.centerY - (shape.radius || 50);
      } else {
        displayX = shape.x || 0;
        displayY = shape.y || 0;
      }
      break;

    case 'text':
      displayX = shape.x || 0;
      displayY = shape.y || 0;
      break;

    case 'line':
      if (shape.points && shape.points.length >= 2) {
        displayX = shape.points[0];
        displayY = shape.points[1];
      } else {
        displayX = shape.x || 0;
        displayY = shape.y || 0;
      }
      break;

    default:
      displayX = shape.x || 0;
      displayY = shape.y || 0;
  }

  return { displayX, displayY };
};

export const useShapes = () => {
  const { state } = useSeating();
  const { shapes } = state;

  // Рендеринг элемента зала
  const renderShape = useCallback((shape) => {
    const { displayX, displayY } = processShapePosition(shape);

    switch (shape.type) {
      case 'rect':
        return (
          <div
            key={shape.id}
            style={{
              position: 'absolute',
              left: `${displayX}px`,
              top: `${displayY}px`,
              width: `${shape.width}px`,
              height: `${shape.height}px`,
              border: `${shape.strokeWidth || 2}px solid ${shape.color}`,
              backgroundColor: shape.fill === 'transparent' ? 'transparent' : (shape.fill || 'transparent'),
              pointerEvents: 'none',
              boxSizing: 'border-box',
              transform: `rotate(${shape.rotation || 0}deg)`,
              transformOrigin: '50% 50%',
            }}
          />
        );

      case 'circle':
        return (
          <div
            key={shape.id}
            style={{
              position: 'absolute',
              left: `${displayX}px`,
              top: `${displayY}px`,
              width: `${(shape.radius || 50) * 2}px`,
              height: `${(shape.radius || 50) * 2}px`,
              borderRadius: '50%',
              border: `${shape.strokeWidth || 2}px solid ${shape.color}`,
              backgroundColor: shape.fill === 'transparent' ? 'transparent' : (shape.fill || 'transparent'),
              pointerEvents: 'none',
              boxSizing: 'border-box',
              transform: `rotate(${shape.rotation || 0}deg)`,
              transformOrigin: '50% 50%',
            }}
          />
        );

      case 'text':
        return (
          <div
            key={shape.id}
            style={{
              position: 'absolute',
              left: `${displayX}px`,
              top: `${displayY}px`,
              color: shape.color,
              fontSize: `${shape.fontSize || 16}px`,
              fontFamily: shape.fontFamily || 'Arial, sans-serif',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              transform: `rotate(${shape.rotation || 0}deg)`,
              transformOrigin: '0 0',
              fontWeight: shape.fontFamily === 'Serif' ? 'bold' : 'normal'
            }}
          >
            {shape.text}
          </div>
        );

      case 'line':
        if (shape.points && shape.points.length >= 4) {
          const [x1, y1, x2, y2] = shape.points;
          const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          const baseAngle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
          const totalAngle = baseAngle + (shape.rotation || 0);

          return (
            <div
              key={shape.id}
              style={{
                position: 'absolute',
                left: `${x1}px`,
                top: `${y1}px`,
                width: `${length}px`,
                height: `${shape.strokeWidth || 2}px`,
                backgroundColor: shape.color,
                transformOrigin: '0 50%',
                transform: `rotate(${totalAngle}deg)`,
                pointerEvents: 'none'
              }}
            />
          );
        }
        return null;

      default:
        return null;
    }
  }, []);

  // Рендеринг всех элементов зала
  const renderShapes = useCallback(() => {
    if (!shapes || shapes.length === 0) return null;

    return (
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none', 
        zIndex: 1 
      }}>
        {shapes.map(renderShape)}
      </div>
    );
  }, [shapes, renderShape]);

  return {
    shapes,
    renderShapes,
    renderShape,
    processShapePosition
  };
}; 