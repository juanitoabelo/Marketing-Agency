import { IsEnum } from 'class-validator';

export enum ClientStatus {
  LEAD = 'LEAD',
  QUALIFIED = 'QUALIFIED',
  CLIENT = 'CLIENT',
  CHURNED = 'CHURNED',
}

export class UpdateClientStatusDto {
  @IsEnum(ClientStatus)
  status: ClientStatus;
}
