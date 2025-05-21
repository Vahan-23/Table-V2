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

  // Состояния для истории действий (отмена/повтор)
  const [historyStack, setHistoryStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [maxHistoryLength] = useState(50); // Ограничиваем размер истории

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
  const undo = useCallback(() => {
    if (historyStack.length === 0) {
      console.log("Нет действий для отмены");
      return;
    }

    console.log("Отмена действия, осталось в истории:", historyStack.length - 1);

    // Получаем предыдущее состояние
    const newHistoryStack = [...historyStack];
    const prevState = newHistoryStack.pop();

    // Сохраняем текущее состояние для возможности повтора
    const currentState = {
      tables: JSON.parse(JSON.stringify(tables)),
      hallElements: JSON.parse(JSON.stringify(hallElements))
    };

    setRedoStack(prev => [...prev, currentState]);
    setHistoryStack(newHistoryStack);

    // Восстанавливаем предыдущее состояние
    setTables(prevState.tables);
    setHallElements(prevState.hallElements);

    // Перерисовываем холст
    setTimeout(() => {
      if (fabricCanvasRef.current) {
        // Сначала очищаем холст от объектов (кроме сетки)
        fabricCanvasRef.current.getObjects().forEach(obj => {
          if (!obj.gridLine) {
            fabricCanvasRef.current.remove(obj);
          }
        });

        // Затем перерисовываем все элементы
        renderAllElements(fabricCanvasRef.current);

        // Сбрасываем выделение
        fabricCanvasRef.current.discardActiveObject();
        fabricCanvasRef.current.renderAll();

        // Очищаем выбранный объект
        setSelectedObject(null);
        setSelectedElementId(null);
      }
    }, 50);
  }, [historyStack, tables, hallElements]);
  // Повтор отмененного действия (Redo)
  const redo = useCallback(() => {
    if (redoStack.length === 0) {
      console.log("Нет действий для повтора");
      return;
    }

    console.log("Повтор действия, осталось для повтора:", redoStack.length - 1);

    // Получаем следующее состояние
    const newRedoStack = [...redoStack];
    const nextState = newRedoStack.pop();

    // Сохраняем текущее состояние для возможности отмены
    const currentState = {
      tables: JSON.parse(JSON.stringify(tables)),
      hallElements: JSON.parse(JSON.stringify(hallElements))
    };

    setHistoryStack(prev => [...prev, currentState]);
    setRedoStack(newRedoStack);

    // Восстанавливаем следующее состояние
    setTables(nextState.tables);
    setHallElements(nextState.hallElements);

    // Перерисовываем холст
    setTimeout(() => {
      if (fabricCanvasRef.current) {
        // Сначала очищаем холст от объектов (кроме сетки)
        fabricCanvasRef.current.getObjects().forEach(obj => {
          if (!obj.gridLine) {
            fabricCanvasRef.current.remove(obj);
          }
        });

        // Затем перерисовываем все элементы
        renderAllElements(fabricCanvasRef.current);

        // Сбрасываем выделение
        fabricCanvasRef.current.discardActiveObject();
        fabricCanvasRef.current.renderAll();

        // Очищаем выбранный объект
        setSelectedObject(null);
        setSelectedElementId(null);
      }
    }, 50);
  }, [redoStack, tables, hallElements]);


  const deleteSelectedObject = () => {
  const canvas = fabricCanvasRef.current;
  if (!canvas) return;

  try {
    // Сохраняем состояние перед удалением
    saveToHistory();

    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    // Проверяем, выбрана ли группа объектов
    if (activeObject.type === 'activeSelection') {
      // Удаляем все объекты из выделения
      const objectsInGroup = activeObject.getObjects();
      
      // Разгруппировываем выделение
      activeObject.destroy();
      
      // Удаляем каждый объект
      objectsInGroup.forEach(obj => {
        canvas.remove(obj);
        
        // Обновляем состояние в зависимости от типа объекта
        if (obj.tableId) {
          setTables(prev => prev.filter(table => table.id !== obj.tableId));
        } else if (obj.elementId) {
          setHallElements(prev => prev.filter(element => element.id !== obj.elementId));
        }
      });
    } else {
      // Удаляем один выбранный объект (как у вас сейчас)
      if (activeObject.tableId) {
        setTables(prev => prev.filter(table => table.id !== activeObject.tableId));
      } else if (activeObject.elementId) {
        setHallElements(prev => prev.filter(element => element.id !== activeObject.elementId));
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
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Если фокус на поле ввода - не обрабатываем
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Отмена действия (Ctrl+Z)
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        console.log("Нажата комбинация Ctrl+Z");
        undo();
      }

      // Повтор действия (Ctrl+Shift+Z)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        console.log("Нажата комбинация Ctrl+Shift+Z");
        redo();
      }

      // Удаление выбранного объекта (Delete)
      if (e.key === 'Delete' && selectedObject) {
        e.preventDefault();
        deleteSelectedObject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, deleteSelectedObject, selectedObject]);

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
      createGrid(canvas);

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
          createGrid(canvas);
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
  const createGrid = (canvas) => {
    if (!canvas) return;

    try {
      // Clear existing grid
      canvas.getObjects().forEach(obj => {
        if (obj.gridLine) {
          canvas.remove(obj);
        }
      });

      const width = canvas.width || 800;
      const height = canvas.height || 600;
      const gridSize = 20;

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

        // Add explicit property to easily identify grid
        line.set('interactive', false);

        return line;
      };

      // Create vertical lines
      for (let i = 0; i <= width / gridSize; i++) {
        const line = createGridLine([i * gridSize, 0, i * gridSize, height]);
        canvas.add(line);
        line.sendToBack();
      }

      // Create horizontal lines
      for (let i = 0; i <= height / gridSize; i++) {
        const line = createGridLine([0, i * gridSize, width, i * gridSize]);
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

        // IMPORTANT: Don't change activeMode here

        canvas.renderAll();
      });

      canvas.on('selection:cleared', () => {
        setSelectedObject(null);
        setSelectedElementId(null);
      });

      // Object moving
      canvas.on('object:moving', (e) => {
        if (!e.target) return;
        saveToHistory();
        const obj = e.target;
        setUnsavedChanges(true);

        if (obj.tableId) {
          // Update table position
          setTables(prevTables => prevTables.map(table =>
            table.id === obj.tableId
              ? { ...table, x: Math.round(obj.left), y: Math.round(obj.top) }
              : table
          ));

          if (onTableMove) {
            onTableMove(obj.tableId, obj.left, obj.top);
          }
        } else if (obj.elementId) {
          const element = hallElements.find(el => el.id === obj.elementId);
          if (element && element.type === 'line') {
            const deltaX = obj.left - element.x;
            const deltaY = obj.top - element.y;
            setHallElements(prevElements => prevElements.map(el =>
              el.id === obj.elementId
                ? {
                  ...el,
                  x: Math.round(obj.left),
                  y: Math.round(obj.top),
                  x1: el.x1 + deltaX,
                  y1: el.y1 + deltaY,
                  x2: el.x2 + deltaX,
                  y2: el.y2 + deltaY
                }
                : el
            ));
          } else {
            setHallElements(prevElements => prevElements.map(el =>
              el.id === obj.elementId
                ? { ...el, x: Math.round(obj.left), y: Math.round(obj.top) }
                : el
            ));
          }
        }
      });

      canvas.on('object:modified', () => {
        saveToHistory();
      });

      // Object scaling
      canvas.on('object:scaling', (e) => {
        if (!e.target) return;

        const obj = e.target;
        setUnsavedChanges(true);

        if (obj.elementId) {
          if (obj.type === 'group') {
            // Scale hall element (icon group)
            const element = hallElements.find(el => el.id === obj.elementId);
            if (element) {
              const newFontSize = Math.max(20, Math.round(element.fontSize * obj.scaleX));

              setHallElements(prevElements => prevElements.map(el =>
                el.id === obj.elementId
                  ? { ...el, fontSize: newFontSize }
                  : el
              ));
            }
          } else if (obj.type === 'rect') {
            // Scale rectangle
            setHallElements(prevElements => prevElements.map(el =>
              el.id === obj.elementId
                ? {
                  ...el,
                  width: Math.round(obj.width * obj.scaleX),
                  height: Math.round(obj.height * obj.scaleY)
                }
                : el
            ));
          } else if (obj.type === 'circle') {
            // Scale circle
            setHallElements(prevElements => prevElements.map(el =>
              el.id === obj.elementId
                ? { ...el, radius: Math.round(obj.radius * obj.scaleX) }
                : el
            ));
          } else if (obj.type === 'i-text') {
            // Scale text
            const newFontSize = Math.round(obj.fontSize * obj.scaleX);

            setHallElements(prevElements => prevElements.map(el =>
              el.id === obj.elementId
                ? { ...el, fontSize: newFontSize }
                : el
            ));

            obj.set({
              fontSize: newFontSize,
              scaleX: 1,
              scaleY: 1
            });

            canvas.renderAll();
          }
        } else if (obj.tableId) {
          // Handle table scaling
          const table = tables.find(t => t.id === obj.tableId);

          if (table) {
            // For round tables
            if (obj.tableShape === 'round') {
              const newWidth = Math.round(table.width * obj.scaleX);

              setTables(prevTables => prevTables.map(t =>
                t.id === obj.tableId
                  ? { ...t, width: newWidth }
                  : t
              ));
            }
            // For rectangle tables
            else if (obj.tableShape === 'rectangle') {
              const newWidth = Math.round(table.width * obj.scaleX);
              const newHeight = Math.round(table.height * obj.scaleY);

              setTables(prevTables => prevTables.map(t =>
                t.id === obj.tableId
                  ? { ...t, width: newWidth, height: newHeight }
                  : t
              ));
            }

            // After scaling, we need to re-render the table with the new dimensions
            // This ensures chairs and other elements are properly positioned
            setTimeout(() => {
              // Remove the old table object
              canvas.remove(obj);

              // Get the updated table data
              const updatedTable = tables.find(t => t.id === obj.tableId);
              if (updatedTable) {
                // Render the updated table
                renderTable(canvas, updatedTable);
                canvas.renderAll();
              }
            }, 100);
          }
        }
      });

      // Object rotating
      canvas.on('object:rotating', (e) => {
        if (!e.target) return;

        const obj = e.target;
        setUnsavedChanges(true);

        if (obj.tableId && obj.tableShape === 'rectangle') {
          // Rotate rectangle table
          setTables(prevTables => prevTables.map(table =>
            table.id === obj.tableId
              ? { ...table, rotation: Math.round(obj.angle) }
              : table
          ));
        } else if (obj.elementId) {
          // Rotate hall element
          setHallElements(prevElements => prevElements.map(element =>
            element.id === obj.elementId
              ? { ...element, rotation: Math.round(obj.angle) }
              : element
          ));
        }
      });

      // Path creation (for drawing)
      canvas.on('path:created', (e) => {
        if (!e.path) return;

        const path = e.path;
        setUnsavedChanges(true);
        saveToHistory()
        // Create new element
        const newElement = {
          id: Date.now(),
          type: 'path',
          path: path.path,
          stroke: path.stroke,
          strokeWidth: path.strokeWidth,
          fill: path.fill || '',
          x: path.left,
          y: path.top,
          width: path.width,
          height: path.height
        };

        // Add element ID
        path.set('elementId', newElement.id);

        // Update state
        setHallElements(prevElements => [...prevElements, newElement]);
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

      // Map of current objects on canvas
      const currentObjects = new Map();
      canvas.getObjects().forEach(obj => {
        if (obj.tableId) currentObjects.set(`table_${obj.tableId}`, obj);
        else if (obj.elementId) currentObjects.set(`element_${obj.elementId}`, obj);
        // Ignore grid objects when creating map
        // They don't have tableId or elementId, but have gridLine
      });

      // Update tables
      tables.forEach(table => {
        const key = `table_${table.id}`;
        const existing = currentObjects.get(key);
        if (!existing) {
          renderTable(canvas, table);
        }
        currentObjects.delete(key);
      });

      // Update elements
      hallElements.forEach(element => {
        const key = `element_${element.id}`;
        const existing = currentObjects.get(key);
        if (!existing) {
          renderHallElement(canvas, element);
        }
        currentObjects.delete(key);
      });

      // Remove objects that no longer exist in state
      // IMPORTANT: don't remove gridLine objects
      currentObjects.forEach(obj => {
        if (!obj.gridLine) canvas.remove(obj);
      });

      // Make sure all grid lines are not selectable
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
          // Circle element
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
            selectable: true
          });
          break;

        case 'line':
          // Line element
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
              selectable: true
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
  const startDrawingLine = (canvas, opt) => {
    if (!canvas) return;

    try {
      const pointer = canvas.getPointer(opt.e);
      setIsDrawing(true);

      // Create new line
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
    if (!canvas || !canvas._tempLine) return;

    try {
      const pointer = canvas.getPointer(opt.e);

      // Update line end point
      canvas._tempLine.set({
        x2: pointer.x,
        y2: pointer.y
      });

      canvas.renderAll();
    } catch (error) {
      console.error('Error updating line drawing:', error);
    }
  };

  const finishDrawingLine = (canvas) => {
    if (!canvas || !canvas._tempLine) return;

    try {
      setIsDrawing(false);
      setUnsavedChanges(true);

      const line = canvas._tempLine;

      // Make line interactive
      line.set({
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        hoverCursor: 'move'
      });

      // Create new element
      const newElement = {
        id: Date.now(),
        type: 'line',
        x1: line.x1,
        y1: line.y1,
        x2: line.x2,
        y2: line.y2,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        x: line.left,
        y: line.top
      };

      // Add element ID
      line.set('elementId', newElement.id);

      // Update state
      setHallElements(prev => [...prev, newElement]);
      setSelectedElementId(newElement.id);
      setObjectCount(prev => prev + 1);

      // Clean up
      canvas._tempLine = null;

      // Set this object as selected
      canvas.setActiveObject(line);

      // Switch to select mode
      setActiveMode(ELEMENT_TYPES.HYBRID);
      saveToHistory();
      // Ensure canvas is updated
      canvas.renderAll();
    } catch (error) {
      console.error('Error finishing line drawing:', error);
    }
  };

  const startDrawingRectangle = (canvas, opt) => {
    if (!canvas) return;

    try {
      saveToHistory();
      const pointer = canvas.getPointer(opt.e);
      setIsDrawing(true);
      // Create new rectangle
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

      // Calculate dimensions
      const width = Math.abs(pointer.x - startPoint.x);
      const height = Math.abs(pointer.y - startPoint.y);

      // Determine position
      let left = startPoint.x;
      let top = startPoint.y;

      if (pointer.x < startPoint.x) {
        left = pointer.x;
      }

      if (pointer.y < startPoint.y) {
        top = pointer.y;
      }

      // Update rectangle
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

      // Make rectangle interactive
      rect.set({
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        hoverCursor: 'move'
      });

      // Create new element
      const newElement = {
        id: Date.now(),
        type: 'rectangle',
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth
      };

      // Add element ID
      rect.set('elementId', newElement.id);

      // Update state
      setHallElements(prev => [...prev, newElement]);
      setSelectedElementId(newElement.id);
      setObjectCount(prev => prev + 1);

      // Clean up
      canvas._tempRect = null;
      canvas._tempStartPoint = null;

      // Set this object as selected
      canvas.setActiveObject(rect);

      // Switch to select mode
      setActiveMode(ELEMENT_TYPES.HYBRID);
      saveToHistory();
      // Ensure canvas is updated
      canvas.renderAll();
    } catch (error) {
      console.error('Error finishing rectangle drawing:', error);
    }
  };

  const startDrawingCircle = (canvas, opt) => {
    if (!canvas) return;

    try {
      const pointer = canvas.getPointer(opt.e);
      setIsDrawing(true);

      // Create new circle
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

      // Calculate radius
      const radius = Math.sqrt(
        Math.pow(pointer.x - startPoint.x, 2) +
        Math.pow(pointer.y - startPoint.y, 2)
      );

      // Update circle
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

      // Make circle interactive
      circle.set({
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        hoverCursor: 'move'
      });

      // Create new element
      const newElement = {
        id: Date.now(),
        type: 'circle',
        x: circle.left,
        y: circle.top,
        radius: circle.radius,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth
      };

      // Add element ID
      circle.set('elementId', newElement.id);

      // Update state
      setHallElements(prev => [...prev, newElement]);
      setSelectedElementId(newElement.id);
      setObjectCount(prev => prev + 1);

      // Clean up
      canvas._tempCircle = null;
      canvas._tempStartPoint = null;

      // Set this object as selected
      canvas.setActiveObject(circle);

      // Switch to select mode
      setActiveMode(ELEMENT_TYPES.HYBRID);
      saveToHistory();
      // Ensure canvas is updated
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

  // Add new text
  const addNewText = () => {
    if (!fabricCanvasRef.current) return;

    try {
      saveToHistory();
      const canvas = fabricCanvasRef.current;
      const center = canvas.getCenter();

      // Create new text element
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

      // Create element data
      const newElement = {
        id: text.elementId,
        type: 'text',
        text: 'Введите текст',
        x: center.left,
        y: center.top,
        fontSize: fontSize,
        fontFamily: 'Arial',
        fill: strokeColor
      };

      // Add to canvas and state
      canvas.add(text);
      canvas.setActiveObject(text);
      text.enterEditing();
      canvas.renderAll();

      setHallElements(prev => [...prev, newElement]);
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
      const center = canvas.getCenter();

      canvas.zoomToPoint({ x: center.left, y: center.top }, 1);
      setZoom(1);
    } catch (error) {
      console.error('Error resetting zoom:', error);
    }
  };

  // Delete selected object


  // Export/import functions
  const exportCanvasAsJSON = () => {
    if (!fabricCanvasRef.current) return null;

    try {
      const canvas = fabricCanvasRef.current;

      const exportData = {
        tables: tables.map(table => ({ ...table })),
        hallElements: hallElements.map(element => ({ ...element })),
        canvasData: {
          version: "1.0",
          zoom: zoom,
          width: canvas.width,
          height: canvas.height,
        }
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting canvas:', error);
      return null;
    }
  };

  const importCanvasFromJSON = (jsonString) => {
    try {
      const importData = JSON.parse(jsonString);

      if (!importData.tables || !importData.hallElements) {
        throw new Error('Invalid JSON format: missing required fields');
      }

      // Update state
      setTables(importData.tables);
      setHallElements(importData.hallElements);

      // Apply zoom
      if (importData.canvasData && importData.canvasData.zoom && fabricCanvasRef.current) {
        const canvas = fabricCanvasRef.current;
        const center = canvas.getCenter();

        setZoom(importData.canvasData.zoom);
        canvas.zoomToPoint({ x: center.left, y: center.top }, importData.canvasData.zoom);
      }

      // Render all elements
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
    getCanvas: () => fabricCanvasRef.current,
    undo,
    redo
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
          <button
            className="tool-btn"
            onClick={undo}
            title="Отмена (Ctrl+Z)"
            disabled={historyStack.length === 0}
          >
            <i className="fas fa-undo">↩️</i>
          </button>
          <button
            className="tool-btn"
            onClick={redo}
            title="Повтор (Ctrl+Shift+Z)"
            disabled={redoStack.length === 0}
          >
            <i className="fas fa-redo">↪️</i>
          </button>
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
              onClick={() => {
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
              title="Экспорт JSON"
            >
              <i className="fas fa-file-export">💾</i>
            </button>

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