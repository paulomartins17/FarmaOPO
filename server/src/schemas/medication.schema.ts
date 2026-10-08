import { z } from 'zod';

export const createMedicationSchema = z.object({
  name: z
    .string({ required_error: 'Nome do medicamento é obrigatório' })
    .trim()
    .min(2, { message: 'Nome deve conter pelo menos 2 caracteres' })
    .max(100, { message: 'Nome deve conter no máximo 100 caracteres' }),
  dosage: z
    .string({ required_error: 'Dosagem é obrigatória' })
    .trim()
    .min(1, { message: 'Dosagem não pode ser vazia' })
    .max(50, { message: 'Dosagem deve conter no máximo 50 caracteres' }),
  time: z
    .string({ required_error: 'Horário/frequência é obrigatório' })
    .trim()
    .min(1, { message: 'Horário de uso não pode ser vazio' })
    .max(60, { message: 'Horário deve conter no máximo 60 caracteres' }),
  observations: z
    .string()
    .trim()
    .max(500, { message: 'Observações devem ter no máximo 500 caracteres' })
    .optional()
    .or(z.literal('')),
});

export const requestBriefingSchema = z.object({
  name: z
    .string({ required_error: 'Nome do medicamento é obrigatório para consulta' })
    .trim()
    .min(2, { message: 'Nome deve conter pelo menos 2 caracteres' })
    .max(100, { message: 'Nome deve conter no máximo 100 caracteres' }),
  dosage: z
    .string()
    .trim()
    .max(50, { message: 'Dosagem deve conter no máximo 50 caracteres' })
    .optional(),
});

export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;
export type RequestBriefingInput = z.infer<typeof requestBriefingSchema>;
