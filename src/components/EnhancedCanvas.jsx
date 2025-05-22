import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import './EnhancedCanvas.css';
import { HallElementsManager, HallElementsCatalog } from './HallElements';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Define element types
const ELEMENT_TYPES = {
  SELECT: 'select',
  DRAW: 'draw',
  LINE: 'line',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  TEXT: 'text',
  TABLE: 'table',
  ERASER: 'eraser',
  PAN: 'pan',
  HYBRID: 'hybrid_pan_select' // Гибридный режим
};

// Define DnD item types
const DND_ITEM_TYPES = {
  HALL_ELEMENT: 'HALL_ELEMENT'
};

// Main canvas component
const EnhancedCanvas = React.forwardRef((
  {
    tables = [],
    setTables,
    hallElements = [],
    setHallElements,
    onChairClick,
    onTableSelect,
    onTableMove,
    initialZoom = 1,
    selectedElementId = null,
    setSelectedElementId = () => { },
    canvasMode = 'tables'
  },
  ref
) => {
  // Refs
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const fabricCanvasRef = useRef(null);

  // States
  const [activeMode, setActiveMode] = useState(ELEMENT_TYPES.HYBRID);
  const [zoom, setZoom] = useState(initialZoom);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('rgba(0, 0, 0, 0.1)');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(18);
  const [selectedObject, setSelectedObject] = useState(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [objectCount, setObjectCount] = useState(0);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [isPanMode, setIsPanMode] = useState(true);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [shapes, setShapes] = useState([]); // Вместо hallElements для рисования
  const [hallIcons, setHallIcons] = useState([]); // Только иконки зала
  // Состояния для истории действий (отмена/повтор)
  const [historyStack, setHistoryStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [maxHistoryLength] = useState(50); // Ограничиваем размер истории

  const [gridSize, setGridSize] = useState(20); // Размер сетки по умолчанию
  const [showGrid, setShowGrid] = useState(true); // Показывать ли сетку


 const renderShape = (canvas, shape) => {
  if (!canvas || !shape) return null;

  try {
    let fabricObj;

    switch (shape.type) {
      case 'rect':
        fabricObj = new fabric.Rect({
          left: shape.x || 0,
          top: shape.y || 0,
          width: shape.width || 100,
          height: shape.height || 50,
          fill: shape.fill || fillColor,
          stroke: shape.color || strokeColor,
          strokeWidth: shape.strokeWidth || strokeWidth,
          angle: shape.rotation || 0, // ✅ УЖЕ ЕСТЬ
          elementId: shape.id,
          hasControls: true,
          hasBorders: true,
          selectable: true
        });
        break;

      case 'circle':
        const radius = shape.radius || 50;
        const centerX = (shape.x || 0) + radius;
        const centerY = (shape.y || 0) + radius;
        
        fabricObj = new fabric.Circle({
          left: centerX,
          top: centerY,
          radius: radius,
          fill: shape.fill || fillColor,
          stroke: shape.color || strokeColor,
          strokeWidth: shape.strokeWidth || strokeWidth,
          angle: shape.rotation || 0, // ✅ УЖЕ ЕСТЬ
          elementId: shape.id,
          hasControls: true,
          hasBorders: true,
          selectable: true,
          originX: 'center',
          originY: 'center'
        });
        break;

      case 'line':
        if (shape.points && shape.points.length >= 4) {
          fabricObj = new fabric.Line(shape.points, {
            stroke: shape.color || strokeColor,
            strokeWidth: shape.strokeWidth || strokeWidth,
            angle: shape.rotation || 0, // ✅ ДОБАВЛЕНО для линий
            elementId: shape.id,
            hasControls: true,
            hasBorders: true,
            selectable: true,
            originalX1: shape.points[0],
            originalY1: shape.points[1],
            originalX2: shape.points[2],
            originalY2: shape.points[3]
          });
        }
        break;

      case 'text':
        fabricObj = new fabric.IText(shape.text || 'Text', {
          left: shape.x || 0,
          top: shape.y || 0,
          fontSize: shape.fontSize || 18,
          fontFamily: shape.fontFamily || 'Arial',
          fill: shape.color || strokeColor,
          angle: shape.rotation || 0, // ✅ УЖЕ ЕСТЬ
          elementId: shape.id,
          hasControls: true,
          hasBorders: true,
          selectable: true
        });
        break;

      case 'path':
        if (shape.path) {
          fabricObj = new fabric.Path(shape.path, {
            left: shape.x || 0,
            top: shape.y || 0,
            stroke: shape.color || strokeColor,
            strokeWidth: shape.strokeWidth || strokeWidth,
            fill: shape.fill || '',
            angle: shape.rotation || 0, // ✅ ДОБАВЛЕНО для path
            elementId: shape.id,
            hasControls: true,
            hasBorders: true,
            selectable: true
          });
        }
        break;

      default:
        console.warn(`Unknown shape type: ${shape.type}`);
        return null;
    }

    if (fabricObj) {
      canvas.add(fabricObj);

      if (selectedElementId === shape.id) {
        canvas.setActiveObject(fabricObj);
      }

      return fabricObj;
    }

    return null;
  } catch (error) {
    console.error('Error rendering shape:', error);
    return null;
  }
};

  const saveToHistory = useCallback(() => {
    // Не сохраняем если операция рисования активна

    console.log("Сохранение снимка в историю");

    // Предотвращаем дублирование состояний
    if (historyStack.length > 0) {
      const lastState = historyStack[historyStack.length - 1];
      const currentStateJson = JSON.stringify({
        tables,
        hallElements
      });
      const lastStateJson = JSON.stringify({
        tables: lastState.tables,
        hallElements: lastState.hallElements
      });

      // Если состояние не изменилось, не сохраняем
      if (currentStateJson === lastStateJson) {
        console.log("Состояние не изменилось, пропускаем сохранение");
        return;
      }
    }

    // Остальной код по сохранению...
    const currentState = {
      tables: JSON.parse(JSON.stringify(tables)),
      hallElements: JSON.parse(JSON.stringify(hallElements))
    };

    setHistoryStack(prev => {
      const newStack = [...prev, currentState];
      if (newStack.length > maxHistoryLength) {
        return newStack.slice(newStack.length - maxHistoryLength);
      }
      return newStack;
    });

    // Очищаем стек повтора при новом действии
    setRedoStack([]);
  }, [tables, hallElements, maxHistoryLength, isDrawing, historyStack]);

  // Отмена последнего действия (Undo)

  const deleteSelectedObject = () => {
  const canvas = fabricCanvasRef.current;
  if (!canvas) return;

  try {
    saveToHistory();

    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    if (activeObject.type === 'activeSelection') {
      // Удаление группы объектов
      const objectsInGroup = activeObject.getObjects();

      activeObject.destroy();

      objectsInGroup.forEach(obj => {
        canvas.remove(obj);

        // Обновляем состояние в зависимости от типа объекта
        if (obj.tableId) {
          setTables(prev => prev.filter(table => table.id !== obj.tableId));
        } else if (obj.elementId) {
          // ✅ Удаляем из shapes
          setShapes(prev => prev.filter(shape => shape.id !== obj.elementId));
        }
      });
    } else {
      // Удаление одного объекта
      if (activeObject.tableId) {
        setTables(prev => prev.filter(table => table.id !== activeObject.tableId));
      } else if (activeObject.elementId) {
        // ✅ Удаляем из shapes
        setShapes(prev => prev.filter(shape => shape.id !== activeObject.elementId));
      }

      canvas.remove(activeObject);
    }

    canvas.discardActiveObject();
    canvas.requestRenderAll();

    setSelectedObject(null);
    setSelectedElementId(null);
    setUnsavedChanges(true);
  } catch (error) {
    console.error('Error deleting selected objects:', error);
  }
};


  const selectAllObjects = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    try {
      // Получаем все объекты на холсте (исключая линии сетки)
      const selectableObjects = canvas.getObjects().filter(obj => !obj.gridLine);

      if (selectableObjects.length === 0) return;

      // Если выбран только один объект и это единственный объект на холсте - не делаем ничего
      if (selectableObjects.length === 1 && canvas.getActiveObject() === selectableObjects[0]) {
        return;
      }

      // Снимаем текущее выделение
      canvas.discardActiveObject();

      // Создаем новую группу выделения со всеми объектами
      const selection = new fabric.ActiveSelection(selectableObjects, { canvas });

      // Устанавливаем её как активную
      canvas.setActiveObject(selection);
      canvas.renderAll();

      console.log(`Выбрано ${selectableObjects.length} объектов`);
    } catch (error) {
      console.error('Ошибка при выборе всех объектов:', error);
    }
  }, []);

 const duplicateSelectedObject = useCallback(() => {
  const canvas = fabricCanvasRef.current;
  if (!canvas) return;

  const activeObject = canvas.getActiveObject();
  if (!activeObject) return;

  try {
    saveToHistory();

    if (activeObject.type === 'activeSelection') {
      // Дублирование группы объектов
      const selectedObjects = activeObject.getObjects();
      const newObjects = [];

      selectedObjects.forEach(obj => {
        const objLeft = activeObject.left + obj.left * activeObject.scaleX;
        const objTop = activeObject.top + obj.top * activeObject.scaleY;

        if (obj.tableId) {
          // Дублирование стола (как было)
          const originalTable = tables.find(table => table.id === obj.tableId);
          if (originalTable) {
            const newTableId = Date.now() + Math.floor(Math.random() * 1000);
            const newTable = {
              ...JSON.parse(JSON.stringify(originalTable)),
              id: newTableId,
              x: objLeft + 10,
              y: objTop + 10
            };

            setTables(prev => [...prev, newTable]);

            setTimeout(() => {
              const newTableObj = renderTable(canvas, newTable);
              if (newTableObj) {
                newObjects.push(newTableObj);
              }
            }, 10);
          }
        } else if (obj.elementId) {
          // ✅ Дублирование shape элемента
          const originalShape = shapes.find(shape => shape.id === obj.elementId);
          if (originalShape) {
            const newShapeId = Date.now() + Math.floor(Math.random() * 1000);

            const newShape = {
              ...JSON.parse(JSON.stringify(originalShape)),
              id: newShapeId,
              x: objLeft + 10,
              y: objTop + 10
            };

            // Для линий обновляем координаты точек
            if (originalShape.type === 'line' && originalShape.points) {
              const deltaX = objLeft - originalShape.x;
              const deltaY = objTop - originalShape.y;

              newShape.points = [
                originalShape.points[0] + deltaX + 10,
                originalShape.points[1] + deltaY + 10,
                originalShape.points[2] + deltaX + 10,
                originalShape.points[3] + deltaY + 10
              ];
            }

            // ✅ Добавляем новый shape
            setShapes(prev => [...prev, newShape]);

            setTimeout(() => {
              const newShapeObj = renderShape(canvas, newShape);
              if (newShapeObj) {
                newObjects.push(newShapeObj);
              }
            }, 10);
          }
        }
      });

      // Выбираем новые объекты как группу
      setTimeout(() => {
        if (newObjects.length > 0) {
          canvas.discardActiveObject();
          const newSelection = new fabric.ActiveSelection(newObjects, {
            canvas: canvas
          });
          canvas.setActiveObject(newSelection);
          canvas.renderAll();
        }
      }, 100);

    } else {
      // Дублирование одиночного объекта
      if (activeObject.tableId) {
        // Дублирование стола (как было)
        const originalTable = tables.find(table => table.id === activeObject.tableId);
        if (!originalTable) return;

        const currentLeft = activeObject.left;
        const currentTop = activeObject.top;

        const newTable = {
          ...JSON.parse(JSON.stringify(originalTable)),
          id: Date.now(),
          x: currentLeft + 10,
          y: currentTop + 10
        };

        setTables(prev => [...prev, newTable]);

        setTimeout(() => {
          const newTableObj = renderTable(canvas, newTable);
          if (newTableObj) {
            canvas.setActiveObject(newTableObj);
            canvas.renderAll();
          }
        }, 50);

      } else if (activeObject.elementId) {
        // ✅ Дублирование shape элемента
        const originalShape = shapes.find(shape => shape.id === activeObject.elementId);
        if (!originalShape) return;

        const currentLeft = activeObject.left;
        const currentTop = activeObject.top;

        const newShape = {
          ...JSON.parse(JSON.stringify(originalShape)),
          id: Date.now(),
          x: currentLeft + 10,
          y: currentTop + 10
        };

        // Для линий обновляем координаты точек
        if (originalShape.type === 'line') {
          const deltaX = currentLeft - originalShape.x;
          const deltaY = currentTop - originalShape.y;

          newShape.points = [
            originalShape.points[0] + deltaX + 10,
            originalShape.points[1] + deltaY + 10,
            originalShape.points[2] + deltaX + 10,
            originalShape.points[3] + deltaY + 10
          ];
        }

        // ✅ Добавляем новый shape
        setShapes(prev => [...prev, newShape]);

        setTimeout(() => {
          const newShapeObj = renderShape(canvas, newShape);
          if (newShapeObj) {
            canvas.setActiveObject(newShapeObj);
            setSelectedElementId(newShape.id);
            setSelectedObject(newShapeObj);
            canvas.renderAll();
          }
        }, 50);
      }
    }

    setUnsavedChanges(true);
    setObjectCount(prev => prev + 1);
  } catch (error) {
    console.error('Ошибка при дублировании объекта:', error);
  }
}, [tables, shapes, saveToHistory, setTables, setShapes, setSelectedElementId, setSelectedObject]);


  useEffect(() => {
    const handleKeyDown = (e) => {
      // Если фокус на поле ввода - не обрабатываем
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Дублирование выбранного объекта (Ctrl+D)
      if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        // Важно вызвать preventDefault до проверки на объект
        e.preventDefault();

        if (fabricCanvasRef.current && fabricCanvasRef.current.getActiveObject()) {
          console.log("Нажата комбинация Ctrl+D");
          duplicateSelectedObject();
        }
      }

      // Выбор всех объектов (Ctrl+A)
      if (e.ctrlKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        console.log("Нажата комбинация Ctrl+A");
        selectAllObjects();
      }

      // Удаление выбранного объекта (Delete)
      if (e.key === 'Delete' && fabricCanvasRef.current && fabricCanvasRef.current.getActiveObject()) {
        e.preventDefault();
        deleteSelectedObject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [deleteSelectedObject, duplicateSelectedObject, selectAllObjects]);

  useEffect(() => {
    if (isCanvasReady && initialized) {
      console.log("Инициализация истории - сохранение начального состояния");
      setTimeout(() => saveToHistory(), 500);
    }
  }, [isCanvasReady, initialized]);

  // Initialize canvas with a delay to ensure it's properly set up
  useEffect(() => {
    const initialize = () => {
      initializeCanvas();
      // Set initial mode with a delay
      setTimeout(() => {
        setActiveMode(ELEMENT_TYPES.HYBRID);
      }, 300);
    };

    initialize();

    // Cleanup
    return () => {
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.dispose();
          fabricCanvasRef.current = null;
        } catch (error) {
          console.error('Error cleaning up canvas:', error);
        }
      }
    };
  }, []);

  // Initialize canvas
  const initializeCanvas = () => {
    console.log('Initializing canvas...');
    if (!canvasRef.current) return;

    // Clean up any existing canvas
    if (fabricCanvasRef.current) {
      try {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      } catch (e) {
        console.error('Error disposing existing canvas:', e);
      }
    }

    // Get container dimensions
    const container = canvasContainerRef.current;
    if (!container) return;

    // Set safe initial dimensions
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    try {
      // Create new canvas with explicit dimensions
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: width,
        height: height,
        backgroundColor: '#f5f5f5',
        selection: true, // Разрешает выделение
        selectionColor: 'rgba(100, 100, 255, 0.3)', // Цвет выделения
        selectionLineWidth: 1, // Ширина линии выделения
        preserveObjectStacking: true,
        fireRightClick: true,
        stopContextMenu: true
      });

      // Store reference
      fabricCanvasRef.current = canvas;

      // Set default properties
      fabric.Object.prototype.transparentCorners = false;
      fabric.Object.prototype.cornerColor = '#2196F3';
      fabric.Object.prototype.cornerSize = 8;

      // Override isControlVisible method for all objects
      // to properly handle gridLine objects
      const originalIsControlVisible = fabric.Object.prototype.isControlVisible;
      fabric.Object.prototype.isControlVisible = function (controlName) {
        if (this.gridLine === true) {
          return false;
        }
        return originalIsControlVisible.call(this, controlName);
      };

      // Override findTarget method to ignore grid lines
      canvas.findTarget = (function (originalFn) {
        return function (e, skipGroup) {
          const target = originalFn.call(this, e, skipGroup);
          if (target && target.gridLine) {
            return null; // If object is a grid line, return null (not selectable)
          }
          return target;
        };
      })(canvas.findTarget);

      // Update state
      setInitialized(true);

      // Setup event handlers
      setupCanvasEventHandlers(canvas);

      // Create grid
      createGrid(canvas, gridSize);

      // Add safe check before handling resize
      const handleResize = () => {
        if (!canvas || !container || !canvas.wrapperEl) return;

        // Safely get dimensions
        const newWidth = container.clientWidth || 800;
        const newHeight = container.clientHeight || 600;

        // Set with checking
        try {
          canvas.setWidth(newWidth);
          canvas.setHeight(newHeight);
          canvas.renderAll();
          createGrid(canvas, gridSize);
        } catch (error) {
          console.error('Error resizing canvas:', error);
        }
      };

      // Add small delay before first resize
      setTimeout(handleResize, 100);

      window.addEventListener('resize', handleResize);

      // Mark as ready
      setIsCanvasReady(true);
      console.log('Canvas initialization complete');

      // Load initial data with delay
      setTimeout(() => {
        renderAllElements(canvas);
      }, 200);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    } catch (error) {
      console.error('Canvas initialization error:', error);
    }
  };

  // Create grid
  const createGrid = (canvas, size = gridSize) => {
    if (!canvas || !showGrid) return;

    try {
      // Clear existing grid
      canvas.getObjects().forEach(obj => {
        if (obj.gridLine) {
          canvas.remove(obj);
        }
      });

      const width = canvas.width || 800;
      const height = canvas.height || 600;

      // Function to create grid lines with correct properties
      const createGridLine = (coords, isCenter = false) => {
        const line = new fabric.Line(coords, {
          stroke: isCenter ? '#aaaaaa' : '#dddddd',
          strokeWidth: isCenter ? 2 : 1,
          selectable: false,
          evented: false,
          hoverCursor: 'default',
          hasControls: false,
          hasBorders: false,
          lockMovementX: true,
          lockMovementY: true,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
          perPixelTargetFind: false,
          gridLine: true,
          excludeFromExport: true
        });

        line.set('interactive', false);
        return line;
      };

      // Create vertical lines
      for (let i = 0; i <= width / size; i++) {
        const line = createGridLine([i * size, 0, i * size, height]);
        canvas.add(line);
        line.sendToBack();
      }

      // Create horizontal lines
      for (let i = 0; i <= height / size; i++) {
        const line = createGridLine([0, i * size, width, i * size]);
        canvas.add(line);
        line.sendToBack();
      }

      // Add center lines
      const xAxis = createGridLine([0, height / 2, width, height / 2], true);
      const yAxis = createGridLine([width / 2, 0, width / 2, height], true);

      canvas.add(xAxis);
      canvas.add(yAxis);
      xAxis.sendToBack();
      yAxis.sendToBack();

      canvas.renderAll();
    } catch (error) {
      console.error('Error creating grid:', error);
    }
  };

  // Set up canvas event handlers
  // Полная исправленная функция setupCanvasEventHandlers в EnhancedCanvas.jsx

  const setupCanvasEventHandlers = (canvas) => {
    if (!canvas) return;

    try {
      // Object selection
      canvas.on('selection:created', (e) => {
        if (!e.selected || e.selected.length === 0) return;

        const obj = e.selected[0];

        // If a grid line is selected by mistake - cancel selection
        if (obj.gridLine) {
          canvas.discardActiveObject();
          canvas.renderAll();
          return;
        }

        setSelectedObject(obj);

        if (obj.elementId) {
          setSelectedElementId(obj.elementId);

          // Force update selected object properties
          obj.set({
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true
          });
        } else if (obj.tableId && onTableSelect) {
          onTableSelect(obj.tableId);
        }

        canvas.renderAll();
      });

      canvas.on('selection:cleared', () => {
        setSelectedObject(null);
        setSelectedElementId(null);
      });

      // Object moving - ИСПРАВЛЕННАЯ ВЕРСИЯ
    canvas.on('object:moving', (e) => {
  if (!e.target) return;
  
  const obj = e.target;
  setUnsavedChanges(true);

  if (obj.tableId) {
    // Столы как было...
    setTables(prevTables => prevTables.map(table =>
      table.id === obj.tableId
        ? { ...table, x: Math.round(obj.left), y: Math.round(obj.top) }
        : table
    ));

    if (onTableMove) {
      onTableMove(obj.tableId, { x: Math.round(obj.left), y: Math.round(obj.top) });
    }
  } else if (obj.elementId) {
    const shape = shapes.find(s => s.id === obj.elementId);

    if (shape && shape.type === 'line') {
      // Линии как было...
    } else if (shape && shape.type === 'circle') {
      // Круги как было...
    } else if (shape && shape.type === 'rect') {
      // ✅ ИСПРАВЛЕНО: Для прямоугольников используем obj.left/top напрямую
      setShapes(prevShapes => prevShapes.map(s =>
        s.id === obj.elementId
          ? { 
              ...s, 
              x: Math.round(obj.left), 
              y: Math.round(obj.top)
              // НЕ обновляем размеры при перемещении!
            }
          : s
      ));
    } else {
      // Остальные элементы
      setShapes(prevShapes => prevShapes.map(s =>
        s.id === obj.elementId
          ? { ...s, x: Math.round(obj.left), y: Math.round(obj.top) }
          : s
      ));
    }
  }
});

canvas.on('object:modified', (e) => {
  if (!e.target) return;

  const obj = e.target;
  
  if (obj.elementId) {
    console.log(`Object modified: ${obj.type}, elementId: ${obj.elementId}`);

    if (obj.type === 'rect') {
      // ✅ СОХРАНЯЕМ ЦЕНТР прямоугольника, а не left/top
      const centerX = obj.left + (obj.width * obj.scaleX) / 2;
      const centerY = obj.top + (obj.height * obj.scaleY) / 2;
      const finalWidth = Math.round(obj.width * obj.scaleX);
      const finalHeight = Math.round(obj.height * obj.scaleY);
      
      setShapes(prevShapes => prevShapes.map(s =>
        s.id === obj.elementId
          ? {
              ...s,
              centerX: Math.round(centerX), // ✅ Сохраняем центр
              centerY: Math.round(centerY), // ✅ Сохраняем центр
              width: finalWidth,
              height: finalHeight,
              rotation: Math.round(obj.angle || 0)
            }
          : s
      ));
      
      // Обновляем объект
      obj.set({
        width: finalWidth,
        height: finalHeight,
        scaleX: 1,
        scaleY: 1
      });

    } else if (obj.type === 'circle') {
      // Для кругов тоже сохраняем центр
      setShapes(prevShapes => prevShapes.map(s =>
        s.id === obj.elementId
          ? {
              ...s,
              centerX: Math.round(obj.left), // Для кругов left/top уже центр
              centerY: Math.round(obj.top),
              radius: Math.round(obj.radius * (obj.scaleX || 1)),
              rotation: Math.round(obj.angle || 0)
            }
          : s
      ));

      obj.set({
        radius: Math.round(obj.radius * (obj.scaleX || 1)),
        scaleX: 1,
        scaleY: 1
      });
    } else {
      // Для остальных типов
      setShapes(prevShapes => prevShapes.map(s =>
        s.id === obj.elementId
          ? {
              ...s,
              x: Math.round(obj.left),
              y: Math.round(obj.top),
              rotation: Math.round(obj.angle || 0)
            }
          : s
      ));
    }

    canvas.renderAll();
    saveToHistory();
  }
});

      // Object scaling - ИСПРАВЛЕННАЯ ВЕРСИЯ
 canvas.on('object:scaling', (e) => {
  if (!e.target) return;

  const obj = e.target;
  setUnsavedChanges(true);

  if (obj.elementId) {
    const shape = shapes.find(s => s.id === obj.elementId);

    if (obj.type === 'rect') {
      // ✅ ИСПРАВЛЕНО: Сохраняем rotation при scaling
      setShapes(prevShapes => prevShapes.map(s =>
        s.id === obj.elementId
          ? {
              ...s,
              width: Math.round(obj.width * obj.scaleX),
              height: Math.round(obj.height * obj.scaleY),
              rotation: Math.round(obj.angle || 0) // ✅ ДОБАВЛЕНО
          }
          : s
      ));
    } else if (obj.type === 'circle'){
      // ✅ ИСПРАВЛЕНО: Сохраняем rotation при scaling кругов
      const newRadius = Math.round(obj.radius * obj.scaleX);
      const newX = Math.round(obj.left - newRadius);
      const newY = Math.round(obj.top - newRadius);

      setShapes(prevShapes => prevShapes.map(s =>
        s.id === obj.elementId
          ? { 
              ...s, 
              radius: newRadius,
              x: newX,
              y: newY,
              rotation: Math.round(obj.angle || 0) // ✅ ДОБАВЛЕНО
            }
          : s
      ));
    } else if (obj.type === 'i-text') {
      // ✅ ИСПРАВЛЕНО: Сохраняем rotation при scaling текста
      const newFontSize = Math.round(obj.fontSize * obj.scaleX);

      setShapes(prevShapes => prevShapes.map(s =>
        s.id === obj.elementId
          ? { 
              ...s, 
              fontSize: newFontSize,
              x: Math.round(obj.left),
              y: Math.round(obj.top),
              rotation: Math.round(obj.angle || 0) // ✅ ДОБАВЛЕНО
            }
          : s
      ));

      obj.set({
        fontSize: newFontSize,
        scaleX: 1,
        scaleY: 1
      });

      canvas.renderAll();
    }
  } else if (obj.tableId) {
    // Обработка столов (как было)
    const table = tables.find(t => t.id === obj.tableId);
    // ... остальной код для столов
  }
});
      // Object rotating
 canvas.on('object:rotating', (e) => {
  if (!e.target) return;

  const obj = e.target;
  setUnsavedChanges(true);

  if (obj.elementId) {
    const shape = shapes.find(s => s.id === obj.elementId);
    
    if (shape && obj.type === 'rect') {
      // ✅ При повороте пересчитываем и сохраняем центр
      const centerX = obj.left + obj.width / 2;
      const centerY = obj.top + obj.height / 2;
      
      setShapes(prevShapes => prevShapes.map(s =>
        s.id === obj.elementId
          ? { 
              ...s, 
              centerX: Math.round(centerX),
              centerY: Math.round(centerY),
              rotation: Math.round(obj.angle) 
            }
          : s
      ));
    } else {
      // Для остальных
      setShapes(prevShapes => prevShapes.map(s =>
        s.id === obj.elementId
          ? { ...s, rotation: Math.round(obj.angle) }
          : s
      ));
    }
  }
});

      // Path creation (for drawing)
      canvas.on('path:created', (e) => {
  if (!e.path) return;

  const path = e.path;
  setUnsavedChanges(true);
  saveToHistory();
  
  // ✅ Создаем элемент в shapes
  const newShape = {
    id: Date.now(),
    type: 'path',
    path: path.path,
    color: path.stroke,
    strokeWidth: path.strokeWidth,
    fill: path.fill || '',
    x: path.left,
    y: path.top,
    width: path.width,
    height: path.height
  };

  // Добавляем element ID
  path.set('elementId', newShape.id);

  // ✅ Обновляем shapes
  setShapes(prevShapes => [...prevShapes, newShape]);
  setObjectCount(prevCount => prevCount + 1);
});

      // Mouse wheel (zoom)
      canvas.on('mouse:wheel', handleMouseWheel);

      // Custom drawing events
      setupDrawingEvents(canvas);
    } catch (error) {
      console.error('Error setting up canvas event handlers:', error);
    }
  };

  // Common mouse wheel handler for zoom
  const handleMouseWheel = (opt) => {
    if (!opt.e) return;

    opt.e.preventDefault();
    opt.e.stopPropagation();

    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Calculate new zoom
    const delta = opt.e.deltaY;
    let newZoom = canvas.getZoom();

    if (delta > 0) {
      newZoom = Math.max(0.1, newZoom * 0.95);
    } else {
      newZoom = Math.min(5, newZoom * 1.05);
    }

    // Apply zoom to point under cursor
    canvas.zoomToPoint(
      { x: opt.e.offsetX, y: opt.e.offsetY },
      newZoom
    );

    // Update state
    setZoom(newZoom);
  };

  // Set up drawing events
  const setupDrawingEvents = useCallback((canvas) => {
    if (!canvas) return;

    try {
      // Clear any existing event handlers first to avoid duplicates
      canvas.off('mouse:down');
      canvas.off('mouse:move');
      canvas.off('mouse:up');

      // Mouse down
      canvas.on('mouse:down', (opt) => {
        if (activeMode === ELEMENT_TYPES.LINE) {
          startDrawingLine(canvas, opt);
          saveToHistory();
        } else if (activeMode === ELEMENT_TYPES.RECTANGLE) {
          startDrawingRectangle(canvas, opt);
        } else if (activeMode === ELEMENT_TYPES.CIRCLE) {
          startDrawingCircle(canvas, opt);
        }
      });

      // Mouse move
      canvas.on('mouse:move', (opt) => {
        if (!isDrawing) return;

        if (activeMode === ELEMENT_TYPES.LINE) {
          updateDrawingLine(canvas, opt);
        } else if (activeMode === ELEMENT_TYPES.RECTANGLE) {
          updateDrawingRectangle(canvas, opt);
        } else if (activeMode === ELEMENT_TYPES.CIRCLE) {
          updateDrawingCircle(canvas, opt);
        }
      });

      // Mouse up
      canvas.on('mouse:up', () => {
        if (!isDrawing) return;

        if (activeMode === ELEMENT_TYPES.LINE) {
          finishDrawingLine(canvas);
        } else if (activeMode === ELEMENT_TYPES.RECTANGLE) {
          finishDrawingRectangle(canvas);
        } else if (activeMode === ELEMENT_TYPES.CIRCLE) {
          finishDrawingCircle(canvas);
        }

        // После завершения рисования переключаемся в гибридный режим
        setActiveMode(ELEMENT_TYPES.HYBRID);
      });
    } catch (error) {
      console.error('Error setting up drawing events:', error);
    }
  }, [activeMode, isDrawing]);

  // Handle different canvas modes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isCanvasReady) return;

    try {
      // Call separate function for hybrid mode
      if (activeMode === ELEMENT_TYPES.HYBRID) {
        setupHybridMode(canvas);
        return;
      }

      // Clear all previous handlers
      canvas.off('mouse:down');
      canvas.off('mouse:move');
      canvas.off('mouse:up');
      canvas.off('selection:created');
      canvas.off('selection:cleared');
      canvas.off('contextmenu');

      if (canvas._hybridHandlers) {
        window.removeEventListener('keydown', canvas._hybridHandlers.keyDown);
        window.removeEventListener('keyup', canvas._hybridHandlers.keyUp);
        canvas._hybridHandlers = null;
      }

      // For pure pan mode
      if (activeMode === ELEMENT_TYPES.PAN) {
        // In pan mode, disable object selection completely
        canvas.selection = false;
        canvas.defaultCursor = 'grab';
        canvas.hoverCursor = 'grab';

        // Clear current selection
        canvas.discardActiveObject();
        canvas.renderAll();

        // Disable interaction with all objects
        canvas.forEachObject(obj => {
          if (!obj.gridLine) {
            obj._previousSelectable = obj.selectable;
            obj._previousEvented = obj.evented;
          }

          obj.set({
            selectable: false,
            evented: false,
            hasControls: false,
            hasBorders: false
          });
        });

        // Special handlers for pure pan mode
        const handlePanMouseDown = (opt) => {
          const evt = opt.e;
          canvas.lastPosX = evt.clientX;
          canvas.lastPosY = evt.clientY;
          canvas.isDragging = true;
          canvas.defaultCursor = 'grabbing';
          canvas.hoverCursor = 'grabbing';

          // Cancel event to prevent any other interaction
          evt.preventDefault();
          evt.stopPropagation();
        };

        const handlePanMouseMove = (opt) => {
          if (!canvas.isDragging) return;

          const evt = opt.e;
          const vpt = canvas.viewportTransform;

          vpt[4] += evt.clientX - canvas.lastPosX;
          vpt[5] += evt.clientY - canvas.lastPosY;

          canvas.lastPosX = evt.clientX;
          canvas.lastPosY = evt.clientY;
          canvas.renderAll();

          // Cancel event
          evt.preventDefault();
          evt.stopPropagation();
        };

        const handlePanMouseUp = () => {
          canvas.isDragging = false;
          canvas.defaultCursor = 'grab';
          canvas.hoverCursor = 'grab';
        };

        // Add handlers
        canvas.on('mouse:down', handlePanMouseDown);
        canvas.on('mouse:move', handlePanMouseMove);
        canvas.on('mouse:up', handlePanMouseUp);

        // Important: intercept selection:created to prevent
        // object selection in pan mode
        canvas.on('selection:created', (e) => {
          canvas.discardActiveObject();
          canvas.renderAll();
          // IMPORTANT: Don't change activeMode
        });

        // Add mouse wheel handler for zoom
        canvas.on('mouse:wheel', handleMouseWheel);

        console.log('Pure PAN mode activated');
      }
      else {
        // For other modes restore standard behavior
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move';

        // Restore object interactivity, except for grid
        canvas.forEachObject(obj => {
          if (!obj.gridLine) {
            // Restore previous values if they exist
            if (obj._previousSelectable !== undefined) {
              obj.set({
                selectable: obj._previousSelectable,
                evented: obj._previousEvented
              });

              delete obj._previousSelectable;
              delete obj._previousEvented;
            } else {
              // Otherwise make object interactive by default
              obj.set({
                selectable: true,
                evented: true,
                hasControls: true,
                hasBorders: true
              });
            }
          }
        });

        // For drawing modes set appropriate parameters
        if (activeMode === ELEMENT_TYPES.DRAW) {
          canvas.isDrawingMode = true;
          if (!canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
          }
          canvas.freeDrawingBrush.width = strokeWidth;
          canvas.freeDrawingBrush.color = strokeColor;
        } else if (activeMode === ELEMENT_TYPES.ERASER) {
          canvas.isDrawingMode = true;
          if (!canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
          }
          canvas.freeDrawingBrush.width = strokeWidth * 3;
          canvas.freeDrawingBrush.color = '#ffffff';
        } else {
          canvas.isDrawingMode = false;

          // ИЗМЕНЕНО: Проверяем режимы рисования фигур и устанавливаем соответствующие обработчики
          if (activeMode === ELEMENT_TYPES.RECTANGLE ||
            activeMode === ELEMENT_TYPES.CIRCLE ||
            activeMode === ELEMENT_TYPES.LINE) {
            // Устанавливаем обработчики для режимов рисования фигур
            setupDrawingEvents(canvas);
          } else {
            // Для всех остальных режимов используем стандартные обработчики
            setupDefaultEventHandlers(canvas);
          }
        }

        // Add mouse wheel handler for zoom
        canvas.on('mouse:wheel', handleMouseWheel);
      }
    } catch (error) {
      console.error('Error updating active mode:', error);
    }
  }, [activeMode, strokeColor, strokeWidth, isCanvasReady, setupDrawingEvents]);

  // Additional restrictions for PAN mode
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !isCanvasReady) return;

    if (activeMode === ELEMENT_TYPES.PAN) {
      console.log('Enforcing PAN mode restrictions...');

      // Override findTarget method for PAN mode
      const originalFindTarget = canvas.findTarget;
      canvas._originalFindTarget = originalFindTarget;

      canvas.findTarget = function () {
        // In PAN mode always return null - no objects are selectable
        return null;
      };

      // Disable interactivity for all objects
      canvas.forEachObject(obj => {
        obj._previousSelectable = obj.selectable;
        obj._previousEvented = obj.evented;

        obj.set({
          selectable: false,
          evented: false,
          hoverCursor: 'grab'
        });
      });

      // Ensure mode won't switch when interacting with objects
      const enforceMode = () => {
        if (activeMode !== ELEMENT_TYPES.PAN) {
          setActiveMode(ELEMENT_TYPES.PAN);
        }
      };

      // Intercept selection attempts
      canvas.on('selection:created', enforceMode);
      canvas.on('selection:updated', enforceMode);

      return () => {
        // Restore method and cleanup
        if (canvas._originalFindTarget) {
          canvas.findTarget = canvas._originalFindTarget;
          delete canvas._originalFindTarget;
        }

        // Restore object properties
        canvas.forEachObject(obj => {
          if (obj._previousSelectable !== undefined) {
            obj.set({
              selectable: obj._previousSelectable,
              evented: obj._previousEvented
            });

            delete obj._previousSelectable;
            delete obj._previousEvented;
          }
        });

        canvas.off('selection:created', enforceMode);
        canvas.off('selection:updated', enforceMode);
      };
    }
  }, [activeMode, isCanvasReady]);

  // Add information tooltip when activating different modes
  useEffect(() => {
    // Show tooltip based on mode
    const showTooltip = (message) => {
      // Remove existing tooltip if any
      const existingTooltip = document.querySelector('.mode-tooltip');
      if (existingTooltip) {
        existingTooltip.remove();
      }

      const tooltipContainer = document.createElement('div');
      tooltipContainer.className = 'mode-tooltip';
      tooltipContainer.style.position = 'absolute';
      tooltipContainer.style.bottom = '110px';
      tooltipContainer.style.left = '85%';
      tooltipContainer.style.transform = 'translateX(-50%)';
      tooltipContainer.style.background = 'rgba(0,0,0,0.7)';
      tooltipContainer.style.color = 'white';
      tooltipContainer.style.padding = '8px 12px';
      tooltipContainer.style.borderRadius = '4px';
      tooltipContainer.style.zIndex = '1000';
      tooltipContainer.style.pointerEvents = 'none';
      tooltipContainer.style.transition = 'opacity 0.3s';
      tooltipContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
      tooltipContainer.style.fontSize = '14px';
      tooltipContainer.style.maxWidth = '400px';
      tooltipContainer.style.textAlign = 'center';
      tooltipContainer.innerHTML = message;

      document.body.appendChild(tooltipContainer);

      // Hide after 4 seconds
      setTimeout(() => {
        tooltipContainer.style.opacity = '0';
        setTimeout(() => {
          if (tooltipContainer.parentNode) {
            document.body.removeChild(tooltipContainer);
          }
        }, 300);
      }, 4000);
    };

    let tooltipMessage = '';

    if (activeMode === ELEMENT_TYPES.HYBRID) {
      tooltipMessage =
        '<strong>Гибридный режим активирован</strong><br>' +
        'Используйте пробел или правую кнопку мыши для панорамирования.<br>' +
        'Нажмите и перетащите объекты для их перемещения.';
    }
    else if (activeMode === ELEMENT_TYPES.PAN) {
      tooltipMessage =
        '<strong>Режим панорамирования активирован</strong><br>' +
        'Перетаскивайте холст, чтобы перемещаться по нему.<br>' +
        'В этом режиме объекты не выбираются.';
    }
    else if (activeMode === ELEMENT_TYPES.SELECT) {
      tooltipMessage =
        '<strong>Режим выбора объектов активирован</strong><br>' +
        'Нажмите на объект для его выбора и изменения.';
    }

    if (tooltipMessage) {
      showTooltip(tooltipMessage);
    }

    // Logging for debugging
    console.log(`Mode changed to: ${activeMode}`);

  }, [activeMode]);

  // Set up hybrid mode
  const setupHybridMode = (canvas) => {
    console.log('Setting up hybrid mode...');
    canvas.isDrawingMode = false;
    setIsDrawing(false);
    // Clear previous handlers
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');
    canvas.off('mouse:wheel');
    canvas.off('selection:created');
    canvas.off('selection:cleared');
    canvas.off('contextmenu');

    if (canvas._hybridHandlers) {
      window.removeEventListener('keydown', canvas._hybridHandlers.keyDown);
      window.removeEventListener('keyup', canvas._hybridHandlers.keyUp);
    }

    // Make sure object selection is enabled
    canvas.selection = true;

    // Set up objects for selection
    canvas.forEachObject(obj => {
      // Grid lines should never be selectable
      if (obj.gridLine) {
        obj.set({
          selectable: false,
          evented: false,
          hasControls: false,
          hasBorders: false,
          hoverCursor: 'default'
        });
      } else {
        // Restore interactivity for objects
        if (obj._previousSelectable !== undefined) {
          obj.set({
            selectable: obj._previousSelectable,
            evented: obj._previousEvented,
            hasControls: true,
            hasBorders: true
          });

          delete obj._previousSelectable;
          delete obj._previousEvented;
        } else {
          obj.set({
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true
          });
        }
      }
    });

    // Object selection handlers
    canvas.on('selection:created', (e) => {
      if (!e.selected || e.selected.length === 0) return;

      const obj = e.selected[0];

      // If grid line is selected - cancel selection
      if (obj.gridLine) {
        canvas.discardActiveObject();
        canvas.renderAll();
        return;
      }

      setSelectedObject(obj);

      if (obj.elementId) {
        setSelectedElementId(obj.elementId);

        obj.set({
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true
        });
      } else if (obj.tableId && onTableSelect) {
        onTableSelect(obj.tableId);
      }

      // IMPORTANT: Don't change activeMode here

      canvas.renderAll();
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
      setSelectedElementId(null);
    });

    // Hybrid mode: panning with space or right mouse button
    let isSpacePressed = false;
    let isDraggingCanvas = false;

    const handleKeyDown = (e) => {

      if (e.key === ' ' && !isSpacePressed) {
        isSpacePressed = true;
        isDraggingCanvas = false;
        canvas.defaultCursor = 'grab';

        // Temporarily disable object selection
        canvas.forEachObject(obj => {
          if (!obj.gridLine) {
            obj._previousSelectable = obj.selectable;
            obj._previousEvented = obj.evented;
            obj.set({
              selectable: false,
              evented: false
            });
          }
        });

        canvas.discardActiveObject();
        canvas.renderAll();

        e.preventDefault();
      }
    };


    const handleKeyUp = (e) => {
      if (e.key === ' ' && isSpacePressed) {
        isSpacePressed = false;
        isDraggingCanvas = false;
        canvas.defaultCursor = 'default';

        // Restore object selection
        canvas.forEachObject(obj => {
          if (!obj.gridLine && obj._previousSelectable !== undefined) {
            obj.set({
              selectable: obj._previousSelectable,
              evented: obj._previousEvented
            });

            delete obj._previousSelectable;
            delete obj._previousEvented;
          }
        });

        canvas.renderAll();
      }
    };

    const handleMouseDown = (opt) => {
      const evt = opt.e;

      // Panning with space or right mouse button
      if (isSpacePressed || evt.buttons === 2) {
        isDraggingCanvas = true;
        canvas.lastPosX = evt.clientX;
        canvas.lastPosY = evt.clientY;
        canvas.isDragging = true;
        canvas.defaultCursor = 'grabbing';

        // Prevent context menu for right button
        if (evt.buttons === 2) {
          evt.preventDefault();
          return false;
        }
      }
    };

    const handleMouseMove = (opt) => {
      const evt = opt.e;

      if (canvas.isDragging && (isSpacePressed || isDraggingCanvas)) {
        const vpt = canvas.viewportTransform;

        vpt[4] += evt.clientX - canvas.lastPosX;
        vpt[5] += evt.clientY - canvas.lastPosY;

        canvas.lastPosX = evt.clientX;
        canvas.lastPosY = evt.clientY;
        canvas.renderAll();

        evt.preventDefault();
        evt.stopPropagation();
      }
    };

    const handleMouseUp = () => {
      if (canvas.isDragging) {
        canvas.isDragging = false;
        isDraggingCanvas = false;
        canvas.defaultCursor = isSpacePressed ? 'grab' : 'default';

        // Restore objects if space is not pressed
        if (!isSpacePressed) {
          canvas.forEachObject(obj => {
            if (!obj.gridLine && obj._previousSelectable !== undefined) {
              obj.set({
                selectable: obj._previousSelectable,
                evented: obj._previousEvented
              });

              delete obj._previousSelectable;
              delete obj._previousEvented;
            }
          });
        }

        canvas.renderAll();
      }
    };

    // Prevent context menu
    const preventContextMenu = (evt) => {
      if (evt.e && (isDraggingCanvas || evt.e.buttons === 2)) {
        evt.e.preventDefault();
        return false;
      }
    };

    // Add handlers
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('mouse:wheel', handleMouseWheel);
    canvas.on('contextmenu', preventContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Save references for cleanup
    canvas._hybridHandlers = {
      mouseDown: handleMouseDown,
      mouseMove: handleMouseMove,
      mouseUp: handleMouseUp,
      keyDown: handleKeyDown,
      keyUp: handleKeyUp,
      contextMenu: preventContextMenu
    };
  };

  // Set up default event handlers
  const setupDefaultEventHandlers = (canvas) => {
    // Clear previous handlers
    canvas.off('selection:created');
    canvas.off('selection:cleared');

    // Object selection handler
    canvas.on('selection:created', (e) => {
      if (!e.selected || e.selected.length === 0) return;

      const obj = e.selected[0];

      // Ignore grid lines
      if (obj.gridLine) {
        canvas.discardActiveObject();
        canvas.renderAll();
        return;
      }

      setSelectedObject(obj);

      if (obj.elementId) {
        setSelectedElementId(obj.elementId);
      } else if (obj.tableId && onTableSelect) {
        onTableSelect(obj.tableId);
      }

      canvas.renderAll();
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
      setSelectedElementId(null);
    });
  };

  // Render all elements
  const renderAllElements = (canvas) => {
  if (!canvas) return;

  try {
    console.log('Rendering all elements...');

    // Мапа текущих объектов на холсте
    const currentObjects = new Map();
    canvas.getObjects().forEach(obj => {
      if (obj.tableId) currentObjects.set(`table_${obj.tableId}`, obj);
      else if (obj.elementId) currentObjects.set(`shape_${obj.elementId}`, obj);
      // Игнорируем объекты сетки при создании мапы
    });

    // Обновляем столы
    tables.forEach(table => {
      const key = `table_${table.id}`;
      const existing = currentObjects.get(key);
      if (!existing) {
        renderTable(canvas, table);
      }
      currentObjects.delete(key);
    });

    // ✅ Обновляем shapes (вместо hallElements)
    shapes.forEach(shape => {
      const key = `shape_${shape.id}`;
      const existing = currentObjects.get(key);
      if (!existing) {
        renderShape(canvas, shape); // Используем новую функцию
      }
      currentObjects.delete(key);
    });

    // Удаляем объекты, которых больше нет в состоянии
    // ВАЖНО: не удаляем объекты сетки
    currentObjects.forEach(obj => {
      if (!obj.gridLine) canvas.remove(obj);
    });

    // Убеждаемся, что все линии сетки не выбираются
    canvas.getObjects().forEach(obj => {
      if (obj.gridLine) {
        obj.set({
          selectable: false,
          evented: false,
          hasControls: false,
          hasBorders: false,
          lockMovementX: true,
          lockMovementY: true,
          hoverCursor: 'default',
          perPixelTargetFind: false
        });
      }
    });

    canvas.renderAll();
    console.log('Rendering complete');
  } catch (error) {
    console.error('Error rendering elements:', error);
  }
};

  // Render table
  const renderTable = (canvas, tableData) => {
    if (!canvas || !tableData) return null;

    try {
      const isRound = tableData.shape !== 'rectangle';

      // Create table group
      const tableGroup = new fabric.Group([], {
        left: tableData.x || 0,
        top: tableData.y || 0,
        tableId: tableData.id,
        tableShape: tableData.shape || 'round',
        hasControls: true,
        hasBorders: true,
        selectable: true,
        hoverCursor: 'move',
        subTargetCheck: true,
        originX: 'center',
        originY: 'center',
      });

      if (isRound) {
        // Round table
        const tableBase = new fabric.Circle({
          radius: (tableData.width || 300) / 2,
          fill: '#e7d8c7',
          stroke: '#7b5c3e',
          strokeWidth: 30,
          originX: 'center',
          originY: 'center'
        });

        tableGroup.addWithUpdate(tableBase);

        const tableTop = new fabric.Circle({
          radius: (tableData.width || 300) / 2 - 30,
          fill: '#ffffff',
          originX: 'center',
          originY: 'center',
          opacity: 0.7
        });

        tableGroup.addWithUpdate(tableTop);

        const woodTexture = new fabric.Circle({
          radius: (tableData.width || 300) / 2 - 35,
          fill: '#e7d8c7',
          originX: 'center',
          originY: 'center'
        });

        tableGroup.addWithUpdate(woodTexture);

        // Add chairs
        addChairsToRoundTable(canvas, tableGroup, tableData);
      } else {
        // Rectangle table
        const tableBase = new fabric.Rect({
          width: tableData.width || 400,
          height: tableData.height || 150,
          fill: '#e7d8c7',
          stroke: '#7b5c3e',
          strokeWidth: 30,
          originX: 'center',
          originY: 'center',
          rx: 5,
          ry: 5
        });

        tableGroup.addWithUpdate(tableBase);

        const tableTop = new fabric.Rect({
          width: (tableData.width || 400) - 60,
          height: (tableData.height || 150) - 60,
          fill: '#ffffff',
          originX: 'center',
          originY: 'center',
          opacity: 0.7,
          rx: 3,
          ry: 3
        });

        tableGroup.addWithUpdate(tableTop);

        const woodTexture = new fabric.Rect({
          width: (tableData.width || 400) - 70,
          height: (tableData.height || 150) - 70,
          fill: '#e7d8c7',
          originX: 'center',
          originY: 'center',
          rx: 3,
          ry: 3
        });

        tableGroup.addWithUpdate(woodTexture);

        // Add chairs
        addChairsToRectangleTable(canvas, tableGroup, tableData);

        // Apply rotation
        if (tableData.rotation) {
          tableGroup.set('angle', tableData.rotation);
        }
      }

      // Add label
      const tableName = tableData.name || `Стол ${tableData.id}`;
      const tableInfo = `(Места: ${tableData.chairCount || 12})`;

      const tableLabel = new fabric.Text(`${tableName} ${tableInfo}`, {
        fontSize: 16,
        fontFamily: 'Arial',
        fill: '#374151',
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        top: isRound ? -((tableData.width || 300) / 2) - 40 : -((tableData.height || 150) / 2) - 40
      });

      tableGroup.addWithUpdate(tableLabel);

      // Add control buttons
      addTableControlButtons(canvas, tableGroup, tableData, isRound);

      // Add event handlers
      tableGroup.on('selected', () => {
        if (onTableSelect) {
          onTableSelect(tableData.id);
        }
      });

      // Add to canvas
      canvas.add(tableGroup);

      return tableGroup;
    } catch (error) {
      console.error('Error rendering table:', error);
      return null;
    }
  };

  // Add chairs to round table
  const addChairsToRoundTable = (canvas, tableGroup, tableData) => {
    if (!canvas || !tableGroup || !tableData) return;

    try {
      const chairCount = tableData.chairCount || 12;
      const people = tableData.people || [];
      const radius = (tableData.width || 300) / 2 + 35;

      for (let i = 0; i < chairCount; i++) {
        const angle = (Math.PI * 2 * i) / chairCount;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);

        const isOccupied = Boolean(people[i]);
        const person = people[i] || null;

        const chair = new fabric.Circle({
          left: x,
          top: y,
          radius: 20,
          fill: isOccupied ? '#ff6b6b' : '#6bff6b',
          originX: 'center',
          originY: 'center',
          chairIndex: i,
          tableId: tableData.id,
          hoverCursor: 'pointer',
          selectable: false
        });

        chair.set('angle', (angle * 180 / Math.PI) + 90);

        chair.on('mousedown', (e) => {
          if (e.e) e.e.stopPropagation();
          if (onChairClick) onChairClick(tableData.id, i);
        });

        tableGroup.addWithUpdate(chair);

        if (isOccupied && person) {
          const nameLabel = new fabric.Text(person.name || 'Гость', {
            fontSize: 10,
            fontFamily: 'Arial',
            fill: '#211812',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            left: x,
            top: y + 5,
            width: 55,
            padding: 3
          });

          tableGroup.addWithUpdate(nameLabel);
        }
      }
    } catch (error) {
      console.error('Error adding chairs to round table:', error);
    }
  };

  // Add chairs to rectangle table
  const addChairsToRectangleTable = (canvas, tableGroup, tableData) => {
    if (!canvas || !tableGroup || !tableData) return;

    try {
      const chairCount = tableData.chairCount || 12;
      const people = tableData.people || [];
      const tableWidth = tableData.width || 400;
      const tableHeight = tableData.height || 150;

      const chairsTop = Math.ceil(chairCount / 2);
      const chairsBottom = chairCount - chairsTop;

      let currentChairIndex = 0;

      // Chairs on top
      for (let i = 0; i < chairsTop; i++) {
        const ratio = chairsTop === 1 ? 0.5 : i / (chairsTop - 1);
        const x = ((tableWidth - 60) * ratio) - (tableWidth / 2) + 30;
        const y = -(tableHeight / 2) - 30;

        const isOccupied = Boolean(people[currentChairIndex]);
        const person = people[currentChairIndex] || null;

        const chair = new fabric.Circle({
          left: x,
          top: y,
          radius: 20,
          fill: isOccupied ? '#ff6b6b' : '#6bff6b',
          originX: 'center',
          originY: 'center',
          chairIndex: currentChairIndex,
          tableId: tableData.id,
          hoverCursor: 'pointer',
          selectable: false
        });

        chair.on('mousedown', (e) => {
          if (e.e) e.e.stopPropagation();
          if (onChairClick) onChairClick(tableData.id, currentChairIndex);
        });

        tableGroup.addWithUpdate(chair);

        if (isOccupied && person) {
          const nameLabel = new fabric.Text(person.name || 'Гость', {
            fontSize: 10,
            fontFamily: 'Arial',
            fill: '#211812',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            left: x,
            top: y - 30,
            width: 55,
            padding: 3
          });

          tableGroup.addWithUpdate(nameLabel);
        }

        currentChairIndex++;
      }

      // Chairs on bottom
      for (let i = 0; i < chairsBottom; i++) {
        const ratio = chairsBottom === 1 ? 0.5 : i / (chairsBottom - 1);
        const x = ((tableWidth - 60) * ratio) - (tableWidth / 2) + 30;
        const y = (tableHeight / 2) + 30;

        const isOccupied = Boolean(people[currentChairIndex]);
        const person = people[currentChairIndex] || null;

        const chair = new fabric.Circle({
          left: x,
          top: y,
          radius: 20,
          fill: isOccupied ? '#ff6b6b' : '#6bff6b',
          originX: 'center',
          originY: 'center',
          chairIndex: currentChairIndex,
          tableId: tableData.id,
          hoverCursor: 'pointer',
          selectable: false
        });

        chair.set('angle', 180);

        chair.on('mousedown', (e) => {
          if (e.e) e.e.stopPropagation();
          if (onChairClick) onChairClick(tableData.id, currentChairIndex);
        });

        tableGroup.addWithUpdate(chair);

        if (isOccupied && person) {
          const nameLabel = new fabric.Text(person.name || 'Гость', {
            fontSize: 10,
            fontFamily: 'Arial',
            fill: '#211812',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            left: x,
            top: y + 30,
            width: 55,
            padding: 3
          });

          tableGroup.addWithUpdate(nameLabel);
        }

        currentChairIndex++;
      }
    } catch (error) {
      console.error('Error adding chairs to rectangle table:', error);
    }
  };

  // Add control buttons to table
  const addTableControlButtons = (canvas, tableGroup, tableData, isRound) => {
    if (!canvas || !tableGroup || !tableData) return;

    try {
      // Delete button
      const deleteBtn = new fabric.Circle({
        radius: 15,
        fill: '#e74c3c',
        left: 0,
        top: isRound ? -((tableData.width || 300) / 2) - 15 : -((tableData.height || 150) / 2) - 15,
        originX: 'center',
        originY: 'center',
        hoverCursor: 'pointer',
        selectable: false
      });

      const deleteIcon = new fabric.Text('×', {
        left: 0,
        top: isRound ? -((tableData.width || 300) / 2) - 15 : -((tableData.height || 150) / 2) - 15,
        fontSize: 24,
        fontFamily: 'Arial',
        fill: 'white',
        originX: 'center',
        originY: 'center',
        selectable: false
      });

      deleteBtn.on('mousedown', (e) => {
        if (e.e) e.e.stopPropagation();

        setDeleteConfirmation({
          tableId: tableData.id,
          tableName: tableData.name || `Стол ${tableData.id}`,
          tableGroup
        });
      });

      tableGroup.addWithUpdate(deleteBtn);
      tableGroup.addWithUpdate(deleteIcon);

      // Info button
      const infoBtn = new fabric.Circle({
        radius: 15,
        fill: '#3498db',
        left: 35,
        top: isRound ? -((tableData.width || 300) / 2) - 15 : -((tableData.height || 150) / 2) - 15,
        originX: 'center',
        originY: 'center',
        hoverCursor: 'pointer',
        selectable: false
      });

      const infoIcon = new fabric.Text('i', {
        left: 35,
        top: isRound ? -((tableData.width || 300) / 2) - 15 : -((tableData.height || 150) / 2) - 15,
        fontSize: 18,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fill: 'white',
        originX: 'center',
        originY: 'center',
        selectable: false
      });

      infoBtn.on('mousedown', (e) => {
        if (e.e) e.e.stopPropagation();
        if (onTableSelect) onTableSelect(tableData.id);
      });

      tableGroup.addWithUpdate(infoBtn);
      tableGroup.addWithUpdate(infoIcon);
    } catch (error) {
      console.error('Error adding table control buttons:', error);
    }
  };

  // Render hall element
  const renderHallElement = (canvas, element) => {
    if (!canvas || !element) return null;

    try {
      let fabricObj;

      switch (element.type) {
        case 'text':
          // Text element
          fabricObj = new fabric.IText(element.text || 'Текст', {
            left: element.x || 0,
            top: element.y || 0,
            fontSize: element.fontSize || 18,
            fontFamily: element.fontFamily || 'Arial',
            fill: element.fill || strokeColor,
            angle: element.rotation || 0,
            elementId: element.id,
            hasControls: true,
            hasBorders: true,
            selectable: true
          });
          break;

        case 'rectangle':
          // Rectangle element
          fabricObj = new fabric.Rect({
            left: element.x || 0,
            top: element.y || 0,
            width: element.width || 100,
            height: element.height || 50,
            fill: element.fill || fillColor,
            stroke: element.stroke || strokeColor,
            strokeWidth: element.strokeWidth || strokeWidth,
            angle: element.rotation || 0,
            elementId: element.id,
            hasControls: true,
            hasBorders: true,
            selectable: true
          });
          break;

        case 'circle':
          // Circle element с center origin (как обычно в Fabric.js)
          fabricObj = new fabric.Circle({
            left: element.x || 0,
            top: element.y || 0,
            radius: element.radius || 50,
            fill: element.fill || fillColor,
            stroke: element.stroke || strokeColor,
            strokeWidth: element.strokeWidth || strokeWidth,
            angle: element.rotation || 0,
            elementId: element.id,
            hasControls: true,
            hasBorders: true,
            selectable: true,
            originX: 'center',  // Оставляем center
            originY: 'center'   // Оставляем center
          });
          break;

        case 'line':
          // Line element - используем сохраненные абсолютные координаты
          fabricObj = new fabric.Line(
            [
              element.x1 || 0,
              element.y1 || 0,
              element.x2 || 100,
              element.y2 || 100
            ],
            {
              stroke: element.stroke || strokeColor,
              strokeWidth: element.strokeWidth || strokeWidth,
              elementId: element.id,
              hasControls: true,
              hasBorders: true,
              selectable: true,
              // Сохраняем исходные координаты для экспорта
              originalX1: element.x1 || 0,
              originalY1: element.y1 || 0,
              originalX2: element.x2 || 100,
              originalY2: element.y2 || 100
            }
          );
          break;

        case 'path':
          // Path element
          if (element.path) {
            fabricObj = new fabric.Path(element.path, {
              left: element.x || 0,
              top: element.y || 0,
              stroke: element.stroke || strokeColor,
              strokeWidth: element.strokeWidth || strokeWidth,
              fill: element.fill || '',
              elementId: element.id,
              hasControls: true,
              hasBorders: true,
              selectable: true
            });
          }
          break;

        default:
          // For hall elements with icons
          if (element.icon) {
            renderHallElementIcon(canvas, element);
            return null;
          }
          break;
      }

      if (fabricObj) {
        canvas.add(fabricObj);

        // Select if this is the selected element
        if (selectedElementId === element.id) {
          canvas.setActiveObject(fabricObj);
        }
      }

      return fabricObj;
    } catch (error) {
      console.error('Error rendering hall element:', error);
      return null;
    }
  };

  // Render hall element icon
  const renderHallElementIcon = (canvas, element) => {
    if (!canvas || !element || !element.icon) return;

    try {
      fabric.Image.fromURL(element.icon, (img) => {
        if (!img) {
          console.error('Failed to load image:', element.icon);
          return;
        }

        // Calculate size (default smaller size)
        const size = element.fontSize || 40;
        const scaleFactor = size / 340;

        // Set image properties
        img.set({
          originX: 'center',
          originY: 'center',
          scaleX: scaleFactor,
          scaleY: scaleFactor
        });

        // Create label
        const label = new fabric.Text(element.customName || element.name || 'Element', {
          fontSize: 14,
          fontFamily: 'Arial',
          fill: '#000000',
          textAlign: 'center',
          originX: 'center',
          originY: 'top',
          top: size / 2 + 5
        });

        // Create group
        const group = new fabric.Group([img, label], {
          left: element.x || 0,
          top: element.y || 0,
          angle: element.rotation || 0,
          elementId: element.id,
          hasControls: true,
          hasBorders: true,
          cornerColor: '#2196F3',
          cornerSize: 8,
          transparentCorners: false,
          selectable: true,
          hoverCursor: 'move'
        });

        // Add to canvas
        canvas.add(group);

        // Select if this is the selected element
        if (selectedElementId === element.id) {
          canvas.setActiveObject(group);
          canvas.renderAll();
        }
      });
    } catch (error) {
      console.error('Error rendering hall element icon:', error);
    }
  };

  // Drawing functions

  // 3. ЛИНИЯ

 const startDrawingLine = (canvas, opt) => {
  if (!canvas) return;

  try {
    const pointer = canvas.getPointer(opt.e);
    setIsDrawing(true);

    // Сохраняем исходные координаты
    canvas._lineStartPoint = { x: pointer.x, y: pointer.y };

    // Создаем новую линию
    const line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      selectable: false,
      evented: false
    });

    canvas.add(line);
    canvas.renderAll();
    canvas._tempLine = line;
  } catch (error) {
    console.error('Error starting line drawing:', error);
  }
};

