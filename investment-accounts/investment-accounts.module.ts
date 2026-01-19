import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { InvestmentAccountsController } from './investment-accounts.controller';
import { InvestmentAccountsService } from './investment-accounts.service';

@Module({
  controllers: [InvestmentAccountsController],
  providers: [InvestmentAccountsService, PrismaService],
})
export class InvestmentAccountsModule {}
