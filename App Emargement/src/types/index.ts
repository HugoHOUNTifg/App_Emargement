export interface Participant {
  nom: string;
  prenom: string;
  signature_matin: string;
  signature_soir: string;
  code_session: string;
  date_du_cours: string;
  nom_formation: string;
  nom_du_cours: string;
}

export interface Intervenant {
  id: number;
  nom: string;
  prenom: string;
  signature_matin: string;
  signature_soir: string;
}

export interface EmargementData {
  participant: Participant;
  intervenants: Omit<Intervenant, 'id'>[];
}

export interface ApiConfig {
  url: string;
  key: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface FormState {
  participant: Participant;
  intervenants: Intervenant[];
  apiConfig: ApiConfig;
} 