const updateDrawingLine = (canvas, opt) => {
  if (!canvas || !canvas._tempLine || !canvas._lineStartPoint) return;

  try {
    const pointer = canvas.getPointer(opt.e);
    const startPoint = canvas._lineStartPoint;

    // Пересоздаем линию с новыми координатами
    canvas.remove(canvas._tempLine);

    const line = new fabric.Line([startPoint.x, startPoint.y, pointer.x, pointer.y], {
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      selectable: false,
      evented: false
    });

    canvas.add(line);
    canvas._tempLine = line;
    canvas.renderAll();
  } catch (error) {
    console.error('Error updating line drawing:', error);
  }
};

const finishDrawingLine = (canvas) => {
  if (!canvas || !canvas._tempLine || !canvas._lineStartPoint) return;

  try {
    setIsDrawing(false);
    setUnsavedChanges(true);

    const line = canvas._tempLine;
    const startPoint = canvas._lineStartPoint;

    // Делаем линию интерактивной
    line.set({
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      hoverCursor: 'move'
    });

    // Вычисляем абсолютные координаты линии
    const x1 = Math.round(startPoint.x);
    const y1 = Math.round(startPoint.y);
    const x2 = Math.round(line.x2 + line.left);
    const y2 = Math.round(line.y2 + line.top);

    // ✅ Создаем элемент в shapes
    const newShape = {
      id: Date.now(),
      type: 'line',
      points: [x1, y1, x2, y2],
      color: strokeColor,
      strokeWidth: strokeWidth
    };

    console.log(`Creating line with coordinates:`, newShape);

    // Сохраняем исходные координаты в самом объекте для экспорта
    line.set({
      elementId: newShape.id,
      originalX1: x1,
      originalY1: y1,
      originalX2: x2,
      originalY2: y2
    });

    // ✅ Обновляем shapes
    setShapes(prev => [...prev, newShape]);
    setSelectedElementId(newShape.id);
    setObjectCount(prev => prev + 1);

    // Cleanup
    canvas._tempLine = null;
    canvas._lineStartPoint = null;

    // Выбираем объект
    canvas.setActiveObject(line);

    // Переключаемся в гибридный режим
    setActiveMode(ELEMENT_TYPES.HYBRID);
    saveToHistory();
    canvas.renderAll();
  } catch (error) {
    console.error('Error finishing line drawing:', error);
  }
};


  // 1. ПРЯМОУГОЛЬНИК
  const startDrawingRectangle = (canvas, opt) => {
  if (!canvas) return;

  try {
    saveToHistory();
    const pointer = canvas.getPointer(opt.e);
    setIsDrawing(true);
    
    // Создаем новый прямоугольник
    const rect = new fabric.Rect({
      left: pointer.x,
      top: pointer.y,
      width: 0,
      height: 0,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      selectable: false,
      evented: false
    });

    canvas.add(rect);
    canvas.renderAll();
    canvas._tempRect = rect;
    canvas._tempStartPoint = pointer;
  } catch (error) {
    console.error('Error starting rectangle drawing:', error);
  }
};

  const updateDrawingRectangle = (canvas, opt) => {
  if (!canvas || !canvas._tempRect || !canvas._tempStartPoint) return;

  try {
    const pointer = canvas.getPointer(opt.e);
    const startPoint = canvas._tempStartPoint;

    // Вычисляем размеры
    const width = Math.abs(pointer.x - startPoint.x);
    const height = Math.abs(pointer.y - startPoint.y);

    // Определяем позицию
    let left = startPoint.x;
    let top = startPoint.y;

    if (pointer.x < startPoint.x) {
      left = pointer.x;
    }

    if (pointer.y < startPoint.y) {
      top = pointer.y;
    }

    // Обновляем прямоугольник
    canvas._tempRect.set({
      left: left,
      top: top,
      width: width,
      height: height
    });

    canvas.renderAll();
  } catch (error) {
    console.error('Error updating rectangle drawing:', error);
  }
};

  const finishDrawingRectangle = (canvas) => {
  if (!canvas || !canvas._tempRect) return;

  try {
    setIsDrawing(false);
    setUnsavedChanges(true);

    const rect = canvas._tempRect;

    // Делаем прямоугольник интерактивным
    rect.set({
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      hoverCursor: 'move'
    });

    // Получаем точные координаты
    const bound = rect.getBoundingRect();

    // ✅ Создаем элемент в shapes
    const newShape = {
      id: Date.now(),
      type: 'rect',
      x: Math.round(bound.left),
      y: Math.round(bound.top),
      width: Math.round(bound.width),
      height: Math.round(bound.height),
      color: strokeColor,
      strokeWidth: strokeWidth,
      fill: fillColor
    };

    // Привязываем ID к canvas объекту
    rect.set('elementId', newShape.id);

    // ✅ Обновляем shapes (НЕ hallElements!)
    setShapes(prev => [...prev, newShape]);
    setSelectedElementId(newShape.id);
    setObjectCount(prev => prev + 1);

    // Cleanup
    canvas._tempRect = null;
    canvas._tempStartPoint = null;

    // Выбираем объект
    canvas.setActiveObject(rect);

    // Переключаемся в гибридный режим
    setActiveMode(ELEMENT_TYPES.HYBRID);
    saveToHistory();
    canvas.renderAll();
  } catch (error) {
    console.error('Error finishing rectangle drawing:', error);
  }
};

