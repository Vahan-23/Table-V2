import React, { useState } from 'react';
import { useSeating } from './SeatingContext';
import { useTranslations } from './useTranslations';
import { useFileUpload } from './useFileUpload';
import { useTables } from './useTables';
import ImportJsonModal from './ImportJsonModal';
import ExportToA5Modal from './ExportToA5Modal';
import ExportToHDTemplateModal from './ExportToHDTemplateModal';
import { useExportToA5 } from './useExportToA5';
import { useExportToHDTemplate } from './useExportToHDTemplate';

const Header = () => {
  const { state, dispatch, actions } = useSeating();
  const { t, language } = useTranslations();
  const { isLoading, error, handleFileUpload } = useFileUpload();
  const { clearAllTables } = useTables();
  const { hallData, windowWidth, showMobileMenu, isBurgerOpen, showTableControls } = state;
  const [showExportModal, setShowExportModal] = useState(false);
  const [showHDExportModal, setShowHDExportModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  
  // Добавляем хуки для экспорта
  const { exportToTableDesignV2, exportToPDFTableDesignV2 } = useExportToA5();
  const { exportToPDF: exportToHDTemplatePDF, exportToHTML: exportToHDTemplateHTML } = useExportToHDTemplate();

  const handleLanguageChange = () => {
    const newLanguage = language === 'ru' ? 'hy' : 'ru';
    dispatch({ type: actions.SET_LANGUAGE, payload: newLanguage });
  };

  const handleQuickExportTableDesignV2 = () => {
    try {
      exportToTableDesignV2();
    } catch (error) {
      console.error('Ошибка при быстром экспорте:', error);
      alert('Ошибка при экспорте. Попробуйте использовать модальное окно экспорта.');
    }
  };

  const handleQuickExportPDFTableDesignV2 = async () => {
    try {
      await exportToPDFTableDesignV2();
    } catch (error) {
      console.error('Ошибка при быстром экспорте PDF:', error);
      alert('Ошибка при экспорте PDF. Попробуйте использовать модальное окно экспорта.');
    }
  };

  const handleQuickExportHDTemplate = () => {
    try {
      exportToHDTemplateHTML();
    } catch (error) {
      console.error('Ошибка при быстром экспорте HD шаблона:', error);
      alert('Ошибка при экспорте HD шаблона. Попробуйте использовать модальное окно экспорта.');
    }
  };

  const handleQuickExportPDFHDTemplate = async () => {
    try {
      await exportToHDTemplatePDF();
    } catch (error) {
      console.error('Ошибка при быстром экспорте PDF HD шаблона:', error);
      alert('Ошибка при экспорте PDF HD шаблона. Попробуйте использовать модальное окно экспорта.');
    }
  };

  const toggleMobileMenu = () => {
    dispatch({ type: actions.SET_SHOW_MOBILE_MENU, payload: !showMobileMenu });
    dispatch({ type: actions.SET_IS_BURGER_OPEN, payload: !isBurgerOpen });
  };

  const closeMobileMenu = () => {
    dispatch({ type: actions.SET_SHOW_MOBILE_MENU, payload: false });
    dispatch({ type: actions.SET_IS_BURGER_OPEN, payload: false });
  };

  const toggleTableControls = () => {
    dispatch({ type: actions.SET_SHOW_TABLE_CONTROLS, payload: !showTableControls });
  };

  const toggleStatistics = () => {
    dispatch({ type: actions.SET_SHOW_STATISTICS, payload: !state.showStatistics });
  };

  const toggleGroupsPanel = () => {
    dispatch({ type: actions.SET_SHOW_GROUPS_PANEL, payload: !state.showGroupsPanel });
  };

  const handleClearAllTables = () => {
    if (window.confirm(t('clearAllTablesConfirm'))) {
      clearAllTables();
      alert(t('allTablesCleared'));
    }
  };

  return (
    <>
             {/* Header */}
       <header className="app-header" style={{
         position: 'fixed',
         top: 0,
         left: 0,
         right: 0,
         padding: '8px 12px',
         backgroundColor: '#0a0a1d',
         color: 'white',
         boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
         zIndex: 100,
         display: 'flex',
         justifyContent: 'space-between',
         alignItems: 'center'
       }}>
        {/* Desktop Header */}
        {windowWidth > 768 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}>
                {hallData?.name || t('guestSeating')}
              </div>

              {/* Import buttons group */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <div className="import-container">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    id="import-file"
                    className="file-input"
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="import-file"
                    className="import-button"
                    style={{
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: '2px solid white',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.05)';
                      e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
                    }}
                  >
                    📁 {t('loadPlan')}
                  </label>
                  {isLoading && <div style={{
                    position: 'absolute',
                    top: '60px',
                    left: '0',
                    color: 'white',
                    fontSize: '11px',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>{t('loading')}</div>}
                  {error && <div style={{
                    position: 'absolute',
                    top: '60px',
                    left: '0',
                    color: '#ff6b6b',
                    fontSize: '11px',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    maxWidth: '180px'
                  }}>{error}</div>}
                </div>

                <button
                  onClick={() => dispatch({ type: actions.SET_SHOW_IMPORT_JSON_MODAL, payload: true })}
                  style={{
                    backgroundColor: '#9b59b6',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
                  }}
                  title="Импорт гостей из JSON"
                >
                  📥 Гости
                </button>
              </div>

              {/* Test Groups Button */}
              <button
                onClick={() => dispatch({ type: actions.CREATE_TEST_GROUPS })}
                style={{
                  backgroundColor: '#f39c12',
                  color: 'white',
                  border: '2px solid white',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
                }}
                title="Создать тестовые группы"
              >
                🧪 Тест
              </button>

              {/* Clear All Groups Button */}
              {state.groups && state.groups.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Вы уверены, что хотите удалить все группы?')) {
                      dispatch({ type: actions.CLEAR_ALL_GROUPS });
                    }
                  }}
                  style={{
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
                  }}
                  title="Удалить все группы"
                >
                  🗑️ Группы
                </button>
              )}

              {/* Templates Modal Button */}
              {hallData && (
                <button
                  onClick={() => setShowTemplatesModal(true)}
                  style={{
                    backgroundColor: '#16a085',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s',
                    marginRight: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
                  }}
                  title="Шаблоны экспорта"
                >
                  📋 Шаблоны
                </button>
              )}


              {/* Statistics */}
              {state.groups && state.groups.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <span style={{ color: '#3498db', fontWeight: 'bold' }}>
                    {state.groups.reduce((total, group) => total + (group.people?.length || 0), 0)}
                  </span>
                  <span style={{ color: '#95a5a6' }}>/</span>
                  <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                    {state.hallData?.tables?.reduce((total, table) => {
                      return total + (table.people?.filter(person => person).length || 0);
                    }, 0) || 0}
                  </span>
                  <span style={{ color: '#95a5a6', fontSize: '9px' }}>
                    {t('people')}
                  </span>
                </div>
              )}
            </div>

            {/* Right side controls */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Table Controls Button */}
              {hallData && (
                <button
                  onClick={toggleTableControls}
                  style={{
                    backgroundColor: showTableControls ? '#e74c3c' : '#2ecc71',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
                  }}
                  title={showTableControls ? t('hideTableControls') : t('showTableControls')}
                >
                  {showTableControls ? '🔴' : '🟢'} {showTableControls ? t('hideTableControls') : t('tableControls')}
                </button>
              )}

              {/* Statistics Toggle Button */}
              {state.groups && state.groups.length > 0 && (
                <button
                  onClick={toggleStatistics}
                  style={{
                    backgroundColor: state.showStatistics ? '#e74c3c' : '#2ecc71',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
                  }}
                  title={state.showStatistics ? t('hideStatistics') : t('showStatistics')}
                >
                  📊 {state.showStatistics ? t('hideStatistics') : t('showStatistics')}
                </button>
              )}

              {/* Groups Panel Toggle Button */}
              {state.groups && state.groups.length > 0 && (
                <button
                  onClick={toggleGroupsPanel}
                  style={{
                    backgroundColor: state.showGroupsPanel ? '#e74c3c' : '#2ecc71',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
                  }}
                  title={state.showGroupsPanel ? t('hideGroups') : t('showGroups')}
                >
                  👥 {state.showGroupsPanel ? t('hideGroups') : t('showGroups')}
                </button>
              )}

              {/* Clear All Tables Button */}
              {hallData && (
                <button
                  onClick={handleClearAllTables}
                  style={{
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
                  }}
                  title={t('clearAllTables')}
                >
                  🗑️ {t('clearAllTables')}
                </button>
              )}

              {/* Language switcher */}
              <button
                onClick={handleLanguageChange}
                style={{
                  backgroundImage: `url(${language === 'ru'
                    ? 'https://flagcdn.com/am.svg'
                    : 'https://flagcdn.com/ru.svg'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  color: 'white',
                  border: '2px solid white',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  minWidth: '90px',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
                }}
              >
                <span style={{
                  fontSize: '14px',
                  letterSpacing: '0.5px',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  color: 'white',
                  zIndex: 1
                }}>
                  {language === 'ru' ? 'Հայ' : 'Рус'}
                </span>
              </button>
            </div>
          </>
        ) : (
          /* Mobile Header */
          <>
            <div style={{
              fontSize: '18px',
              fontWeight: 'bold',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {hallData?.name || t('guestSeating')}
            </div>

            {/* Mobile Table Controls Button */}
            {hallData && (
              <button
                onClick={toggleTableControls}
                style={{
                  backgroundColor: showTableControls ? '#e74c3c' : '#2ecc71',
                  color: 'white',
                  border: '2px solid white',
                  borderRadius: '8px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginRight: '8px',
                  transition: 'all 0.2s'
                }}
                onTouchStart={(e) => {
                  e.target.style.transform = 'scale(0.95)';
                }}
                onTouchEnd={(e) => {
                  e.target.style.transform = 'scale(1)';
                }}
                title={showTableControls ? t('hideTableControls') : t('showTableControls')}
              >
                {showTableControls ? '🔴' : '🟢'}
              </button>
            )}

            {/* Mobile burger menu button */}
            <button
              onClick={toggleMobileMenu}
              style={{
                background: 'none',
                border: '2px solid white',
                color: 'white',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onTouchStart={(e) => {
                e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                e.target.style.transform = 'scale(0.95)';
              }}
              onTouchEnd={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.transform = 'scale(1)';
              }}
            >
              {/* Animated burger lines */}
              <div style={{
                width: '18px',
                height: '2px',
                backgroundColor: 'white',
                borderRadius: '1px',
                transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                transform: isBurgerOpen
                  ? 'rotate(45deg) translateY(5px)'
                  : 'rotate(0deg) translateY(0px)',
                transformOrigin: 'center',
                pointerEvents: 'none'
              }}></div>

              <div style={{
                width: '18px',
                height: '2px',
                backgroundColor: 'white',
                borderRadius: '1px',
                transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                opacity: isBurgerOpen ? '0' : '1',
                transform: isBurgerOpen ? 'scaleX(0)' : 'scaleX(1)',
                transformOrigin: 'center',
                pointerEvents: 'none'
              }}></div>

              <div style={{
                width: '18px',
                height: '2px',
                backgroundColor: 'white',
                borderRadius: '1px',
                transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                transform: isBurgerOpen
                  ? 'rotate(-45deg) translateY(-5px)'
                  : 'rotate(0deg) translateY(0px)',
                transformOrigin: 'center',
                pointerEvents: 'none'
              }}></div>

              {/* Notification dots for loaded plan and groups */}
              {(hallData || state.groups.length > 0) && (
                <div style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '8px',
                  height: '8px',
                  backgroundColor: hallData ? '#2ecc71' : '#f39c12',
                  borderRadius: '50%',
                  border: '1px solid #0a0a1d',
                  animation: hallData ? 'none' : 'pulse 2s infinite',
                  transition: 'all 0.3s ease',
                  opacity: isBurgerOpen ? 0 : 1,
                  transform: isBurgerOpen ? 'scale(0)' : 'scale(1)',
                  pointerEvents: 'none'
                }}></div>
              )}
            </button>
          </>
        )}
      </header>

             {/* Mobile Menu */}
       {showMobileMenu && (
         <div style={{
           position: 'fixed',
           top: 0,
           left: 0,
           width: '100%',
           height: '100%',
           backgroundColor: 'rgba(0, 0, 0, 0.8)',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           zIndex: 2000,
           padding: '15px',
           boxSizing: 'border-box'
         }}>
           <div style={{
             backgroundColor: '#0a0a1d',
             borderRadius: '12px',
             padding: '20px',
             width: '100%',
             maxWidth: '380px',
             maxHeight: '90vh',
             boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
             color: 'white',
             animation: 'slideDown 0.3s ease-out',
             overflow: 'auto'
           }}>
                         <div style={{
               display: 'flex',
               justifyContent: 'space-between',
               alignItems: 'center',
               marginBottom: '15px',
               borderBottom: '2px solid rgba(255,255,255,0.1)',
               paddingBottom: '10px'
             }}>
               <h2 style={{ margin: 0, color: 'white', fontSize: '18px' }}>
                 ⚙️ {t('settings')}
               </h2>
               <button
                 onClick={closeMobileMenu}
                 style={{
                   background: 'none',
                   border: 'none',
                   fontSize: '20px',
                   fontWeight: 'bold',
                   cursor: 'pointer',
                   color: 'white',
                   width: '25px',
                   height: '25px',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center'
                 }}
               >
                 ×
               </button>
             </div>

                         {/* Language Selection */}
             <div style={{ marginBottom: '15px' }}>
               <h3 style={{
                 margin: '0 0 8px 0',
                 color: 'white',
                 fontSize: '14px',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '6px'
               }}>
                 🌐 {t('language')}
               </h3>
               <div style={{ display: 'flex', gap: '8px' }}>
                 <button
                   onClick={() => {
                     dispatch({ type: actions.SET_LANGUAGE, payload: 'ru' });
                     closeMobileMenu();
                   }}
                   style={{
                     flex: 1,
                     padding: '8px',
                     backgroundColor: language === 'ru' ? '#3498db' : 'rgba(255,255,255,0.1)',
                     color: 'white',
                     border: `1px solid ${language === 'ru' ? '#3498db' : 'rgba(255,255,255,0.3)'}`,
                     borderRadius: '6px',
                     cursor: 'pointer',
                     fontSize: '12px',
                     fontWeight: 'bold',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: '6px',
                     transition: 'all 0.2s ease'
                   }}
                 >
                   <span style={{
                     width: '16px',
                     height: '12px',
                     backgroundImage: 'url(https://flagcdn.com/ru.svg)',
                     backgroundSize: 'cover',
                     backgroundPosition: 'center',
                     borderRadius: '2px'
                   }}></span>
                   <span>Русский</span>
                 </button>
                 <button
                   onClick={() => {
                     dispatch({ type: actions.SET_LANGUAGE, payload: 'hy' });
                     closeMobileMenu();
                   }}
                   style={{
                     flex: 1,
                     padding: '8px',
                     backgroundColor: language === 'hy' ? '#3498db' : 'rgba(255,255,255,0.1)',
                     color: 'white',
                     border: `1px solid ${language === 'hy' ? '#3498db' : 'rgba(255,255,255,0.3)'}`,
                     borderRadius: '6px',
                     cursor: 'pointer',
                     fontSize: '12px',
                     fontWeight: 'bold',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: '6px',
                     transition: 'all 0.2s ease'
                   }}
                 >
                   <span style={{
                     width: '16px',
                     height: '12px',
                     backgroundImage: 'url(https://flagcdn.com/am.svg)',
                     backgroundSize: 'cover',
                     backgroundPosition: 'center',
                     borderRadius: '2px'
                   }}></span>
                   <span>Հայերեն</span>
                 </button>
               </div>
             </div>

                         {/* Groups Management */}
             <div style={{ marginBottom: '15px' }}>
               <h3 style={{
                 margin: '0 0 8px 0',
                 color: 'white',
                 fontSize: '14px',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '6px'
               }}>
                 👥 {t('groups')}
               </h3>

               <div style={{ display: 'flex', gap: '8px' }}>
                 <button
                   onClick={() => {
                     dispatch({ type: actions.SET_IS_MOBILE_GROUPS_EXPANDED, payload: true });
                     closeMobileMenu();
                   }}
                   style={{
                     flex: 1,
                     padding: '8px',
                     backgroundColor: '#3498db',
                     color: 'white',
                     border: '1px solid rgba(255,255,255,0.3)',
                     borderRadius: '6px',
                     cursor: 'pointer',
                     fontSize: '12px',
                     fontWeight: 'bold',
                     textAlign: 'center',
                     transition: 'all 0.2s ease'
                   }}
                   onTouchStart={(e) => {
                     e.target.style.transform = 'scale(0.95)';
                   }}
                   onTouchEnd={(e) => {
                     e.target.style.transform = 'scale(1)';
                   }}
                 >
                   📋 {t('manageGroups')}
                 </button>

                 <button
                   onClick={() => {
                     dispatch({ type: actions.SET_SHOW_ADD_GROUP_MODAL, payload: true });
                     closeMobileMenu();
                   }}
                   style={{
                     flex: 1,
                     padding: '8px',
                     backgroundColor: '#2ecc71',
                     color: 'white',
                     border: '1px solid rgba(255,255,255,0.3)',
                     borderRadius: '6px',
                     cursor: 'pointer',
                     fontSize: '12px',
                     fontWeight: 'bold',
                     textAlign: 'center',
                     transition: 'all 0.2s ease'
                   }}
                   onTouchStart={(e) => {
                     e.target.style.transform = 'scale(0.95)';
                   }}
                   onTouchEnd={(e) => {
                     e.target.style.transform = 'scale(1)';
                   }}
                 >
                   ➕ {t('createGroup')}
                 </button>
               </div>
             </div>

                         {/* File Upload */}
             <div style={{ marginBottom: '15px' }}>
               <h3 style={{
                 margin: '0 0 8px 0',
                 color: 'white',
                 fontSize: '14px',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '6px'
               }}>
                 📁 {t('loadPlan')}
               </h3>

               <input
                 type="file"
                 accept=".json"
                 onChange={(e) => {
                   handleFileUpload(e);
                   closeMobileMenu();
                 }}
                 id="mobile-import-file"
                 style={{ display: 'none' }}
               />

               <label
                 htmlFor="mobile-import-file"
                 style={{
                   display: 'block',
                   padding: '8px',
                   backgroundColor: '#2ecc71',
                   color: 'white',
                   border: '1px solid rgba(255,255,255,0.3)',
                   borderRadius: '6px',
                   cursor: 'pointer',
                   fontSize: '12px',
                   fontWeight: 'bold',
                   textAlign: 'center',
                   transition: 'all 0.2s ease'
                 }}
                 onTouchStart={(e) => {
                   e.target.style.transform = 'scale(0.95)';
                 }}
                 onTouchEnd={(e) => {
                   e.target.style.transform = 'scale(1)';
                 }}
               >
                 📂 {t('loadHallPlanBtn')}
               </label>

               {isLoading && (
                 <div style={{
                   marginTop: '6px',
                   padding: '4px 8px',
                   backgroundColor: 'rgba(255,255,255,0.1)',
                   borderRadius: '4px',
                   fontSize: '10px',
                   textAlign: 'center',
                   color: '#74b9ff'
                 }}>
                   ⏳ {t('loading')}
                 </div>
               )}

               {error && (
                 <div style={{
                   marginTop: '6px',
                   padding: '4px 8px',
                   backgroundColor: 'rgba(231, 76, 60, 0.2)',
                   border: '1px solid #e74c3c',
                   borderRadius: '4px',
                   fontSize: '10px',
                   textAlign: 'center',
                   color: '#ff6b6b'
                 }}>
                   ❌ {error}
                 </div>
               )}
             </div>

                         {/* Current Status */}
             {hallData && (
               <div style={{
                 backgroundColor: 'rgba(46, 204, 113, 0.1)',
                 border: '1px solid rgba(46, 204, 113, 0.3)',
                 borderRadius: '6px',
                 padding: '8px',
                 marginBottom: '15px'
               }}>
                 <div style={{
                   fontSize: '10px',
                   color: '#2ecc71',
                   fontWeight: 'bold',
                   marginBottom: '3px',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '4px'
                 }}>
                   ✅ {t('planLoaded')}
                 </div>
                 <div style={{ fontSize: '9px', color: '#bdc3c7' }}>
                   {hallData.name || t('guestSeating')}
                 </div>
                 {hallData.tables && (
                   <div style={{ fontSize: '9px', color: '#bdc3c7', marginTop: '1px' }}>
                     📊 {hallData.tables.length} {t('tables')}
                   </div>
                 )}
               </div>
             )}

                         {/* Clear All Tables Button - Mobile */}
             {hallData && (
               <div style={{ marginBottom: '15px' }}>
                 <h3 style={{
                   margin: '0 0 8px 0',
                   color: 'white',
                   fontSize: '14px',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '6px'
                 }}>
                   🗑️ {t('clearAllTables')}
                 </h3>
                 <button
                   onClick={() => {
                     handleClearAllTables();
                     closeMobileMenu();
                   }}
                   style={{
                     width: '100%',
                     padding: '8px',
                     backgroundColor: '#e74c3c',
                     color: 'white',
                     border: '1px solid rgba(255,255,255,0.3)',
                     borderRadius: '6px',
                     cursor: 'pointer',
                     fontSize: '12px',
                     fontWeight: 'bold',
                     transition: 'all 0.2s ease'
                   }}
                   onTouchStart={(e) => {
                     e.target.style.transform = 'scale(0.95)';
                   }}
                   onTouchEnd={(e) => {
                     e.target.style.transform = 'scale(1)';
                   }}
                 >
                   🗑️ {t('clearAllTables')}
                 </button>
               </div>
             )}

             {/* Quick Export Button - Mobile */}
             {hallData && (
               <div style={{ marginBottom: '15px' }}>
                 <h3 style={{
                   margin: '0 0 8px 0',
                   color: 'white',
                   fontSize: '14px',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '6px'
                 }}>
                   🎨 {t('exportTableDesignV2') || 'Шаблон A5'}
                 </h3>
                 <button
                   onClick={() => {
                     handleQuickExportTableDesignV2();
                     closeMobileMenu();
                   }}
                   disabled={!hallData?.tables?.some(table => table.people?.some(person => person))}
                   style={{
                     width: '100%',
                     padding: '8px',
                     backgroundColor: hallData?.tables?.some(table => table.people?.some(person => person)) ? '#e67e22' : '#95a5a6',
                     color: 'white',
                     border: '1px solid rgba(255,255,255,0.3)',
                     borderRadius: '6px',
                     cursor: hallData?.tables?.some(table => table.people?.some(person => person)) ? 'pointer' : 'not-allowed',
                     fontSize: '12px',
                     fontWeight: 'bold',
                     transition: 'all 0.2s ease',
                     opacity: hallData?.tables?.some(table => table.people?.some(person => person)) ? 1 : 0.5
                   }}
                   onTouchStart={(e) => {
                     if (hallData?.tables?.some(table => table.people?.some(person => person))) {
                       e.target.style.transform = 'scale(0.95)';
                     }
                   }}
                   onTouchEnd={(e) => {
                     e.target.style.transform = 'scale(1)';
                   }}
                 >
                   🎨 {t('exportTableDesignV2') || 'Шаблон A5'}
                 </button>
               </div>
             )}

             {/* Quick Export PDF Button - Mobile */}
             {hallData && (
               <div style={{ marginBottom: '15px' }}>
                 <h3 style={{
                   margin: '0 0 8px 0',
                   color: 'white',
                   fontSize: '14px',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '6px'
                 }}>
                   📄 {t('exportPDFTableDesignV2') || 'Шаблон A5 (PDF)'}
                 </h3>
                 <button
                   onClick={() => {
                     handleQuickExportPDFTableDesignV2();
                     closeMobileMenu();
                   }}
                   disabled={!hallData?.tables?.some(table => table.people?.some(person => person))}
                   style={{
                     width: '100%',
                     padding: '8px',
                     backgroundColor: hallData?.tables?.some(table => table.people?.some(person => person)) ? '#e74c3c' : '#95a5a6',
                     color: 'white',
                     border: '1px solid rgba(255,255,255,0.3)',
                     borderRadius: '6px',
                     cursor: hallData?.tables?.some(table => table.people?.some(person => person)) ? 'pointer' : 'not-allowed',
                     fontSize: '12px',
                     fontWeight: 'bold',
                     transition: 'all 0.2s ease',
                     opacity: hallData?.tables?.some(table => table.people?.some(person => person)) ? 1 : 0.5
                   }}
                   onTouchStart={(e) => {
                     if (hallData?.tables?.some(table => table.people?.some(person => person))) {
                       e.target.style.transform = 'scale(0.95)';
                     }
                   }}
                   onTouchEnd={(e) => {
                     e.target.style.transform = 'scale(1)';
                   }}
                 >
                   📄 {t('exportPDFTableDesignV2') || 'Шаблон A5 (PDF)'}
                 </button>
               </div>
             )}

             {/* Quick Export HD Template Button - Mobile */}
             {hallData && (
               <div style={{ marginBottom: '15px' }}>
                 <h3 style={{
                   margin: '0 0 8px 0',
                   color: 'white',
                   fontSize: '14px',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '6px'
                 }}>
                   🌸 HD Шаблон
                 </h3>
                 <button
                   onClick={() => {
                     handleQuickExportHDTemplate();
                     closeMobileMenu();
                   }}
                   disabled={!hallData?.tables?.some(table => table.people?.some(person => person))}
                   style={{
                     width: '100%',
                     padding: '8px',
                     backgroundColor: hallData?.tables?.some(table => table.people?.some(person => person)) ? '#9b59b6' : '#95a5a6',
                     color: 'white',
                     border: '1px solid rgba(255,255,255,0.3)',
                     borderRadius: '6px',
                     cursor: hallData?.tables?.some(table => table.people?.some(person => person)) ? 'pointer' : 'not-allowed',
                     fontSize: '12px',
                     fontWeight: 'bold',
                     transition: 'all 0.2s ease',
                     opacity: hallData?.tables?.some(table => table.people?.some(person => person)) ? 1 : 0.5
                   }}
                   onTouchStart={(e) => {
                     if (hallData?.tables?.some(table => table.people?.some(person => person))) {
                       e.target.style.transform = 'scale(0.95)';
                     }
                   }}
                   onTouchEnd={(e) => {
                     e.target.style.transform = 'scale(1)';
                   }}
                 >
                   🌸 HD Шаблон
                 </button>
               </div>
             )}

             {/* Quick Export PDF HD Template Button - Mobile */}
             {hallData && (
               <div style={{ marginBottom: '15px' }}>
                 <h3 style={{
                   margin: '0 0 8px 0',
                   color: 'white',
                   fontSize: '14px',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '6px'
                 }}>
                   📄 PDF HD Шаблон
                 </h3>
                 <button
                   onClick={() => {
                     handleQuickExportPDFHDTemplate();
                     closeMobileMenu();
                   }}
                   disabled={!hallData?.tables?.some(table => table.people?.some(person => person))}
                   style={{
                     width: '100%',
                     padding: '8px',
                     backgroundColor: hallData?.tables?.some(table => table.people?.some(person => person)) ? '#8e44ad' : '#95a5a6',
                     color: 'white',
                     border: '1px solid rgba(255,255,255,0.3)',
                     borderRadius: '6px',
                     cursor: hallData?.tables?.some(table => table.people?.some(person => person)) ? 'pointer' : 'not-allowed',
                     fontSize: '12px',
                     fontWeight: 'bold',
                     transition: 'all 0.2s ease',
                     opacity: hallData?.tables?.some(table => table.people?.some(person => person)) ? 1 : 0.5
                   }}
                   onTouchStart={(e) => {
                     if (hallData?.tables?.some(table => table.people?.some(person => person))) {
                       e.target.style.transform = 'scale(0.95)';
                     }
                   }}
                   onTouchEnd={(e) => {
                     e.target.style.transform = 'scale(1)';
                   }}
                 >
                   📄 PDF HD Шаблон
                 </button>
               </div>
             )}

             {/* Export Modal Button - Mobile */}
             {hallData && (
               <div style={{ marginBottom: '15px' }}>
                 <h3 style={{
                   margin: '0 0 8px 0',
                   color: 'white',
                   fontSize: '14px',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '6px'
                 }}>
                   📄 {t('exportToA5') || 'Экспорт в A5'}
                 </h3>
                 <button
                   onClick={() => {
                     setShowExportModal(true);
                     closeMobileMenu();
                   }}
                   style={{
                     width: '100%',
                     padding: '8px',
                     backgroundColor: '#648767',
                     color: 'white',
                     border: '1px solid rgba(255,255,255,0.3)',
                     borderRadius: '6px',
                     cursor: 'pointer',
                     fontSize: '12px',
                     fontWeight: 'bold',
                     transition: 'all 0.2s ease'
                   }}
                   onTouchStart={(e) => {
                     e.target.style.transform = 'scale(0.95)';
                   }}
                   onTouchEnd={(e) => {
                     e.target.style.transform = 'scale(1)';
                   }}
                 >
                   📄 {t('exportToA5') || 'Экспорт в A5'}
                 </button>
               </div>
             )}

             <button
               onClick={closeMobileMenu}
               style={{
                 width: '100%',
                 padding: '8px',
                 backgroundColor: 'rgba(255,255,255,0.1)',
                 color: 'white',
                 border: '1px solid rgba(255,255,255,0.3)',
                 borderRadius: '6px',
                 cursor: 'pointer',
                 fontSize: '12px',
                 fontWeight: 'bold'
               }}
             >
               {t('close')}
             </button>
          </div>
        </div>
      )}

      {/* Import JSON Modal */}
      <ImportJsonModal />
      
      {/* Export to A5 Modal */}
      <ExportToA5Modal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)} 
      />
      
      {/* Export to HD Template Modal */}
      <ExportToHDTemplateModal 
        isOpen={showHDExportModal} 
        onClose={() => setShowHDExportModal(false)} 
      />

      {/* Templates Modal */}
      {showTemplatesModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }} onClick={() => setShowTemplatesModal(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid #e9ecef',
              paddingBottom: '15px'
            }}>
              <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '20px' }}>
                📋 Шаблоны экспорта
              </h2>
              <button
                onClick={() => setShowTemplatesModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#95a5a6',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Templates Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px'
            }}>
              {/* 📄 A5 - Open A5 Modal */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowExportModal(true);
                  setShowTemplatesModal(false);
                }}
                style={{
                  backgroundColor: '#648767',
                  color: 'white',
                  border: '2px solid #5a7a5d',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                }}
                title="Экспорт в A5"
              >
                <span style={{ fontSize: '32px' }}>📄</span>
                <span>A5</span>
              </button>

              {/* 🌸 HD - Open HD Modal */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHDExportModal(true);
                  setShowTemplatesModal(false);
                }}
                style={{
                  backgroundColor: '#9b59b6',
                  color: 'white',
                  border: '2px solid #8e44ad',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                }}
                title="Экспорт HD шаблона"
              >
                <span style={{ fontSize: '32px' }}>🌸</span>
                <span>HD</span>
              </button>

              {/* 🎨 A5 - Quick Export TableDesignV2 HTML */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickExportTableDesignV2();
                  setShowTemplatesModal(false);
                }}
                disabled={!hallData?.tables?.some(table => table.people?.some(person => person))}
                style={{
                  backgroundColor: '#e67e22',
                  color: 'white',
                  border: '2px solid #d35400',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: hallData?.tables?.some(table => table.people?.some(person => person)) ? 'pointer' : 'not-allowed',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s',
                  opacity: hallData?.tables?.some(table => table.people?.some(person => person)) ? 1 : 0.5
                }}
                onMouseEnter={(e) => {
                  if (hallData?.tables?.some(table => table.people?.some(person => person))) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                }}
                title="Быстрый экспорт по шаблону A5 (HTML)"
              >
                <span style={{ fontSize: '32px' }}>🎨</span>
                <span>A5</span>
              </button>

              {/* 📄 PDF - Quick Export TableDesignV2 PDF */}
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await handleQuickExportPDFTableDesignV2();
                  setShowTemplatesModal(false);
                }}
                disabled={!hallData?.tables?.some(table => table.people?.some(person => person))}
                style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: '2px solid #c0392b',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: hallData?.tables?.some(table => table.people?.some(person => person)) ? 'pointer' : 'not-allowed',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s',
                  opacity: hallData?.tables?.some(table => table.people?.some(person => person)) ? 1 : 0.5
                }}
                onMouseEnter={(e) => {
                  if (hallData?.tables?.some(table => table.people?.some(person => person))) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                }}
                title="Быстрый экспорт PDF по шаблону A5"
              >
                <span style={{ fontSize: '32px' }}>📄</span>
                <span>PDF</span>
              </button>

              {/* 🌸 HD - Quick Export HD HTML */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickExportHDTemplate();
                  setShowTemplatesModal(false);
                }}
                disabled={!hallData?.tables?.some(table => table.people?.some(person => person))}
                style={{
                  backgroundColor: '#9b59b6',
                  color: 'white',
                  border: '2px solid #8e44ad',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: hallData?.tables?.some(table => table.people?.some(person => person)) ? 'pointer' : 'not-allowed',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s',
                  opacity: hallData?.tables?.some(table => table.people?.some(person => person)) ? 1 : 0.5
                }}
                onMouseEnter={(e) => {
                  if (hallData?.tables?.some(table => table.people?.some(person => person))) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                }}
                title="Быстрый экспорт HD шаблона (HTML)"
              >
                <span style={{ fontSize: '32px' }}>🌸</span>
                <span>HD</span>
              </button>

              {/* 📄 PDF - Quick Export HD PDF */}
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await handleQuickExportPDFHDTemplate();
                  setShowTemplatesModal(false);
                }}
                disabled={!hallData?.tables?.some(table => table.people?.some(person => person))}
                style={{
                  backgroundColor: '#8e44ad',
                  color: 'white',
                  border: '2px solid #7d3c98',
                  borderRadius: '8px',
                  padding: '16px',
                  cursor: hallData?.tables?.some(table => table.people?.some(person => person)) ? 'pointer' : 'not-allowed',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s',
                  opacity: hallData?.tables?.some(table => table.people?.some(person => person)) ? 1 : 0.5
                }}
                onMouseEnter={(e) => {
                  if (hallData?.tables?.some(table => table.people?.some(person => person))) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                }}
                title="Быстрый экспорт PDF HD шаблона"
              >
                <span style={{ fontSize: '32px' }}>📄</span>
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header; 