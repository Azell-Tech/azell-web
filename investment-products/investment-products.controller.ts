import { BadRequestException, Body, Controller, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { InvestmentProductsService } from './investment-products.service';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { Roles } from '../common/auth/roles.decorator';
import { RolesGuard } from '../common/auth/roles.guard';

const createSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  annualRateBps: z.number().int().min(1),
  minContribution: z.number().min(0).optional(),
  active: z.boolean().optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  annualRateBps: z.number().int().min(1).optional(),
  minContribution: z.number().min(0).nullable().optional(),
  active: z.boolean().optional(),
});

@Controller('investment-products')
@UseGuards(JwtAuthGuard)
export class InvestmentProductsController {
  constructor(private readonly svc: InvestmentProductsService) {}

  @Get()
  list(@Req() req: any, @Query('active') active?: string) {
    return this.svc.list(req.user.tenantId, active === 'true');
  }

  @Get('options')
  async options(@Req() req: any) {
    const items = await this.svc.list(req.user.tenantId, true);
    return items.map((i) => ({ id: i.id, label: i.name }));
  }

  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Post()
  create(@Req() req: any, @Body() body: any) {
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues?.[0]?.message || 'Datos inválidos');
    return this.svc.create(req.user.tenantId, parsed.data);
  }

  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Patch(':id')
  update(@Req() req: any, @Body() body: any) {
    const id = req.params.id as string;
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues?.[0]?.message || 'Datos inválidos');
    return this.svc.update(req.user.tenantId, id, parsed.data);
  }
}
