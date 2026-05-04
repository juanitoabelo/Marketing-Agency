import { Module } from '@nestjs/common';
import { ClientsModule } from './clients/clients.module';
import { ProjectsModule } from './projects/projects.module';
import { SeoAuditsModule } from './seo-audits/seo-audits.module';
import { InvoicesModule } from './invoices/invoices.module';
import { MessagesModule } from './messages/messages.module';
import { AgentsModule } from './agents/agents.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ClientsModule,
    ProjectsModule,
    SeoAuditsModule,
    InvoicesModule,
    MessagesModule,
    AgentsModule,
  ],
})
export class AppModule {}
