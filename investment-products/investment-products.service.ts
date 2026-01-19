import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class InvestmentProductsService {
  constructor(private db: PrismaService) {}

  async list(tenantId: string, onlyActive?: boolean) {
    return this.db.investmentProduct.findMany({
      where: { tenantId, ...(onlyActive ? { active: true } : {}) },
      orderBy: { createdAt: 'desc' },
      select: { id: true, code: true, name: true, termMonths: true, annualRateBps: true, minContribution: true, active: true },
    });
  }

  async create(
    tenantId: string,
    dto: { code: string; name: string; annualRateBps: number; minContribution?: number; active?: boolean },
  ) {
    const code = dto.code.trim();
    const name = dto.name.trim();
    if (!code || !name) throw new BadRequestException('code y name son requeridos');

    const exists = await this.db.investmentProduct.findUnique({
      where: { tenantId_code: { tenantId, code } },
    });
    if (exists) throw new BadRequestException('Ya existe un producto con ese code');

    return this.db.investmentProduct.create({
      data: {
        tenantId,
        code,
        name,
        termMonths: 12,
        annualRateBps: dto.annualRateBps,
        minContribution: dto.minContribution ?? null,
        currency: 'MXN',
        active: dto.active ?? true,
      },
    });
  }

  async update(
    tenantId: string,
    id: string,
    dto: { name?: string; annualRateBps?: number; minContribution?: number | null; active?: boolean },
  ) {
    const current = await this.db.investmentProduct.findFirst({ where: { id, tenantId } });
    if (!current) throw new NotFoundException('Producto no encontrado');

    return this.db.investmentProduct.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.annualRateBps !== undefined ? { annualRateBps: dto.annualRateBps } : {}),
        ...(dto.minContribution !== undefined ? { minContribution: dto.minContribution } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }
}