// 2. КРУГ

 const startDrawingCircle = (canvas, opt) => {
  if (!canvas) return;

  try {
    const pointer = canvas.getPointer(opt.e);
    setIsDrawing(true);

    // Создаем круг с center origin
    const circle = new fabric.Circle({
      left: pointer.x,
      top: pointer.y,
      radius: 0,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      selectable: false,
      evented: false,
      originX: 'center',
      originY: 'center'
    });

    canvas.add(circle);
    canvas.renderAll();
    canvas._tempCircle = circle;
    canvas._tempStartPoint = pointer;
  } catch (error) {
    console.error('Error starting circle drawing:', error);
  }
};

const updateDrawingCircle = (canvas, opt) => {
  if (!canvas || !canvas._tempCircle || !canvas._tempStartPoint) return;

  try {
    const pointer = canvas.getPointer(opt.e);
    const startPoint = canvas._tempStartPoint;

    // Вычисляем радиус
    const radius = Math.sqrt(
      Math.pow(pointer.x - startPoint.x, 2) +
      Math.pow(pointer.y - startPoint.y, 2)
    );

    // Обновляем круг
    canvas._tempCircle.set({
      radius: radius
    });

    canvas.renderAll();
  } catch (error) {
    console.error('Error updating circle drawing:', error);
  }
};

