import React, { useState, useRef } from 'react';
import { useSeating } from './SeatingContext';
import { useTranslations } from './useTranslations';
import { useGroups } from './useGroups';

const ImportJsonModal = () => {
  const { state, dispatch, actions } = useSeating();
  const { t } = useTranslations();
  const { addGroup } = useGroups();
  
  const [jsonText, setJsonText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          setJsonText(content);
          setError('');
          parseAndPreview(content);
        } catch (err) {
          setError('Ошибка чтения файла');
        }
      };
      reader.readAsText(file);
    }
  };

  const parseAndPreview = (text) => {
    try {
      const data = JSON.parse(text);
      if (data.guests && Array.isArray(data.guests)) {
        setPreviewData(data);
        setError('');
      } else {
        setError('Неверный формат JSON. Ожидается массив "guests"');
        setPreviewData(null);
      }
    } catch (err) {
      setError('Неверный формат JSON');
      setPreviewData(null);
    }
  };

  const handleJsonChange = (e) => {
    const text = e.target.value;
    setJsonText(text);
    if (text.trim()) {
      parseAndPreview(text);
    } else {
      setPreviewData(null);
      setError('');
    }
  };

  const processGuests = () => {
    if (!previewData || !previewData.guests) return;

    setIsProcessing(true);
    
    try {
      const guests = previewData.guests;
      let groupsCreated = 0;
      let totalGuests = 0;

      guests.forEach((guest, index) => {
        // Каждый гость создается как отдельная группа
        const groupName = guest.guest_fullname && guest.guest_fullname.trim() 
          ? guest.guest_fullname.trim() 
          : guest.guest_name?.trim() || `Гость ${index + 1}`;
        
        // Определяем пол гостя
        const guestGender = guest.guest_gender === 'արական' ? 'мужской' : 
                           guest.guest_gender === 'женский' ? 'женский' : 
                           guest.guest_gender === 'смешанный' ? 'мужской' : 'мужской';

        // Создаем группу с одним гостем
        const members = [{
          name: guest.guest_name?.trim() || guest.guest_fullname?.trim() || `Гость ${index + 1}`,
          fullName: guest.guest_fullname?.trim() || guest.guest_name?.trim() || `Гость ${index + 1}`,
          gender: guestGender
        }];

        console.log(`Создаем группу "${groupName}" с участником:`, members[0]);
        addGroup(groupName, members);
        groupsCreated++;
        totalGuests += members.length;
      });

      // Показываем уведомление об успехе
      dispatch({
        type: actions.SET_NOTIFICATION,
        payload: {
          type: 'success',
          message: `Импортировано ${groupsCreated} групп с ${totalGuests} гостями (группы созданы по полным именам)`
        }
      });

      // Закрываем модальное окно
      dispatch({ type: actions.SET_SHOW_IMPORT_JSON_MODAL, payload: false });
      
      // Очищаем состояние
      setJsonText('');
      setPreviewData(null);
      setError('');
      
    } catch (err) {
      setError('Ошибка при обработке данных: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    dispatch({ type: actions.SET_SHOW_IMPORT_JSON_MODAL, payload: false });
    setJsonText('');
    setPreviewData(null);
    setError('');
  };

  if (!state.showImportJsonModal) return null;

  return (
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
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
      }}>
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
            📥 Импорт групп из JSON
          </h2>
          <button
            onClick={handleClose}
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

        {/* File Upload */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#2c3e50'
          }}>
            Выберите JSON файл с гостями:
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            style={{
              width: '100%',
              padding: '10px',
              border: '2px dashed #3498db',
              borderRadius: '8px',
              backgroundColor: '#f8f9fa',
              cursor: 'pointer'
            }}
          />
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '12px',
            color: '#7f8c8d',
            fontStyle: 'italic'
          }}>
            Или вставьте JSON текст в поле ниже. Группы будут созданы по полным именам гостей.
          </p>
        </div>

        {/* JSON Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: '#2c3e50'
          }}>
            JSON текст с гостями:
          </label>
          <textarea
            value={jsonText}
            onChange={handleJsonChange}
            placeholder="Вставьте JSON с данными гостей (группы будут созданы по полным именам)..."
            style={{
              width: '100%',
              minHeight: '150px',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'monospace',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fdf2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            marginBottom: '20px'
          }}>
            ❌ {error}
          </div>
        )}

        {/* Preview */}
        {previewData && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>
              📋 Предварительный просмотр групп:
            </h3>
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>ID события:</strong> {previewData.event_id || 'Не указан'}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Дата экспорта:</strong> {previewData.export_date || 'Не указана'}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Всего гостей:</strong> {previewData.total_attendees || previewData.guests?.length || 0}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Групп для создания:</strong> {previewData.guests?.length || 0}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Всего участников:</strong> {
                  previewData.guests?.reduce((total, guest) => {
                    let count = 0;
                    if (guest.guest_fullname && guest.guest_fullname.trim()) count++;
                    else if (guest.guest_name && guest.guest_name.trim()) count++;
                    if (guest.second_guest && guest.has_spouse && guest.second_guest.trim()) count++;
                    return total + count;
                  }, 0) || 0
                }
              </div>
              
              {/* Sample guests */}
              <div style={{ marginTop: '15px' }}>
                <strong>Примеры групп для создания:</strong>
                <div style={{ marginTop: '8px' }}>
                  {previewData.guests?.slice(0, 3).map((guest, index) => {
                    const members = [];
                    const groupName = guest.guest_fullname && guest.guest_fullname.trim() 
                      ? guest.guest_fullname.trim() 
                      : `Группа ${guest.group_description || `Гость ${index + 1}`}`;
                    
                    if (guest.guest_fullname && guest.guest_fullname.trim()) {
                      members.push(guest.guest_fullname.trim());
                    } else if (guest.guest_name && guest.guest_name.trim()) {
                      members.push(guest.guest_name.trim());
                    }
                    if (guest.second_guest && guest.has_spouse && guest.second_guest.trim()) {
                      members.push(guest.second_guest.trim());
                    }
                    
                    return (
                      <div key={index} style={{
                        padding: '8px',
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        marginBottom: '5px',
                        fontSize: '13px'
                      }}>
                        <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                          Группа: {groupName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '2px' }}>
                          {guest.guest_fullname ? 'Полное имя' : 'Короткое имя'}: {guest.guest_name || 'Без имени'}
                        </div>
                        {guest.has_spouse && guest.second_guest && (
                          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                            + {guest.second_guest}
                          </div>
                        )}
                        <span style={{ color: '#27ae60', marginTop: '5px', display: 'block' }}>
                          Участников: {members.length} чел.
                        </span>
                        {members.length === 0 && (
                          <span style={{ color: '#e74c3c', marginTop: '5px', display: 'block' }}>
                            ⚠️ Группа не будет создана
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {previewData.guests?.length > 3 && (
                    <div style={{ color: '#7f8c8d', fontSize: '12px', fontStyle: 'italic' }}>
                      ... и еще {previewData.guests.length - 3} групп
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          borderTop: '1px solid #e9ecef',
          paddingTop: '20px'
        }}>
          <button
            onClick={handleClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#333',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Отмена
          </button>
          <button
            onClick={processGuests}
            disabled={!previewData || isProcessing}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: previewData && !isProcessing ? '#3498db' : '#bdc3c7',
              color: 'white',
              cursor: previewData && !isProcessing ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {isProcessing ? 'Обработка...' : 'Создать группы'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportJsonModal;
