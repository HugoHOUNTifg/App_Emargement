import { useState } from 'react';
import { FormState } from '../types';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erreur lors du chargement de ${key}:`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de ${key}:`, error);
    }
  };

  return [storedValue, setValue] as const;
}

export function useFormState(): [FormState, (value: FormState | ((val: FormState) => FormState)) => void] {
  const initialFormState: FormState = {
    participant: {
      nom: '',
      prenom: '',
      signature_matin: '',
      signature_soir: '',
      code_session: '',
      date_du_cours: new Date().toISOString().split('T')[0],
      nom_formation: '',
      nom_du_cours: '',
    },
    intervenants: [],
    apiConfig: {
      url: 'http://localhost:3000/api/emargement',
      key: 'IFG_EMARGEMENT_2025_SECURE_KEY',
    },
  };

  return useLocalStorage<FormState>('emargement_form_state', initialFormState);
} 