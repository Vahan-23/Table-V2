import { useCallback } from 'react';
import { useSeating, isFemaleGender } from './SeatingContext';
import { useTranslations } from './useTranslations';

export const useExportGuestCards = () => {
  const { state } = useSeating();
  const { t, language } = useTranslations();
  const { hallData } = state;

  // Получение всех гостей для карточек
  const getAllGuests = useCallback(() => {
    if (!hallData?.tables) return [];

    const allGuests = [];
    hallData.tables
      .filter(table => table.enabled !== false)
      .forEach(table => {
        const people = table.people?.filter(person => person !== null && person !== undefined) || [];
        people.forEach(person => {
          allGuests.push({
            name: person.name, // Используем только короткое имя для карточек
            gender: person.gender || 'мужской',
            tableNumber: table.tableNumber || table.id
          });
        });
      });

    return allGuests.filter(guest => guest.name && guest.name.trim() !== '');
  }, [hallData]);

  // Экспорт именных карточек в HTML
  const exportToHTML = useCallback(() => {
    const guests = getAllGuests();
    
    if (guests.length === 0) {
      alert('Нет гостей для создания карточек');
      return;
    }

    const htmlContent = generateGuestCardsContent(guests);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${hallData?.name || 'guest_cards'}_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [hallData, getAllGuests]);

  // Экспорт именных карточек в PDF
  const exportToPDF = useCallback(async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = await import('html2canvas');
      
      const guests = getAllGuests();
      
      if (guests.length === 0) {
        alert('Нет гостей для создания карточек');
        return;
      }

      // Создаем временный HTML элемент
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generateGuestCardsContent(guests);
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      document.body.appendChild(tempDiv);

      try {
        // Создаем PDF с размером 10x10 см
        const pdf = new jsPDF('p', 'mm', [100, 100]); // 10x10 см
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Получаем все карточки
        const cards = tempDiv.querySelectorAll('.guest-card');
        
        // Конвертируем карточки последовательно
        for (let index = 0; index < cards.length; index++) {
          if (index > 0) {
            pdf.addPage([100, 100]); // Добавляем страницу 10x10 см
          }

          // Конвертируем каждую карточку отдельно
          const cardCanvas = await html2canvas.default(cards[index], {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#e9e3d7'
          });
          
          const imgData = cardCanvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
        }

        // Сохраняем PDF
        const fileName = `${hallData?.name || 'guest_cards'}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

      } finally {
        // Удаляем временный элемент
        document.body.removeChild(tempDiv);
      }

    } catch (error) {
      console.error('Ошибка при экспорте карточек в PDF:', error);
      alert(`Ошибка при экспорте: ${error.message || 'Неизвестная ошибка'}`);
    }
  }, [hallData, getAllGuests]);

  // Экспорт номеров столов в HTML
  const exportTableNumbersToHTML = useCallback(() => {
    const tables = getActiveTables();
    
    if (tables.length === 0) {
      alert('Нет активных столов для создания номеров');
      return;
    }

    const htmlContent = generateTableNumbersContent(tables);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${hallData?.name || 'table_numbers'}_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [hallData]);

  // Экспорт номеров столов в PDF
  const exportTableNumbersToPDF = useCallback(async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = await import('html2canvas');
      
      const tables = getActiveTables();
      
      if (tables.length === 0) {
        alert('Нет активных столов для создания номеров');
        return;
      }

      // Создаем временный HTML элемент
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generateTableNumbersContent(tables);
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      document.body.appendChild(tempDiv);

      try {
        // Создаем PDF с размером А7 (74x105 мм)
        const pdf = new jsPDF('p', 'mm', [74, 105]);
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Получаем все номера столов
        const tableNumbers = tempDiv.querySelectorAll('.table-number');
        
        // Конвертируем номера столов последовательно
        for (let index = 0; index < tableNumbers.length; index++) {
          if (index > 0) {
            pdf.addPage([74, 105]); // Добавляем страницу А7
          }

          // Конвертируем каждый номер стола отдельно
          const tableCanvas = await html2canvas.default(tableNumbers[index], {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#e9e3d7'
          });
          
          const imgData = tableCanvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
        }

        // Сохраняем PDF
        const fileName = `${hallData?.name || 'table_numbers'}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

      } finally {
        // Удаляем временный элемент
        document.body.removeChild(tempDiv);
      }

    } catch (error) {
      console.error('Ошибка при экспорте номеров столов в PDF:', error);
      alert(`Ошибка при экспорте: ${error.message || 'Неизвестная ошибка'}`);
    }
  }, [hallData]);

  // Получение активных столов
  const getActiveTables = useCallback(() => {
    if (!hallData?.tables) return [];

    return hallData.tables
      .filter(table => table.enabled !== false)
      .map(table => ({
        id: table.id,
        tableNumber: table.tableNumber || table.id
      }));
  }, [hallData]);

  // Генерация HTML контента для номеров столов
  const generateTableNumbersContent = (tables) => {
         const tableNumbers = tables.map(table => `
       <div class="table-number">
         <div class="corner-decoration top-left"></div>
         <div class="table-title">${table.tableNumber}</div>
       </div>
     `).join('');

    return `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${hallData?.name || 'Номера столов'}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&family=Great+Vibes&family=Playfair+Display:wght@400;500;600;700&family=Caveat:wght@400;500;600;700&family=Marck+Script&display=swap" rel="stylesheet">
        <style>
          @media print {
            body { margin: 0; }
            .table-number {
              page-break-after: always;
              page-break-inside: avoid;
              width: 74mm; /* А7 ширина */
              height: 105mm; /* А7 высота */
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              position: relative;
              overflow: hidden;
              clip-path: inset(0 0 0 0);
              background: #e9e3d7;
            }
            .table-number:last-child { page-break-after: avoid; }
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            background: linear-gradient(to bottom, #cfcbb0, #e8e2d2, #ddd9c2);
          }
          
          .table-number {
            width: 74mm; /* А7 ширина */
            height: 105mm; /* А7 высота */
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
            overflow: hidden;
            clip-path: inset(0 0 0 0);
            background: #e9e3d7;
            background-image: url('./fonta.jpg');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
          }
          
          .table-title {
            font-size: 233px;
            color: #5f4f3c;
            font-weight: 600;
            font-family: 'Dancing Script', cursive;
            text-align: center;
            z-index: 3;
            position: relative;
            text-shadow: 0 2px 4px rgba(139, 69, 19, 0.3);
          }
          
          /* Наложение для уменьшения прозрачности фонового изображения */
          .table-number::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(233, 227, 215, 0.8);
            z-index: 1;
          }

          /* Декоративные веточки в углах */
          .table-number::after {
            content: '';
            position: absolute;
            width: 400px;
            height: 400px;
            background-image: url('./cveta.PNG');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            opacity: 0.3;
            z-index: 2;
            bottom: -80px;
            right: -90px;
            transform: rotate(11deg);
          }

          /* Веточка в левом верхнем углу */
          .table-number .corner-decoration.top-left {
            content: '';
            position: absolute;
            width: 400px;
            height: 400px;
            background-image: url('./cveta.PNG');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            opacity: 0.3;
            z-index: 2;
            top: -70px;
            left: -80px;
            transform: rotate(188deg);
          }
          
          @media print {
            .table-number {
              width: 74mm; /* А7 ширина */
              height: 105mm; /* А7 высота */
              margin: 0;
              padding: 0;
              overflow: hidden;
              clip-path: inset(0 0 0 0);
              background: #e9e3d7;
              background-image: url('./fonta.jpg');
              background-size: cover;
              background-position: center;
              background-repeat: no-repeat;
            }
            
            .table-title {
              font-size: 233px;
              font-family: 'Dancing Script', cursive;
            }
          }
        </style>
      </head>
      <body>
        ${tableNumbers}
      </body>
      </html>
    `;
  };

  // Генерация HTML контента для карточек гостей
  const generateGuestCardsContent = (guests) => {
         const guestCards = guests.map(guest => {
           const greeting = isFemaleGender(guest.gender) ? 'Дорогая' : 'Дорогой';
           return `
       <div class="guest-card">
         <div class="corner-decoration top-left"></div>
         <div class="guest-name">${greeting} ${guest.name}</div>
         <div class="guest-thanks">Спасибо, что разделили с нами этот день</div>
         <div class="guest-signature">С любовью,<br>Василий и София</div>
       </div>
     `;
         }).join('');

    return `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${hallData?.name || 'Именные карточки гостей'}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Marck+Script&display=swap" rel="stylesheet">
        <style>
          @media print {
            body { margin: 0; }
            .guest-card {
              page-break-after: always;
              page-break-inside: avoid;
              width: 100mm; /* 10x10 см */
              height: 100mm; /* 10x10 см */
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              position: relative;
              overflow: hidden;
              clip-path: inset(0 0 0 0);
              background: #faf5ef;
            }
            .guest-card:last-child { page-break-after: avoid; }
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            background: linear-gradient(to bottom, #cfcbb0, #e8e2d2, #ddd9c2);
          }
          
          .guest-card {
            width: 100mm; /* 10x10 см */
            height: 100mm; /* 10x10 см */
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
            overflow: hidden;
            clip-path: inset(0 0 0 0);
            background: #e9e3d7;
            background-image: url('./fonta.jpg');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
          }
          
          .guest-name {
            font-size: 42px;
            color: #5f4f3c;
            font-weight: bold;
            font-family: 'Caveat', 'Marck Script', cursive;
            margin-bottom: 15mm;
            text-align: center;
            z-index: 3;
            position: relative;
          }
          
          .guest-thanks {
            font-size: 28px;
            color: #5f4f3c;
            font-weight: 600;
            font-family: 'Caveat', 'Marck Script', cursive;
            margin-bottom: 18mm;
            text-align: center;
            max-width: 85mm;
            line-height: 1.3;
            z-index: 3;
            position: relative;
            text-shadow: 0 1px 2px rgba(139, 69, 19, 0.2);
          }
          
          .guest-signature {
            font-size: 28px;
            color: #5f4f3c;
            font-weight: 600;
            font-family: 'Caveat', 'Marck Script', cursive;
            text-align: center;
            z-index: 3;
            position: relative;
          }
          
          /* Наложение для уменьшения прозрачности фонового изображения */
          .guest-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(233, 227, 215, 0.8);
            z-index: 1;
          }

          /* Наложение для уменьшения прозрачности фонового изображения */
          .guest-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(233, 227, 215, 0.8);
            z-index: 1;
          }

          /* Декоративные веточки в углах */
          .guest-card::after {
            content: '';
            position: absolute;
            width: 500px;
            height: 500px;
            background-image: url('./cveta.PNG');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            opacity: 0.3;
            z-index: 2;
            bottom: -102px;
            right: -120px;
            transform: rotate(11deg);
          }

          /* Веточка в левом верхнем углу */
          .guest-card .corner-decoration.top-left {
            content: '';
            position: absolute;
            width: 500px;
            height: 500px;
            background-image: url('./cveta.PNG');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            opacity: 0.6;
            z-index: 2;
            top: -94px;
            left: -109px;
            transform: rotate(188deg);
          }
          
          @media print {
            .guest-card {
              width: 100mm; /* 10x10 см */
              height: 100mm; /* 10x10 см */
              margin: 0;
              padding: 0;
              overflow: hidden;
              clip-path: inset(0 0 0 0);
              background: #e9e3d7;
              background-image: url('./fonta.jpg');
              background-size: cover;
              background-position: center;
              background-repeat: no-repeat;
            }
            
            .guest-name {
              font-size: 42px;
              margin-bottom: 15mm;
            }
            
            .guest-thanks {
              font-size: 28px;
              margin-bottom: 18mm;
            }
            
            .guest-signature {
              font-size: 28px;
            }
          }
        </style>
      </head>
      <body>
        ${guestCards}
      </body>
      </html>
    `;
  };

  return {
    getAllGuests,
    exportToHTML,
    exportToPDF,
    exportTableNumbersToHTML,
    exportTableNumbersToPDF,
    hasGuests: getAllGuests().length > 0,
    hasTables: getActiveTables().length > 0
  };
};
