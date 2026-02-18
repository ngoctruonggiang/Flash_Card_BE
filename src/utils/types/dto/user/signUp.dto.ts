import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  password: string;
}
