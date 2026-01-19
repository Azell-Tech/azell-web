import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';
import { InvestmentAccountsService } from './investment-accounts.service';

const contributeSchema = z.object({
  amount: z.number().min(1),
});

@Controller('investment-accounts')
@UseGuards(JwtAuthGuard)
export class InvestmentAccountsController {
  constructor(private readonly svc: InvestmentAccountsService) {}

  @Post('me/open')
  open(@Req() req: any) {
    return this.svc.openForMe(req.user.tenantId, req.user.sub);
  }

  @Post('me/contribute-mock')
  contributeMock(@Req() req: any, @Body() body: any) {
    const parsed = contributeSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues?.[0]?.message || 'Datos inválidos');
    return this.svc.contributeMock(req.user.tenantId, req.user.sub, parsed.data.amount);
  }

  @Get('me/dashboard')
  dashboard(@Req() req: any) {
    return this.svc.dashboard(req.user.tenantId, req.user.sub);
  }
}
