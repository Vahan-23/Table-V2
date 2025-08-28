import { useCallback } from 'react';
import { useSeating } from './SeatingContext';
import { useTranslations } from './useTranslations';

export const useExportToHDTemplate = () => {
  const { state } = useSeating();
  const { t, language } = useTranslations();
  const { hallData } = state;

  // Предварительная загрузка изображений для HD шаблона
  const preloadHDTemplateImages = useCallback(async () => {
    const imageUrls = [
      `${window.location.origin}/HDfon.jpg`,
      `${window.location.origin}/HDtsaxik.png`
    ];

    const imagePromises = imageUrls.map(url => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          console.log(`HD изображение загружено: ${url}`);
          resolve(img);
        };
        img.onerror = () => {
          console.warn(`Не удалось загрузить HD изображение: ${url}`);
          resolve(null);
        };
        img.src = url;
      });
    });

    try {
      const loadedImages = await Promise.all(imagePromises);
      const loadedCount = loadedImages.filter(img => img !== null).length;
      console.log(`Загружено ${loadedCount} из ${imageUrls.length} HD изображений`);
      
      if (loadedCount === 0) {
        console.warn('Внимание: ни одно HD изображение не загружено. Проверьте наличие файлов в папке public/');
        console.warn('Проверьте, что файлы HDfon.jpg и HDtsaxik.png находятся в папке public/');
      }
      
      return loadedImages;
    } catch (error) {
      console.warn('Ошибка при загрузке HD изображений:', error);
      return [];
    }
  }, []);

  // Генерация HTML контента для HD шаблона
  const generateHDTemplateContent = useCallback((tables) => {
    const tablePages = tables.map(table => `
      <div class="hd-a5-page">
        <!-- Фоновое изображение -->
        <img src="${window.location.origin}/HDfon.jpg" class="hd-background-image" alt="HD фон" />
        <!-- Декоративные цветы -->
        <img src="${window.location.origin}/HDtsaxik.png" class="hd-flower-decoration top-left" alt="цветок" />
        <img src="${window.location.origin}/HDtsaxik.png" class="hd-bottom-flower" alt="цветок" />
        <div class="hd-table-title">СТОЛ №${table.tableNumber}</div>
        <div class="hd-guests-list">
          ${table.people.map(guest => `<div class="hd-guest-name">${guest}</div>`).join('')}
        </div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${hallData?.name || t('guestSeating') || 'Рассадка гостей'} - HD Шаблон</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&family=Great+Vibes&family=Playfair+Display:wght@400;500;600;700&family=Caveat:wght@400;500;600;700&family=Marck+Script&display=swap" rel="stylesheet">
        <style>
          /* CSS переменные для настройки поворота изображений */
          :root {
            --top-left-rotate: 45deg;      /* Поворот верхнего левого цветка */
            --bottom-right-rotate: 225deg;  /* Поворот нижнего правого цветка */
          }

          /* Базовые стили для A5 страницы */
          body {
            margin: 0;
            padding: 0;
            font-family: 'Dancing Script', cursive;
            background: linear-gradient(to bottom, #e8e2d2, #f5f0e8, #ddd9c2);
            min-height: 100vh;
          }

          /* A5 страница для HD шаблона */
          .hd-a5-page {
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

          /* Фоновое изображение HD */
          .hd-background-image {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.6;
            z-index: 3;
          }

          /* Fallback для фонового изображения */
          .hd-a5-page:has(.hd-background-image:not([src])) {
            background: linear-gradient(135deg, #e9e3d7 0%, #f5f0e8 50%, #e9e3d7 100%);
          }

          /* Наложение для уменьшения прозрачности фонового изображения */
          .hd-a5-page::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(233, 227, 215, 0.7);
            z-index: 2;
          }

          /* Декоративные цветы */
          .hd-flower-decoration {
            position: absolute;
            width: 700px;
            height: 700px;
            object-fit: contain;
            opacity: 0.8;
            z-index: 3;
          }

          .hd-flower-decoration.top-left {
            top: -190px;
            left: -170px;
            /* transform: rotate(45deg); Базовый поворот, можно изменить через F12 */
            /* Альтернативные варианты поворота для тестирования: */
            /* transform: rotate(0deg); */
            /* transform: rotate(90deg); */
            /* transform: rotate(180deg); */
            /* transform: rotate(270deg); */
            /* transform: rotate(360deg); */
          }

          .hd-flower-decoration.bottom-right {
            bottom: 20px;
            right: 20px;
            transform: rotate(225deg); /* Базовый поворот, можно изменить через F12 */
          }

          /* Отдельный класс для нижнего цветка */
          .hd-bottom-flower {
            position: absolute;
            width: 800px;
            height: 800px;
            object-fit: contain;
            opacity: 0.8;
            z-index: 3;
            bottom: -223px;
            /* right: 0px; */
            left: -35px;
            transform: rotate(183deg);
          }

          /* Дополнительные CSS классы для быстрого изменения поворота нижнего цветка через F12 */
          .hd-bottom-flower.rotate-0 { transform: rotate(0deg); }
          .hd-bottom-flower.rotate-45 { transform: rotate(45deg); }
          .hd-bottom-flower.rotate-90 { transform: rotate(90deg); }
          .hd-bottom-flower.rotate-135 { transform: rotate(135deg); }
          .hd-bottom-flower.rotate-180 { transform: rotate(180deg); }
          .hd-bottom-flower.rotate-225 { transform: rotate(225deg); }
          .hd-bottom-flower.rotate-270 { transform: rotate(270deg); }
          .hd-bottom-flower.rotate-315 { transform: rotate(315deg); }
          .hd-bottom-flower.rotate-360 { transform: rotate(360deg); }

          /* Дополнительные CSS классы для быстрого изменения поворота через F12 */
          .hd-flower-decoration.top-left.rotate-0 { transform: rotate(0deg); }
          .hd-flower-decoration.top-left.rotate-45 { transform: rotate(45deg); }
          .hd-flower-decoration.top-left.rotate-90 { transform: rotate(90deg); }
          .hd-flower-decoration.top-left.rotate-135 { transform: rotate(135deg); }
          .hd-flower-decoration.top-left.rotate-180 { transform: rotate(180deg); }
          .hd-flower-decoration.top-left.rotate-225 { transform: rotate(225deg); }
          .hd-flower-decoration.top-left.rotate-270 { transform: rotate(270deg); }
          .hd-flower-decoration.top-left.rotate-315 { transform: rotate(315deg); }
          .hd-flower-decoration.top-left.rotate-360 { transform: rotate(360deg); }

          /* Классы для нижнего правого цветка */
          .hd-flower-decoration.bottom-right.rotate-0 { transform: rotate(0deg); }
          .hd-flower-decoration.bottom-right.rotate-45 { transform: rotate(45deg); }
          .hd-flower-decoration.bottom-right.rotate-90 { transform: rotate(90deg); }
          .hd-flower-decoration.bottom-right.rotate-135 { transform: rotate(135deg); }
          .hd-flower-decoration.bottom-right.rotate-180 { transform: rotate(180deg); }
          .hd-flower-decoration.bottom-right.rotate-225 { transform: rotate(225deg); }
          .hd-flower-decoration.bottom-right.rotate-270 { transform: rotate(270deg); }
          .hd-flower-decoration.bottom-right.rotate-315 { transform: rotate(315deg); }
          .hd-flower-decoration.bottom-right.rotate-360 { transform: rotate(360deg); }

          /* Заголовок стола */
          .hd-table-title {
            font-size: 42px;
            font-weight: 600;
            color: #5f4f3c;
            margin-top: 20px;
            margin-bottom: 40px;
            font-family: 'Dancing Script', cursive;
            text-shadow: 0 2px 4px rgba(139, 69, 19, 0.3);
            position: relative;
            z-index: 4;
          }

          .hd-table-title::after {
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
          .hd-guests-list {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            gap: 0px;
            margin-bottom: 0;
            margin-top: 0;
            width: 100%;
            max-width: 90mm;
            position: relative;
            z-index: 4;
          }

          /* Имя гостя */
          .hd-guest-name {
            font-size: 32px;
            color: #5f4f3c;
            font-weight: 500;
            font-family: 'Caveat', 'Marck Script', cursive;
            padding: 0;
            margin: 0;
            text-align: center;
            background: transparent;
            border-radius: 0;
            backdrop-filter: none;
            box-shadow: none;
          }

          /* Стили для печати */
          @media print {
            body { 
              background: white; 
              margin: 0; 
              padding: 0;
            }
            
            .hd-a5-page {
              box-shadow: none;
              margin: 0;
              padding: 25mm;
              width: 148mm;
              height: 210mm;
              page-break-after: always;
              page-break-inside: avoid;
              border-radius: 0;
            }
            
            .hd-a5-page:last-child {
              page-break-after: avoid;
            }
          }

          /* Адаптивность для мобильных устройств */
          @media (max-width: 768px) {
            .hd-a5-page {
              width: 100%;
              height: auto;
              min-height: 200mm;
              padding: 15mm;
            }
            
            .hd-table-title {
              font-size: 32px;
              margin-top: 15px;
              margin-bottom: 30px;
            }
            
            .hd-guest-name {
              font-size: 24px;
            }
            
            .hd-flower-decoration {
              width: 400px;
              height: 400px;
            }
          }
        </style>
      </head>
      <body>
        ${tablePages}
      </body>
      </html>
    `;
  }, [hallData, language, t]);

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
  const exportToPDF = useCallback(async () => {
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
      const htmlContent = generateHDTemplateContent(tables);
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      document.body.appendChild(tempDiv);

      console.log('HTML контент HD шаблона создан:', tempDiv.innerHTML.substring(0, 500) + '...');

      // Предварительно загружаем изображения
      console.log('Начинаем загрузку HD изображений...');
      const loadedImages = await preloadHDTemplateImages();
      
      if (loadedImages.length === 0) {
        console.warn('HD изображения не загружены, но продолжаем экспорт...');
      }
      
      // Дополнительная задержка для полной загрузки изображений
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Проверяем, что изображения действительно загружены в DOM
      const backgroundImg = tempDiv.querySelector('.hd-background-image');
      const flowerImgs = tempDiv.querySelectorAll('.hd-flower-decoration');
      
      if (backgroundImg && flowerImgs.length > 0) {
        console.log('HD изображения найдены в DOM, ожидаем загрузки...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Проверяем статус загрузки изображений
        const allImages = [backgroundImg, ...flowerImgs];
        const loadedCount = allImages.filter(img => img.complete && img.naturalHeight !== 0).length;
        console.log(`Статус загрузки HD: ${loadedCount}/${allImages.length} изображений загружено`);
        
        if (loadedCount === 0) {
          console.warn('Внимание: HD изображения в DOM не загружены. Возможно, проблема с путями к файлам.');
        }
      }

      try {
        // Конвертируем HTML в canvas
        await html2canvas.default(tempDiv, {
          scale: 2, // Увеличиваем качество
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#faf5ef',
          logging: false, // Отключаем логи для производительности
          imageTimeout: 15000, // Увеличиваем таймаут для изображений
          onclone: (clonedDoc) => {
            // Дополнительная обработка клонированного документа
            const images = clonedDoc.querySelectorAll('img');
            let loadedImages = 0;
            images.forEach(img => {
              if (img.complete && img.naturalHeight !== 0) {
                img.style.display = 'block';
                loadedImages++;
              } else {
                console.warn(`HD изображение не загружено: ${img.src}`);
                img.style.display = 'none';
              }
            });
            console.log(`Загружено ${loadedImages} из ${images.length} HD изображений в клоне`);
          }
        });

        // Создаем PDF
        const pdf = new jsPDF('p', 'mm', 'a5');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Получаем все страницы
        const pages = tempDiv.querySelectorAll('.hd-a5-page');
        
        // Конвертируем страницы последовательно
        for (let index = 0; index < pages.length; index++) {
          if (index > 0) {
            pdf.addPage();
          }

          // Конвертируем каждую страницу отдельно
          const pageCanvas = await html2canvas.default(pages[index], {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#faf5ef',
            logging: false,
            imageTimeout: 15000,
            onclone: (clonedPage) => {
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
          });
          
          const imgData = pageCanvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
        }

        // Сохраняем PDF после обработки всех страниц
        const fileName = `${hallData?.name || 'seating'}_HD_template_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

      } finally {
        // Удаляем временный элемент
        document.body.removeChild(tempDiv);
      }

    } catch (error) {
      console.error('Ошибка при экспорте HD шаблона в PDF:', error);
      alert(`Ошибка при экспорте HD шаблона: ${error.message || 'Неизвестная ошибка'}`);
    }
  }, [hallData, getExportData, t, preloadHDTemplateImages, generateHDTemplateContent]);

  // Экспорт в HTML для печати
  const exportToHTML = useCallback(() => {
    const tables = getExportData();
    
    if (tables.length === 0) {
      alert(t('noTablesToExport') || 'Нет столов для экспорта');
      return;
    }

    const htmlContent = generateHDTemplateContent(tables);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${hallData?.name || 'seating'}_HD_template_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [hallData, getExportData, t, generateHDTemplateContent]);

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
            name: person.name,
            tableNumber: table.tableNumber || table.id
          });
        });
      });

    return allGuests.filter(guest => guest.name && guest.name.trim() !== '');
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

  // Генерация HTML контента для карточек гостей в HD-стиле
  const generateHDGuestCardsContent = useCallback((guests) => {
    const guestCards = guests.map(guest => `
      <div class="hd-guest-card">
        <!-- Фоновое изображение -->
        <img src="${window.location.origin}/HDfon.jpg" class="hd-card-background-image" alt="HD фон" />
        <!-- Декоративные цветы -->
        <img src="${window.location.origin}/HDtsaxik.png" class="hd-card-flower-decoration top-left" alt="цветок" />
        <img src="${window.location.origin}/HDtsaxik.png" class="hd-card-bottom-flower" alt="цветок" />
        <div class="hd-guest-name">${guest.name}</div>
        <div class="hd-guest-thanks">Спасибо, что нашли время присутствовать на нашем празднике</div>
        <div class="hd-guest-signature">С любовью,<br>Василий и София</div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${hallData?.name || 'Именные карточки гостей'} - HD Стиль</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&family=Great+Vibes&family=Playfair+Display:wght@400;500;600;700&family=Caveat:wght@400;500;600;700&family=Marck+Script&display=swap" rel="stylesheet">
        <style>
          @media print {
            body { margin: 0; }
            .hd-guest-card {
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
            .hd-guest-card:last-child { page-break-after: avoid; }
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            background: linear-gradient(to bottom, #cfcbb0, #e8e2d2, #ddd9c2);
          }
          
          .hd-guest-card {
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
            box-shadow: 
                0 8px 32px rgba(139, 69, 19, 0.15),
                0 4px 16px rgba(139, 69, 19, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.9);
            border-radius: 8px;
            border: 1px solid rgba(139, 69, 19, 0.1);
          }
          
          /* Фоновое изображение HD для карточек */
          .hd-card-background-image {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.6;
            z-index: 1;
          }

          /* Наложение для уменьшения прозрачности фонового изображения */
          .hd-guest-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(233, 227, 215, 0.7);
            z-index: 2;
          }

                                /* Декоративные цветы для карточек */
            .hd-card-flower-decoration {
              position: absolute;
              width: 500px;
              height: 500px;
              object-fit: contain;
              opacity: 0.6;
              z-index: 3;
            }

            .hd-card-flower-decoration.top-left {
              top: -135px;
              left: -127px;
              transform: rotate(359deg);
            }

                      .hd-card-bottom-flower {
              position: absolute;
              width: 250px;
              height: 250px;
              object-fit: contain;
              opacity: 0;
              z-index: 3;
              bottom: -63px;
              right: -62px;
              transform: rotate(214deg);
            }
          
          .hd-guest-name {
            font-size: 42px;
            color: #5f4f3c;
            font-weight: bold;
            font-family: 'Caveat', 'Marck Script', cursive;
            margin-bottom: 15mm;
            text-align: center;
            z-index: 4;
            position: relative;
            text-shadow: 0 2px 4px rgba(139, 69, 19, 0.3);
          }
          
          .hd-guest-thanks {
            font-size: 22px;
            color: #5f4f3c;
            font-weight: 400;
            font-family: 'Caveat', 'Marck Script', cursive;
            margin-bottom: 18mm;
            text-align: center;
            max-width: 85mm;
            line-height: 1.4;
            z-index: 4;
            position: relative;
          }
          
          .hd-guest-signature {
            font-size: 28px;
            color: #5f4f3c;
            font-weight: 600;
            font-family: 'Caveat', 'Marck Script', cursive;
            text-align: center;
            z-index: 4;
            position: relative;
          }
          
          @media print {
            .hd-guest-card {
              width: 100mm; /* 10x10 см */
              height: 100mm; /* 10x10 см */
              margin: 0;
              padding: 0;
              overflow: hidden;
              clip-path: inset(0 0 0 0);
              background: #faf5ef;
            }
            
            .hd-guest-name {
              font-size: 42px;
              margin-bottom: 15mm;
            }
            
            .hd-guest-thanks {
              font-size: 22px;
              margin-bottom: 18mm;
            }
            
            .hd-guest-signature {
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
   }, [hallData, language]);

  // Генерация HTML контента для номеров столов в HD-стиле
  const generateHDTableNumbersContent = useCallback((tables) => {
    const tableNumbers = tables.map(table => `
      <div class="hd-table-number">
        <!-- Фоновое изображение -->
        <img src="${window.location.origin}/HDfon.jpg" class="hd-number-background-image" alt="HD фон" />
        <!-- Декоративные цветы -->
        <img src="${window.location.origin}/HDtsaxik.png" class="hd-number-flower-decoration top-left" alt="цветок" />
        <img src="${window.location.origin}/HDtsaxik.png" class="hd-number-bottom-flower" alt="цветок" />
        <div class="hd-table-title">${table.tableNumber}</div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html lang="${language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${hallData?.name || 'Номера столов'} - HD Стиль</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&family=Great+Vibes&family=Playfair+Display:wght@400;500;600;700&family=Caveat:wght@400;500;600;700&family=Marck+Script&display=swap" rel="stylesheet">
        <style>
          @media print {
            body { margin: 0; }
            .hd-table-number {
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
              background: #faf5ef;
            }
            .hd-table-number:last-child { page-break-after: avoid; }
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            background: linear-gradient(to bottom, #cfcbb0, #e8e2d2, #ddd9c2);
          }
          
          .hd-table-number {
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
            background: #faf5ef;
            box-shadow: 
                0 8px 32px rgba(139, 69, 19, 0.15),
                0 4px 16px rgba(139, 69, 19, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.9);
            border-radius: 8px;
            border: 1px solid rgba(139, 69, 19, 0.1);
          }
          
          /* Фоновое изображение HD для номеров столов */
          .hd-number-background-image {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.6;
            z-index: 1;
          }

          /* Наложение для уменьшения прозрачности фонового изображения */
          .hd-table-number::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(233, 227, 215, 0.7);
            z-index: 2;
          }

                     /* Декоративные цветы для номеров столов */
           .hd-number-flower-decoration {
             position: absolute;
             width: 400px;
             height: 400px;
             object-fit: contain;
             opacity: 0.6;
             z-index: 3;
           }

           .hd-number-flower-decoration.top-left {
             top: -114px;
             left: -56px;
             transform: rotate(41deg);
           }

                     .hd-number-bottom-flower {
             position: absolute;
             width: 400px;
             height: 400px;
             object-fit: contain;
             opacity: 0.6;
             z-index: 3;
             bottom: -114px;
             right: -64px;
             transform: rotate(214deg);
           }
          
          .hd-table-title {
            font-size: 233px;
            color: #5f4f3c;
            font-weight: 600;
            font-family: 'Dancing Script', cursive;
            text-align: center;
            z-index: 4;
            position: relative;
            text-shadow: 0 2px 4px rgba(139, 69, 19, 0.3);
          }
          
          @media print {
            .hd-table-number {
              width: 74mm; /* А7 ширина */
              height: 105mm; /* А7 высота */
              margin: 0;
              padding: 0;
              overflow: hidden;
              clip-path: inset(0 0 0 0);
              background: #faf5ef;
            }
            
            .hd-table-title {
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
   }, [hallData, language]);

  // Экспорт карточек гостей в HD-стиле
  const exportGuestCardsToHD = useCallback(async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = await import('html2canvas');
      
      const guests = getAllGuests();
      
      if (guests.length === 0) {
        alert(t('noGuestsToExport') || 'Нет гостей для создания карточек');
        return;
      }

      // Создаем временный HTML элемент
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generateHDGuestCardsContent(guests);
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
        const cards = tempDiv.querySelectorAll('.hd-guest-card');
        
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
            backgroundColor: '#faf5ef'
          });
          
          const imgData = cardCanvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
        }

        // Сохраняем PDF
        const fileName = `${hallData?.name || 'guest_cards'}_HD_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

      } finally {
        // Удаляем временный элемент
        document.body.removeChild(tempDiv);
      }

    } catch (error) {
      console.error('Ошибка при экспорте карточек гостей в HD-стиле:', error);
      alert(`Ошибка при экспорте: ${error.message || 'Неизвестная ошибка'}`);
    }
  }, [hallData, getAllGuests, t, generateHDGuestCardsContent]);

  // Экспорт карточек гостей в HD-стиле в HTML
  const exportGuestCardsToHDHTML = useCallback(() => {
    const guests = getAllGuests();
    
    if (guests.length === 0) {
      alert(t('noGuestsToExport') || 'Нет гостей для создания карточек');
      return;
    }

    const htmlContent = generateHDGuestCardsContent(guests);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${hallData?.name || 'guest_cards'}_HD_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [hallData, getAllGuests, t, generateHDGuestCardsContent]);

  // Экспорт номеров столов в HD-стиле
  const exportTableNumbersToHD = useCallback(async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = await import('html2canvas');
      
      const tables = getActiveTables();
      
      if (tables.length === 0) {
        alert(t('noTablesToExport') || 'Нет активных столов для создания номеров');
        return;
      }

      // Создаем временный HTML элемент
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = generateHDTableNumbersContent(tables);
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
        const tableNumbers = tempDiv.querySelectorAll('.hd-table-number');
        
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
            backgroundColor: '#faf5ef'
          });
          
          const imgData = tableCanvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
        }

        // Сохраняем PDF
        const fileName = `${hallData?.name || 'table_numbers'}_HD_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

      } finally {
        // Удаляем временный элемент
        document.body.removeChild(tempDiv);
      }

    } catch (error) {
      console.error('Ошибка при экспорте номеров столов в HD-стиле:', error);
      alert(`Ошибка при экспорте: ${error.message || 'Неизвестная ошибка'}`);
    }
  }, [hallData, getActiveTables, t, generateHDTableNumbersContent]);

  // Экспорт номеров столов в HD-стиле в HTML
  const exportTableNumbersToHDHTML = useCallback(() => {
    const tables = getActiveTables();
    
    if (tables.length === 0) {
      alert(t('noTablesToExport') || 'Нет активных столов для создания номеров');
      return;
    }

    const htmlContent = generateHDTableNumbersContent(tables);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${hallData?.name || 'table_numbers'}_HD_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [hallData, getActiveTables, t, generateHDTableNumbersContent]);

  return {
    getExportData,
    exportToPDF,
    exportToHTML,
    exportGuestCardsToHD,
    exportGuestCardsToHDHTML,
    exportTableNumbersToHD,
    exportTableNumbersToHDHTML,
    hasData: getExportData().length > 0,
    hasGuests: getAllGuests().length > 0,
    hasTables: getActiveTables().length > 0
  };
};
