import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientStatusDto } from './dto/update-client-status.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateClientDto) {
    // Sanitize inputs to prevent XSS
    const sanitized = {
      ...dto,
      name: this.sanitize(dto.name),
      company: dto.company ? this.sanitize(dto.company) : undefined,
    };

    return this.prisma.client.create({
      data: sanitized,
    });
  }

  async findAll(status?: string) {
    const where = status ? { status } : {};
    return this.prisma.client.findMany({ where });
  }

  async findOne(id: string) {
    return this.prisma.client.findUnique({
      where: { id },
      include: { projects: true, invoices: true, audits: true },
    });
  }

  async updateStatus(id: string, dto: UpdateClientStatusDto) {
    return this.prisma.client.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  private sanitize(input: string): string {
    return input
      .replace(/<script.*?>.*?<\/script>/gi, '')
      .replace(/<.*?>/g, '')
      .trim();
  }
}
