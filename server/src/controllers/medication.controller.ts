import { Request, Response, NextFunction } from 'express';
import { MedicationService } from '../services/medication.service.js';
import { CreateMedicationInput, RequestBriefingInput } from '../schemas/medication.schema.js';

export class MedicationController {
  constructor(private readonly service: MedicationService) {}

  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const medications = await this.service.listAll();
      res.status(200).json({
        success: true,
        data: medications,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const medication = await this.service.getById(id);
      res.status(200).json({
        success: true,
        data: medication,
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as CreateMedicationInput;
      const created = await this.service.create(body);
      res.status(201).json({
        success: true,
        data: created,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.delete(id);
      res.status(200).json({
        success: true,
        data: { id, message: 'Medicamento removido com sucesso.' },
      });
    } catch (error) {
      next(error);
    }
  };

  generateBriefing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, dosage } = req.body as RequestBriefingInput;
      const briefing = await this.service.getBriefing(name, dosage);
      res.status(200).json({
        success: true,
        data: briefing,
      });
    } catch (error) {
      next(error);
    }
  };

  getMedicationBriefing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const briefing = await this.service.getBriefingForMedication(id);
      res.status(200).json({
        success: true,
        data: briefing,
      });
    } catch (error) {
      next(error);
    }
  };
}
