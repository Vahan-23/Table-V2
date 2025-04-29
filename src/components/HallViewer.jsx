import React, { useState, useEffect, useRef } from 'react';
import './hallview.css'; // Предполагаем, что стили импортированы из предоставленного CSS файла

const HallViewer = ({ hallData: initialHallData, onDataChange }) => {
  const [hallData, setHallData] = useState(initialHallData);
  const [zoom, setZoom] = useState(0.4);
  const tablesAreaRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // При изменении initialHallData обновляем состояние компонента
    setHallData(initialHallData);
  }, [initialHallData]);
  
  // Функция для обработки загрузки JSON файла
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const parsedData = JSON.parse(e.target.result);
        setHallData(parsedData);
        
        // Если передан колбэк для оповещения родительского компонента
        if (onDataChange) {
          onDataChange(parsedData);
        }
        
        setIsLoading(false);
      } catch (error) {
        setError("Ошибка при чтении JSON файла. Проверьте формат файла.");
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError("Ошибка при чтении файла.");
      setIsLoading(false);
    };

    reader.readAsText(file);
    
    // Сбрасываем значение input после загрузки, чтобы можно было загрузить 
    // тот же файл повторно, если нужно
    event.target.value = "";
  };
  
  // Обработчики кнопок масштабирования
  const handleButtonZoomIn = () => {
    setZoom(Math.min(zoom * 1.1, 1.0));
  };

  const handleButtonZoomOut = () => {
    setZoom(Math.max(zoom / 1.1, 0.2));
  };
  
  // Функция для отрисовки стульев в зависимости от формы стола
  const renderChairs = (table) => {
    if (table.shape === 'rectangle') {
      return renderRectangleChairs(table);
    } else {
      return renderRoundChairs(table);
    }
  };
  
  const renderRoundChairs = (table) => {
    const chairs = [];
    const angleStep = 360 / table.chairCount;
    const radius = 140;
    const peopleOnTable = table.people || [];

    for (let i = 0; i < table.chairCount; i++) {
      const angle = angleStep * i;
      const xPosition = radius * Math.cos((angle * Math.PI) / 180);
      const yPosition = radius * Math.sin((angle * Math.PI) / 180);

      const chairStyle = {
        position: 'absolute',
        transformOrigin: 'center',
        width: '60px',
        height: '60px',
        backgroundImage: peopleOnTable[i] ? "url('/red1.png')" : "url('/green2.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '50%',
        fontSize: '12px',
        textAlign: 'center',
        left: `calc(50% + ${xPosition}px)`,
        top: `calc(50% + ${yPosition}px)`,
        transform: `rotate(${angle + 90}deg)`
      };

      const nameOverlayStyle = {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: '2px 6px',
        color: "#211812",
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 'bold',
        maxWidth: '55px',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        zIndex: 5
      };

      chairs.push(
        <div
          key={i}
          className="chair"
          style={chairStyle}
        >
          {peopleOnTable[i] && (
            <div
              className="person-name-overlay"
              style={nameOverlayStyle}
            >
              {peopleOnTable[i].name}
            </div>
          )}
        </div>
      );
    }

    return chairs;
  };
  
  const renderRectangleChairs = (table) => {
    const chairs = [];
    const tableWidth = 400;
    const tableHeight = 150;
    const border = 50;
    const peopleOnTable = table.people || [];

    const totalChairs = table.chairCount;

    // Распределяем стулья по сторонам стола
    let chairsLeft = 0;
    let chairsRight = 0;
    let chairsTop = 0;
    let chairsBottom = 0;

    // Изначально выделяем по 1 стулу слева и справа (если стульев больше 4)
    if (totalChairs > 4) {
      chairsLeft = 1;
      chairsRight = 1;
      // Оставшиеся стулья распределяются на верхнюю и нижнюю стороны
      const remainingChairs = totalChairs - 2; // 2 стула на левой и правой стороне
      const maxTopBottom = Math.floor(remainingChairs / 2);
      chairsTop = maxTopBottom;
      chairsBottom = remainingChairs - chairsTop;
    } else {
      // Если стульев меньше или равно 4, они распределяются только по верхней и нижней стороне
      chairsTop = Math.ceil(totalChairs / 2);
      chairsBottom = totalChairs - chairsTop;
    }

    let chairIndex = 0;

    // Левый край стола
    if (chairsLeft > 0) {
      const leftChairIndex = chairIndex;
      const person = peopleOnTable[leftChairIndex];

      chairs.push(
        <div
          key={`left-${leftChairIndex}`}
          className="chair"
          style={{
            position: 'absolute',
            width: '60px',
            height: '60px',
            backgroundImage: person ? "url('/red1.png')" : "url('/green2.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '50%',
            fontSize: '12px',
            textAlign: 'center',
            left: `calc(50% - ${250}px)`, 
            top: `calc(50% - ${15}px)`,
            cursor: 'pointer',
            transform: 'rotate(270deg)' 
          }}
        >
          {person && (
            <div
              className="person-name-overlay"
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                padding: '2px 6px',
                color: "#211812",
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                maxWidth: '55px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                zIndex: 5
              }}
            >
              {person.name}
            </div>
          )}
        </div>
      );

      chairIndex++;
    }

    // Правая сторона стола
    if (chairsRight > 0) {
      const rightChairIndex = chairIndex;
      const person = peopleOnTable[rightChairIndex];

      chairs.push(
        <div
          key={`right-${rightChairIndex}`}
          className="chair"
          style={{
            position: 'absolute',
            width: '60px',
            height: '60px',
            backgroundImage: person ? "url('/red1.png')" : "url('/green2.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '50%',
            fontSize: '12px',
            textAlign: 'center',
            left: `calc(50% + ${190}px)`,
            top: `calc(50% - ${15}px)`, 
            cursor: 'pointer',
            transform: 'rotate(90deg)' 
          }}
        >
          {person && (
            <div
              className="person-name-overlay"
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                padding: '2px 6px',
                color: "#211812",
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                maxWidth: '55px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                zIndex: 5
              }}
            >
              {person.name}
            </div>
          )}
        </div>
      );

      chairIndex++;
    }

    // Верхняя сторона стола
    for (let i = 0; i < chairsTop; i++) {
      const topChairIndex = chairIndex;
      const person = peopleOnTable[topChairIndex];
      const ratio = chairsTop === 1 ? 0.5 : i / (chairsTop - 1);
      const xPosition = ((tableWidth - 50) * ratio) - tableWidth / 2;
      const yPosition = -tableHeight / 2 - border + 10;

      chairs.push(
        <div
          key={`top-${topChairIndex}`}
          className="chair"
          style={{
            position: 'absolute',
            width: '60px',
            height: '60px',
            backgroundImage: person ? "url('/red1.png')" : "url('/green2.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '50%',
            fontSize: '12px',
            textAlign: 'center',
            left: `calc(50% + ${xPosition}px)`,
            top: `calc(50% + ${yPosition}px)`,
            cursor: 'pointer',
            transform: 'rotate(0deg)'
          }}
        >
          {person && (
            <div
              className="person-name-overlay"
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                padding: '2px 6px',
                color: "#211812",
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                maxWidth: '55px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                zIndex: 5
              }}
            >
              {person.name}
            </div>
          )}
        </div>
      );

      chairIndex++;
    }

    // Нижняя сторона стола
    for (let i = 0; i < chairsBottom; i++) {
      const bottomChairIndex = chairIndex;
      const person = peopleOnTable[bottomChairIndex];
      const ratio = chairsBottom === 1 ? 0.5 : i / (chairsBottom - 1);
      const xPosition = ((tableWidth - 50) * ratio) - tableWidth / 2;
      const yPosition = tableHeight / 2;

      chairs.push(
        <div
          key={`bottom-${bottomChairIndex}`}
          className="chair"
          style={{
            position: 'absolute',
            width: '60px',
            height: '60px',
            backgroundImage: person ? "url('/red1.png')" : "url('/green2.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '50%',
            fontSize: '12px',
            textAlign: 'center',
            left: `calc(50% + ${xPosition}px)`,
            top: `calc(50% + ${yPosition}px)`,
            cursor: 'pointer',
            transform: 'rotate(180deg)'
          }}
        >
          {person && (
            <div
              className="person-name-overlay"
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                padding: '2px 6px',
                color: "#211812",
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                maxWidth: '55px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                zIndex: 5
              }}
            >
              {person.name}
            </div>
          )}
        </div>
      );

      chairIndex++;
    }

    return chairs;
  };
  
  // Функция для отрисовки элементов зала (входы, туалеты и т.д.)
  const renderHallElements = () => {
    if (!hallData.hallElements) return null;
    
    return hallData.hallElements.map(element => {
      return (
        <div
          key={element.id}
          className="hall-element"
          style={{
            position: 'absolute',
            left: `${element.x}px`,
            top: `${element.y}px`,
            transform: `rotate(${element.rotation || 0}deg)`,
            opacity: element.opacity || 1,
            zIndex: element.zIndex || 1
          }}
        >
          <img 
            src={element.icon} 
            alt={element.name} 
            style={{ 
              width: `${element.fontSize || 100}px`,
              height: 'auto',
            }} 
          />
          <div className="element-label" style={{ textAlign: 'center', marginTop: '5px' }}>
            {element.customName || element.name}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-top">
          <div className="logo2">Просмотр зала: {hallData?.name || 'Без названия'}</div>
          <div className="import-container">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              id="import-file"
              className="file-input"
            />
            <label htmlFor="import-file" className="import-button">
              Импортировать зал
            </label>
            {isLoading && <div className="loading-indicator">Загрузка...</div>}
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      </header>
      
      {hallData ? (
        <div className="main-content">
          <div className="figmaContainer">
            <div className="zoom-controls">
              <div className="zoom-buttons">
                <button
                  className="zoom-btn zoom-out-btn"
                  onClick={handleButtonZoomOut}
                >−</button>
                <span className="zoom-percentage">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  className="zoom-btn zoom-in-btn"
                  onClick={handleButtonZoomIn}
                >+</button>
              </div>
            </div>
            
            <div
              className="tables-area"
              ref={tablesAreaRef}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                display: 'flex',
                overflow: 'auto',
                width: `${100 / zoom}%`,
                height: `${100 / zoom}%`,
                minHeight: `${100 / zoom}%`,
                padding: '20px',
                position: 'relative',
                '--zoom-level': zoom,
                transition: 'transform 0.1s ease-out'
              }}
            >
              {/* Отображаем столы */}
              {hallData.tables && hallData.tables.map((table) => (
                <div
                  key={table.id}
                  className="table-container"
                  style={{
                    position: 'absolute',
                    left: `${table.x || 0}px`,
                    top: `${table.y || 0}px`
                  }}
                >
                  <div className="table-header">
                    <h3>Стол {table.id} (Стульев: {table.chairCount})</h3>
                  </div>
                  
                  {table.shape === 'rectangle' ? (
                    <div className="table" style={{
                      margin: "20px",
                      width: "400px",
                      height: "150px",
                      border: "30px solid #e7d8c7",
                      borderRadius: "0%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundImage: "url('/table2.png')",
                      backgroundSize: "100% 100%",
                      backgroundRepeat: "no-repeat",
                    }}>
                      {renderChairs(table)}
                    </div>
                  ) : (
                    <div className="table">
                      <div className="table-top">
                        {renderChairs(table)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Отображаем элементы зала */}
              {renderHallElements()}
            </div>
          </div>
        </div>
      ) : (
        <div className="no-data-message">
          <div className="message-content">
            <h2>Нет данных для отображения</h2>
            <p>Пожалуйста, импортируйте JSON файл с данными зала, используя кнопку выше.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HallViewer;