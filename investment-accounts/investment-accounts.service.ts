import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

@Injectable()
export class InvestmentAccountsService {
  constructor(private db: PrismaService) {}

  async openForMe(tenantId: string, userId: string) {
    const user = await this.db.user.findFirst({ where: { id: userId, tenantId } });
    if (!user || !user.active) throw new BadRequestException('Usuario no aprobado');

    const product = await this.db.investmentProduct.findFirst({
      where: { tenantId, active: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!product) throw new BadRequestException('No hay producto activo');

    const existing = await this.db.investmentAccount.findFirst({
      where: { tenantId, userId, productId: product.id },
    });
    if (existing) return existing;

    const now = new Date();
    const maturity = new Date(now);
    maturity.setMonth(maturity.getMonth() + 12);

    return this.db.investmentAccount.create({
      data: {
        tenantId,
        userId,
        productId: product.id,
        status: 'ACTIVE',
        principal: 0,
        accruedYield: 0,
        currency: 'MXN',
        openedAt: now,
        maturityAt: maturity,
      },
    });
  }

  async contributeMock(tenantId: string, userId: string, amount: number) {
    const account = await this.db.investmentAccount.findFirst({
      where: { tenantId, userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: { product: true },
    });
    if (!account) throw new BadRequestException('No existe cuenta activa. Abre primero la cuenta.');

    const newPrincipal = Number(account.principal) + amount;

    // yield estimado simple (demo): principal * (tasa anual) * (días transcurridos/365)
    const annualRate = account.product.annualRateBps / 10000;
    const days = 1; // demo: 1 día por aporte
    const yieldInc = amount * annualRate * (days / 365);

    const updated = await this.db.investmentAccount.update({
      where: { id: account.id },
      data: {
        principal: newPrincipal,
        accruedYield: round2(Number(account.accruedYield) + yieldInc),
      },
    });

    // movimiento demo
    await this.db.movement.create({
      data: {
        tenantId,
        userId,
        type: 'INVESTMENT_CONTRIBUTION',
        status: 'POSTED',
        currency: 'MXN',
        amount,
        reference: 'mock_contribution',
        happenedAt: new Date(),
        investmentId: account.id,
      },
    });

    return updated;
  }

  async dashboard(tenantId: string, userId: string) {
    const account = await this.db.investmentAccount.findFirst({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
      include: { product: true },
    });

    const movements = await this.db.movement.findMany({
      where: { tenantId, userId },
      orderBy: { happenedAt: 'desc' },
      take: 20,
      select: { id: true, type: true, amount: true, currency: true, status: true, reference: true, happenedAt: true },
    });

    return {
      account: account
        ? {
            id: account.id,
            status: account.status,
            principal: Number(account.principal),
            accruedYield: Number(account.accruedYield),
            currency: account.currency,
            openedAt: account.openedAt,
            maturityAt: account.maturityAt,
          }
        : null,
      product: account
        ? {
            id: account.product.id,
            name: account.product.name,
            termMonths: account.product.termMonths,
            annualRateBps: account.product.annualRateBps,
            minContribution: account.product.minContribution ? Number(account.product.minContribution) : null,
          }
        : null,
      movements,
    };
  }
}
