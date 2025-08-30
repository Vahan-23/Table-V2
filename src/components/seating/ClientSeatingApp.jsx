import React from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { SeatingProvider } from './SeatingContext';
import { useSeating } from './SeatingContext';
import { useTranslations } from './useTranslations';
import { useGroups } from './useGroups';
import { useTables } from './useTables';
import { useFileUpload } from './useFileUpload';
import { useShapes } from './useShapes';
import Header from './Header';
import PersonModal from './PersonModal';
import GroupsPanel from './GroupsPanel';
import CreateGroupModal from './CreateGroupModal';
import GroupDetailsModal from './GroupDetailsModal';
import EditGroupModal from './EditGroupModal';
import TableSelectionModal from './TableSelectionModal';
import TableSelectionIndicator from './TableSelectionIndicator';
import MobileSeatingCanvas from './MobileSeatingCanvas';
import MobileGroupsPanel from './MobileGroupsPanel';
import StatisticsPanel from './StatisticsPanel';
import Notification from './Notification';
import SeatingModal from './SeatingModal';

// Компонент для отображения стола
const TableComponent = ({ 
  table, 
  onChairClick, 
  onTableClick, 
  onDragOver, 
  onDragLeave, 
  onDrop, 
  dragOverTable, 
  getGroupColor,
  onToggleEnabled,
  showTableControls = false
}) => {
  const { t } = useTranslations();
  const chairCount = table.chairCount || 12;
  const isEnabled = table.enabled !== false; // По умолчанию стол включен

  const getRenderingPosition = () => {
    const rawLeft = table.renderingOptions?.left ?? table.x ?? 0;
    const rawTop = table.renderingOptions?.top ?? table.y ?? 0;
    const angle = table.renderingOptions?.angle ?? table.rotation ?? 0;
    const scaleX = table.renderingOptions?.scaleX ?? 1;
    const scaleY = table.renderingOptions?.scaleY ?? 1;

    const baseWidth = table.renderingOptions?.width ?? table.width ?? (table.shape !== 'rectangle' ? 300 : 400);
    const baseHeight = table.renderingOptions?.height ?? table.height ?? (table.shape !== 'rectangle' ? 300 : 150);

    const left = rawLeft - (baseWidth * scaleX) / 2;
    const top = rawTop - (baseHeight * scaleY) / 2;

    const width = baseWidth * scaleX;
    const height = baseHeight * scaleY;

    return { left, top, angle, scaleX, scaleY, width, height };
  };

  const position = getRenderingPosition();
  const isRound = table.shape !== 'rectangle';

  const tableWidth = position.width;
  const tableHeight = position.height;

  const isDragOver = dragOverTable === table.id;

  const renderChairsForRoundTable = () => {
    const chairs = [];
    const borderWidth = -20;
    const baseRadius = Math.min(tableWidth, tableHeight) / 2;
    const radius = baseRadius + borderWidth + 5;

    const chairSize = Math.max(30, Math.min(50, tableWidth * 0.13));
    const labelFontSize = Math.max(8, Math.min(12, tableWidth * 0.035));

    for (let i = 0; i < chairCount; i++) {
      const angle = (Math.PI * 2 * i) / chairCount;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);

      const person = table.people && table.people[i];
      const isOccupied = Boolean(person);

      chairs.push(
        <div key={i} style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%)`,
          pointerEvents: 'auto'
        }}>
          <div
            onClick={isEnabled ? (e) => {
              e.stopPropagation();
              onChairClick(table.id, i);
            } : undefined}
            style={{
              position: 'absolute',
              left: `${x - chairSize / 2}px`,
              top: `${y - chairSize / 2}px`,
              width: `${chairSize}px`,
              height: `${chairSize}px`,
              borderRadius: '50%',
              backgroundColor: isOccupied ? (person.groupId ? getGroupColor(person.groupId) : '#c12f2f') : '#28592a',
              transform: `rotate(${(angle * 180 / Math.PI) + 90}deg)`,
              transformOrigin: 'center',
              zIndex: 1,
              border: `${Math.max(1, chairSize * 0.05)}px solid #1a1a1a`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              cursor: isEnabled ? 'pointer' : 'not-allowed',
              opacity: isEnabled ? 1 : 0.5
            }}
          />

          {isOccupied && person && person.name && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onChairClick(table.id, i);
              }}
              style={{
                position: 'absolute',
                left: `${x - chairSize * 0.7}px`,
                top: `${y + chairSize * 0.6}px`,
                width: `${chairSize * 1.4}px`,
                fontSize: `${labelFontSize}px`,
                fontFamily: 'Arial',
                color: '#211812',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                textAlign: 'center',
                borderRadius: '3px',
                padding: '2px',
                zIndex: 2,
                pointerEvents: 'auto',
                border: '1px solid #ccc',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2)';
              }}
            >
              ✏️ {person.name}
            </div>
          )}
        </div>
      );
    }

    return chairs;
  };

  const renderChairsForRectangleTable = () => {
    const chairs = [];

    const chairsTop = Math.ceil(chairCount / 2);
    const chairsBottom = chairCount - chairsTop;
    let currentChairIndex = 0;

    const horizontalSpacing = Math.max(80, tableWidth * 0.2);
    const verticalSpacing = 50;
    const chairSize = 40;
    const labelFontSize = 10;

    // Top chairs
    for (let i = 0; i < chairsTop; i++) {
      const ratio = chairsTop === 1 ? 0.5 : i / (chairsTop - 1);
      const x = ((tableWidth - horizontalSpacing) * ratio) - (tableWidth / 2) + (horizontalSpacing / 2);
      const y = -(tableHeight / 2) - verticalSpacing;

      const person = table.people && table.people[currentChairIndex];
      const isOccupied = Boolean(person);

      chairs.push(
        <div key={currentChairIndex} style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%)`,
          pointerEvents: 'auto'
        }}>
          <div
            onClick={isEnabled ? (e) => {
              e.stopPropagation();
              onChairClick(table.id, currentChairIndex);
            } : undefined}
            style={{
              position: 'absolute',
              left: `${x - chairSize / 2}px`,
              top: `${y - chairSize / 2}px`,
              width: `${chairSize}px`,
              height: `${chairSize}px`,
              borderRadius: '50%',
              backgroundColor: isOccupied ? (person.groupId ? getGroupColor(person.groupId) : '#c12f2f') : '#28592a',
              zIndex: 1,
              border: `2px solid #1a1a1a`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              cursor: isEnabled ? 'pointer' : 'not-allowed',
              opacity: isEnabled ? 1 : 0.5
            }}
          />

          {isOccupied && person && person.name && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onChairClick(table.id, currentChairIndex);
              }}
              style={{
                position: 'absolute',
                left: `${x - chairSize * 0.7}px`,
                top: `${y + chairSize * 0.6}px`,
                width: `${chairSize * 1.4}px`,
                fontSize: `${labelFontSize}px`,
                fontFamily: 'Arial',
                color: '#211812',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                textAlign: 'center',
                borderRadius: '3px',
                padding: '2px',
                zIndex: 2,
                pointerEvents: 'auto',
                border: '1px solid #ccc',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2)';
              }}
            >
              ✏️ {person.name}
            </div>
          )}
        </div>
      );

      currentChairIndex++;
    }

    // Bottom chairs
    for (let i = 0; i < chairsBottom; i++) {
      const ratio = chairsBottom === 1 ? 0.5 : i / (chairsBottom - 1);
      const x = ((tableWidth - horizontalSpacing) * ratio) - (tableWidth / 2) + (horizontalSpacing / 2);
      const y = (tableHeight / 2) + verticalSpacing;

      const person = table.people && table.people[currentChairIndex];
      const isOccupied = Boolean(person);

      chairs.push(
        <div key={currentChairIndex} style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%)`,
          pointerEvents: 'auto'
        }}>
          <div
            onClick={isEnabled ? (e) => {
              e.stopPropagation();
              onChairClick(table.id, currentChairIndex);
            } : undefined}
            style={{
              position: 'absolute',
              left: `${x - chairSize / 2}px`,
              top: `${y - chairSize / 2}px`,
              width: `${chairSize}px`,
              height: `${chairSize}px`,
              borderRadius: '50%',
              backgroundColor: isOccupied ? (person.groupId ? getGroupColor(person.groupId) : '#c12f2f') : '#28592a',
              zIndex: 1,
              border: `2px solid #1a1a1a`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              cursor: isEnabled ? 'pointer' : 'not-allowed',
              opacity: isEnabled ? 1 : 0.5
            }}
          />

          {isOccupied && person && person.name && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onChairClick(table.id, currentChairIndex);
              }}
              style={{
                position: 'absolute',
                left: `${x - chairSize * 0.7}px`,
                top: `${y + chairSize * 0.6}px`,
                width: `${chairSize * 1.4}px`,
                fontSize: `${labelFontSize}px`,
                fontFamily: 'Arial',
                color: '#211812',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                textAlign: 'center',
                borderRadius: '3px',
                padding: '2px',
                zIndex: 2,
                pointerEvents: 'auto',
                border: '1px solid #ccc',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2)';
              }}
            >
              ✏️ {person.name}
            </div>
          )}
        </div>
      );

      currentChairIndex++;
    }

    return chairs;
  };

  return (
    <>
      <div
        className="table-container"
        data-id={table.id}
        style={{
          position: 'absolute',
          left: `${position.left}px`,
          top: `${position.top}px`,
          cursor: isEnabled ? 'pointer' : 'not-allowed',
          transformOrigin: 'center center',
          zIndex: 10,
          width: `${tableWidth}px`,
          height: `${tableHeight}px`,
          opacity: isEnabled ? 1 : 0.4,
          filter: isEnabled ? 'none' : 'grayscale(100%)'
        }}
        onDragOver={isEnabled ? (e) => onDragOver(e, table.id) : undefined}
        onDragLeave={isEnabled ? onDragLeave : undefined}
        onDrop={isEnabled ? (e) => onDrop(e, table.id) : undefined}
        onClick={(e) => onTableClick(e, table)}
      >
        <div style={{ position: 'relative' }}>
          {isDragOver && (
            <div style={{
              position: 'absolute',
              top: '-10px',
              left: '-10px',
              right: '-10px',
              bottom: '-10px',
              backgroundColor: 'rgba(52, 152, 219, 0.3)',
              border: '3px dashed #3498db',
              borderRadius: isRound ? '50%' : '12px',
              zIndex: 1,
              pointerEvents: 'none'
            }} />
          )}

          {isRound ? (
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: `${tableWidth}px`,
                  height: `${tableHeight}px`,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    width: `${tableWidth - 40}px`,
                    height: `${tableHeight - 40}px`,
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    opacity: 0.8
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: '25px',
                    left: '25px',
                    width: `${tableWidth - 50}px`,
                    height: `${tableHeight - 50}px`,
                    borderRadius: '50%',
                    backgroundColor: '#e0d6cc',
                    border: '20px solid #a67c52',
                    boxSizing: 'border-box'
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${Math.max(10, Math.min(16, tableWidth * 0.04))}px`,
                    fontFamily: 'Arial',
                    color: '#374151',
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    padding: `${Math.max(2, Math.min(6, tableWidth * 0.015))}px`,
                    borderRadius: '4px',
                    lineHeight: 1.1,
                    zIndex: 3,
                    fontWeight: 'bold',
                    border: '1px solid #ccc',
                    overflow: 'hidden',
                    maxWidth: `${tableWidth * 0.8}px`,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis'
                  }}
                >
                  <div style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: `${Math.max(8, Math.min(14, tableWidth * 0.035))}px`
                  }}>
                    {table.name || `Стол ${table.id}`}
                  </div>
                  <div style={{
                    fontSize: `${Math.max(6, Math.min(10, tableWidth * 0.025))}px`,
                    color: '#666',
                    marginTop: '1px'
                  }}>
                    {chairCount} мест
                  </div>
                </div>
              </div>

              {renderChairsForRoundTable()}
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: `${tableWidth}px`,
                  height: `${tableHeight}px`,
                  backgroundColor: '#e7d8c7',
                  border: '20px solid #7b5c3e',
                  borderRadius: '8px',
                  position: 'relative',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    width: `${tableWidth - 40}px`,
                    height: `${tableHeight - 40}px`,
                    backgroundColor: '#ffffff',
                    opacity: 0.8,
                    borderRadius: '5px'
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: '25px',
                    left: '25px',
                    width: `${tableWidth - 50}px`,
                    height: `${tableHeight - 50}px`,
                    backgroundColor: '#e7d8c7',
                    borderRadius: '3px'
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '20px',
                    fontFamily: 'Arial',
                    color: '#374151',
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '8px',
                    borderRadius: '6px',
                    lineHeight: 1.2,
                    zIndex: 3,
                    fontWeight: 'bold',
                    border: '1px solid #ddd'
                  }}
                >
                  {table.name || `Стол ${table.id}`}<br />
                  {chairCount} мест
                </div>
              </div>

              {renderChairsForRectangleTable()}
            </div>
          )}
        </div>
      </div>

      {/* Кнопка управления столом - отдельно от контейнера стола */}
      {showTableControls && (
        <div
          style={{
            position: 'absolute',
            left: `${position.left + tableWidth / 2}px`,
            top: `${position.top + tableHeight / 2}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: 30
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleEnabled(table.id);
            }}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: isEnabled ? '#e74c3c' : '#27ae60',
              color: 'white',
              border: '4px solid white',
              cursor: 'pointer',
              fontSize: '24px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isEnabled ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(39, 174, 96, 0.6)',
              transition: 'all 0.2s ease',
              opacity: 1,
              filter: 'none'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.1)';
              e.target.style.boxShadow = isEnabled ? '0 6px 20px rgba(0,0,0,0.5)' : '0 6px 20px rgba(39, 174, 96, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = isEnabled ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(39, 174, 96, 0.6)';
            }}
            title={isEnabled ? t('disableTable') : t('enableTable')}
          >
            {isEnabled ? '✕' : '✓'}
          </button>
        </div>
      )}
    </>
  );
};

