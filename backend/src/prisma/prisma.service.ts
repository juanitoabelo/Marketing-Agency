import { Injectable, OnModuleInit, OnModuleDestroy, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Prisma connected to database');
    } catch (error) {
      console.error('❌ Prisma connection failed:', error.message);
      console.error('   Make sure DATABASE_URL is set and database is running');
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 Prisma disconnected');
  }
}
