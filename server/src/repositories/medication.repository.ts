import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { Medication, CreateMedicationDTO } from '../types/medication.js';

export interface IMedicationRepository {
  findAll(): Promise<Medication[]>;
  findById(id: string): Promise<Medication | null>;
  findDuplicate(name: string, dosage: string): Promise<Medication | null>;
  create(dto: CreateMedicationDTO): Promise<Medication>;
  delete(id: string): Promise<boolean>;
}

export class JsonMedicationRepository implements IMedicationRepository {
  private readonly filePath: string;
  private readonly seedInitialData: boolean;

  constructor(filePath?: string, seedInitialData = true) {
    this.filePath = filePath || path.resolve(process.cwd(), 'data', 'medications.json');
    this.seedInitialData = seedInitialData;
  }

  private async ensureInitialized(): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });

    try {
      await fs.access(this.filePath);
    } catch {
      const initialItems: Medication[] = this.seedInitialData
        ? [
            {
              id: 'med-001',
              name: 'Paracetamol',
              dosage: '750 mg',
              time: '08:00 / 16:00',
              observations: 'Uso se febre ou dor moderada',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'med-002',
              name: 'Amoxicilina',
              dosage: '500 mg',
              time: '08:00 / 16:00 / 00:00',
              observations: 'Completar ciclo de 7 dias prescrito',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'med-003',
              name: 'Losartana Potássica',
              dosage: '50 mg',
              time: '08:00',
              observations: 'Tomar pela manhã em jejum',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]
        : [];

      await fs.writeFile(this.filePath, JSON.stringify(initialItems, null, 2), 'utf-8');
    }
  }

  private async readData(): Promise<Medication[]> {
    await this.ensureInitialized();
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(content) as Medication[];
    } catch (error) {
      console.error('[Repository] Erro ao ler arquivo de medicamentos:', error);
      return [];
    }
  }

  private async writeData(medications: Medication[]): Promise<void> {
    await this.ensureInitialized();
    const tempPath = `${this.filePath}.${crypto.randomUUID()}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(medications, null, 2), 'utf-8');
    await fs.rename(tempPath, this.filePath);
  }

  async findAll(): Promise<Medication[]> {
    return this.readData();
  }

  async findById(id: string): Promise<Medication | null> {
    const medications = await this.readData();
    return medications.find(m => m.id === id) || null;
  }

  async findDuplicate(name: string, dosage: string): Promise<Medication | null> {
    const medications = await this.readData();
    const normalizedName = name.trim().toLowerCase();
    const normalizedDosage = dosage.trim().toLowerCase();

    return (
      medications.find(
        m => m.name.trim().toLowerCase() === normalizedName && m.dosage.trim().toLowerCase() === normalizedDosage
      ) || null
    );
  }

  async create(dto: CreateMedicationDTO): Promise<Medication> {
    const medications = await this.readData();
    const now = new Date().toISOString();

    const newMedication: Medication = {
      id: crypto.randomUUID(),
      name: dto.name.trim(),
      dosage: dto.dosage.trim(),
      time: dto.time.trim(),
      observations: dto.observations?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    medications.push(newMedication);
    await this.writeData(medications);
    return newMedication;
  }

  async delete(id: string): Promise<boolean> {
    const medications = await this.readData();
    const initialLength = medications.length;
    const filtered = medications.filter(m => m.id !== id);

    if (filtered.length === initialLength) {
      return false;
    }

    await this.writeData(filtered);
    return true;
  }
}
