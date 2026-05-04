import { IsEnum } from 'class-validator';
import { ClientStatus } from '@prisma/client';

export class UpdateClientStatusDto {
  @IsEnum(ClientStatus)
  status: ClientStatus;
}
