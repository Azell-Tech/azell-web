import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { InvestmentProductsController } from './investment-products.controller';
import { InvestmentProductsService } from './investment-products.service';

@Module({
  controllers: [InvestmentProductsController],
  providers: [InvestmentProductsService, PrismaService],
})
export class InvestmentProductsModule {}
