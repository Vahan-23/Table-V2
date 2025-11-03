import React, { useState } from 'react';
import { useExportToHDTemplate } from './useExportToHDTemplate';
import './ExportToHDTemplateModal.css';

const ExportToHDTemplateModal = ({ isOpen, onClose }) => {
  const { 
    getExportData, 
    exportToPDF, 
    exportToHTML, 
    exportGuestCardsToHD,
    exportGuestCardsToHDHTML,
    exportTableNumbersToHD,
    exportTableNumbersToHDHTML,
    hasData,
    hasGuests,
    hasTables
  } = useExportToHDTemplate();

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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const htmlContent = generatePrintContent(tables);
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const generatePrintContent = (tables) => {
    const tableCards = tables.map(table => `
      <div class="hd-table-card">
        <div class="hd-table-number">№${table.tableNumber}</div>
        <div class="hd-guests-list">
          ${table.people.map(guest => `<div class="hd-guest-name">${guest}</div>`).join('')}
        </div>
        <div class="hd-seats-info">${table.occupiedSeats}/${table.chairCount}</div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>HD Шаблон - Печать</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: #f5f5f5;
          }
          .hd-table-card {
            background: white;
            border: 2px solid #ddd;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .hd-table-number {
            font-size: 24px;
            font-weight: bold;
            color: #5f4f3c;
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #5f4f3c;
            padding-bottom: 10px;
          }
          .hd-guest-name {
            font-size: 18px;
            color: #5f4f3c;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .hd-seats-info {
            text-align: center;
            margin-top: 15px;
            font-size: 14px;
            color: #666;
          }
          @media print {
            body { background: white; }
            .hd-table-card { box-shadow: none; border: 1px solid #ccc; }
          }
        </style>
      </head>
      <body>
        <h1 style="text-align: center; color: #5f4f3c; margin-bottom: 30px;">
          HD Шаблон - Рассадка гостей
        </h1>
        ${tableCards}
      </body>
      </html>
    `;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Экспорт HD Шаблона</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="export-info">
            <p>Экспорт рассадки гостей в HD шаблоне с фоновым изображением и декоративными элементами.</p>
            <p><strong>Формат:</strong> A5</p>
            <p><strong>Столов с гостями:</strong> {tables.length}</p>
          </div>

          <div className="export-options">
            <div className="format-selector">
              <label>
                <input
                  type="radio"
                  name="exportFormat"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={(e) => setExportFormat(e.target.value)}
                />
                PDF
              </label>
              <label>
                <input
                  type="radio"
                  name="exportFormat"
                  value="html"
                  checked={exportFormat === 'html'}
                  onChange={(e) => setExportFormat(e.target.value)}
                />
                HTML
              </label>
            </div>
          </div>

          <div className="export-actions">
            <button
              className="export-button primary"
              onClick={handleExport}
              disabled={!hasData || isExporting}
            >
              {isExporting ? 'Экспорт...' : `PDF Столы+Гости`}
            </button>
            
            <button
              className="export-button secondary"
              onClick={handlePrint}
              disabled={!hasData}
            >
              Печать
            </button>
          </div>

          <div className="export-actions">
            <h3>Карточки гостей в HD-стиле</h3>
            <div className="button-group">
              <button
                className="export-button secondary"
                onClick={exportGuestCardsToHDHTML}
                disabled={!hasGuests}
                title="Экспорт карточек гостей в HTML"
              >
                🎴 HTML Карточки
              </button>
              
              <button
                className="export-button secondary"
                onClick={exportGuestCardsToHD}
                disabled={!hasGuests}
                title="Экспорт карточек гостей в PDF"
              >
                📄 PDF карточки
              </button>
            </div>
          </div>

          <div className="export-actions">
            <h3>Номера столов в HD-стиле</h3>
            <div className="button-group">
              <button
                className="export-button secondary"
                onClick={exportTableNumbersToHDHTML}
                disabled={!hasTables}
                title="Экспорт номеров столов в HTML"
              >
                🏷️ HTML Номера
              </button>
              
              <button
                className="export-button secondary"
                onClick={exportTableNumbersToHD}
                disabled={!hasTables}
                title="Экспорт номеров столов в PDF"
              >
                📄 PDF Номера
              </button>
            </div>
          </div>

          {!hasData && (
            <div className="no-data-message">
              Нет данных для экспорта. Добавьте гостей к столам.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportToHDTemplateModal;
