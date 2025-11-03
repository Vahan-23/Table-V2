import { useCallback } from 'react';
import { useSeating } from './SeatingContext';
import { useTranslations } from './useTranslations';

export const useExportToA5 = () => {
  const { state } = useSeating();
  const { t, language } = useTranslations();
  const { hallData, groups } = state;

  // Получение данных для экспорта
  const getExportData = useCallback(() => {
    if (!hallData?.tables) return [];

    return hallData.tables
      .filter(table => table.enabled !== false) // Исключаем отключенные столы
      .map(table => {
        const tableNumber = table.tableNumber || table.id;
        const people = table.people?.filter(person => person !== null && person !== undefined) || [];
        
        return {
          id: table.id,
          tableNumber,
          people: people.map(person => person.fullName || person.name), // Используем полное имя для PDF
          chairCount: table.chairCount || (table.chairs ? table.chairs.length : 12),
          occupiedSeats: people.length,
          shape: table.shape || 'round'
        };
      })
      .filter(table => table.occupiedSeats > 0); // Только столы с гостями
  }, [hallData]);

  // Экспорт в PDF
  const exportToPDF = useCallback(async () => {
    try {
      // Динамически импортируем jsPDF для уменьшения размера бандла
      const { jsPDF } = await import('jspdf');
      
      const pdf = new jsPDF('p', 'mm', 'a5');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const tables = getExportData();
      
      if (tables.length === 0) {
        alert(t('noTablesToExport') || 'Нет столов для экспорта');
        return;
      }

      let currentY = 20;
      let pageNumber = 1;

      tables.forEach((table, index) => {
        // Проверяем, нужна ли новая страница
        if (currentY > pageHeight - 60) {
          pdf.addPage();
          currentY = 20;
          pageNumber++;
        }

        // Заголовок страницы
        if (index === 0 || currentY === 20) {
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text(hallData?.name || t('guestSeating') || 'Рассадка гостей', pageWidth / 2, currentY, { align: 'center' });
          currentY += 15;
        }

        // Карточка стола
        currentY = drawTableCard(pdf, table, currentY, pageWidth);
        currentY += 20;
      });

      // Сохраняем PDF
      const fileName = `${hallData?.name || 'seating'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Ошибка при экспорте в PDF:', error);
      alert(t('exportError') || 'Ошибка при экспорте');
    }
  }, [hallData, getExportData, t]);

  // Рисование карточки стола
  const drawTableCard = (pdf, table, startY, pageWidth) => {
    const cardWidth = pageWidth - 20; // Ширина карточки с отступами
    const cardHeight = 60;
    const cardX = 10;
    
    // Рисуем рамку с веточками
    drawDecoratedFrame(pdf, cardX, startY, cardWidth, cardHeight);
    
    // Заголовок "Սեղան X"
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Սեղան ${table.tableNumber}`, pageWidth / 2, startY + 15, { align: 'center' });
    
    // Имена гостей
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(50, 50, 50);
    
    let guestY = startY + 30;
    table.people.forEach((guest, index) => {
      if (guestY < startY + cardHeight - 10) {
        pdf.text(guest, pageWidth / 2, guestY, { align: 'center' });
        guestY += 8;
      }
    });
    
    return startY + cardHeight;
  };

  // Рисование декорированной рамки с веточками
  const drawDecoratedFrame = (pdf, x, y, width, height) => {
    // Основная рамка
    pdf.setDrawColor(100, 100, 100);
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height);
    
    // Веточки в углах
    pdf.setDrawColor(80, 120, 80);
    pdf.setLineWidth(0.5);
    
    // Левый верхний угол
    drawBranch(pdf, x + 5, y + 5, 8, 8, 'top-left');
    
    // Правый верхний угол
    drawBranch(pdf, x + width - 13, y + 5, 8, 8, 'top-right');
    
    // Левый нижний угол
    drawBranch(pdf, x + 5, y + height - 13, 8, 8, 'bottom-left');
    
    // Правый нижний угол
    drawBranch(pdf, x + width - 13, y + height - 13, 8, 8, 'bottom-right');
  };

  // Рисование веточки
  const drawBranch = (pdf, x, y, size, size, position) => {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    
    // Основная веточка
    pdf.line(centerX, y, centerX, y + size);
    
    // Боковые ответвления
    if (position === 'top-left' || position === 'top-right') {
      pdf.line(centerX, y + 2, centerX - 2, y + 4);
      pdf.line(centerX, y + 4, centerX + 2, y + 6);
      pdf.line(centerX, y + 6, centerX - 1, y + 8);
    } else {
      pdf.line(centerX, y + 2, centerX - 2, y + 4);
      pdf.line(centerX, y + 4, centerX + 2, y + 6);
      pdf.line(centerX, y + 6, centerX - 1, y + 8);
    }
  };

  // Экспорт в HTML для печати
  const exportToHTML = useCallback(() => {
    const tables = getExportData();
    
    if (tables.length === 0) {
      alert(t('noTablesToExport') || 'Нет столов для экспорта');
      return;
    }

    const htmlContent = generateHTMLContent(tables);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${hallData?.name || 'seating'}_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [hallData, getExportData, t]);

  // Генерация HTML контента
  const generateHTMLContent = (tables) => {
    const tableCards = tables.map(table => `
      <div class="table-card">
        <div class="table-header">Սեղան ${table.tableNumber}</div>
        <div class="guests-list">
          ${table.people.map(guest => `<div class="guest-name">${guest}</div>`).join('')}
        </div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${hallData?.name || t('guestSeating') || 'Рассадка гостей'}</title>
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
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          
                     .table-card {
             border: 2px solid #648767;
             border-radius: 15px;
             padding: 25px;
             text-align: center;
             background: white;
             box-shadow: 0 4px 15px rgba(100, 135, 103, 0.2);
             min-height: 120px;
             display: flex;
             flex-direction: column;
             justify-content: space-between;
             position: relative;
             margin: 20px 0;
           }
           
           .table-card::before {
             content: '';
             position: absolute;
             top: -2px;
             left: -2px;
             right: -2px;
             bottom: -2px;
             background: linear-gradient(45deg, #648767, #8fb996, #648767);
             border-radius: 17px;
             z-index: -1;
           }
           
           .table-header {
             font-size: 24px;
             font-weight: bold;
             color: #648767;
             margin-bottom: 20px;
             text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
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
          
                     @media print {
             body { 
               margin: 10mm;
               font-size: 12pt;
             }
             
             .tables-grid {
               grid-template-columns: 1fr;
               gap: 10mm;
             }
             
             .table-card {
               border: 1pt solid #648767;
               box-shadow: none;
               page-break-inside: avoid;
               margin: 5mm 0;
               padding: 15pt;
             }
             
             .table-header {
               font-size: 16pt;
               margin-bottom: 15pt;
             }
             
             .guest-name {
               font-size: 11pt;
               margin: 3pt 0;
             }
           }
        </style>
      </head>
      <body>
        <div class="header">${hallData?.name || t('guestSeating') || 'Рассадка гостей'}</div>
        <div class="tables-grid">
          ${tableCards}
        </div>
      </body>
      </html>
    `;
  };

  return {
    getExportData,
    exportToPDF,
    exportToHTML,
    hasData: getExportData().length > 0
  };
};
