import React, { useState } from 'react';
import { useExportToA5 } from './useExportToA5';
import { useExportGuestCards } from './useExportGuestCards';
import { useTranslations } from './useTranslations';
import './ExportToA5Modal.css';

const ExportToA5Modal = ({ isOpen, onClose }) => {
  const { getExportData, exportToPDF, exportToHTML, exportToTableDesignV2, exportToPDFTableDesignV2, hasData } = useExportToA5();
  const { 
  exportToHTML: exportGuestCardsHTML, 
  exportToPDF: exportGuestCardsPDF, 
  exportTableNumbersToHTML,
  exportTableNumbersToPDF,
  hasGuests,
  hasTables 
} = useExportGuestCards();
  const { t } = useTranslations();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');

  const tables = getExportData();

  const handleExport = async () => {
    if (!hasData) return;
    
    setIsExporting(true);
    try {
      if (exportFormat === 'pdf') {
        await exportToPDF();
      } else {
        exportToHTML();
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportGuestCards = async () => {
    if (!hasGuests) return;
    
    setIsExporting(true);
    try {
      if (exportFormat === 'pdf') {
        await exportGuestCardsPDF();
      } else {
        exportGuestCardsHTML();
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportTableNumbers = async () => {
    if (!hasTables) return;
    
    setIsExporting(true);
    try {
      if (exportFormat === 'pdf') {
        await exportTableNumbersToPDF();
      } else {
        exportTableNumbersToHTML();
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportTableDesignV2 = () => {
    if (!hasData) return;
    exportToTableDesignV2();
  };

  const handleExportPDFTableDesignV2 = async () => {
    if (!hasData) return;
    setIsExporting(true);
    try {
      await exportToPDFTableDesignV2();
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const htmlContent = generatePrintContent(tables);
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const generatePrintContent = (tables) => {
    const tableCards = tables.map(table => `
      <div class="table-card">
        <div class="table-number">№${table.tableNumber}</div>
        <div class="guests-list">
          ${table.people.map(guest => `<div class="guest-name">${guest}</div>`).join('')}
        </div>
        <div class="seats-info">${table.occupiedSeats}/${table.chairCount}</div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Рассадка гостей</title>
        <style>
          @media print {
            body { margin: 0; }
            .page { page-break-after: always; }
            .page:last-child { page-break-after: avoid; }
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: white;
          }
          
          .header {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 30px;
            color: #333;
          }
          
          .tables-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          
          .table-card {
            border: 2px solid #333;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            background: white;
            min-height: 150px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-inside: avoid;
          }
          
          .table-number {
            font-size: 32px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
          }
          
          .guests-list {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 5px;
          }
          
          .guest-name {
            font-size: 14px;
            color: #555;
            font-weight: 500;
          }
          
          .seats-info {
            font-size: 12px;
            color: #888;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">Рассадка гостей</div>
        <div class="tables-grid">
          ${tableCards}
        </div>
      </body>
      </html>
    `;
  };

  if (!isOpen) return null;

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <h2>📄 {t('exportToA5') || 'Экспорт в A5'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="export-modal-content">
          {!hasData ? (
            <div className="no-data-message">
              <p>😔 {t('noTablesToExport') || 'Нет столов для экспорта'}</p>
              <p className="hint">{t('exportHint') || 'Добавьте гостей за столы для экспорта'}</p>
            </div>
          ) : (
            <>
              <div className="export-preview">
                <h3>{t('preview') || 'Предпросмотр'}</h3>
                <div className="tables-preview">
                                     {tables.slice(0, 4).map((table) => (
                     <div key={table.id} className="table-preview-card">
                       <div className="table-preview-header">Стол №{table.tableNumber}</div>
                       <div className="table-preview-guests">
                         {table.people.slice(0, 3).map((guest, index) => (
                           <div key={index} className="guest-preview-name">{guest}</div>
                         ))}
                         {table.people.length > 3 && (
                           <div className="more-guests">+{table.people.length - 3}</div>
                         )}
                       </div>
                     </div>
                   ))}
                  {tables.length > 4 && (
                    <div className="more-tables">
                      <span>+{tables.length - 4} {t('moreTables') || 'столов'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="export-options">
                <h3>{t('exportOptions') || 'Настройки экспорта'}</h3>
                
                <div className="format-selection">
                  <label className="format-option">
                    <input
                      type="radio"
                      name="format"
                      value="pdf"
                      checked={exportFormat === 'pdf'}
                      onChange={(e) => setExportFormat(e.target.value)}
                    />
                    <span className="format-label">
                      <span className="format-icon">📄</span>
                      <span className="format-text">
                        <strong>PDF</strong>
                        <small>{t('pdfDescription') || 'Для печати и отправки'}</small>
                      </span>
                    </span>
                  </label>

                  <label className="format-option">
                    <input
                      type="radio"
                      name="format"
                      value="html"
                      checked={exportFormat === 'html'}
                      onChange={(e) => setExportFormat(e.target.value)}
                    />
                    <span className="format-label">
                      <span className="format-icon">🌐</span>
                      <span className="format-text">
                        <strong>HTML</strong>
                        <small>{t('htmlDescription') || 'Для веб-просмотра'}</small>
                      </span>
                    </span>
                  </label>
                </div>

                <div className="export-actions">
                  <button
                    className="export-button primary"
                    onClick={handleExport}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <span className="loading-spinner">⏳</span>
                    ) : (
                      <span className="export-icon">💾</span>
                    )}
                    {isExporting 
                      ? (t('exporting') || 'Экспорт...') 
                      : (t('export') || 'Экспорт')
                    }
                  </button>

                  <button
                    className="export-button secondary"
                    onClick={handleExportGuestCards}
                    disabled={!hasGuests || isExporting}
                  >
                    🎴 {t('exportGuestCards') || 'Карточки гостей'}
                  </button>

                  <button
                    className="export-button secondary"
                    onClick={handleExportTableNumbers}
                    disabled={!hasTables || isExporting}
                  >
                    🏷️ {t('exportTableNumbers') || 'Номера столов'}
                  </button>

                  <button
                    className="export-button secondary"
                    onClick={handleExportTableDesignV2}
                    disabled={!hasData || isExporting}
                  >
                    📄 {t('exportTableDesignV2') || 'Шаблон A5'}
                  </button>

                  <button
                    className="export-button secondary"
                    onClick={handleExportPDFTableDesignV2}
                    disabled={!hasData || isExporting}
                  >
                    �� {t('exportPDFTableDesignV2') || 'Шаблон A5 (PDF)'}
                  </button>

                  <button
                    className="export-button secondary"
                    onClick={handlePrint}
                    disabled={!hasData}
                  >
                    🖨️ {t('print') || 'Печать'}
                  </button>
                </div>
              </div>

              <div className="export-info">
                <div className="info-item">
                  <span className="info-icon">📊</span>
                  <span>{t('totalTables') || 'Всего столов'}: <strong>{tables.length}</strong></span>
                </div>
                <div className="info-item">
                  <span className="info-icon">👥</span>
                  <span>{t('totalGuests') || 'Всего гостей'}: <strong>
                    {tables.reduce((sum, table) => sum + table.occupiedSeats, 0)}
                  </strong></span>
                </div>
                <div className="info-item">
                  <span className="info-icon">🎴</span>
                  <span>{t('guestCards') || 'Карточки гостей'}: <strong>
                    {tables.reduce((sum, table) => sum + (table.people?.length || 0), 0)}
                  </strong></span>
                </div>
                <div className="info-item">
                  <span className="info-icon">🏷️</span>
                  <span>{t('tableNumbers') || 'Номера столов'}: <strong>{tables.length}</strong></span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportToA5Modal;
