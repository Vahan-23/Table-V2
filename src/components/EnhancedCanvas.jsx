import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import './EnhancedCanvas.css';
import { HallElementsManager, HallElementsCatalog } from './HallElements';
// import { DndProvider } from 'react-dnd';
// import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrop } from 'react-dnd';
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
  HALL_ELEMENT: 'HALL_ELEMENT',
  GROUP: 'GROUP' // ← ДОБАВИТЬ
};

const TableDropOverlay = ({
  table,
  fabricTable,
  style,
  people,
  setPeople,
  tables,
  setTables,
  canvas,
  onShowPeopleSelector,
  // ✅ ДОБАВЬТЕ ЭТОТ НОВЫЙ ПРОП
  onTableUpdate
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'GROUP',
    drop: (item, monitor) => {
      console.log('Group dropped on table:', table.id, item);

      // Убираем подсветку при drop
      if (fabricTable && canvas) {
        fabricTable.set({
          shadow: null
        });
        canvas.renderAll();
      }

      if (!item.group || !Array.isArray(item.group)) {
        console.error('Invalid group data:', item);
        return { success: false };
      }

      // Вычисляем количество свободных мест
      const occupiedSeats = table.people?.filter(Boolean).length || 0;
      const freeSeats = table.chairCount - occupiedSeats;

      if (freeSeats >= item.group.length) {
        // ДОСТАТОЧНО МЕСТ - РАЗМЕЩАЕМ ВСЮ ГРУППУ
        console.log('Placing full group on table:', table.id);

        // Создаем обновленные данные стола
        const newPeople = [...table.people];
        let groupIndex = 0;

        // Заполняем пустые места
        for (let i = 0; i < newPeople.length && groupIndex < item.group.length; i++) {
          if (!newPeople[i]) {
            newPeople[i] = item.group[groupIndex];
            groupIndex++;
          }
        }

        // Если остались люди, добавляем в конец
        while (groupIndex < item.group.length && newPeople.length < table.chairCount) {
          newPeople.push(item.group[groupIndex]);
          groupIndex++;
        }

        const updatedTable = { ...table, people: newPeople };

        // ✅ СНАЧАЛА ОБНОВЛЯЕМ ВИЗУАЛИЗАЦИЮ
        if (onTableUpdate) {
          onTableUpdate(table.id, updatedTable);
        }

        // ✅ ПОТОМ ОБНОВЛЯЕМ СОСТОЯНИЕ
        setTables(prevTables => {
          return prevTables.map(t =>
            t.id === table.id ? updatedTable : t
          );
        });

        // Удаляем людей из общего списка
        setPeople(prevPeople => {
          return prevPeople.filter(person =>
            !item.group.some(groupPerson => groupPerson.name === person.name)
          );
        });

        showTableTransferNotification(item.group[0]?.group || 'группа', table.id, item.group.length);

      } else if (freeSeats > 0) {
        // МАЛО МЕСТ - ПОКАЗЫВАЕМ СЕЛЕКТОР ЛЮДЕЙ
        if (onShowPeopleSelector) {
          onShowPeopleSelector({
            groupToPlace: {
              groupName: item.group[0]?.group || 'группа',
              people: item.group,
              sourceTableId: null
            },
            targetTableId: table.id,
            availableSeats: freeSeats
          });
        }
      } else {
        // НЕТ МЕСТ
        alert(`На столе ${table.id} нет свободных мест!`);
      }

      return { success: true, tableId: table.id };
    },
    hover: (item, monitor) => {
      if (fabricTable && canvas && monitor.isOver()) {
        fabricTable.set({
          shadow: {
            color: 'rgba(33, 150, 243, 0.8)',
            blur: 15,
            offsetX: 0,
            offsetY: 0
          }
        });
        canvas.renderAll();
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop()
    })
  });

  // Убираем подсветку когда hover заканчивается
  React.useEffect(() => {
    if (!isOver && fabricTable && canvas) {
      fabricTable.set({
        shadow: null
      });
      canvas.renderAll();
    }
  }, [isOver, fabricTable, canvas]);

  // Функция для показа уведомлений
  const showTableTransferNotification = (groupName, tableId, count) => {
    const notification = document.createElement('div');
    notification.className = 'transfer-notification';
    notification.textContent = `Группа ${groupName} (${count} чел.) размещена за столом ${tableId}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(33, 150, 243, 0.9);
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '1';
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
          if (notification.parentNode) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 2000);
    }, 100);
  };

  // Вычисляем количество свободных мест
  const occupiedSeats = table.people?.filter(Boolean).length || 0;
  const freeSeats = table.chairCount - occupiedSeats;

  return (
    <div
      ref={drop}
      style={{
        ...style,
        backgroundColor: isOver && canDrop ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
        border: isOver && canDrop ? '3px dashed #2196F3' : '3px dashed transparent',
        borderRadius: table.shape === 'round' ? '50%' : '8px',
        cursor: canDrop ? 'copy' : 'default',
        transition: 'all 0.2s ease',
        boxShadow: isOver && canDrop ? '0 0 20px rgba(33, 150, 243, 0.5)' : 'none'
      }}
      title={`Стол ${table.id} - ${occupiedSeats}/${table.chairCount} мест (свободно: ${freeSeats})`}
    >
      {isOver && canDrop && (
        <div style={{
          position: 'absolute',
          top: '-30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(33, 150, 243, 0.9)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          pointerEvents: 'none'
        }}>
          Свободно мест: {freeSeats}
        </div>
      )}
    </div>
  );
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
    canvasMode = 'tables',
    people = [],
    setPeople = () => { },
    draggingGroup = null,
    setDraggingGroup = () => { },
    chairCount = 12,
    PeopleSelector = null,
    onShowPeopleSelector = () => { },
    // ← ДОБАВИТЬ ЭТИ НОВЫЕ ПРОПСЫ
    viewMode = 'design', // ← НОВЫЙ ПРОПС: 'design' | 'seating'
    onViewModeChange = () => { }, // ← НОВЫЙ ПРОПС
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

  const [isTablesRendered, setIsTablesRendered] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [groupToPlace, setGroupToPlace] = useState(null);
  const [targetTableId, setTargetTableId] = useState(null);
  const [availableSeats, setAvailableSeats] = useState(0);
  const [groupSelectionActive, setGroupSelectionActive] = useState(false);


  const renderShape = (canvas, shape) => {
    if (!canvas || !shape) return null;

    try {
      let fabricObj;

      switch (shape.type) {
        case 'rect':
          // ✅ Прямоугольники работают правильно
          fabricObj = new fabric.Rect({
            left: shape.x || 0,
            top: shape.y || 0,
            width: shape.width || 100,
            height: shape.height || 50,
            fill: shape.fill || fillColor,
            stroke: shape.color || strokeColor,
            strokeWidth: shape.strokeWidth || strokeWidth,
            angle: shape.rotation || 0,
            elementId: shape.id,
            hasControls: true,
            hasBorders: true,
            selectable: true
          });
          break;

        case 'circle':
          // ✅ Круги работают правильно  
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
            angle: shape.rotation || 0,
            elementId: shape.id,
            hasControls: true,
            hasBorders: true,
            selectable: true,
            originX: 'center',
            originY: 'center'
          });
          break;

        case 'line':
          // ❌ ПРОБЛЕМА ЗДЕСЬ - неправильное создание линий
          if (shape.points && shape.points.length >= 4) {
            const [x1, y1, x2, y2] = shape.points;

            fabricObj = new fabric.Line([x1, y1, x2, y2], {
              stroke: shape.color || strokeColor,
              strokeWidth: shape.strokeWidth || strokeWidth,
              angle: shape.rotation || 0,
              elementId: shape.id,
              hasControls: true,
              hasBorders: true,
              selectable: true,
              originalX1: x1,
              originalY1: y1,
              originalX2: x2,
              originalY2: y2
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
            angle: shape.rotation || 0,
            elementId: shape.id,
            hasControls: true,
            hasBorders: true,
            selectable: true,
            originX: 'left',
            originY: 'top'
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
              angle: shape.rotation || 0,
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
            // ✅ ИСПРАВЛЕНО: Дублирование shape элемента в группе
            const originalShape = shapes.find(shape => shape.id === obj.elementId);
            if (originalShape) {
              const newShapeId = Date.now() + Math.floor(Math.random() * 1000);

              let newShape;

              // ✅ Для прямоугольников берем актуальные размеры
              if (originalShape.type === 'rect') {
                newShape = {
                  ...JSON.parse(JSON.stringify(originalShape)),
                  id: newShapeId,
                  x: objLeft + 10,
                  y: objTop + 10,
                  width: Math.round(obj.width * (obj.scaleX || 1)), // ✅ Актуальная ширина
                  height: Math.round(obj.height * (obj.scaleY || 1)), // ✅ Актуальная высота  
                  rotation: Math.round(obj.angle || 0)
                };
              } else if (originalShape.type === 'circle') {
                newShape = {
                  ...JSON.parse(JSON.stringify(originalShape)),
                  id: newShapeId,
                  x: objLeft + 10,
                  y: objTop + 10,
                  radius: Math.round(obj.radius * (obj.scaleX || 1)), // ✅ Актуальный радиус
                  rotation: Math.round(obj.angle || 0)
                };
              } else if (originalShape.type === 'line') {
                // Для линий обновляем координаты точек
                const deltaX = objLeft - originalShape.x;
                const deltaY = objTop - originalShape.y;

                newShape = {
                  ...JSON.parse(JSON.stringify(originalShape)),
                  id: newShapeId,
                  points: [
                    originalShape.points[0] + deltaX + 10,
                    originalShape.points[1] + deltaY + 10,
                    originalShape.points[2] + deltaX + 10,
                    originalShape.points[3] + deltaY + 10
                  ]
                };
              } else {
                // Для остальных элементов
                newShape = {
                  ...JSON.parse(JSON.stringify(originalShape)),
                  id: newShapeId,
                  x: objLeft + 10,
                  y: objTop + 10,
                  rotation: Math.round(obj.angle || 0)
                };
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
          // ✅ ИСПРАВЛЕНО: Дублирование shape элемента
          const originalShape = shapes.find(shape => shape.id === activeObject.elementId);
          if (!originalShape) return;

          const currentLeft = activeObject.left;
          const currentTop = activeObject.top;

          let newShape;

          // ✅ Для прямоугольников берем актуальные размеры
          if (originalShape.type === 'rect') {
            newShape = {
              ...JSON.parse(JSON.stringify(originalShape)),
              id: Date.now(),
              x: currentLeft + 10,
              y: currentTop + 10,
              width: Math.round(activeObject.width * (activeObject.scaleX || 1)), // ✅ Актуальная ширина
              height: Math.round(activeObject.height * (activeObject.scaleY || 1)), // ✅ Актуальная высота
              rotation: Math.round(activeObject.angle || 0) // ✅ Актуальный поворот
            };
          } else if (originalShape.type === 'circle') {
            newShape = {
              ...JSON.parse(JSON.stringify(originalShape)),
              id: Date.now(),
              x: currentLeft + 10,
              y: currentTop + 10,
              radius: Math.round(activeObject.radius * (activeObject.scaleX || 1)), // ✅ Актуальный радиус
              rotation: Math.round(activeObject.angle || 0)
            };
          } else if (originalShape.type === 'line') {
            // Для линий обновляем координаты точек
            const deltaX = currentLeft - originalShape.x;
            const deltaY = currentTop - originalShape.y;

            newShape = {
              ...JSON.parse(JSON.stringify(originalShape)),
              id: Date.now(),
              points: [
                originalShape.points[0] + deltaX + 10,
                originalShape.points[1] + deltaY + 10,
                originalShape.points[2] + deltaX + 10,
                originalShape.points[3] + deltaY + 10
              ]
            };
          } else if (originalShape.type === 'text') {
            newShape = {
              ...JSON.parse(JSON.stringify(originalShape)),
              id: Date.now(),
              x: currentLeft + 10,
              y: currentTop + 10,
              fontSize: Math.round(activeObject.fontSize * (activeObject.scaleX || 1)), // ✅ Актуальный размер шрифта
              text: activeObject.text || originalShape.text, // ✅ Актуальный текст
              rotation: Math.round(activeObject.angle || 0)
            };
          } else {
            // Для остальных элементов
            newShape = {
              ...JSON.parse(JSON.stringify(originalShape)),
              id: Date.now(),
              x: currentLeft + 10,
              y: currentTop + 10,
              rotation: Math.round(activeObject.angle || 0)
            };
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

      // Object moving - ПОЛНАЯ ВЕРСИЯ
      canvas.on('object:moving', (e) => {
        if (!e.target) return;

        const obj = e.target;
        setUnsavedChanges(true);

        if (obj.tableId) {
          // Обработка столов
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
            // ✅ ИСПРАВЛЕНО: Правильное движение линий
            const originalPoints = [
              obj.originalX1 !== undefined ? obj.originalX1 : shape.points[0],
              obj.originalY1 !== undefined ? obj.originalY1 : shape.points[1],
              obj.originalX2 !== undefined ? obj.originalX2 : shape.points[2],
              obj.originalY2 !== undefined ? obj.originalY2 : shape.points[3]
            ];

            // Вычисляем смещение от исходной позиции
            const deltaX = obj.left - originalPoints[0];
            const deltaY = obj.top - originalPoints[1];

            // Новые абсолютные координаты всех точек линии
            const newPoints = [
              originalPoints[0] + deltaX,
              originalPoints[1] + deltaY,
              originalPoints[2] + deltaX,
              originalPoints[3] + deltaY
            ];

            setShapes(prevShapes => prevShapes.map(s =>
              s.id === obj.elementId
                ? { ...s, points: newPoints.map(p => Math.round(p)) }
                : s
            ));

            // Обновляем сохраненные координаты в объекте
            obj.originalX1 = newPoints[0];
            obj.originalY1 = newPoints[1];
            obj.originalX2 = newPoints[2];
            obj.originalY2 = newPoints[3];

          } else if (shape && shape.type === 'circle') {
            // Обработка кругов (left/top для кругов это центр)
            const radius = shape.radius || 50;
            const newX = Math.round(obj.left - radius);
            const newY = Math.round(obj.top - radius);

            setShapes(prevShapes => prevShapes.map(s =>
              s.id === obj.elementId
                ? {
                  ...s,
                  x: newX,
                  y: newY,
                  centerX: Math.round(obj.left),
                  centerY: Math.round(obj.top)
                }
                : s
            ));

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

          } else if (shape && shape.type === 'text') {
            // ✅ ИСПРАВЛЕНО: Правильное движение текста
            console.log('Moving text to:', obj.left, obj.top); // Для отладки

            setShapes(prevShapes => prevShapes.map(s =>
              s.id === obj.elementId
                ? {
                  ...s,
                  x: Math.round(obj.left),
                  y: Math.round(obj.top)
                }
                : s
            ));

          } else if (shape && shape.type === 'path') {
            // Обработка path объектов
            setShapes(prevShapes => prevShapes.map(s =>
              s.id === obj.elementId
                ? {
                  ...s,
                  x: Math.round(obj.left),
                  y: Math.round(obj.top)
                }
                : s
            ));

          } else {
            // Остальные элементы (общий случай)
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

          } else if (obj.type === 'line') {
            // ✅ ИСПРАВЛЕНО: Обработка изменения линий
            const currentPoints = [
              obj.originalX1 !== undefined ? obj.originalX1 : obj.x1,
              obj.originalY1 !== undefined ? obj.originalY1 : obj.y1,
              obj.originalX2 !== undefined ? obj.originalX2 : obj.x2,
              obj.originalY2 !== undefined ? obj.originalY2 : obj.y2
            ];

            setShapes(prevShapes => prevShapes.map(s =>
              s.id === obj.elementId
                ? {
                  ...s,
                  points: currentPoints.map(p => Math.round(p)),
                  rotation: Math.round(obj.angle || 0)
                }
                : s
            ));

            // Обновляем сохраненную позицию
            obj.originalLeft = obj.left;
            obj.originalTop = obj.top;

          } else if (obj.type === 'i-text') {
            // ✅ ИСПРАВЛЕНО: Правильная обработка изменения текста
            const newFontSize = Math.round(obj.fontSize * (obj.scaleX || 1));

            setShapes(prevShapes => prevShapes.map(s =>
              s.id === obj.elementId
                ? {
                  ...s,
                  fontSize: newFontSize,
                  x: Math.round(obj.left),
                  y: Math.round(obj.top),
                  text: obj.text || s.text,
                  rotation: Math.round(obj.angle || 0)
                }
                : s
            ));

            // ✅ Сбрасываем масштаб после применения к размеру шрифта
            obj.set({
              fontSize: newFontSize,
              scaleX: 1,
              scaleY: 1
            });

          } else if (obj.type === 'path') {
            // ✅ Обработка path объектов
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

      // Object scaling
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
          } else if (obj.type === 'circle') {
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
                  text: obj.text || s.text, // ✅ Обновляем текст
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

      // ✅ ДОБАВЛЕНО: Обработчик изменения текста
      canvas.on('text:changed', (e) => {
        if (!e.target || !e.target.elementId) return;

        const obj = e.target;
        console.log('Text changed:', obj.text, 'at position:', obj.left, obj.top);

        setShapes(prevShapes => prevShapes.map(s =>
          s.id === obj.elementId
            ? {
              ...s,
              text: obj.text,
              x: Math.round(obj.left),
              y: Math.round(obj.top)
            }
            : s
        ));

        setUnsavedChanges(true);
      });

      // ✅ ДОБАВЛЕНО: Обработчик окончания редактирования текста
      canvas.on('text:editing:exited', (e) => {
        if (!e.target || !e.target.elementId) return;

        const obj = e.target;
        console.log('Text editing exited:', obj.text);

        setShapes(prevShapes => prevShapes.map(s =>
          s.id === obj.elementId
            ? {
              ...s,
              text: obj.text,
              x: Math.round(obj.left),
              y: Math.round(obj.top)
            }
            : s
        ));

        setUnsavedChanges(true);
        saveToHistory();
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
      // Очищаем существующие обработчики
      canvas.off('mouse:down');
      canvas.off('mouse:move');
      canvas.off('mouse:up');

      // ✅ ИСПРАВЛЕНО: Правильная привязка событий
      canvas.on('mouse:down', (opt) => {
        console.log('Mouse down at:', canvas.getPointer(opt.e)); // Для отладки

        if (activeMode === ELEMENT_TYPES.LINE) {
          startDrawingLine(canvas, opt);
          saveToHistory();
        } else if (activeMode === ELEMENT_TYPES.RECTANGLE) {
          startDrawingRectangle(canvas, opt);
        } else if (activeMode === ELEMENT_TYPES.CIRCLE) {
          startDrawingCircle(canvas, opt);
        }
      });

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
// Set up hybrid mode

const applyModeSettings = (targetMode) => {
  const canvas = fabricCanvasRef.current;
  if (!canvas) return;

  console.log(`🔄 Applying ${targetMode} mode settings`);
  
  // 1. Принудительно снимаем выделение
  canvas.discardActiveObject();
  setSelectedObject(null);
  setSelectedElementId(null);
  
  // 2. Настраиваем обработчики для нового режима
  setupHybridMode(canvas);
  
  // 3. Применяем настройки ко всем объектам
  applyObjectSettings(canvas, targetMode);
  
  // 4. Обновляем столы для нового режима  
  forceUpdateAllTablesForMode(targetMode);
  
  // 5. Финальное применение настроек после обновления столов
  setTimeout(() => {
    // Повторно применяем настройки объектов после обновления столов
    applyObjectSettings(canvas, targetMode);
    canvas.renderAll();
    
    // ✅ НОВОЕ РЕШЕНИЕ: Принудительно переустанавливаем обработчики выделения для дизайна
    if (targetMode === 'design') {
      console.log('🔧 Force reinstalling selection handlers for design mode...');
      
      // Убеждаемся что selection включен
      canvas.selection = true;
      canvas.defaultCursor = 'default';
      
      // Принудительно удаляем и переустанавливаем обработчики выделения
      canvas.off('selection:created');
      canvas.off('selection:cleared');
      
      // Переустанавливаем обработчики выделения
      canvas.on('selection:created', (e) => {
        console.log('🎯 FORCED Selection created:', e.selected?.length || 0);
        
        if (!e.selected || e.selected.length === 0) return;
        const obj = e.selected[0];
        
        if (obj.gridLine) {
          canvas.discardActiveObject();
          canvas.renderAll();
          return;
        }
        
        setSelectedObject(obj);
        
        if (obj.elementId) {
          console.log(`✅ FORCED Setting selectedElementId to: ${obj.elementId}`);
          setSelectedElementId(obj.elementId);
        } else if (obj.tableId && onTableSelect) {
          onTableSelect(obj.tableId, 'design-select');
        }
        
        canvas.renderAll();
      });

      canvas.on('selection:cleared', () => {
        console.log('🔄 FORCED Selection cleared');
        setSelectedObject(null);
        setSelectedElementId(null);
      });
      
      // Дополнительно: принудительно обновляем target finding
      canvas._setupCurrentTransform = fabric.Canvas.prototype._setupCurrentTransform;
      canvas.findTarget = fabric.Canvas.prototype.findTarget;
      
      console.log('✅ Selection handlers forcefully reinstalled!');
    }
  }, 100);
  
  console.log(`✅ ${targetMode} mode applied successfully`);
};

const forceCanvasReload = () => {
  if (viewMode === 'design') {
    console.log('🔄 Force reloading canvas for design mode...');
    
    // Сохраняем данные
    const currentTables = [...tables];
    const currentShapes = [...shapes];
    
    // Пересоздаем canvas
    setTimeout(() => {
      initializeCanvas();
      
      // Восстанавливаем данные
      setTimeout(() => {
        renderAllElements(fabricCanvasRef.current, currentTables, currentShapes);
        applyObjectSettings(fabricCanvasRef.current, 'design');
      }, 200);
    }, 100);
  }
};

const applyObjectSettings = (canvas, targetMode) => {
  if (!canvas) return;

  console.log(`🔧 Applying ${targetMode} object settings to all objects...`);
  
  // Получаем все объекты на холсте
  const allObjects = canvas.getObjects();
  console.log(`Found ${allObjects.length} total objects on canvas`);
  
  if (targetMode === 'seating') {
    console.log('🔒 Applying SEATING restrictions to objects');
    
    // Принудительно снимаем выделение
    canvas.discardActiveObject();
    canvas.selection = false;
    
    // Настраиваем все объекты для режима рассадки
    allObjects.forEach((obj, index) => {
      if (obj.gridLine) {
        // Сетка остается неинтерактивной
        return;
      } else if (obj.tableId) {
        // ✅ СТОЛЫ: Блокируем редактирование, разрешаем клики
        console.log(`🔒 Setting table ${obj.tableId} for seating mode`);
        obj.set({
          selectable: false,
          evented: true,
          hasControls: false,
          hasBorders: false,
          lockMovementX: true,
          lockMovementY: true,
          lockScalingX: true,
          lockScalingY: true,
          lockRotation: true,
          hoverCursor: 'pointer'
        });
        
        // ✅ ВАЖНО: Блокируем объекты внутри группы столов
        if (obj.getObjects) {
          obj.getObjects().forEach(groupObj => {
            if (groupObj.chairIndex !== undefined) {
              // Стулья остаются кликабельными
              groupObj.set({
                selectable: false,
                evented: true,
                hoverCursor: 'pointer'
              });
            } else {
              // Остальные части стола не интерактивны
              groupObj.set({
                selectable: false,
                evented: false
              });
            }
          });
        }
      } else if (obj.elementId) {
        // ✅ SHAPES: Полностью блокируем
        console.log(`🔒 Blocking shape ${obj.elementId} (${obj.type}) for seating mode`);
        obj.set({
          selectable: false,
          evented: false,
          hasControls: false,
          hasBorders: false,
          lockMovementX: true,
          lockMovementY: true,
          lockScalingX: true,
          lockScalingY: true,
          lockRotation: true
        });
      } else {
        // ✅ Остальные объекты
        console.log(`🔒 Blocking other object (${obj.type}) for seating mode`);
        obj.set({
          selectable: false,
          evented: false,
          hasControls: false,
          hasBorders: false,
          lockMovementX: true,
          lockMovementY: true,
          lockScalingX: true,
          lockScalingY: true,
          lockRotation: true
        });
      }
    });
    
  } else if (targetMode === 'design') {
    console.log('🔓 Applying DESIGN permissions to objects');
    
    canvas.selection = true;
    
    // ✅ ПРИНУДИТЕЛЬНО разблокируем все объекты для редактирования
    allObjects.forEach((obj, index) => {
      if (obj.gridLine) {
        // Сетка остается неинтерактивной
        obj.set({
          selectable: false,
          evented: false,
          hasControls: false,
          hasBorders: false
        });
        return;
      } else {
        // ✅ ВСЕ ОСТАЛЬНЫЕ ОБЪЕКТЫ: Полное редактирование
        const objType = obj.tableId ? `table-${obj.tableId}` : 
                       obj.elementId ? `shape-${obj.elementId}` : 
                       `other-${obj.type}`;
        
        console.log(`🔓 Unlocking object [${index}]: ${objType} (${obj.type})`);
        
        obj.set({
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          lockMovementX: false,
          lockMovementY: false,
          lockScalingX: false,
          lockScalingY: false,
          lockRotation: false,
          hoverCursor: 'move'
        });
        
        // ✅ ПРИНУДИТЕЛЬНО разблокируем объекты внутри групп
        if (obj.getObjects) {
          const groupObjects = obj.getObjects();
          console.log(`🔓 Unlocking ${groupObjects.length} objects inside group ${objType}`);
          groupObjects.forEach((groupObj, groupIndex) => {
            groupObj.set({
              selectable: true,
              evented: true,
              hasControls: true,
              hasBorders: true,
              lockMovementX: false,
              lockMovementY: false,
              lockScalingX: false,
              lockScalingY: false,
              lockRotation: false,
              hoverCursor: 'move'
            });
          });
        }
      }
    });
  }
  
  canvas.renderAll();
  console.log(`✅ ${targetMode} object settings applied to ${allObjects.length} objects successfully`);
};
const setupHybridMode = (canvas) => {
  console.log('Setting up hybrid mode for viewMode:', viewMode);
  canvas.isDrawingMode = false;
  setIsDrawing(false);

  // ✅ УПРОЩЕНО: Только основная очистка
  canvas.discardActiveObject();
  setSelectedObject(null);
  setSelectedElementId(null);

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
    canvas._hybridHandlers = null;
  }

  // ✅ УПРОЩЕНО: Убираем специфичные настройки объектов отсюда
  // Настройки объектов теперь применяются в applyModeSettings
  
  if (viewMode === 'seating') {
    setupSeatingModeHandlers(canvas);
  } else {
    setupDesignModeHandlers(canvas);
  }
};

// ✅ НОВАЯ ФУНКЦИЯ: Обработчики для режима рассадки
const setupSeatingModeHandlers = (canvas) => {
  console.log('Setting up SEATING mode handlers');
  
  canvas.selection = false;
  canvas.defaultCursor = 'default';
  
  // Панорамирование
  let isSpacePressed = false;
  let isDraggingCanvas = false;

  const handleKeyDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
      return;
    }
    if (e.key === ' ' && !isSpacePressed) {
      isSpacePressed = true;
      canvas.defaultCursor = 'grab';
      e.preventDefault();
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === ' ' && isSpacePressed) {
      isSpacePressed = false;
      canvas.defaultCursor = 'default';
    }
  };

  const handleMouseDown = (opt) => {
    const evt = opt.e;
    if (isSpacePressed || evt.buttons === 2) {
      isDraggingCanvas = true;
      canvas.lastPosX = evt.clientX;
      canvas.lastPosY = evt.clientY;
      canvas.isDragging = true;
      canvas.defaultCursor = 'grabbing';
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
    }
  };

  const preventContextMenu = (evt) => {
    if (evt.e && (isDraggingCanvas || evt.e.buttons === 2)) {
      evt.e.preventDefault();
      return false;
    }
  };

  // ✅ БЛОКИРОВКА ВЫДЕЛЕНИЯ в режиме рассадки
  const blockSelection = () => {
    console.log('Blocking selection in seating mode');
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  // Добавляем обработчики
  canvas.on('mouse:down', handleMouseDown);
  canvas.on('mouse:move', handleMouseMove);
  canvas.on('mouse:up', handleMouseUp);
  canvas.on('contextmenu', preventContextMenu);
  canvas.on('mouse:wheel', handleMouseWheel);
  canvas.on('selection:created', blockSelection);
  canvas.on('selection:updated', blockSelection);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  canvas._hybridHandlers = {
    mouseDown: handleMouseDown,
    mouseMove: handleMouseMove,
    mouseUp: handleMouseUp,
    keyDown: handleKeyDown,
    keyUp: handleKeyUp,
    contextMenu: preventContextMenu,
    blockSelection: blockSelection
  };
};

// ✅ НОВАЯ ФУНКЦИЯ: Обработчики для режима дизайна  
const setupDesignModeHandlers = (canvas) => {
  console.log('🎨 Setting up DESIGN mode handlers');
  
  canvas.selection = true;
  canvas.defaultCursor = 'default';

  // ✅ Обработчики выделения объектов (только для дизайна)
  canvas.on('selection:created', (e) => {
    console.log('🎯 Selection created in design mode:', e.selected?.length || 0, 'objects');
    
    if (!e.selected || e.selected.length === 0) return;
    const obj = e.selected[0];
    
    console.log('🎯 Selected object:', {
      type: obj.type,
      tableId: obj.tableId,
      elementId: obj.elementId,
      gridLine: obj.gridLine,
      selectable: obj.selectable,
      evented: obj.evented
    });
    
    if (obj.gridLine) {
      console.log('🚫 Grid line selected, discarding...');
      canvas.discardActiveObject();
      canvas.renderAll();
      return;
    }
    
    setSelectedObject(obj);
    
    if (obj.elementId) {
      console.log(`✅ Setting selectedElementId to: ${obj.elementId}`);
      setSelectedElementId(obj.elementId);
      
      // Убеждаемся что объект интерактивный
      obj.set({
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true
      });
    } else if (obj.tableId && onTableSelect) {
      console.log(`🏠 Table selected: ${obj.tableId}`);
      onTableSelect(obj.tableId, 'design-select');
    }
    
    canvas.renderAll();
  });

  canvas.on('selection:cleared', () => {
    console.log('🔄 Selection cleared in design mode');
    setSelectedObject(null);
    setSelectedElementId(null);
  });

  // Проверяем что объекты доступны для выделения
  setTimeout(() => {
    const selectableObjects = canvas.getObjects().filter(obj => 
      !obj.gridLine && obj.selectable
    );
    console.log(`🎯 ${selectableObjects.length} objects are selectable in design mode`);
    
    if (selectableObjects.length === 0) {
      console.log('⚠️ No selectable objects found! Forcing object settings update...');
      applyObjectSettings(canvas, 'design');
    }
  }, 200);

  // Панорамирование с пробелом (код аналогичен режиму рассадки, но с выделением)
  let isSpacePressed = false;
  let isDraggingCanvas = false;

  const handleKeyDown = (e) => {
    // ✅ Проверяем, редактируется ли текст
    const activeObject = canvas.getActiveObject();
    const isEditingText = activeObject && 
      activeObject.type === 'i-text' && 
      activeObject.isEditing;

    if (isEditingText) {
      return; // Позволяем тексту обработать пробел
    }

    // ✅ Также проверяем фокус на input элементах
    if (e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.contentEditable === 'true') {
      return;
    }

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
    // ✅ Также проверяем редактирование текста при отпускании
    const activeObject = canvas.getActiveObject();
    const isEditingText = activeObject &&
      activeObject.type === 'i-text' &&
      activeObject.isEditing;

    if (isEditingText) {
      return;
    }

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

  // Add handlers for design mode
  canvas.on('mouse:down', handleMouseDown);
  canvas.on('mouse:move', handleMouseMove);
  canvas.on('mouse:up', handleMouseUp);
  canvas.on('contextmenu', preventContextMenu);
  canvas.on('mouse:wheel', handleMouseWheel);
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

const debugObjectStates = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    console.log('🔍 DEBUGGING OBJECT STATES:');
    console.log(`Canvas selection enabled: ${canvas.selection}`);
    console.log(`Current viewMode: ${viewMode}`);
    console.log(`Current activeMode: ${activeMode}`);
    
    const objects = canvas.getObjects();
    console.log(`Total objects on canvas: ${objects.length}`);
    
    objects.forEach((obj, index) => {
      if (obj.gridLine) return;
      
      const info = {
        index,
        type: obj.type,
        tableId: obj.tableId || 'none',
        elementId: obj.elementId || 'none',
        selectable: obj.selectable,
        evented: obj.evented,
        hasControls: obj.hasControls,
        hasBorders: obj.hasBorders,
        lockMovementX: obj.lockMovementX,
        lockMovementY: obj.lockMovementY
      };
      
      console.log(`Object [${index}]:`, info);
    });
  };

  // ✅ ВРЕМЕННАЯ КНОПКА ДЛЯ ОТЛАДКИ - можно удалить позже
  if (process.env.NODE_ENV === 'development') {
    window.debugObjectStates = debugObjectStates;
    window.applyDesignMode = () => applyObjectSettings(fabricCanvasRef.current, 'design');
    window.applySeatingMode = () => applyObjectSettings(fabricCanvasRef.current, 'seating');
  }

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
  const renderAllElements = useCallback((canvas, forceTables = null, forceShapes = null) => {
    if (!canvas) return;

    try {
      console.log('Rendering all elements...');

      // Используем переданные данные или текущее состояние
      const tablesToRender = forceTables || tables;
      const shapesToRender = forceShapes || shapes;

      console.log('Data to render:', {
        tables: tablesToRender?.length || 0,
        shapes: shapesToRender?.length || 0
      });

      // Мапа текущих объектов на холсте
      const currentObjects = new Map();
      canvas.getObjects().forEach(obj => {
        if (obj.tableId) currentObjects.set(`table_${obj.tableId}`, obj);
        else if (obj.elementId) currentObjects.set(`shape_${obj.elementId}`, obj);
        // Игнорируем объекты сетки при создании мапы
      });

      // Обновляем столы
      if (tablesToRender && Array.isArray(tablesToRender)) {
        tablesToRender.forEach(table => {
          const key = `table_${table.id}`;
          const existing = currentObjects.get(key);
          if (!existing) {
            try {
              renderTable(canvas, table);
              console.log(`Rendered table ${table.id}`);
            } catch (error) {
              console.error(`Error rendering table ${table.id}:`, error);
            }
          }
          currentObjects.delete(key);
        });
      }

      // Обновляем shapes
      if (shapesToRender && Array.isArray(shapesToRender)) {
        shapesToRender.forEach(shape => {
          const key = `shape_${shape.id}`;
          const existing = currentObjects.get(key);
          if (!existing) {
            try {
              renderShape(canvas, shape);
              console.log(`Rendered shape ${shape.id} (${shape.type})`);
            } catch (error) {
              console.error(`Error rendering shape ${shape.id}:`, error);
            }
          }
          currentObjects.delete(key);
        });
      }

      // Удаляем объекты, которых больше нет в состоянии
      // ВАЖНО: не удаляем объекты сетки
      currentObjects.forEach(obj => {
        if (!obj.gridLine) {
          console.log(`Removing orphaned object:`, obj.type, obj.tableId || obj.elementId);
          canvas.remove(obj);
        }
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

      // Подсчитываем объекты для проверки
      const renderedObjects = canvas.getObjects().filter(obj => !obj.gridLine);
      console.log(`Rendering complete. Objects on canvas: ${renderedObjects.length}`);

    } catch (error) {
      console.error('Error rendering elements:', error);
    }
}, [tables, shapes, viewMode]);

  // Render table
 const renderTable = (canvas, tableData, currentViewMode = viewMode, chairClickHandler = onChairClick) => {
    if (!canvas || !tableData) return null;

    console.log(`🏠 Rendering table ${tableData.id} for mode: ${currentViewMode}`);

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
  subTargetCheck: true,  // ✅ ВАЖНО: позволяет кликать по объектам внутри группы
  interactive: true,     // ✅ ВАЖНО: группа интерактивна
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
       addChairsToRoundTable(canvas, tableGroup, tableData, currentViewMode, onChairClick);
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
       addChairsToRectangleTable(canvas, tableGroup, tableData, currentViewMode, onChairClick);

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
    addTableControlButtons(canvas, tableGroup, tableData, isRound, currentViewMode);

      // Add event handlers
      tableGroup.on('selected', () => {
  if (currentViewMode === 'seating') {
    // В режиме рассадки - показываем детали стола для работы с рассадкой
    if (onTableSelect) {
      onTableSelect(tableData.id, 'seating-details', {
        tableData: tableData,
        occupiedSeats: tableData.people?.filter(Boolean).length || 0,
        freeSeats: tableData.chairCount - (tableData.people?.filter(Boolean).length || 0),
        people: tableData.people || []
      });
    }
 } else if (currentViewMode === 'design') {
    // В режиме дизайна - обычное выделение для редактирования свойств стола
    if (onTableSelect) {
      onTableSelect(tableData.id, 'design-edit', {
        tableData: tableData
      });
    }
  }
});
tableGroup.on('mousedblclick', () => {
  if (currentViewMode === 'seating') {
    // Двойной клик в режиме рассадки - быстрое открытие деталей
    if (onTableSelect) {
      onTableSelect(tableData.id, 'seating-quick-edit', {
        tableData: tableData,
        occupiedSeats: tableData.people?.filter(Boolean).length || 0,
        freeSeats: tableData.chairCount - (tableData.people?.filter(Boolean).length || 0),
        people: tableData.people || []
      });
    }
  } else if (currentViewMode === 'design') {
    // Двойной клик в режиме дизайна - быстрое редактирование свойств
    if (onTableSelect) {
      onTableSelect(tableData.id, 'design-quick-edit', {
        tableData: tableData
      });
    }
  }
});

    canvas.add(tableGroup);

// ✅ ИСПРАВЛЕНО: Применяем настройки в зависимости от текущего режима
if (viewMode === 'seating') {
  // В режиме рассадки настраиваем стол для кликабельности без редактирования
  tableGroup.set({
    selectable: false,      // Не выделяется для редактирования
    evented: true,          // ✅ Остается интерактивным для кликов
    hasControls: false,     // Нет контролов изменения размера
    hasBorders: false,      // Нет рамок выделения  
    lockMovementX: true,    // Заблокировано перемещение
    lockMovementY: true,
    lockScalingX: true,     // Заблокировано изменение размера
    lockScalingY: true,
    lockRotation: true,     // Заблокирован поворот
    hoverCursor: 'pointer', // ✅ Указатель при наведении
    subTargetCheck: true,   // ✅ ВАЖНО: позволяет кликать по стульям внутри
    interactive: true       // ✅ ВАЖНО: группа остается интерактивной
  });

  // ✅ Настраиваем стулья для кликабельности
  tableGroup.forEachObject && tableGroup.forEachObject(obj => {
    if (obj.chairIndex !== undefined) {
      obj.set({
        selectable: false,
        evented: true,  // ✅ Стулья кликабельны
        hoverCursor: 'pointer'
      });
    }
  });
}

return tableGroup;
    } catch (error) {
      console.error('Error rendering table:', error);
      return null;
    }
  };

  const forceUpdateSpecificTable = (tableId, updatedTable) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    console.log('Force updating table:', tableId);

    // Находим Fabric.js группу, соответствующую столу
    const tableGroup = canvas.getObjects().find(obj => obj.tableId === tableId);
    if (tableGroup) {
      // Сохраняем текущую позицию и поворот
      const currentLeft = tableGroup.left;
      const currentTop = tableGroup.top;
      const currentAngle = tableGroup.angle || 0;
      const currentHeight = tableGroup.height;
      const currentWidth = tableGroup.width;
      const currentZoomX = tableGroup.zoomX;
      const currentZoomY = tableGroup.zoomY;
      const currentScaleX = tableGroup.scaleX;
      const currentScaleY = tableGroup.scaleY;

      // Удаляем старую группу
      canvas.remove(tableGroup);

      // Рендерим обновленный стол с сохранением позиции
      const newTableObj = renderTable(canvas, updatedTable);
      console.log("newTab", newTableObj);
     if (newTableObj) {
  newTableObj.set({
    left: currentLeft,
    top: currentTop,
    angle: currentAngle,
    height: currentHeight,
    width: currentWidth,
    scaleX: currentScaleX,
    scaleY: currentScaleY,
    zoomX: currentZoomX,
    zoomY: currentZoomY,
  });
  newTableObj.setCoords();

  // ✅ ИСПРАВЛЕНО: Восстанавливаем настройки для текущего режима
   if (viewMode === 'seating') {
    // Применяем настройки режима рассадки к обновленному столу
    newTableObj.set({
      selectable: false,      // Не выделяется для редактирования
      evented: true,          // ✅ Остается интерактивным для кликов
      hasControls: false,     // Нет контролов изменения размера
      hasBorders: false,      // Нет рамок выделения  
      lockMovementX: true,    // Заблокировано перемещение
      lockMovementY: true,
      lockScalingX: true,     // Заблокировано изменение размера
      lockScalingY: true,
      lockRotation: true,     // Заблокирован поворот
      hoverCursor: 'pointer', // ✅ Указатель при наведении
      subTargetCheck: true,   // ✅ ВАЖНО: позволяет кликать по стульям
      interactive: true       // ✅ ВАЖНО: группа интерактивна
    });

    // ✅ Также применяем настройки к стульям внутри группы
      newTableObj.forEachObject && newTableObj.forEachObject(obj => {
      if (obj.chairIndex !== undefined) {
        obj.set({
          selectable: false,
          evented: true,  // ✅ Стулья тоже должны быть кликабельными
          hoverCursor: 'pointer'
        });
      }
    });
  } else if (viewMode === 'design') {
    // В режиме дизайна столы должны быть редактируемыми
    newTableObj.set({
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
      lockMovementX: false,
      lockMovementY: false,
      lockScalingX: false,
      lockScalingY: false,
      lockRotation: false,
      hoverCursor: 'move',
      subTargetCheck: true,
      interactive: true
    });
  }
}

      // Перерисовываем холст
      canvas.renderAll();
    }
  };

  const updateTableVisual = (tableData) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !tableData) return;

    // Находим объект стола на canvas
    const fabricTable = canvas.getObjects().find(obj => obj.tableId === tableData.id);
    if (!fabricTable) return;

    console.log('Updating table visual for:', tableData.id, 'with people:', tableData.people);

    // Сохраняем текущую позицию и поворот
    const currentLeft = fabricTable.left;
    const currentTop = fabricTable.top;
    const currentAngle = fabricTable.angle || 0;

    // Удаляем старый стол
    canvas.remove(fabricTable);

    // Создаем обновленный стол с новыми данными
    const newTableObj = renderTable(canvas, {
      ...tableData,
      x: currentLeft,
      y: currentTop,
      rotation: currentAngle
    });

    if (newTableObj) {
      // Устанавливаем точную позицию
      newTableObj.set({
        left: currentLeft,
        top: currentTop,
        angle: currentAngle
      });
      newTableObj.setCoords();
    }

    canvas.renderAll();
  };

  // Add chairs to round table
const addChairsToRoundTable = (canvas, tableGroup, tableData, currentViewMode, chairClickHandler) => {
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
          hoverCursor: currentViewMode === 'seating' ? 'pointer' : 'move',
          selectable: false
        });

        chair.set('angle', (angle * 180 / Math.PI) + 90);

        // ✅ ИСПРАВЛЕНО: Убираем клики по стульям в режиме дизайна
        chair.set({
          selectable: false,
          evented: currentViewMode === 'seating', // ✅ События только в режиме рассадки
          hoverCursor: currentViewMode === 'seating' ? 'pointer' : 'default'
        });

        // Добавляем обработчик только для режима рассадки
        if (currentViewMode === 'seating') {
          chair.on('mousedown', (e) => {
            if (e.e) e.e.stopPropagation();
            
            console.log('Chair clicked in SEATING mode:', tableData.id, i);
            if (chairClickHandler) {
              chairClickHandler(tableData.id, i);
            }
          });
        }

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
            padding: 3,
            selectable: false,
            evented: false
          });

          tableGroup.addWithUpdate(nameLabel);
        }
      }
    } catch (error) {
      console.error('Error adding chairs to round table:', error);
    }
  };

  // Add chairs to rectangle table
const addChairsToRectangleTable = (canvas, tableGroup, tableData, currentViewMode, chairClickHandler) => {
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
          hoverCursor: currentViewMode === 'seating' ? 'pointer' : 'default',
          selectable: false
        });

        // ✅ ИСПРАВЛЕНО: Убираем клики по стульям в режиме дизайна
        chair.set({
          selectable: false,
          evented: currentViewMode === 'seating', // ✅ События только в режиме рассадки
          hoverCursor: currentViewMode === 'seating' ? 'pointer' : 'default'
        });

        // Добавляем обработчик только для режима рассадки
        if (currentViewMode === 'seating') {
          chair.on('mousedown', (e) => {
            if (e.e) e.e.stopPropagation();
            
            console.log('Chair clicked in SEATING mode:', tableData.id, currentChairIndex);
            if (chairClickHandler) {
              chairClickHandler(tableData.id, currentChairIndex);
            }
          });
        }

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
            padding: 3,
            selectable: false,
            evented: false
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
          hoverCursor: currentViewMode === 'seating' ? 'pointer' : 'default',
          selectable: false
        });

        // ✅ ИСПРАВЛЕНО: Убираем клики по стульям в режиме дизайна
        chair.set({
          angle: 180,
          selectable: false,
          evented: currentViewMode === 'seating', // ✅ События только в режиме рассадки
          hoverCursor: currentViewMode === 'seating' ? 'pointer' : 'default'
        });

        // Добавляем обработчик только для режима рассадки
        if (currentViewMode === 'seating') {
          chair.on('mousedown', (e) => {
            if (e.e) e.e.stopPropagation();
            
            console.log('Chair clicked in SEATING mode:', tableData.id, currentChairIndex);
            if (chairClickHandler) {
              chairClickHandler(tableData.id, currentChairIndex);
            }
          });
        }

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
            padding: 3,
            selectable: false,
            evented: false
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
 const addTableControlButtons = (canvas, tableGroup, tableData, isRound, currentViewMode = viewMode) => {
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
  
  if (currentViewMode === 'design') {
    // Удаление разрешено только в режиме дизайна
    setDeleteConfirmation({
      tableId: tableData.id,
      tableName: tableData.name || `Стол ${tableData.id}`,
      tableGroup
    });
  } else {
    // В режиме рассадки показываем предупреждение
    alert('Удаление столов доступно только в режиме дизайна');
  }
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
  
  if (currentViewMode === 'seating') {
    // В режиме рассадки - показываем информацию о рассадке
    if (onTableSelect) {
      onTableSelect(tableData.id, 'seating-info', {
        tableData: tableData,
        occupiedSeats: tableData.people?.filter(Boolean).length || 0,
        freeSeats: tableData.chairCount - (tableData.people?.filter(Boolean).length || 0),
        people: tableData.people || []
      });
    }
  } else if (currentViewMode === 'design') {
    // В режиме дизайна - показываем свойства стола для редактирования
    if (onTableSelect) {
      onTableSelect(tableData.id, 'design-properties', {
        tableData: tableData
      });
    }
  }
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
      // ✅ ИСПРАВЛЕНО: Правильное получение координат клика
      const pointer = canvas.getPointer(opt.e);
      console.log('Start drawing line at:', pointer); // Для отладки

      setIsDrawing(true);

      // Сохраняем исходные координаты
      canvas._lineStartPoint = { x: pointer.x, y: pointer.y };

      // ✅ ИСПРАВЛЕНО: Создаем линию точно в месте клика
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
      // ✅ ИСПРАВЛЕНО: Правильное получение координат движения
      const pointer = canvas.getPointer(opt.e);
      const startPoint = canvas._lineStartPoint;

      // ✅ ИСПРАВЛЕНО: Обновляем конечную точку линии
      canvas._tempLine.set({
        x2: pointer.x,
        y2: pointer.y,
        x1: startPoint.x,
        y1: startPoint.y
      });

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

      // ✅ ИСПРАВЛЕНО: Получаем правильные координаты
      const x1 = Math.round(startPoint.x);
      const y1 = Math.round(startPoint.y);
      const x2 = Math.round(line.x2);
      const y2 = Math.round(line.y2);

      console.log(`Line coordinates: (${x1}, ${y1}) to (${x2}, ${y2})`); // Для отладки

      // Делаем линию интерактивной
      line.set({
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        hoverCursor: 'move'
      });

      // ✅ Создаем элемент в shapes с правильными координатами
      const newShape = {
        id: Date.now(),
        type: 'line',
        points: [x1, y1, x2, y2],
        color: strokeColor,
        strokeWidth: strokeWidth,
        rotation: 0
      };

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

      // ✅ ИСПРАВЛЕНО: Получаем правильные координаты центра с учетом зума и панорамирования
      const viewportTransform = canvas.viewportTransform;
      const zoom = canvas.getZoom();

      // Вычисляем центр видимой области
      const centerX = (-viewportTransform[4] + canvas.width / 2) / zoom;
      const centerY = (-viewportTransform[5] + canvas.height / 2) / zoom;

      console.log('Adding text at:', { centerX, centerY }); // Для отладки

      // ✅ Создаем текстовый элемент с правильными координатами
      const text = new fabric.IText('Введите текст', {
        left: centerX,
        top: centerY,
        fontSize: fontSize,
        fontFamily: 'Arial',
        fill: strokeColor,
        elementId: Date.now(),
        hasControls: true,
        hasBorders: true,
        selectable: true,
        originX: 'left',
        originY: 'top'
      });

      // ✅ Создаем элемент в shapes с теми же координатами
      const newShape = {
        id: text.elementId,
        type: 'text',
        text: 'Введите текст',
        x: centerX,
        y: centerY,
        fontSize: fontSize,
        fontFamily: 'Arial',
        color: strokeColor,
        rotation: 0
      };

      canvas.add(text);
      canvas.setActiveObject(text);
      text.enterEditing();
      canvas.renderAll();

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

  const createTableFromGroup = useCallback((group, position) => {
    const newTable = {
      id: Date.now(),
      x: Math.max(0, position.x - 150),
      y: Math.max(0, position.y - 150),
      width: 300,
      height: 300,
      people: [...group],
      chairCount: Math.max(chairCount, group.length),
      shape: 'round',
      name: `Стол для группы ${group[0]?.group || ''}`
    };
    setTables(prev => {
      const updatedTables = [...prev, newTable];
      const canvas = fabricCanvasRef.current;
      if (canvas) {
        renderTable(canvas, newTable); // Рендерим немедленно
        saveToHistory();
      }
      return updatedTables;
    });
    return newTable;
  }, [chairCount, setTables, saveToHistory]);

  const handleGroupDropOnTable = useCallback((group, tableId) => {
    console.log('Processing group drop on table:', tableId, group);

    const targetTable = tables.find(t => t.id === tableId);
    if (!targetTable) {
      console.error('Target table not found:', tableId);
      return;
    }

    const occupiedSeats = targetTable.people?.filter(Boolean).length || 0;
    const freeSeats = targetTable.chairCount - occupiedSeats;

    if (freeSeats >= group.length) {
      // Достаточно мест - размещаем всю группу
      placeGroupOnTable(group, tableId);
    } else if (freeSeats > 0) {
      // ✅ ВЫЗЫВАЕМ CALLBACK ДЛЯ ПОКАЗА СЕЛЕКТОРА
      if (onShowPeopleSelector) {
        onShowPeopleSelector({
          groupToPlace: {
            groupName: group[0]?.group || 'группа',
            people: group,
            sourceTableId: null
          },
          targetTableId: tableId,
          availableSeats: freeSeats
        });
      }
    } else {
      alert(`На столе ${tableId} нет свободных мест!`);
    }
  }, [tables, onShowPeopleSelector]);

  // Функция размещения группы на стол
  const placeGroupOnTable = useCallback((group, tableId) => {
    console.log('Placing group on table:', tableId, group);

    setTables(prevTables => {
      const updatedTables = prevTables.map(table => {
        if (table.id === tableId) {
          const newPeople = [...(table.people || [])];

          // Заполняем пустые места
          let groupIndex = 0;
          for (let i = 0; i < newPeople.length && groupIndex < group.length; i++) {
            if (!newPeople[i]) {
              newPeople[i] = group[groupIndex];
              groupIndex++;
            }
          }

          // Если остались люди, добавляем в конец
          while (groupIndex < group.length && newPeople.length < table.chairCount) {
            newPeople.push(group[groupIndex]);
            groupIndex++;
          }

          console.log('Updated table people:', newPeople);

          // ✅ СОХРАНЯЕМ ПОЗИЦИЮ И ПЕРЕРЕНДЕРИВАЕМ ТОЛЬКО ЭТОТ СТОЛ
          setTimeout(() => {
            const canvas = fabricCanvasRef.current;
            if (canvas) {
              const fabricTable = canvas.getObjects().find(obj => obj.tableId === tableId);
              if (fabricTable) {
                // Сохраняем текущую позицию и поворот
                const currentLeft = fabricTable.left;
                const currentTop = fabricTable.top;
                const currentAngle = fabricTable.angle || 0;

                console.log('Preserving table position:', {
                  left: currentLeft,
                  top: currentTop,
                  angle: currentAngle
                });

                // Удаляем старый стол
                canvas.remove(fabricTable);

                // Создаем обновленные данные стола с сохраненной позицией
                const updatedTable = {
                  ...table,
                  people: newPeople,
                  x: currentLeft,
                  y: currentTop,
                  rotation: currentAngle
                };

                // Рендерим новый стол с сохраненной позицией
                const newTableObj = renderTable(canvas, updatedTable);

                if (newTableObj) {
                  // Устанавливаем точную позицию
                  newTableObj.set({
                    left: currentLeft,
                    top: currentTop,
                    angle: currentAngle
                  });
                  newTableObj.setCoords();
                }

                canvas.renderAll();
              }
            }
          }, 10);

          return { ...table, people: newPeople };
        }
        return table;
      });

      return updatedTables;
    });

    // Удаляем людей из общего списка
    setPeople(prevPeople =>
      prevPeople.filter(person =>
        !group.some(groupPerson => groupPerson.name === person.name)
      )
    );

    saveToHistory();
  }, [setTables, setPeople, saveToHistory]);

  const updateTableChairs = (fabricTableGroup, tableData) => {
    if (!fabricTableGroup || !tableData) return;

    try {
      console.log('Updating table chairs for table:', tableData.id);

      // Получаем все объекты в группе стола
      const groupObjects = fabricTableGroup.getObjects();

      // Обновляем стулья и удаляем старые подписи
      groupObjects.forEach(obj => {
        if (obj.chairIndex !== undefined) {
          const chairIndex = obj.chairIndex;
          const person = tableData.people[chairIndex];

          // Обновляем цвет стула
          obj.set({
            fill: person ? '#ff6b6b' : '#6bff6b'
          });
        }

        // Удаляем все старые подписи имен
        if (obj.isNameLabel) {
          fabricTableGroup.removeWithUpdate(obj);
        }
      });

      // Добавляем новые подписи имен
      const updatedObjects = fabricTableGroup.getObjects();
      updatedObjects.forEach(obj => {
        if (obj.chairIndex !== undefined) {
          const chairIndex = obj.chairIndex;
          const person = tableData.people[chairIndex];

          if (person && person.name) {
            // ✅ ПРАВИЛЬНЫЕ ОТНОСИТЕЛЬНЫЕ КООРДИНАТЫ
            let nameX = obj.left;
            let nameY = obj.top;

            // Корректируем позицию в зависимости от формы стола
            if (tableData.shape === 'round') {
              nameY += 5; // Немного ниже стула
            } else if (tableData.shape === 'rectangle') {
              // Для прямоугольных столов определяем сторону
              const tableCenter = { x: 0, y: 0 }; // Центр группы

              if (obj.top < tableCenter.y) {
                // Верхняя сторона
                nameY -= 30;
              } else {
                // Нижняя сторона  
                nameY += 30;
              }
            }

            // Создаем подпись имени с правильными координатами
            const nameLabel = new fabric.Text(person.name, {
              fontSize: 10,
              fontFamily: 'Arial',
              fill: '#211812',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              textAlign: 'center',
              originX: 'center',
              originY: 'center',
              left: nameX,
              top: nameY,
              width: 55,
              padding: 3,
              isNameLabel: true,
              chairIndex: chairIndex,
              selectable: false,
              evented: false
            });

            console.log(`Adding name label for ${person.name} at chair ${chairIndex}:`, {
              x: nameX,
              y: nameY
            });

            fabricTableGroup.addWithUpdate(nameLabel);
          }
        }
      });

      // Принудительно обновляем группу
      fabricTableGroup.setCoords();

    } catch (error) {
      console.error('Error updating table chairs:', error);
    }
  };

  // Уведомление о размещении
  const showTableTransferNotification = (groupName, tableId, count) => {
    const notification = document.createElement('div');
    notification.className = 'transfer-notification';
    notification.textContent = `Группа ${groupName} (${count} чел.) размещена за столом ${tableId}`;
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(33, 150, 243, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s;
  `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '1';
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
          if (notification.parentNode) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 2000);
    }, 100);
  };

  const renderTableDropOverlays = () => {
  // ✅ Показываем оверлеи только в режиме рассадки И при активном перетаскивании
  if (viewMode !== 'seating' || !draggingGroup || !fabricCanvasRef.current || !isCanvasReady || !canvasContainerRef.current) {
    return null;
  }

  const canvas = fabricCanvasRef.current;

  return tables.map(table => {
    const fabricTable = canvas.getObjects().find(obj => obj.tableId === table.id);
    if (!fabricTable) return null;

    const boundingRect = fabricTable.getBoundingRect();

    return (
      <TableDropOverlay
        key={`table-overlay-${table.id}`}
        table={table}
        fabricTable={fabricTable}
        style={{
          position: 'absolute',
          left: `${boundingRect.left}px`,
          top: `${boundingRect.top}px`,
          width: `${boundingRect.width}px`,
          height: `${boundingRect.height}px`,
          zIndex: 10,
          pointerEvents: 'auto'
        }}
        people={people}
        setPeople={setPeople}
        tables={tables}
        setTables={setTables}
        canvas={canvas}
        onShowPeopleSelector={onShowPeopleSelector}
        onTableUpdate={forceUpdateSpecificTable}
      />
    );
  });
};
  // Функция для показа уведомления
  const showTransferNotification = (groupName, tableId) => {
    const notification = document.createElement('div');
    notification.className = 'transfer-notification';
    notification.textContent = `Создан новый стол для группы ${groupName}`;
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s;
  `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '1';
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
          if (notification.parentNode) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 2000);
    }, 100);
  };

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'GROUP',
    drop: (item, monitor) => {
      console.log('Group dropped on canvas:', item);

      if (!item.group || !Array.isArray(item.group)) {
        console.error('Invalid group data:', item);
        return { success: false };
      }

      // Получаем позицию drop
      const dropOffset = monitor.getClientOffset();
      if (!dropOffset || !canvasContainerRef.current) {
        return { success: false };
      }

      // Простой расчет координат
      const canvasRect = canvasContainerRef.current.getBoundingClientRect();
      const canvas = fabricCanvasRef.current;

      if (!canvas) return { success: false };

      const x = dropOffset.x - canvasRect.left;
      const y = dropOffset.y - canvasRect.top;

      console.log('Drop coordinates:', { x, y });

      // Создаем стол
      const newTable = createTableFromGroup(item.group, { x, y });

      return { success: true, tableId: newTable?.id };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop()
    })
  });

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

      // Сохраняем текущее состояние viewport
      const currentZoom = zoom;
      const originalViewportTransform = [...canvas.viewportTransform];

      // Временно сбрасываем зум для точного экспорта
      canvas.setZoom(1.0);
      canvas.viewportTransform[4] = 0;
      canvas.viewportTransform[5] = 0;
      canvas.renderAll();

      console.log("Temporarily reset zoom to 1.0 for accurate export");

      // Получаем актуальные shapes с canvas
      const actualShapes = [];

      canvas.getObjects().forEach(obj => {
        if (obj.elementId && !obj.gridLine) {
          let shape = null;

          switch (obj.type) {
            case 'rect':
              const rectBounds = obj.getBoundingRect();
              shape = {
                id: obj.elementId,
                type: 'rect',
                x: Math.round(rectBounds.left),
                y: Math.round(rectBounds.top),
                width: Math.round(obj.width * (obj.scaleX || 1)),
                height: Math.round(obj.height * (obj.scaleY || 1)),
                centerX: Math.round(rectBounds.left + rectBounds.width / 2),
                centerY: Math.round(rectBounds.top + rectBounds.height / 2),
                color: obj.stroke || '#000000',
                strokeWidth: obj.strokeWidth || 2,
                fill: obj.fill || 'transparent',
                rotation: Math.round(obj.angle || 0)
              };
              break;

            case 'circle':
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

            case 'line':
              const linePoints = [
                obj.originalX1 !== undefined ? obj.originalX1 : obj.x1,
                obj.originalY1 !== undefined ? obj.originalY1 : obj.y1,
                obj.originalX2 !== undefined ? obj.originalX2 : obj.x2,
                obj.originalY2 !== undefined ? obj.originalY2 : obj.y2
              ];

              shape = {
                id: obj.elementId,
                type: 'line',
                points: linePoints.map(p => Math.round(p)),
                color: obj.stroke || '#000000',
                strokeWidth: obj.strokeWidth || 2,
                rotation: Math.round(obj.angle || 0)
              };
              break;

            case 'i-text':
              shape = {
                id: obj.elementId,
                type: 'text',
                text: obj.text || 'Text',
                x: Math.round(obj.left),
                y: Math.round(obj.top),
                fontSize: Math.round(obj.fontSize * (obj.scaleX || 1)),
                fontFamily: obj.fontFamily || 'Arial',
                color: obj.fill || '#000000',
                rotation: Math.round(obj.angle || 0)
              };
              break;

            case 'path':
              shape = {
                id: obj.elementId,
                type: 'path',
                path: obj.path,
                x: Math.round(obj.left),
                y: Math.round(obj.top),
                color: obj.stroke || '#000000',
                strokeWidth: obj.strokeWidth || 2,
                fill: obj.fill || '',
                rotation: Math.round(obj.angle || 0)
              };
              break;

            default:
              console.warn(`Unknown object type for export: ${obj.type}`);
              break;
          }

          if (shape) {
            actualShapes.push(shape);
          }
        }
      });

      // ✅ NEW: Collect renderingOptions for tables from fabric objects
      const tablesWithRenderingOptions = tables.map(table => {
        // Find corresponding fabric table object
        const fabricTableObj = canvas.getObjects().find(obj => obj.tableId === table.id);

        let renderingOptions = {};

        if (fabricTableObj) {
          renderingOptions = {
            left: Math.round(fabricTableObj.left || 0),
            top: Math.round(fabricTableObj.top || 0),
            angle: Math.round(fabricTableObj.angle || 0),
            height: Math.round(fabricTableObj.height || table.height || 300),
            width: Math.round(fabricTableObj.width || table.width || 300),
            zoomX: fabricTableObj.zoomX || 1,
            zoomY: fabricTableObj.zoomY || 1,
            scaleX: fabricTableObj.scaleX || 1,
            scaleY: fabricTableObj.scaleY || 1
          };

          console.log(`Table ${table.id} renderingOptions:`, renderingOptions);
        } else {
          // Fallback to table data if fabric object not found
          renderingOptions = {
            left: Math.round(table.x || 0),
            top: Math.round(table.y || 0),
            angle: Math.round(table.rotation || 0),
            height: Math.round(table.height || 300),
            width: Math.round(table.width || 300),
            zoomX: 1,
            zoomY: 1,
            scaleX: 1,
            scaleY: 1
          };

          console.warn(`Fabric object not found for table ${table.id}, using fallback renderingOptions`);
        }

        return {
          ...table,
          renderingOptions: renderingOptions
        };
      });

      // Формируем данные для экспорта
      const exportData = {
        name: "Зал ресторана",
        version: "2.1", // Increased version for renderingOptions support
        timestamp: new Date().toISOString(),
        tables: tablesWithRenderingOptions, // ✅ Use tables with renderingOptions
        shapes: actualShapes,
        canvasData: {
          zoom: currentZoom,
          width: canvas.width,
          height: canvas.height,
          gridSize: gridSize,
          showGrid: showGrid
        }
      };

      // Восстанавливаем исходное состояние viewport
      canvas.setViewportTransform(originalViewportTransform);
      canvas.renderAll();
      console.log("Restored original zoom after export");

      console.log("Export data with renderingOptions:", exportData);
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
      console.log('Starting import with data:', importData);

      if (!importData.tables && !importData.shapes) {
        throw new Error('Invalid JSON format: missing required data');
      }

      const canvas = fabricCanvasRef.current;
      if (!canvas) {
        throw new Error('Canvas not ready for import');
      }

      // Очищаем выделение
      canvas.discardActiveObject();
      setSelectedObject(null);
      setSelectedElementId(null);

      // Очищаем холст от всех объектов кроме сетки
      const objectsToRemove = canvas.getObjects().filter(obj => !obj.gridLine);
      objectsToRemove.forEach(obj => canvas.remove(obj));
      canvas.renderAll();

      // Очищаем состояние
      setTables([]);
      setShapes([]);
      setHallElements([]);

      // Подготавливаем данные для импорта
      const importedTables = importData.tables || [];
      const importedShapes = importData.shapes || [];

      console.log(`Importing ${importedTables.length} tables and ${importedShapes.length} shapes`);

      // ✅ NEW: Enhanced renderTable function that applies renderingOptions
      const renderTableWithOptions = (tableData) => {
        if (!canvas || !tableData) return null;

        try {
          // First render the table normally
          const tableGroup = renderTable(canvas, tableData);

          if (!tableGroup) {
            console.error('Failed to render table:', tableData.id);
            return null;
          }

          // ✅ Apply renderingOptions if available
          if (tableData.renderingOptions) {
            const options = tableData.renderingOptions;

            console.log(`Applying renderingOptions to table ${tableData.id}:`, options);

            // Apply all rendering properties
            tableGroup.set({
              left: options.left || tableData.x || 0,
              top: options.top || tableData.y || 0,
              angle: options.angle || tableData.rotation || 0,
              height: options.height || tableData.height || 300,
              width: options.width || tableData.width || 300,
              scaleX: options.scaleX || 1,
              scaleY: options.scaleY || 1
            });

            // Apply zoom properties if they exist
            if (options.zoomX !== undefined) {
              tableGroup.zoomX = options.zoomX;
            }
            if (options.zoomY !== undefined) {
              tableGroup.zoomY = options.zoomY;
            }

            // Update coordinates after applying transformations
            tableGroup.setCoords();

            console.log(`Applied renderingOptions to table ${tableData.id}:`, {
              left: tableGroup.left,
              top: tableGroup.top,
              angle: tableGroup.angle,
              scaleX: tableGroup.scaleX,
              scaleY: tableGroup.scaleY
            });
          } else {
            // Fallback to original table data
            console.log(`No renderingOptions for table ${tableData.id}, using original data`);
            tableGroup.set({
              left: tableData.x || 0,
              top: tableData.y || 0,
              angle: tableData.rotation || 0
            });
            tableGroup.setCoords();
          }

          return tableGroup;
        } catch (error) {
          console.error('Error rendering table with options:', tableData, error);
          return null;
        }
      };

      // Функция для рендеринга импортированного shape (unchanged)
      const renderImportedShape = (shape) => {
        if (!shape || !shape.type) return null;

        try {
          let fabricObj;

          switch (shape.type) {
            case 'rect':
              fabricObj = new fabric.Rect({
                left: shape.x || 0,
                top: shape.y || 0,
                width: shape.width || 100,
                height: shape.height || 50,
                fill: shape.fill || 'rgba(0, 0, 0, 0.1)',
                stroke: shape.color || '#000000',
                strokeWidth: shape.strokeWidth || 2,
                angle: shape.rotation || 0,
                elementId: shape.id,
                hasControls: true,
                hasBorders: true,
                selectable: true
              });
              break;

            case 'circle':
              const radius = shape.radius || 50;
              const centerX = shape.centerX || (shape.x + radius);
              const centerY = shape.centerY || (shape.y + radius);

              fabricObj = new fabric.Circle({
                left: centerX,
                top: centerY,
                radius: radius,
                fill: shape.fill || 'rgba(0, 0, 0, 0.1)',
                stroke: shape.color || '#000000',
                strokeWidth: shape.strokeWidth || 2,
                angle: shape.rotation || 0,
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
                const [x1, y1, x2, y2] = shape.points;
                fabricObj = new fabric.Line([x1, y1, x2, y2], {
                  stroke: shape.color || '#000000',
                  strokeWidth: shape.strokeWidth || 2,
                  angle: shape.rotation || 0,
                  elementId: shape.id,
                  hasControls: true,
                  hasBorders: true,
                  selectable: true,
                  originalX1: x1,
                  originalY1: y1,
                  originalX2: x2,
                  originalY2: y2
                });
              }
              break;

            case 'text':
              fabricObj = new fabric.IText(shape.text || 'Text', {
                left: shape.x || 0,
                top: shape.y || 0,
                fontSize: shape.fontSize || 18,
                fontFamily: shape.fontFamily || 'Arial',
                fill: shape.color || '#000000',
                angle: shape.rotation || 0,
                elementId: shape.id,
                hasControls: true,
                hasBorders: true,
                selectable: true,
                originX: 'left',
                originY: 'top'
              });
              break;

            case 'path':
              if (shape.path) {
                fabricObj = new fabric.Path(shape.path, {
                  left: shape.x || 0,
                  top: shape.y || 0,
                  stroke: shape.color || '#000000',
                  strokeWidth: shape.strokeWidth || 2,
                  fill: shape.fill || '',
                  angle: shape.rotation || 0,
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
            return fabricObj;
          }

          return null;
        } catch (error) {
          console.error('Error rendering imported shape:', shape, error);
          return null;
        }
      };

      // Рендерим shapes (unchanged)
      importedShapes.forEach((shape, index) => {
        try {
          console.log(`Rendering shape ${index + 1}/${importedShapes.length}:`, shape.type, shape.id);
          renderImportedShape(shape);
        } catch (error) {
          console.error('Error rendering imported shape:', shape, error);
        }
      });

      // ✅ Render tables with renderingOptions
      importedTables.forEach((table, index) => {
        try {
          console.log(`Rendering table ${index + 1}/${importedTables.length}:`, table.id);
          renderTableWithOptions(table);
        } catch (error) {
          console.error('Error rendering imported table:', table, error);
        }
      });

      // Применяем настройки холста
      if (importData.canvasData) {
        const canvasData = importData.canvasData;

        // Применяем зум
        if (canvasData.zoom && canvasData.zoom !== zoom) {
          const center = canvas.getCenter();
          canvas.zoomToPoint({ x: center.left, y: center.top }, canvasData.zoom);
          setZoom(canvasData.zoom);
        }

        // Применяем настройки сетки
        if (canvasData.gridSize && canvasData.gridSize !== gridSize) {
          setGridSize(canvasData.gridSize);
        }

        if (canvasData.showGrid !== undefined && canvasData.showGrid !== showGrid) {
          setShowGrid(canvasData.showGrid);
        }
      }

      // ✅ Update state with clean table data (without renderingOptions for state)
      const cleanTables = importedTables.map(table => {
        const { renderingOptions, ...cleanTable } = table;
        return cleanTable;
      });

      setTables(cleanTables);
      setShapes([...importedShapes]);

      // Принудительный рендер
      canvas.renderAll();

      // Финальная проверка через задержку
      setTimeout(() => {
        const renderedObjects = canvas.getObjects().filter(obj => !obj.gridLine);
        const expectedCount = importedTables.length + importedShapes.length;

        console.log(`Import verification: ${renderedObjects.length} objects rendered, expected ${expectedCount}`);

        if (renderedObjects.length !== expectedCount) {
          console.warn('Object count mismatch after import, forcing re-render...');

          // Повторный рендер при несовпадении
          importedTables.forEach(table => renderTableWithOptions(table));
          importedShapes.forEach(shape => renderImportedShape(shape));
          canvas.renderAll();
        }

        // Сохраняем в историю после успешного импорта
        saveToHistory();
      }, 500);

      // Сбрасываем флаги
      setUnsavedChanges(false);
      setObjectCount(importedTables.length + importedShapes.length);

      console.log('Import completed successfully with renderingOptions applied');
      return true;

    } catch (error) {
      console.error('Error importing JSON:', error);
      alert(`Ошибка импорта: ${error.message}`);
      return false;
    }
  };

  const forceRerenderAfterImport = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    console.log('Force re-rendering all elements...');

    // Очищаем все объекты кроме сетки
    const objectsToRemove = [];
    canvas.getObjects().forEach(obj => {
      if (!obj.gridLine) {
        objectsToRemove.push(obj);
      }
    });

    objectsToRemove.forEach(obj => {
      canvas.remove(obj);
    });

    // Перерендериваем все из текущего состояния
    setTimeout(() => {
      // Рендерим столы
      tables.forEach(table => {
        try {
          renderTable(canvas, table);
        } catch (error) {
          console.error('Error re-rendering table:', error);
        }
      });

      // Рендерим shapes
      shapes.forEach(shape => {
        try {
          renderShape(canvas, shape);
        } catch (error) {
          console.error('Error re-rendering shape:', error);
        }
      });

      canvas.renderAll();
      console.log('Force re-render complete');
    }, 100);
  }, [tables, shapes]);


  // Enable/disable pan mode
  const enablePanMode = () => {
    setActiveMode(ELEMENT_TYPES.PAN);
  };

  const disablePanMode = () => {
    setActiveMode(ELEMENT_TYPES.SELECT);
  };


  //   useEffect(() => {
  //   // Обновляем позиции оверлеев при zoom/pan/resize
  //   const updateOverlays = () => {
  //     if (fabricCanvasRef.current && tables.length > 0) {
  //       // Принудительно обновляем компонент
  //       setObjectCount(prev => prev);
  //     }
  //   };

  //   const canvas = fabricCanvasRef.current;
  //   if (canvas) {
  //     // Слушаем события zoom и pan
  //     canvas.on('after:render', updateOverlays);
  //     canvas.on('mouse:wheel', updateOverlays);
  //     canvas.on('mouse:up', updateOverlays);

  //     return () => {
  //       canvas.off('after:render', updateOverlays);
  //       canvas.off('mouse:wheel', updateOverlays);
  //       canvas.off('mouse:up', updateOverlays);
  //     };
  //   }
  // }, [tables.length]);

  // useEffect(() => {
  //   // Когда tables изменяются, принудительно обновляем оверлеи
  //   const timer = setTimeout(() => {
  //     setObjectCount(prev => prev + 1); // Принудительный rerender
  //   }, 100);

  //   return () => clearTimeout(timer);
  // }, [tables]);

  useEffect(() => {
    // Принудительно обновляем оверлеи только когда активно перетаскивание
    if (draggingGroup && tables.length > 0) {
      const timer = setTimeout(() => {
        setObjectCount(prev => prev + 1);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [draggingGroup, tables.length]);
  useEffect(() => {
    // После инициализации холста и рендеринга всех элементов
    if (isCanvasReady && fabricCanvasRef.current) {
      // Дайте немного времени для полной загрузки
      setTimeout(() => {
        saveToHistory();
      }, 500);
    }
  }, [isCanvasReady]);

useEffect(() => {
  // Ограничения для режима рассадки
  if (viewMode === 'seating') {
    // В режиме рассадки разрешены только навигационные режимы
    const allowedModes = [ELEMENT_TYPES.HYBRID, ELEMENT_TYPES.PAN, ELEMENT_TYPES.SELECT];
    if (!allowedModes.includes(activeMode)) {
      setActiveMode(ELEMENT_TYPES.HYBRID);
    }
  }
}, [viewMode, activeMode]);

// Добавить этот useEffect после существующих
useEffect(() => {
  const canvas = fabricCanvasRef.current;
  if (!canvas || !isCanvasReady) return;
  
  console.log(`📋 ViewMode changed to: ${viewMode}, activeMode: ${activeMode}`);
  
  // ✅ ИСПРАВЛЕНИЕ: Не перезаписываем обработчики для режимов рисования
  const drawingModes = [
    ELEMENT_TYPES.LINE, 
    ELEMENT_TYPES.RECTANGLE, 
    ELEMENT_TYPES.CIRCLE, 
    ELEMENT_TYPES.DRAW
  ];
  
  if (drawingModes.includes(activeMode)) {
    console.log('🎨 Drawing mode active, skipping mode override');
    return; // ← НЕ ТРОГАЕМ РЕЖИМЫ РИСОВАНИЯ!
  }
  
  // Ограничения для режима рассадки
  if (viewMode === 'seating') {
    if (activeMode !== ELEMENT_TYPES.HYBRID) {
      console.log('🚫 Blocking mode change in seating view, forcing HYBRID');
      setActiveMode(ELEMENT_TYPES.HYBRID);
      return;
    }
    
    setTimeout(() => {
      console.log('🔒 Enforcing seating mode settings...');
      applyObjectSettings(canvas, 'seating');
    }, 100);
    
    setupHybridMode(canvas);
    return;
  }
  
  // Для режима дизайна
  if (viewMode === 'design') {
    setTimeout(() => {
      console.log('🔓 Enforcing design mode settings...');
      applyObjectSettings(canvas, 'design');
      
      canvas.selection = true;
      setupHybridMode(canvas);
    }, 100);
  }
}, [viewMode, activeMode, isCanvasReady]);


// ✅ Функция для принудительного обновления всех столов
const forceUpdateAllTablesForMode = (newViewMode) => {
  const canvas = fabricCanvasRef.current;
  if (!canvas || tables.length === 0) return;

  console.log(`🔄 Force updating all tables for ${newViewMode} mode...`);
  
  // Получаем все столы на canvas
  const tableObjects = canvas.getObjects().filter(obj => obj.tableId);
  
  tableObjects.forEach(obj => {
    const tableData = tables.find(t => t.id === obj.tableId);
    if (tableData) {
      console.log(`📝 Force updating table ${obj.tableId} for ${newViewMode} mode`);
      
      // Сохраняем ВСЕ свойства трансформации
      const currentLeft = obj.left;
      const currentTop = obj.top;
      const currentAngle = obj.angle || 0;
      const currentScaleX = obj.scaleX || 1;
      const currentScaleY = obj.scaleY || 1;
      const currentWidth = obj.width;
      const currentHeight = obj.height;

      // Удаляем старый
      canvas.remove(obj);

      // ✅ ИСПРАВЛЕНО: Создаем новый с правильным режимом
      const newTableObj = renderTable(canvas, {
        ...tableData,
        x: currentLeft,
        y: currentTop,
        rotation: currentAngle
      }, newViewMode, onChairClick); // ✅ Передаем newViewMode

      if (newTableObj) {
        // Восстанавливаем ВСЕ свойства трансформации
        newTableObj.set({
          left: currentLeft,
          top: currentTop,
          angle: currentAngle,
          scaleX: currentScaleX,
          scaleY: currentScaleY,
          width: currentWidth,
          height: currentHeight
        });
        newTableObj.setCoords();
        
        // ✅ ДОБАВЛЕНО: Применяем настройки режима к новому столу
        // if (newViewMode === 'seating') {
        //   newTableObj.set({
        //     selectable: false,
        //     evented: true,
        //     hasControls: false,
        //     hasBorders: false,
        //     lockMovementX: true,
        //     lockMovementY: true,
        //     lockScalingX: true,
        //     lockScalingY: true,
        //     lockRotation: true,
        //     hoverCursor: 'pointer'
        //   });
        // } else if (newViewMode === 'design') {
        //   newTableObj.set({
        //     selectable: true,
        //     evented: true,
        //     hasControls: true,
        //     hasBorders: true,
        //     lockMovementX: false,
        //     lockMovementY: false,
        //     lockScalingX: false,
        //     lockScalingY: false,
        //     lockRotation: false,
        //     hoverCursor: 'move'
        //   });
        // }
      }
    }
  });

  canvas.renderAll();
  console.log(`✅ All tables updated for ${newViewMode} mode`);
};

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
    updateTableVisual: forceUpdateSpecificTable,
    debugObjectStates, // ✅ Добавляем отладочную функцию
  }));

 return (
  <div className="enhanced-canvas-container">
    {/* ← НОВЫЙ БЛОК: Переключатель режимов */}
<button 
  className={`mode-btn ${viewMode === 'seating' ? 'active' : ''}`}
  onClick={() => {
    console.log('🔘 Switching to SEATING mode...');
    
    // ✅ Принудительно очищаем состояние выделения
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      canvas.discardActiveObject();
      setSelectedObject(null);
      setSelectedElementId(null);
    }
    
    onViewModeChange('seating');
    
    // ✅ УВЕЛИЧЕНА ЗАДЕРЖКА для обновления состояния
    setTimeout(() => {
      applyModeSettings('seating');
    }, 200); // было 100, стало 200
  }}
  title="Режим рассадки - работа с размещением гостей"
>
  👥 Рассадка
</button>

<button 
  className={`mode-btn ${viewMode === 'design' ? 'active' : ''}`}
  onClick={() => {
    console.log('🔘 Switching to DESIGN mode...');
    
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      canvas.discardActiveObject();
      setSelectedObject(null);
      setSelectedElementId(null);
    }
    
    onViewModeChange('design');
    
    setTimeout(() => {
      applyModeSettings('design');
      // ✅ Если ничего не помогает - перезагружаем canvas
      // forceCanvasReload();
    }, 200);
  }}
  title="Режим дизайна - создание и редактирование планировки"
>
  🎨 Дизайн
</button>

    {/* ← ИЗМЕНЕНО: Условный рендеринг toolbar */}
    <div className="canvas-toolbar">
      {viewMode === 'design' ? (
        // Существующий toolbar для дизайна
        <>
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
        </>
      ) : (
        // Новый toolbar для режима рассадки
       <div className="tool-group seating-tools">
    <div className="seating-info">
      <span>👥 Режим рассадки: кликайте по стульям и столам, перетаскивайте группы на столы</span>
    </div>
    <button
      className="tool-btn"
      onClick={addNewTable}
      title="Добавить новый стол"
    >
      <i className="fas fa-table">+ Стол</i>
    </button>
  </div>
)}
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

      {/* ← ИЗМЕНЕНО: Условный рендеринг инструментов редактирования */}
      {viewMode === 'design' && (
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
          <button
            className="tool-btn"
            onClick={forceRerenderAfterImport}
            title="Принудительно перерендерить все объекты"
          >
            🔄
          </button>
        </div>
      )}
    </div>

    <div className="canvas-content-area">
      <div className="canvas-and-sidebar-container" style={{ display: 'flex', width: '100%' }}>
        <div
          className="canvas-wrapper"
          ref={drop}
          style={{
            width: '100%',
            position: 'relative',
            border: '1px solid #ddd',
            overflow: 'hidden',
            backgroundColor: isOver && canDrop ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
            borderColor: isOver && canDrop ? '#4CAF50' : '#ddd'
          }}
        >
          <div
            ref={canvasContainerRef}
            style={{
              width: '100%',
              height: '100%',
              position: 'relative'
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                display: 'block',
                touchAction: 'none'
              }}
            />
            {renderTableDropOverlays()}
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
        {/* ← НОВОЕ: Показываем текущий режим */}
        <span className={`current-mode ${viewMode}`}>
          Режим: {viewMode === 'design' ? '🎨 Дизайн' : '👥 Рассадка'}
        </span>
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
);
});

export default EnhancedCanvas;