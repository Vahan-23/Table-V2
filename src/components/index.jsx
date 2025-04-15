// Экспортируем все необходимые компоненты и функции
import HallElementsManager, { HallElementsCatalog, HallElement } from './HallElements';
import ElementProperties from './ElementProperties';

// Экспортируем для использования в других файлах
export {
    HallElementsManager,
    HallElementsCatalog,
    HallElement,
    ElementProperties
};

// Также экспортируем HallElementsManager как компонент по умолчанию
export default HallElementsManager;