import { TestingModule } from '@nestjs/testing';
import { AuthService } from 'src/services/auth/auth.service';
import { UserService } from 'src/services/user/user.service';
import { AuthResponseDto } from 'src/utils/types/dto/user/authResponse.dto';
import { SignUpDto } from 'src/utils/types/dto/user/signUp.dto';

export const createTestUser = async (
  testingModule: TestingModule,
  testUser: SignUpDto,
): Promise<AuthResponseDto> => {
  const authService = testingModule.get<AuthService>(AuthService);
  const userService = testingModule.get<UserService>(UserService);

  const existingUser = await userService.findByEmail(testUser.email);
  if (!existingUser) {
    return await authService.signUp(testUser);
  } else {
    return await authService.signIn({
      email: testUser.email,
      password: testUser.password,
    });
  }
};
