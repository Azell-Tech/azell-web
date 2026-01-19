import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { z } from 'zod';
import { SetupService } from './setup.service';

const bootstrapSchema = z.object({
  setupKey: z.string().min(6),
  tenantCode: z.string().min(2),
  tenantName: z.string().min(2),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  // Producto único 12m
  productCode: z.string().min(2).default('INV_12M'),
  productName: z.string().min(2).default('Inversión 12 meses'),
  annualRateBps: z.number().int().min(1), // ej 1200 = 12%
  minContribution: z.number().min(0).optional(),
});

@Controller('setup')
export class SetupController {
  constructor(private readonly svc: SetupService) {}

  @Post('bootstrap')
  bootstrap(@Body() body: any) {
    const parsed = bootstrapSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues?.[0]?.message || 'Datos inválidos');
    }
    return this.svc.bootstrap(parsed.data);
  }
}