const finishDrawingCircle = (canvas) => {
  if (!canvas || !canvas._tempCircle) return;

  try {
    setIsDrawing(false);
    setUnsavedChanges(true);

    const circle = canvas._tempCircle;

    // Делаем круг интерактивным
    circle.set({
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      hoverCursor: 'move'
    });

    // Для кругов с center origin координаты left/top - это центр
    // Для shapes сохраняем координаты левого верхнего угла для консистентности
    const radius = Math.round(circle.radius);

    // ✅ Создаем элемент в shapes
    const newShape = {
      id: Date.now(),
      type: 'circle',
      x: Math.round(circle.left - radius), // Левый верхний угол = центр - радиус
      y: Math.round(circle.top - radius),  // Левый верхний угол = центр - радиус
      radius: radius,
      color: strokeColor,
      strokeWidth: strokeWidth,
      fill: fillColor
    };

    console.log(`Creating circle: center(${circle.left}, ${circle.top}), radius=${radius}, topLeft(${newShape.x}, ${newShape.y})`);

    // Привязываем ID к canvas объекту
    circle.set('elementId', newShape.id);

    // ✅ Обновляем shapes
    setShapes(prev => [...prev, newShape]);
    setSelectedElementId(newShape.id);
    setObjectCount(prev => prev + 1);

    // Cleanup
    canvas._tempCircle = null;
    canvas._tempStartPoint = null;

    // Выбираем объект
    canvas.setActiveObject(circle);

    // Переключаемся в гибридный режим
    setActiveMode(ELEMENT_TYPES.HYBRID);
    saveToHistory();
    canvas.renderAll();
  } catch (error) {
    console.error('Error finishing circle drawing:', error);
  }
};

  // Handle element drop
  const handleElementDrop = (elementData, position) => {
    if (!fabricCanvasRef.current || canvasMode !== 'elements') return null;

    try {
      console.log('Dropping element:', elementData.name, 'at', position);

      // Create new element
      const newElement = {
        id: Date.now(),
        type: elementData.id,
        name: elementData.name,
        icon: elementData.icon,
        fontSize: 40, // Default reasonable size
        x: position.x,
        y: position.y,
        rotation: 0,
        customName: elementData.name
      };

      // Add to hall elements
      setHallElements(prev => [...prev, newElement]);
      setSelectedElementId(newElement.id);
      setUnsavedChanges(true);

      // Try to render the element immediately
      setTimeout(() => {
        if (fabricCanvasRef.current) {
          renderHallElement(fabricCanvasRef.current, newElement);
        }
      }, 50);

      return newElement;
    } catch (error) {
      console.error('Error handling element drop:', error);
      return null;
    }
  };

  // Calculate drop position for DnD
  const handleDrop = (item, monitor) => {
    if (!fabricCanvasRef.current || !canvasContainerRef.current || canvasMode !== 'elements') return { success: false };

    try {
      // Get drop position
      const dropOffset = monitor.getClientOffset();
      if (!dropOffset) return { success: false };

      // Calculate canvas position
      const canvasRect = canvasContainerRef.current.getBoundingClientRect();

      // Get scroll offset
      const containerScroll = {
        scrollLeft: canvasContainerRef.current.scrollLeft || 0,
        scrollTop: canvasContainerRef.current.scrollTop || 0
      };

      // Calculate drop coordinates in canvas space
      const x = (dropOffset.x - canvasRect.left + containerScroll.scrollLeft) / zoom;
      const y = (dropOffset.y - canvasRect.top + containerScroll.scrollTop) / zoom;

      // Create new element
      const newElement = handleElementDrop(item.elementData, { x, y });

      return { success: true, elementId: newElement ? newElement.id : null };
    } catch (error) {
      console.error('Error handling DnD drop:', error);
      return { success: false };
    }
  };

  // 4. ТЕКСТ
 const addNewText = () => {
  if (!fabricCanvasRef.current) return;

  try {
    saveToHistory();
    const canvas = fabricCanvasRef.current;
    const center = canvas.getCenter();

    // Создаем новый текстовый элемент
    const text = new fabric.IText('Введите текст', {
      left: center.left,
      top: center.top,
      fontSize: fontSize,
      fontFamily: 'Arial',
      fill: strokeColor,
      elementId: Date.now(),
      hasControls: true,
      hasBorders: true,
      selectable: true
    });

    // ✅ Создаем элемент в shapes
    const newShape = {
      id: text.elementId,
      type: 'text',
      text: 'Введите текст',
      x: center.left,
      y: center.top,
      fontSize: fontSize,
      fontFamily: 'Arial',
      color: strokeColor
    };

    // Добавляем на холст и в состояние
    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    canvas.renderAll();

    // ✅ Обновляем shapes
    setShapes(prev => [...prev, newShape]);
    setObjectCount(prev => prev + 1);
    setUnsavedChanges(true);
    setActiveMode(ELEMENT_TYPES.HYBRID);

  } catch (error) {
    console.error('Error adding text:', error);
  }
};

  // Add new table
  const addNewTable = () => {
    if (!fabricCanvasRef.current) return;

    try {
      const canvas = fabricCanvasRef.current;
      const center = canvas.getCenter();

      // Create new table
      const newTable = {
        id: Date.now(),
        x: center.left,
        y: center.top,
        width: 300,
        height: 300,
        shape: 'round',
        chairCount: 12,
        people: Array(12).fill(null)
      };

      // Add to tables
      setTables(prev => [...prev, newTable]);

      // Render on canvas
      renderTable(canvas, newTable);
      saveToHistory();
      setUnsavedChanges(true);
      setObjectCount(prev => prev + 1);
      setActiveMode(ELEMENT_TYPES.HYBRID);
    } catch (error) {
      console.error('Error adding table:', error);
    }
  };

  // Zoom functions
  const zoomIn = () => {
    if (!fabricCanvasRef.current) return;

    try {
      const canvas = fabricCanvasRef.current;
      const center = canvas.getCenter();
      const newZoom = Math.min(zoom * 1.1, 5);

      canvas.zoomToPoint({ x: center.left, y: center.top }, newZoom);
      setZoom(newZoom);
    } catch (error) {
      console.error('Error zooming in:', error);
    }
  };

  const zoomOut = () => {
    if (!fabricCanvasRef.current) return;

    try {
      const canvas = fabricCanvasRef.current;
      const center = canvas.getCenter();
      const newZoom = Math.max(zoom / 1.1, 0.1);

      canvas.zoomToPoint({ x: center.left, y: center.top }, newZoom);
      setZoom(newZoom);
    } catch (error) {
      console.error('Error zooming out:', error);
    }
  };

  const resetZoom = () => {
    if (!fabricCanvasRef.current) return;

    try {
      const canvas = fabricCanvasRef.current;

      // Получаем размеры canvas
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Центр сетки (где пересекаются центральные линии)
      const gridCenterX = canvasWidth / 2;
      const gridCenterY = canvasHeight / 2;

      // Сбрасываем viewport transform для центрирования
      canvas.viewportTransform = [1, 0, 0, 1, 0, 0];

      // Устанавливаем масштаб 1:1 с центрированием на центре сетки
      canvas.zoomToPoint({ x: gridCenterX, y: gridCenterY }, 1);

      setZoom(1);

      console.log(`Reset zoom to center of grid at (${gridCenterX}, ${gridCenterY})`);
    } catch (error) {
      console.error('Error resetting zoom:', error);
    }
  };

  useEffect(() => {
    if (fabricCanvasRef.current && isCanvasReady) {
      createGrid(fabricCanvasRef.current, gridSize);
    }
  }, [gridSize, showGrid, isCanvasReady]);

  // Delete selected object


  // Export/import functions
 const exportCanvasAsJSON = () => {
  if (!fabricCanvasRef.current) return null;

  try {
    const canvas = fabricCanvasRef.current;

    // STEP 1: Save current zoom state and viewport transform
    const currentZoom = zoom;
    const originalViewportTransform = [...canvas.viewportTransform];
    
    // STEP 2: Reset zoom to 1.0 (100%) temporarily
    canvas.setZoom(1.0);
    canvas.viewportTransform[4] = 0; // Reset X pan
    canvas.viewportTransform[5] = 0; // Reset Y pan
    canvas.renderAll();
    
    // STEP 3: Let the canvas update with new zoom
    console.log("Temporarily reset zoom to 1.0 for accurate export");

    // STEP 4: Get shapes from canvas at zoom level 1.0
    const actualShapes = [];

    canvas.getObjects().forEach(obj => {
      if (obj.elementId && !obj.gridLine) {
        let shape = null;

        switch (obj.type) {
          case 'rect':
            // Calculate accurate measurements at zoom 1.0
            const bound = obj.getBoundingRect();
            const centerX = bound.left + bound.width / 2;
            const centerY = bound.top + bound.height / 2;
            
            shape = {
              id: obj.elementId,
              type: 'rect',
              x: Math.round(bound.left),
              y: Math.round(bound.top),
              width: Math.round(obj.width * (obj.scaleX || 1)),
              height: Math.round(obj.height * (obj.scaleY || 1)),
              centerX: Math.round(centerX),
              centerY: Math.round(centerY),
              color: obj.stroke || '#000000',
              strokeWidth: obj.strokeWidth || 2,
              fill: obj.fill || 'transparent',
              rotation: Math.round(obj.angle || 0)
            };
            break;

          case 'circle':
            // For circles...
            const radius = Math.round(obj.radius * (obj.scaleX || 1));
            shape = {
              id: obj.elementId,
              type: 'circle',
              x: Math.round(obj.left - radius),
              y: Math.round(obj.top - radius),
              centerX: Math.round(obj.left),
              centerY: Math.round(obj.top),
              radius: radius,
              color: obj.stroke || '#000000',
              strokeWidth: obj.strokeWidth || 2,
              fill: obj.fill || 'transparent',
              rotation: Math.round(obj.angle || 0)
            };
            break;

          // Other shape types...
        }

        if (shape) {
          actualShapes.push(shape);
        }
      }
    });

    // STEP 5: Create export data
    const exportData = {
      name: "Зал ресторана", 
      tables: tables.map(table => ({ ...table })),
      shapes: actualShapes,
      canvasData: {
        version: "2.0",
        zoom: currentZoom, // We store the original zoom level
        width: canvas.width,
        height: canvas.height,
        coordinateSystem: "topLeft"
      }
    };

    // STEP 6: Restore original viewport transform
    canvas.setViewportTransform(originalViewportTransform);
    canvas.renderAll();
    console.log("Restored original zoom after export");

    // STEP 7: Return the JSON data
    console.log("Exporting unified data:", exportData);
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting canvas:', error);
    return null;
  }
};

  // Helper function to extract points from a path element
  const extractPathPoints = (pathElement) => {
    try {
      if (!pathElement.path) {
        return [pathElement.x || 0, pathElement.y || 0];
      }

      // For fabric.js Path objects with path data
      if (typeof pathElement.path === 'string') {
        // Simplified SVG path parsing - extract points from M and L commands
        let points = [];
        const regex = /[ML]\s*(-?\d+(?:\.\d+)?)[,\s](-?\d+(?:\.\d+)?)/g;
        let match;

        while ((match = regex.exec(pathElement.path)) !== null) {
          points.push(parseFloat(match[1]), parseFloat(match[2]));
        }

        return points.length ? points : [pathElement.x || 0, pathElement.y || 0];
      }
      else if (Array.isArray(pathElement.path)) {
        // Handle array path format (Fabric.js internal format)
        let points = [];

        pathElement.path.forEach(cmd => {
          if (cmd[0] === 'M' || cmd[0] === 'L') {
            points.push(cmd[1], cmd[2]);
          }
        });

        return points.length ? points : [pathElement.x || 0, pathElement.y || 0];
      }
    } catch (e) {
      console.error("Error extracting points from path:", e);
    }

    // Fallback: return element position if we can't extract path
    return [pathElement.x || 0, pathElement.y || 0];
  }

  const importCanvasFromJSON = (jsonString) => {
  try {
    const importData = JSON.parse(jsonString);

    if (!importData.tables && !importData.shapes) {
      throw new Error('Invalid JSON format: missing required fields');
    }

    // Обновляем состояние
    if (importData.tables) {
      setTables(importData.tables);
    }

    // ✅ Импортируем shapes напрямую (без конвертации)
    if (importData.shapes && Array.isArray(importData.shapes)) {
      setShapes(importData.shapes);
    } else {
      setShapes([]);
    }

    // Применяем зум
    if (importData.canvasData && importData.canvasData.zoom && fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      const center = canvas.getCenter();

      setZoom(importData.canvasData.zoom);
      canvas.zoomToPoint({ x: center.left, y: center.top }, importData.canvasData.zoom);
    }

    // Рендерим все элементы
    setTimeout(() => {
      if (fabricCanvasRef.current) {
        renderAllElements(fabricCanvasRef.current);
        saveToHistory();
      }
    }, 100);

    setUnsavedChanges(false);
    return true;
  } catch (error) {
    console.error('Error importing JSON:', error);
    return false;
  }
};


  // Enable/disable pan mode
  const enablePanMode = () => {
    setActiveMode(ELEMENT_TYPES.PAN);
  };

  const disablePanMode = () => {
    setActiveMode(ELEMENT_TYPES.SELECT);
  };

  useEffect(() => {
    // После инициализации холста и рендеринга всех элементов
    if (isCanvasReady && fabricCanvasRef.current) {
      // Дайте немного времени для полной загрузки
      setTimeout(() => {
        saveToHistory();
      }, 500);
    }
  }, [isCanvasReady]);




  // Export methods via ref
  React.useImperativeHandle(ref, () => ({
    exportCanvasAsJSON,
    importCanvasFromJSON,
    zoomIn,
    zoomOut,
    resetZoom,
    addNewTable,
    addNewText,
    deleteSelectedObject,
    duplicateSelectedObject,
    selectAllObjects,
    getCanvas: () => fabricCanvasRef.current,
  }));

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="enhanced-canvas-container">
        <div className="canvas-toolbar">
          <div className="tool-group">
            <button
              className={`tool-btn ${activeMode === ELEMENT_TYPES.HYBRID ? 'active' : ''}`}
              onClick={() => setActiveMode(ELEMENT_TYPES.HYBRID)}
              title="Гибридный режим: выбор и панорамирование. Используйте ПРОБЕЛ или правую кнопку мыши для панорамирования."
            >

              <i className="fas fa-hand-paper"></i> ✋ + 🖱️ <i className="fas fa-mouse-pointer"></i>
            </button>
            <button
              className={`tool-btn ${activeMode === ELEMENT_TYPES.PAN ? 'active' : ''}`}
              onClick={() => setActiveMode(ELEMENT_TYPES.PAN)}
              title="Только панорамирование"
            >
              <i className="fas fa-hand-paper">✋</i>
            </button>
            <button
              className={`tool-btn ${activeMode === ELEMENT_TYPES.SELECT ? 'active' : ''}`}
              onClick={() => setActiveMode(ELEMENT_TYPES.SELECT)}
              title="Выбор объектов"
            >

              <i className="fas fa-mouse-pointer">🖱️</i>
            </button>
            <button
              className={`tool-btn ${activeMode === ELEMENT_TYPES.DRAW ? 'active' : ''}`}
              onClick={() => setActiveMode(ELEMENT_TYPES.DRAW)}
              title="Свободное рисование"
            >
              <i className="fas fa-pencil-alt">✏️</i>
            </button>
            <button
              className={`tool-btn ${activeMode === ELEMENT_TYPES.LINE ? 'active' : ''}`}
              onClick={() => setActiveMode(ELEMENT_TYPES.LINE)}
              title="Прямая линия"
            >
              <i className="fas fa-minus">➖</i>
            </button>
            <button
              className={`tool-btn ${activeMode === ELEMENT_TYPES.RECTANGLE ? 'active' : ''}`}
              onClick={() => setActiveMode(ELEMENT_TYPES.RECTANGLE)}
              title="Прямоугольник"
            >
              <i className="far fa-square">⬛</i>
            </button>
            <button
              className={`tool-btn ${activeMode === ELEMENT_TYPES.CIRCLE ? 'active' : ''}`}
              onClick={() => setActiveMode(ELEMENT_TYPES.CIRCLE)}
              title="Круг"
            >
              <i className="far fa-circle">⚪</i>
            </button>
            <button
              className={`tool-btn ${activeMode === ELEMENT_TYPES.TEXT ? 'active' : ''}`}
              onClick={() => {
                setActiveMode(ELEMENT_TYPES.TEXT);
                addNewText();
              }}
              title="Добавить текст"
            >
              <i className="fas fa-font">A</i>
            </button>
            <button
              className={`tool-btn ${activeMode === ELEMENT_TYPES.TABLE ? 'active' : ''}`}
              onClick={() => {
                setActiveMode(ELEMENT_TYPES.TABLE);
                addNewTable();
              }}
              title="Добавить стол"
            >
              <i className="fas fa-table">T</i>
            </button>
            {/* <button
              className={`tool-btn ${activeMode === ELEMENT_TYPES.ERASER ? 'active' : ''}`}
              onClick={() => setActiveMode(ELEMENT_TYPES.ERASER)}
              title="Ластик"
            >
              <i className="fas fa-eraser"></i>
            </button> */}
          </div>

          <div className="tool-group">
            <div className="color-picker">
              <label htmlFor="stroke-color">Цвет линии:</label>
              <input
                type="color"
                id="stroke-color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
              />
            </div>

            <div className="color-picker">
              <label htmlFor="fill-color">Цвет заливки:</label>
              <input
                type="color"
                id="fill-color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
              />
            </div>

            <div className="stroke-width">
              <label htmlFor="stroke-width">Толщина:</label>
              <input
                type="range"
                id="stroke-width"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
              />
              <span>{strokeWidth}px</span>
            </div>

            <div className="font-size">
              <label htmlFor="font-size">Размер шрифта:</label>
              <input
                type="range"
                id="font-size"
                min="8"
                max="72"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
              />
              <span>{fontSize}px</span>
            </div>
          </div>

          <div className="tool-group">
            <button
              className="tool-btn"
              onClick={zoomIn}
              title="Увеличить"
            >
              <i className="fas fa-search-plus">➕</i>
            </button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button
              className="tool-btn"
              onClick={zoomOut}
              title="Уменьшить"
            >
              <i className="fas fa-search-minus">➖</i>
            </button>
            <button
              className="tool-btn"
              onClick={resetZoom}
              title="Сбросить масштаб"
            >
              <i className="fas fa-compress-arrows-alt">↔️</i>
            </button>
          </div>
          <div className="tool-group">
            {selectedObject && (
              <>
                <button
                  className="tool-btn"
                  onClick={deleteSelectedObject}
                  title="Удалить выбранный объект"
                >
                  <i className="fas fa-trash">🗑️</i>

                </button>

                <button
                  className="tool-btn"
                  onClick={duplicateSelectedObject}
                  title="Дублировать выбранный объект (Ctrl+D)"
                >
                  <i className="fas fa-copy">📋</i>
                </button>
                <button
                  className="tool-btn"
                  onClick={() => {
                    if (!fabricCanvasRef.current || !selectedObject) return;
                    fabricCanvasRef.current.bringForward(selectedObject);
                    fabricCanvasRef.current.renderAll();
                  }}
                  title="Переместить вперед"
                >
                  <i className="fas fa-arrow-up">⬆️</i>
                </button>

                <button
                  className="tool-btn"
                  onClick={() => {
                    if (!fabricCanvasRef.current || !selectedObject) return;
                    fabricCanvasRef.current.sendBackwards(selectedObject);
                    fabricCanvasRef.current.renderAll();
                  }}
                  title="Переместить назад"
                >
                  <i className="fas fa-arrow-down">⬇️</i>
                </button>
              </>
            )}

             <button
              className="tool-btn"
              onClick={async () => {
                // First reset zoom to ensure clean export
                resetZoom();
                
                // Wait for zoom reset to complete
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Then proceed with export
                const jsonData = exportCanvasAsJSON();
                if (jsonData) {
                  const blob = new Blob([jsonData], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'hall_layout.json';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);

                  setUnsavedChanges(false);
                }
              }}
              title="Экспорт JSON (автоматически сбрасывает масштаб)"
            >💾</button>

            <input
              type="file"
              id="import-json"
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (event.target.result) {
                      importCanvasFromJSON(event.target.result.toString());
                    }
                  };
                  reader.readAsText(file);
                }
              }}
            />

            <button
              className="tool-btn"
              onClick={() => document.getElementById('import-json').click()}
              title="Импорт JSON"
            >
              <i className="fas fa-file-import">🗂️</i>
            </button>
          </div>
        </div>

        <div className="canvas-content-area">
          <div className="canvas-and-sidebar-container" style={{ display: 'flex', width: '100%' }}>
            <div
              className="canvas-wrapper"
              ref={canvasContainerRef}
              style={{
                width: '100%',
                position: 'relative',
                border: '1px solid #ddd',
                overflow: 'hidden'
              }}
            >
              <canvas
                ref={canvasRef}
                style={{
                  display: 'block',
                  touchAction: 'none'
                }}
              />
              {!initialized && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.7)',
                  zIndex: 1000
                }}>
                  <div>Initializing canvas...</div>
                </div>
              )}
            </div>

            {canvasMode === 'elements' && (
              <div className="elements-sidebar" style={{ width: '250px', padding: '10px', background: '#f5f5f5', borderLeft: '1px solid #ddd' }}>
                <HallElementsCatalog onAddElement={handleElementDrop} />
              </div>
            )}
          </div>

          {initialized && canvasMode === 'elements' && (
            <HallElementsManager
              tablesAreaRef={canvasContainerRef}
              zoom={zoom}
              elements={hallElements}
              setElements={setHallElements}
              selectedElementId={selectedElementId}
              setSelectedElementId={setSelectedElementId}
              activeMode={canvasMode}
              onDrop={handleDrop}
            />
          )}
        </div>

        <div className="canvas-status">
          <div className="stats">
            <span>Объектов: {objectCount}</span>
            <span>Столов: {tables.length}</span>
            <span>Элементов: {hallElements.length}</span>
          </div>
          {deleteConfirmation && (
            <div className="delete-confirmation-overlay">
              <div className="delete-confirmation-dialog">
                <h3>Подтверждение удаления</h3>
                <p>Вы уверены, что хотите удалить стол "{deleteConfirmation.tableName}"?</p>
                <div className="dialog-buttons">
                  <button
                    className="confirm-btn"
                    onClick={() => {
                      const updatedTables = tables.filter(t => t.id !== deleteConfirmation.tableId);
                      setTables(updatedTables);

                      if (fabricCanvasRef.current && deleteConfirmation.tableGroup) {
                        fabricCanvasRef.current.remove(deleteConfirmation.tableGroup);
                        fabricCanvasRef.current.renderAll();
                      }

                      setDeleteConfirmation(null);
                    }}
                  >
                    Удалить
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => setDeleteConfirmation(null)}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}
          {unsavedChanges && (
            <div className="unsaved-changes">
              Есть несохраненные изменения
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
});

export default EnhancedCanvas;