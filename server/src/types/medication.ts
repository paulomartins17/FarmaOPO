export interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicationDTO {
  name: string;
  dosage: string;
  time: string;
  observations?: string;
}

export interface MedicationBriefing {
  medicationName: string;
  pharmacologicalClass: string;
  mainIndications: string[];
  administrationGuidance: string;
  safetyWarnings: string[];
  mandatoryDisclaimer: string;
  source: 'gemini-ai' | 'clinical-catalog-fallback';
  generatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
