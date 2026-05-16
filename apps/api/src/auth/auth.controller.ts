import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Войти в систему' })
  @ApiResponse({
    status: 200,
    description: 'Успешная авторизация, возвращает JWT токен',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid',
          email: 'admin@company.com',
          firstName: 'Иван',
          lastName: 'Иванов',
          role: 'admin',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Неверные учётные данные' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Получить профиль текущего пользователя' })
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }
}
