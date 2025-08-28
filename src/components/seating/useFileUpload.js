import { useCallback } from 'react';
import { useSeating } from './SeatingContext';
import persistentStorage from './persistentStorage';

export const useFileUpload = () => {
  const { state, dispatch, actions } = useSeating();
  const { isLoading, error } = state;

  // Обработка загрузки файла
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    dispatch({ type: actions.SET_LOADING, payload: true });
    dispatch({ type: actions.SET_ERROR, payload: null });

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const parsedData = JSON.parse(e.target.result);
        dispatch({ type: actions.SET_HALL_DATA, payload: parsedData });

        if (parsedData.shapes && Array.isArray(parsedData.shapes)) {
          dispatch({ type: actions.SET_SHAPES, payload: parsedData.shapes });
        } else {
          dispatch({ type: actions.SET_SHAPES, payload: [] });
        }

        if (parsedData.canvasData && parsedData.canvasData.zoom) {
          const canvasZoom = Math.max(parsedData.canvasData.zoom, 0.1);
          dispatch({ type: actions.SET_ZOOM, payload: canvasZoom });
        }

        persistentStorage.save('hallData', parsedData);
        dispatch({ type: actions.SET_LOADING, payload: false });

      } catch (error) {
        console.error("Error parsing JSON:", error);
        dispatch({ type: actions.SET_ERROR, payload: 'Ошибка при чтении JSON файла. Проверьте формат файла.' });
        dispatch({ type: actions.SET_LOADING, payload: false });
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  }, [dispatch, actions]);

  return {
    isLoading,
    error,
    handleFileUpload
  };
}; 