import React from 'react';
import { useSeating } from './SeatingContext';
import { useTranslations } from './useTranslations';
import { useFileUpload } from './useFileUpload';

const Header = () => {
  const { state, dispatch, actions } = useSeating();
  const { t, language } = useTranslations();
  const { isLoading, error, handleFileUpload } = useFileUpload();
  const { hallData, windowWidth, showMobileMenu, isBurgerOpen, showTableControls } = state;

  const handleLanguageChange = () => {
    const newLanguage = language === 'ru' ? 'hy' : 'ru';
    dispatch({ type: actions.SET_LANGUAGE, payload: newLanguage });
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

  return (
    <>
      {/* Header */}
      <header className="app-header" style={{
        padding: '10px 15px',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}>
                {hallData?.name || t('guestSeating')}
              </div>

              {/* Import button */}
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
                    border: '3px solid white',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                  }}
                >
                  📁 {t('loadPlan')}
                </label>
                {isLoading && <div style={{
                  position: 'absolute',
                  top: '70px',
                  left: '0',
                  color: 'white',
                  fontSize: '12px',
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  padding: '5px 10px',
                  borderRadius: '4px'
                }}>{t('loading')}</div>}
                {error && <div style={{
                  position: 'absolute',
                  top: '70px',
                  left: '0',
                  color: '#ff6b6b',
                  fontSize: '12px',
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  maxWidth: '200px'
                }}>{error}</div>}
              </div>

              {/* Statistics */}
              {state.groups && state.groups.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  padding: '6px 12px',
                  borderRadius: '6px',
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
                  <span style={{ color: '#95a5a6', fontSize: '10px' }}>
                    {t('people')}
                  </span>
                </div>
              )}
            </div>

            {/* Table Controls Button */}
            {hallData && (
              <button
                onClick={toggleTableControls}
                style={{
                  backgroundColor: showTableControls ? '#e74c3c' : '#2ecc71',
                  color: 'white',
                  border: '3px solid white',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                }}
                title={showTableControls ? t('hideTableControls') : t('showTableControls')}
              >
                {showTableControls ? '🔴' : '🟢'} {showTableControls ? t('hideTableControls') : t('tableControls')}
              </button>
            )}

            {/* Language switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={handleLanguageChange}
                style={{
                  backgroundImage: `url(${language === 'ru'
                    ? 'https://flagcdn.com/am.svg'
                    : 'https://flagcdn.com/ru.svg'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  color: 'white',
                  border: '3px solid white',
                  borderRadius: '8px',
                  padding: '10px 15px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  minWidth: '110px',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
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
          alignItems: 'flex-start',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: '#0a0a1d',
            borderRadius: '12px',
            padding: '25px',
            width: '100%',
            maxWidth: '400px',
            marginTop: '60px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            color: 'white',
            animation: 'slideDown 0.3s ease-out'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px',
              borderBottom: '2px solid rgba(255,255,255,0.1)',
              paddingBottom: '15px'
            }}>
              <h2 style={{ margin: 0, color: 'white', fontSize: '20px' }}>
                ⚙️ {t('settings')}
              </h2>
              <button
                onClick={closeMobileMenu}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  color: 'white',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Language Selection */}
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{
                margin: '0 0 15px 0',
                color: 'white',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🌐 {t('language')}
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    dispatch({ type: actions.SET_LANGUAGE, payload: 'ru' });
                    closeMobileMenu();
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: language === 'ru' ? '#3498db' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: `2px solid ${language === 'ru' ? '#3498db' : 'rgba(255,255,255,0.3)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{
                    width: '20px',
                    height: '15px',
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
                    padding: '12px',
                    backgroundColor: language === 'hy' ? '#3498db' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: `2px solid ${language === 'hy' ? '#3498db' : 'rgba(255,255,255,0.3)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{
                    width: '20px',
                    height: '15px',
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
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{
                margin: '0 0 15px 0',
                color: 'white',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                👥 {t('groups')}
              </h3>

              <button
                onClick={() => {
                  dispatch({ type: actions.SET_IS_MOBILE_GROUPS_EXPANDED, payload: true });
                  closeMobileMenu();
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  marginBottom: '10px'
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
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#2ecc71',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
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

            {/* File Upload */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{
                margin: '0 0 15px 0',
                color: 'white',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
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
                  padding: '12px 16px',
                  backgroundColor: '#2ecc71',
                  color: 'white',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
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
                  marginTop: '10px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  textAlign: 'center',
                  color: '#74b9ff'
                }}>
                  ⏳ {t('loading')}
                </div>
              )}

              {error && (
                <div style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(231, 76, 60, 0.2)',
                  border: '1px solid #e74c3c',
                  borderRadius: '6px',
                  fontSize: '12px',
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
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#2ecc71',
                  fontWeight: 'bold',
                  marginBottom: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  ✅ {t('planLoaded')}
                </div>
                <div style={{ fontSize: '11px', color: '#bdc3c7' }}>
                  {hallData.name || t('guestSeating')}
                </div>
                {hallData.tables && (
                  <div style={{ fontSize: '11px', color: '#bdc3c7', marginTop: '2px' }}>
                    📊 {hallData.tables.length} {t('tables')}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={closeMobileMenu}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Header; 