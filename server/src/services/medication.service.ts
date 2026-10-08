import { IMedicationRepository } from '../repositories/medication.repository.js';
import { IGeminiService } from './gemini.service.js';
import { Medication, CreateMedicationDTO, MedicationBriefing } from '../types/medication.js';

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class MedicationService {
  constructor(
    private readonly repository: IMedicationRepository,
    private readonly geminiService: IGeminiService
  ) {}

  async listAll(): Promise<Medication[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<Medication> {
    const medication = await this.repository.findById(id);
    if (!medication) {
      throw new NotFoundError(`Medicamento com identificador "${id}" não foi localizado.`);
    }
    return medication;
  }

  async create(dto: CreateMedicationDTO): Promise<Medication> {
    const duplicate = await this.repository.findDuplicate(dto.name, dto.dosage);
    if (duplicate) {
      throw new ConflictError(
        `Já existe um registro para o medicamento "${dto.name}" com dosagem "${dto.dosage}".`
      );
    }

    return this.repository.create({
      name: dto.name.trim(),
      dosage: dto.dosage.trim(),
      time: dto.time.trim(),
      observations: dto.observations?.trim() || undefined,
    });
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new NotFoundError(`Medicamento com identificador "${id}" não foi localizado para exclusão.`);
    }
  }

  async getBriefing(name: string, dosage?: string): Promise<MedicationBriefing> {
    return this.geminiService.generateMedicationBriefing(name, dosage);
  }

  async getBriefingForMedication(id: string): Promise<MedicationBriefing> {
    const medication = await this.getById(id);
    return this.geminiService.generateMedicationBriefing(medication.name, medication.dosage);
  }
}
