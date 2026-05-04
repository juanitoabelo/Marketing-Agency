import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';

describe('ClientsService', () => {
  let service: ClientsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new client with valid data', async () => {
      const dto: CreateClientDto = {
        name: 'Acme Corp',
        email: 'contact@acme.com',
        company: 'Acme',
        leadScore: 85,
      };

      const expected = { id: 'client_123', ...dto, status: 'LEAD', createdAt: new Date() };
      jest.spyOn(prisma.client, 'create').mockResolvedValue(expected);

      const result = await service.create(dto);
      expect(result).toEqual(expected);
      expect(prisma.client.create).toHaveBeenCalledWith({
        data: dto,
      });
    });

    it('should sanitize inputs to prevent XSS', async () => {
      const dto: CreateClientDto = {
        name: '<script>alert("xss")</script>Acme',
        email: 'contact@acme.com',
        company: 'Acme',
      };

      await service.create(dto);
      expect(prisma.client.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: expect.not.stringContaining('<script>'),
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return all clients', async () => {
      const clients = [
        { id: '1', name: 'Client 1' },
        { id: '2', name: 'Client 2' },
      ];
      jest.spyOn(prisma.client, 'findMany').mockResolvedValue(clients);

      const result = await service.findAll();
      expect(result).toEqual(clients);
    });
  });

  describe('updateStatus', () => {
    it('should update client status', async () => {
      const clientId = 'client_123';
      const status = 'QUALIFIED';
      const expected = { id: clientId, status };
      jest.spyOn(prisma.client, 'update').mockResolvedValue(expected);

      const result = await service.updateStatus(clientId, status);
      expect(result).toEqual(expected);
    });
  });
});