// Основной компонент приложения
const ClientSeatingAppContent = () => {
  const { state, dispatch, actions } = useSeating();
  const { t } = useTranslations();
  const { getGroupColor } = useGroups();
  const { 
    hallData, 
    handleChairClick, 
    handleTableClick, 
    handleTableDragOver, 
    handleTableDragLeave, 
    handleTableDrop,
    dragOverTable,
    toggleTableEnabled,
    getActiveTables,
    getDisabledTables
  } = useTables();
  const { renderShapes } = useShapes();

  const { windowWidth, isMobileGroupsExpanded, showTableControls } = state;
  
  // Ref для хранения функций масштабирования
  const zoomFunctionsRef = React.useRef(null);

  return (
    <div className="simple-seating-container" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: 'Arial, sans-serif',
      paddingTop: '60px' // Отступ для фиксированного header
    }}>
      <Header />

      {/* Statistics Panel */}
      {state.groups && state.groups.length > 0 && state.showStatistics && (
        <div style={{
          padding: '0 20px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e9ecef'
        }}>
          <StatisticsPanel />
        </div>
      )}

      {/* Main content area */}
      <div className="main-content" style={{
        flex: 1,
        width: '100%',
        height: windowWidth > 768
          ? (state.groups && state.groups.length > 0 && state.showStatistics ? 'calc(100vh - 340px)' : 'calc(100vh - 250px)')
          : isMobileGroupsExpanded
            ? (state.groups && state.groups.length > 0 && state.showStatistics ? 'calc(100vh - 350px)' : 'calc(100vh - 260px)')
            : (state.groups && state.groups.length > 0 && state.showStatistics ? 'calc(100vh - 260px)' : 'calc(100vh - 170px)'),
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div className="zoom-container">
          <TransformWrapper
            initialScale={1}
            minScale={0.1}
            maxScale={4}
            limitToBounds={false}
            doubleClick={{ disabled: true }}
            pinch={{ step: 5 }}
            wheel={{ step: 0.05 }}
            onZoomChange={({ state }) => {
              // Обработка изменения зума
            }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => {
              // Сохраняем функции масштабирования для мобильных кнопок
              zoomFunctionsRef.current = { zoomIn, zoomOut, resetTransform };
              
              return (
              <>
                {/* Desktop Zoom Controls */}
                {windowWidth > 768 && (
                  <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <button
                      onClick={() => zoomIn(0.2)}
                      style={{
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        fontSize: '18px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                      }}
                      title="Увеличить масштаб"
                    >
                      +
                    </button>
                    <button
                      onClick={() => zoomOut(0.2)}
                      style={{
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        fontSize: '18px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                      }}
                      title="Уменьшить масштаб"
                    >
                      -
                    </button>
                    <button
                      onClick={() => resetTransform()}
                      style={{
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        fontSize: '18px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                      }}
                      title="Сбросить масштаб"
                    >
                      🔄
                    </button>
                  </div>
                )}

                <TransformComponent
                  wrapperStyle={{ width: "100%", height: "100vh" }}
                  contentStyle={{ width: "100%", height: "100%" }}
                  className="tables-area"
                >
                  {hallData ? (
                    <div
                      className="tables-content"
                      style={{
                        position: 'relative',
                        minWidth: '3000px',
                        minHeight: '3000px',
                        willChange: 'transform'
                      }}
                    >
                      {/* Render shapes (elements of the hall) */}
                      {renderShapes()}
                      
                      {/* Render tables */}
                      {hallData.tables && hallData.tables.map((table) => (
                        <TableComponent 
                          key={table.id} 
                          table={table}
                          onChairClick={handleChairClick}
                          onTableClick={handleTableClick}
                          onDragOver={handleTableDragOver}
                          onDragLeave={handleTableDragLeave}
                          onDrop={handleTableDrop}
                          dragOverTable={dragOverTable}
                          getGroupColor={getGroupColor}
                          onToggleEnabled={toggleTableEnabled}
                          showTableControls={showTableControls}
                        />
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      width: '100%',
                      flexDirection: 'column',
                      padding: '20px'
                    }}>
                      <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                        textAlign: 'center',
                        maxWidth: '500px',
                        width: '90%'
                      }}>
                        <h2 style={{ marginTop: 0 }}>{t('system')}</h2>
                        <p>{t('loadHallPlan')}</p>
                        <input
                          type="file"
                          accept=".json"
                          onChange={(e) => {
                            // Обработка загрузки файла
                          }}
                          id="import-file-center"
                          style={{ display: 'none' }}
                        />
                        <label
                          htmlFor="import-file-center"
                          style={{
                            backgroundColor: '#2ecc71',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '12px 24px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            display: 'inline-block',
                            marginTop: '15px',
                            fontWeight: 'bold'
                          }}
                        >
                          {t('loadHallPlanBtn')}
                        </label>
                      </div>
                    </div>
                  )}
                </TransformComponent>
              </>
            );
          }}
          </TransformWrapper>
        </div>
      </div>

      {/* Desktop drag hint - hidden on mobile */}
      {hallData && windowWidth > 768 && (
        <div style={{
          position: 'absolute',
          bottom: '15px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 15px',
          borderRadius: '20px',
          fontSize: '12px',
          zIndex: 10,
          textAlign: 'center',
          pointerEvents: 'none',
          opacity: '0.8'
        }}>
          {t('dragGroupToTable')}
        </div>
      )}

      {/* Панели и модальные окна */}
      <GroupsPanel />
      <MobileGroupsPanel />
      <PersonModal />
      <CreateGroupModal />
      <GroupDetailsModal />
      <EditGroupModal />
              <TableSelectionModal />
        <TableSelectionIndicator />
      <MobileSeatingCanvas />

      {/* Mobile Groups Button */}
      {windowWidth <= 768 && (
        <button
          onClick={() => dispatch({ type: actions.SET_IS_MOBILE_GROUPS_EXPANDED, payload: !isMobileGroupsExpanded })}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            backgroundColor: isMobileGroupsExpanded ? '#e74c3c' : '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          title={isMobileGroupsExpanded ? t('closeGroups') : t('groups')}
        >
          👥
        </button>
      )}

      {/* Mobile Navigation */}
      {windowWidth <= 768 && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 1000
        }}>
          {/* Zoom Controls */}
          <button
            onClick={() => {
              if (zoomFunctionsRef.current) {
                zoomFunctionsRef.current.zoomIn(0.2);
              }
            }}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              fontSize: '18px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}
            title="Увеличить масштаб"
          >
            +
          </button>
          
          <button
            onClick={() => {
              if (zoomFunctionsRef.current) {
                zoomFunctionsRef.current.zoomOut(0.2);
              }
            }}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              fontSize: '18px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}
            title="Уменьшить масштаб"
          >
            -
          </button>
          
          <button
            onClick={() => {
              if (zoomFunctionsRef.current) {
                zoomFunctionsRef.current.resetTransform();
              }
            }}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              fontSize: '18px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}
            title="Сбросить масштаб"
          >
            🔄
          </button>

          {/* Statistics Toggle Button */}
          <button
            onClick={() => dispatch({ type: actions.SET_SHOW_STATISTICS, payload: !state.showStatistics })}
            style={{
              backgroundColor: state.showStatistics ? '#e74c3c' : '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              fontSize: '18px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={state.showStatistics ? t('hideStatistics') : t('showStatistics')}
          >
            📊
          </button>

          {/* Quick Actions Button */}
          <button
            onClick={() => dispatch({ type: actions.SET_SHOW_MOBILE_MENU, payload: !state.showMobileMenu })}
            style={{
              backgroundColor: '#f39c12',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              fontSize: '18px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={t('quickActions')}
          >
            ⚙️
          </button>
        </div>
      )}

      {/* Notification Component */}
      <Notification />
      
      {/* Seating Modal for People Selection */}
      <SeatingModal />
    </div>
  );
};

// Обертка с провайдером контекста
const ClientSeatingApp = () => {
  return (
    <SeatingProvider>
      <ClientSeatingAppContent />
    </SeatingProvider>
  );
};

export default ClientSeatingApp; 