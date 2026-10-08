import { GoogleGenerativeAI } from '@google/generative-ai';
import { MedicationBriefing } from '../types/medication.js';

export interface IGeminiService {
  generateMedicationBriefing(name: string, dosage?: string): Promise<MedicationBriefing>;
}

export class GeminiService implements IGeminiService {
  private readonly genAI: GoogleGenerativeAI | null = null;
  private readonly modelName = 'gemini-2.5-flash';

  private readonly mandatoryDisclaimerText =
    'AVISO REGULATÓRIO: As orientações técnicas aqui expressas possuem caráter estritamente informativo e não substituem o aconselhamento médico individualizado ou a leitura integral da bula oficial homologada pela ANVISA.';

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (key && key.trim().length > 0) {
      this.genAI = new GoogleGenerativeAI(key.trim());
    } else {
      console.warn('[GeminiService] GEMINI_API_KEY não configurada. Operando em modo de contingência clínica.');
    }
  }

  async generateMedicationBriefing(name: string, dosage?: string): Promise<MedicationBriefing> {
    if (!this.genAI) {
      return this.buildFallbackBriefing(name, dosage, 'Chave de API do Gemini não configurada no servidor.');
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      });

      const prompt = `
Você é um sistema de apoio à decisão farmacêutica estritamente técnico e objetivo.
Analise a medicação abaixo e responda EXCLUSIVAMENTE em formato JSON compatível com o esquema solicitado.
NÃO utilize nenhum emoji, gíria ou formatação informal. Mantenha linguagem clínica e farmacológica formal.

Medicação: ${name}
${dosage ? `Dosagem indicada: ${dosage}` : ''}

Esquema JSON obrigatório:
{
  "pharmacologicalClass": "string descrevendo a classe terapêutica e mecanismo principal",
  "mainIndications": ["indicação 1", "indicação 2"],
  "administrationGuidance": "recomendações técnicas de administração (ex: com água, relação com refeições, horários)",
  "safetyWarnings": ["contraindicação ou precaução 1", "interação ou precaução 2"]
}
`;

      const result = await model.generateContent(prompt);
      const textResponse = result.response.text();

      const parsed = JSON.parse(textResponse);

      return {
        medicationName: name,
        pharmacologicalClass: parsed.pharmacologicalClass || 'Classe terapêutica não categorizada',
        mainIndications: Array.isArray(parsed.mainIndications) ? parsed.mainIndications : ['Indicação clínica sob prescrição'],
        administrationGuidance: parsed.administrationGuidance || 'Administrar conforme prescrição médica e orientações de posologia.',
        safetyWarnings: Array.isArray(parsed.safetyWarnings) ? parsed.safetyWarnings : ['Consultar médico ou farmacêutico em caso de reações adversas.'],
        mandatoryDisclaimer: this.mandatoryDisclaimerText,
        source: 'gemini-ai',
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`[GeminiService] Falha na chamada da API Gemini para "${name}":`, error);
      return this.buildFallbackBriefing(name, dosage, 'Falha momentânea na conexão com o modelo de inteligência artificial.');
    }
  }

  private buildFallbackBriefing(name: string, dosage?: string, reason?: string): MedicationBriefing {
    return {
      medicationName: name,
      pharmacologicalClass: 'Consulta via catálogo de referência offline',
      mainIndications: [
        `Uso associado ao princípio ativo de ${name}`,
        'Administração sob prescrição e acompanhamento profissional',
      ],
      administrationGuidance: dosage
        ? `Posologia informada de ${dosage}. Respeitar rigorosamente os intervalos e a via prescrita.`
        : 'Administrar estritamente conforme horário prescrito pelo médico responsável.',
      safetyWarnings: [
        'Verificar histórico de hipersensibilidade prévia aos componentes da fórmula.',
        'Não interromper nem alterar a posologia sem prévia anuência profissional.',
      ],
      mandatoryDisclaimer: this.mandatoryDisclaimerText,
      source: 'clinical-catalog-fallback',
      generatedAt: new Date().toISOString(),
    };
  }
}
