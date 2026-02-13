import { ApiProperty } from '@nestjs/swagger';

export type JwtPayload = {
  id: number;
  username: string;
};

export class JwtTokenReturn {
  @ApiProperty()
  accessToken: string;
}
