import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

const envModule = ConfigModule.forRoot({
  isGlobal: true,
})

@Module({
  imports: [envModule, PrismaModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
