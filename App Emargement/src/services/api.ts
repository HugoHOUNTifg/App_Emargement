import axios, { AxiosResponse } from 'axios';
import { EmargementData, ApiConfig } from '../types';

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.config.key,
    };
  }

  async generatePdf(data: EmargementData): Promise<Blob> {
    try {
      const response: AxiosResponse<Blob> = await axios.post(
        `${this.config.url}`,
        data,
        {
          headers: this.getHeaders(),
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Erreur lors de la génération du PDF: ${error.response?.data?.message || error.message}`);
      }
      throw new Error(`Erreur lors de la génération du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

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

  updateConfig(config: ApiConfig): void {
    this.config = config;
  }
}

export default ApiService; 