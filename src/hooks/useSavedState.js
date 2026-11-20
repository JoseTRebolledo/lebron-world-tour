/* eslint-disable import/prefer-default-export */
import { useCallback, useState } from 'react';

const STORAGE_ROOT = 'lebron-world-tour-saved-state';

const useSavedState = (initialValue, nameVariable) => {
  const hasAllKeys = useCallback((savedValue) => {
    const initialKeys = Object.keys(initialValue).filter((key) => initialValue[key] !== undefined);
    return initialKeys.every((key) => Object.prototype.hasOwnProperty.call(savedValue, key));
  }, [initialValue]);

  const getSavedValues = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_ROOT);
      if (!raw) {
        localStorage.setItem(STORAGE_ROOT, '{}');
        return {};
      }
      return JSON.parse(raw) || {};
    } catch (error) {
      return {};
    }
  }, []);

  const saveValues = useCallback((newValue) => {
    const savedValues = getSavedValues();
    savedValues[nameVariable] = newValue;
    localStorage.setItem(STORAGE_ROOT, JSON.stringify(savedValues));
  }, [getSavedValues, nameVariable]);

  const primaryValue = useCallback(() => {
    const values = getSavedValues();
    if (values[nameVariable] === undefined) return initialValue;
    if (values[nameVariable] && !hasAllKeys(values[nameVariable])) {
      saveValues(initialValue);
      return initialValue;
    }
    return values[nameVariable];
  }, [nameVariable, initialValue, getSavedValues, hasAllKeys, saveValues]);

  const [state, setState] = useState(primaryValue);

  const proxySetState = useCallback((dispatcher) => {
    setState((prevValue) => {
      const nextValue = typeof dispatcher === 'function' ? dispatcher(prevValue) : dispatcher;
      saveValues(nextValue);
      return nextValue;
    });
  }, [saveValues]);

  return [state, proxySetState];
};

export default useSavedState;
