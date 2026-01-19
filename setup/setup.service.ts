import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { hashPassword } from '../common/auth/password';

@Injectable()
export class SetupService {
  constructor(private db: PrismaService) {}

  async bootstrap(dto: {
    setupKey: string;
    tenantCode: string;
    tenantName: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
    productCode: string;
    productName: string;
    annualRateBps: number;
    minContribution?: number;
  }) {
    const expected = process.env.SETUP_KEY;
    if (!expected || dto.setupKey !== expected) {
      throw new BadRequestException('SETUP_KEY inválida');
    }

    const tenantCode = dto.tenantCode.trim();
    const tenantName = dto.tenantName.trim();

    const existingTenant = await this.db.tenant.findUnique({ where: { code: tenantCode } });
    if (existingTenant) throw new BadRequestException('Ya existe un tenant con ese código');

    const adminEmail = dto.adminEmail.trim().toLowerCase();

    const res = await this.db.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { code: tenantCode, name: tenantName, active: true },
      });

      const admin = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: dto.adminName.trim(),
          email: adminEmail,
          password: hashPassword(dto.adminPassword),
          role: 'SUPER_ADMIN',
          active: true,
          mustChangePassword: false,
          emailVerified: true,
        },
        select: { id: true, email: true, role: true, active: true },
      });

      const product = await tx.investmentProduct.create({
        data: {
          tenantId: tenant.id,
          code: dto.productCode.trim(),
          name: dto.productName.trim(),
          termMonths: 12,
          annualRateBps: dto.annualRateBps,
          minContribution: dto.minContribution != null ? dto.minContribution : null,
          currency: 'MXN',
          active: true,
        },
        select: { id: true, code: true, name: true, annualRateBps: true, termMonths: true, active: true },
      });

      return { tenant, admin, product };
    });

    return {
      ok: true,
      tenant: { id: res.tenant.id, code: res.tenant.code, name: res.tenant.name },
      admin: res.admin,
      product: res.product,
    };
  }
}
