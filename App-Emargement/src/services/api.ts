import axios, { AxiosResponse } from 'axios';
import { EmargementData, ApiConfig } from '../types';

/**
 * ApiService
 * Couche d'accès réseau du frontend.
 * - Centralise les appels HTTP vers l'API (/api/*)
 * - Force le type de réponse (PDF) pour la génération
 * - Remonte des erreurs lisibles côté UI
 */

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  /**
   * En-têtes minimum requis par l'API
   */
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.config.key,
    };
  }

  /**
   * POST /api/emargement → retourne un Blob PDF
   */
  async generatePdf(data: EmargementData): Promise<Blob> {
    try {
      const response: AxiosResponse<Blob> = await axios.post(
        `${this.config.url}`,
        data,
        {
          headers: this.getHeaders(),
          responseType: 'blob',
          validateStatus: (status) => status >= 200 && status < 300,
        }
      );
      const contentType = (response.headers as any)['content-type'] || '';
      if (!contentType.includes('application/pdf')) {
        // Lire le corps texte pour remonter l'erreur
        const text = await (response.data as any).text?.().catch(() => '')
          || '[blob non-texte]';
        throw new Error(`Réponse non-PDF du serveur: ${text.slice(0, 300)}`);
      }
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Erreur lors de la génération du PDF: ${error.response?.data?.message || error.message}`);
      }
      throw new Error(`Erreur lors de la génération du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * POST /api/test → PDF minimal pour valider l'API
   */
  async testApi(): Promise<Blob> {
    try {
      const testUrl = this.config.url.replace('/emargement', '/test');
      const response: AxiosResponse<Blob> = await axios.post(
        testUrl,
        {},
        {
          headers: {
            'x-api-key': this.config.key,
          },
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Erreur lors du test API: ${error.response?.data?.message || error.message}`);
      }
      throw new Error(`Erreur lors du test API: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * GET /api/health → état de santé JSON
   */
  async checkHealth(): Promise<{ status: string; message: string }> {
    try {
      const healthUrl = this.config.url.replace('/emargement', '/health');
      const response = await axios.get(healthUrl);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Erreur lors de la vérification de santé: ${error.response?.data?.message || error.message}`);
      }
      throw new Error(`Erreur lors de la vérification de santé: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Met à jour dynamiquement l'URL/clé utilisées
   */
  updateConfig(config: ApiConfig): void {
    this.config = config;
  }
}

export default ApiService; 