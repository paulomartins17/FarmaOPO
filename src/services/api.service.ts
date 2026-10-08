import { API_BASE_URL } from '../config/api';

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  time: string;
  observations?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicationBriefingData {
  medicationName: string;
  pharmacologicalClass: string;
  mainIndications: string[];
  administrationGuidance: string;
  safetyWarnings: string[];
  mandatoryDisclaimer: string;
  source: 'gemini-ai' | 'clinical-catalog-fallback';
  generatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export const ApiService = {
  async getMedications(): Promise<MedicationItem[]> {
    const response = await fetch(`${API_BASE_URL}/medications`);
    const data: ApiResponse<MedicationItem[]> = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Falha ao buscar medicamentos');
    }
    return data.data;
  },

  async createMedication(payload: {
    name: string;
    dosage: string;
    time: string;
    observations?: string;
  }): Promise<MedicationItem> {
    const response = await fetch(`${API_BASE_URL}/medications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data: ApiResponse<MedicationItem> = await response.json();
    if (!response.ok || !data.success) {
      if (data.error?.details && data.error.details.length > 0) {
        const detailMsg = data.error.details.map(d => `${d.field}: ${d.message}`).join('\n');
        throw new Error(`${data.error.message}\n${detailMsg}`);
      }
      throw new Error(data.error?.message || 'Falha ao cadastrar medicamento');
    }
    return data.data;
  },

  async deleteMedication(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/medications/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error?.message || 'Falha ao excluir medicamento');
    }
  },

  async getBriefing(name: string, dosage?: string): Promise<MedicationBriefingData> {
    const response = await fetch(`${API_BASE_URL}/medications/briefing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, dosage }),
    });

    const data: ApiResponse<MedicationBriefingData> = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Falha ao obter briefing técnico');
    }
    return data.data;
  },

  async getBriefingById(id: string): Promise<MedicationBriefingData> {
    const response = await fetch(`${API_BASE_URL}/medications/${id}/briefing`);
    const data: ApiResponse<MedicationBriefingData> = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Falha ao obter briefing técnico');
    }
    return data.data;
  },
};
