import { useCallback } from 'react';
import { useSeating } from './SeatingContext';
import { useTranslations } from './useTranslations';
import { getAssetUrl } from '../../utils/baseUrl';

export const useExportToA5 = () => {
  const { state } = useSeating();
  const { t, language } = useTranslations();
  const { hallData, groups } = state;

  // Предварительная загрузка изображений для TableDesignV2
  const preloadTableDesignV2Images = useCallback(async () => {
    const imageUrls = [
      getAssetUrl('/fonTa.jpg'),
      getAssetUrl('/cveta.PNG')
    ];

    const imagePromises = imageUrls.map(url => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          console.log(`Изображение загружено: ${url}`);
          resolve(img);
        };
        img.onerror = () => {
          console.warn(`Не удалось загрузить изображение: ${url}`);
          resolve(null);
        };
        img.src = url;
      });
    });

    try {
      const loadedImages = await Promise.all(imagePromises);
      const loadedCount = loadedImages.filter(img => img !== null).length;
      console.log(`Загружено ${loadedCount} из ${imageUrls.length} изображений TableDesignV2`);
      
      if (loadedCount === 0) {
        console.warn('Внимание: ни одно изображение не загружено. Проверьте наличие файлов в папке public/');
        console.warn('Проверьте, что файлы fonTa.jpg и cveta.PNG находятся в папке public/');
        console.warn('Также убедитесь, что сервер корректно отдает статические файлы');
      }
      
      return loadedImages;
    } catch (error) {
      console.warn('Ошибка при загрузке изображений:', error);
      return [];
    }
  }, []);

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
          people: people.map(person => person.name),
          chairCount: table.chairCount || (table.chairs ? table.chairs.length : 12),
          occupiedSeats: people.length,
          shape: table.shape || 'round'
        };
      })
      .filter(table => table.occupiedSeats > 0); // Только столы с гостями
  }, [hallData]);

  // Экспорт в PDF
  const exportToPDF = useCallback(async (useTableDesignV2 = false) => {
    try {
      // Динамически импортируем библиотеки
      const { jsPDF } = await import('jspdf');
      const html2canvas = await import('html2canvas');
      
      const tables = getExportData();
      
      if (tables.length === 0) {
        alert(t('noTablesToExport') || 'Нет столов для экспорта');
        return;
      }

              // Создаем временный HTML элемент
        const tempDiv = document.createElement('div');
        const htmlContent = useTableDesignV2 ? generateTableDesignV2Content(tables) : generateHTMLContent(tables);
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '0';
        document.body.appendChild(tempDiv);

        if (useTableDesignV2) {
          console.log('HTML контент TableDesignV2 создан:', tempDiv.innerHTML.substring(0, 500) + '...');
        }

      // Если используется TableDesignV2, предварительно загружаем изображения
      if (useTableDesignV2) {
        console.log('Начинаем загрузку изображений для TableDesignV2...');
        const loadedImages = await preloadTableDesignV2Images();
        
        if (loadedImages.length === 0) {
          console.warn('Изображения не загружены, но продолжаем экспорт...');
        }
        
        // Дополнительная задержка для полной загрузки изображений
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Проверяем, что изображения действительно загружены в DOM
        const backgroundImg = tempDiv.querySelector('.background-image');
        const cornerImgs = tempDiv.querySelectorAll('.corner-decoration');
        
        if (backgroundImg && cornerImgs.length > 0) {
          console.log('Изображения найдены в DOM, ожидаем загрузки...');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Проверяем статус загрузки изображений
          const allImages = [backgroundImg, ...cornerImgs];
          const loadedCount = allImages.filter(img => img.complete && img.naturalHeight !== 0).length;
          console.log(`Статус загрузки: ${loadedCount}/${allImages.length} изображений загружено`);
          
          if (loadedCount === 0) {
            console.warn('Внимание: изображения в DOM не загружены. Возможно, проблема с путями к файлам.');
          }
        }
      }

      try {
        // Конвертируем HTML в canvas
        const canvas = await html2canvas.default(tempDiv, {
          scale: 2, // Увеличиваем качество
          useCORS: true,
          allowTaint: true,
          backgroundColor: useTableDesignV2 ? '#faf5ef' : '#faf5ef',
          logging: false, // Отключаем логи для производительности
          imageTimeout: 15000, // Увеличиваем таймаут для изображений
          onclone: (clonedDoc) => {
            // Дополнительная обработка клонированного документа
            if (useTableDesignV2) {
              // Убеждаемся, что изображения загружены
              const images = clonedDoc.querySelectorAll('img');
              let loadedImages = 0;
              images.forEach(img => {
                if (img.complete && img.naturalHeight !== 0) {
                  img.style.display = 'block';
                  loadedImages++;
                } else {
                  console.warn(`Изображение не загружено: ${img.src}`);
                  img.style.display = 'none';
                }
              });
              console.log(`Загружено ${loadedImages} из ${images.length} изображений в клоне`);
            }
          }
        });

        // Создаем PDF
        const pdf = new jsPDF('p', 'mm', 'a5');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Получаем все страницы в зависимости от типа экспорта
        const pageSelector = useTableDesignV2 ? '.a5-page' : '.page';
        const pages = tempDiv.querySelectorAll(pageSelector);
        
        // Конвертируем страницы последовательно
        for (let index = 0; index < pages.length; index++) {
          if (index > 0) {
            pdf.addPage();
          }

          // Конвертируем каждую страницу отдельно с улучшенными настройками для TableDesignV2
          const pageCanvas = await html2canvas.default(pages[index], {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: useTableDesignV2 ? '#faf5ef' : '#faf5ef',
            logging: false,
            imageTimeout: 15000,
            onclone: (clonedPage) => {
              if (useTableDesignV2) {
                // Убеждаемся, что все изображения загружены и отображаются
                const images = clonedPage.querySelectorAll('img');
                images.forEach(img => {
                  if (img.complete && img.naturalHeight !== 0) {
                    img.style.display = 'block';
                  } else {
                    // Если изображение не загружено, показываем заглушку
                    img.style.display = 'none';
                  }
                });
              }
            }
          });
          
          const imgData = pageCanvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
        }

        // Сохраняем PDF после обработки всех страниц
        const fileName = `${hallData?.name || 'seating'}_${useTableDesignV2 ? 'tableDesignV2' : 'seating'}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

      } finally {
        // Удаляем временный элемент
        document.body.removeChild(tempDiv);
      }

    } catch (error) {
      console.error('Ошибка при экспорте в PDF:', error);
      alert(`Ошибка при экспорте: ${error.message || 'Неизвестная ошибка'}`);
    }
  }, [hallData, getExportData, t]);

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

  // Экспорт в HTML по шаблону tableDesignV2
  const exportToTableDesignV2 = useCallback(() => {
    const tables = getExportData();
    
    if (tables.length === 0) {
      alert(t('noTablesToExport') || 'Нет столов для экспорта');
      return;
    }

    const htmlContent = generateTableDesignV2Content(tables);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${hallData?.name || 'seating'}_tableDesignV2_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [hallData, getExportData, t]);

  // Экспорт в PDF по шаблону tableDesignV2
  const exportToPDFTableDesignV2 = useCallback(async () => {
    await exportToPDF(true);
  }, [exportToPDF]);

  // Генерация HTML контента
  const generateHTMLContent = (tables) => {
    const tablePages = tables.map(table => `
      <div class="page">
        <div class="table-page">
          <div class="table-title">СТОЛ N${table.tableNumber}</div>
          <div class="guests-list">
            ${table.people.map(guest => `<div class="guest-name">${guest}</div>`).join('')}
          </div>
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
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Marck+Script&display=swap" rel="stylesheet">
        <style>
          @media print {
            body { margin: 0; }
            .page { 
              page-break-after: always; 
              page-break-inside: avoid;
            }
            .page:last-child { page-break-after: avoid; }
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            background: #faf5ef;
          }
          
          .page {
            width: 148mm;
            height: 210mm;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            position: relative;
            overflow: hidden;
            clip-path: inset(0 0 0 0);
            background: #faf5ef;
          }
          
          .table-page {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            text-align: center;
            background: #faf5ef;
            position: relative;
            overflow: hidden;
            clip-path: inset(0 0 0 0);
          }
          
          /* Декоративные веточки в углах */
          .table-page::before,
          .table-page::after {
            content: '';
            position: absolute;
            width: 400px;
            height: 400px;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            opacity: 0.5;
            z-index: 1;
          }

          /* Веточка в левом верхнем углу */
          .table-page::before {
            background-image: url('afterVetka.png');
            top: -18mm;
            left: -8mm;
            transform: rotate(358deg);
          }

          /* Веточка в правом нижнем углу */
          .table-page::after {
            background-image: url('beforeVetka.png');
            bottom: -33mm;
            right: -21mm;
            transform: rotate(284deg);
          }
          
          .table-title {
            font-size: 42px;
            font-weight: bold;
            color: #6b5b47;
            margin-top: 20mm;
            margin-bottom: 40mm;
            font-family: 'Caveat', 'Marck Script', cursive;
            z-index: 2;
            position: relative;
          }
          
          .guests-list {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 8px;
            margin-top: -25mm;
            margin-bottom: 20mm;
            z-index: 2;
            position: relative;
          }
          
          .guest-name {
            font-size: 32px;
            color: #92894f;
            font-weight: 500;
            font-family: 'Caveat', 'Marck Script', cursive;
          }
          
          @media print {
            .page { 
              margin: 0;
              padding: 0;
              width: 148mm;
              height: 210mm;
              overflow: hidden;
              clip-path: inset(0 0 0 0);
              background: #faf5ef;
            }
            
            .table-page {
              background: #faf5ef;
              overflow: hidden;
              clip-path: inset(0 0 0 0);
            }
            
            .table-title {
              font-size: 42px;
              margin-top: 20mm;
              margin-bottom: 40mm;
            }
            
            .guest-name {
              font-size: 32px;
              margin: 8pt 0;
            }
          }
        </style>
      </head>
      <body>
        ${tablePages}
      </body>
      </html>
    `;
  };

  // Генерация HTML контента по шаблону tableDesignV2
  const generateTableDesignV2Content = (tables) => {
    const tablePages = tables.map(table => `
      <div class="a5-page">
        <!-- Фоновое изображение как img элемент для лучшей совместимости с html2canvas -->
        <img src="${getAssetUrl('/fonTa.jpg')}" class="background-image" alt="фон" />
        <img src="${getAssetUrl('/cveta.PNG')}" class="corner-decoration top-left" alt="декорация" />
        <img src="${getAssetUrl('/cveta.PNG')}" class="corner-decoration bottom-right" alt="декорация" />
        <div class="table-title">СТОЛ №${table.tableNumber}</div>
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
        <title>${hallData?.name || t('guestSeating') || 'Рассадка гостей'} - TableDesignV2</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&family=Great+Vibes&family=Playfair+Display:wght@400;500;600;700&family=Caveat:wght@400;500;600;700&family=Marck+Script&display=swap" rel="stylesheet">
        <style>
          /* CSS переменные для настройки поворота изображений */
          :root {
            --top-left-rotate: 188deg;      /* Поворот верхнего левого изображения */
            --bottom-right-rotate: 11deg;   /* Поворот нижнего правого изображения */
          }

          /* Базовые стили для A5 страницы */
          body {
            margin: 0;
            padding: 0;
            font-family: 'Dancing Script', cursive;
            background: linear-gradient(to bottom, #cfcbb0, #e8e2d2, #ddd9c2);
            min-height: 100vh;
          }

          /* Контейнер для предварительного просмотра */
          .preview-container {
            display: flex;
            flex-wrap: wrap;
            gap: 30px;
            padding: 30px;
            justify-content: center;
            align-items: flex-start;
          }

          /* A5 страница */
          .a5-page {
            width: 148mm;
            height: 210mm;
            margin: 0;
            padding: 25mm;
            box-sizing: border-box;
            box-shadow: 
                0 8px 32px rgba(139, 69, 19, 0.15),
                0 4px 16px rgba(139, 69, 19, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            text-align: center;
            position: relative;
            overflow: hidden;
            border-radius: 8px;
            border: 1px solid rgba(139, 69, 19, 0.1);
          }

          /* Фоновое изображение как img элемент */
          .background-image {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.2;
          }

          /* Fallback для фонового изображения */
          .a5-page:has(.background-image:not([src])) {
            background: linear-gradient(135deg, #e9e3d7 0%, #f5f0e8 50%, #e9e3d7 100%);
          }

          /* Наложение для уменьшения прозрачности фонового изображения */
          .a5-page::before {
             content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(233, 227, 215, 0.8);
    z-index: 1;
          }

          /* Декоративные изображения в углах */
          .corner-decoration {
           position: absolute;
    width: 500px;
    height: 500px;
    object-fit: contain;
    opacity: 0.5;
    z-index: 2;
          }

          .corner-decoration.top-left {
            top: -94px;
            left: -109px;
            transform: rotate(188deg);
          }

          .corner-decoration.bottom-right {
            bottom: -102px;
            right: -120px;
            transform: rotate(11deg);
          }

          /* Заголовок стола */
          .table-title {
            font-size: 42px;
            font-weight: 600;
            color: #5f4f3c;
            margin-top: -50px;
            margin-bottom: 40px;
            font-family: 'Dancing Script', cursive;
            text-shadow: 0 2px 4px rgba(139, 69, 19, 0.301);
            position: relative;
            z-index: 3;
          }

          .table-title::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 2px;
            background: linear-gradient(90deg, #5f4f3c, #a0522d);
            border-radius: 1px;
          }

          /* Список гостей */
          .guests-list {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 8px;
            margin-bottom: 0;
            margin-top: -10px;
            width: 100%;
            max-width: 90mm;
            position: relative;
            z-index: 3;
          }

          /* Имя гостя */
          .guest-name {
            font-size: 32px;
            color: #5f4f3c;
            font-weight: 500;
            font-family: 'Caveat', 'Marck Script', cursive;
            padding: 0;
            margin: 0;
            text-align: center;
          }

          /* Стили для печати */
          @media print {
            body { 
              background: white; 
              margin: 0; 
              padding: 0;
            }
            
            .preview-container {
              display: none;
            }
            
            .a5-page {
              box-shadow: none;
              margin: 0;
              padding: 25mm;
              width: 148mm;
              height: 210mm;
              page-break-after: always;
              page-break-inside: avoid;
              border-radius: 0;
            }
            
            .a5-page:last-child {
              page-break-after: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="preview-container">
          ${tablePages}
        </div>
      </body>
      </html>
    `;
  };

  return {
    getExportData,
    exportToPDF,
    exportToHTML,
    exportToTableDesignV2,
    exportToPDFTableDesignV2,
    hasData: getExportData().length > 0
  };
};
