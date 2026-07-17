import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { CreateAuthDto } from './dto/create-auth.dto.js';
import { LoginAuthDto } from './dto/login-auth.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new account and receive a JWT' })
  @HttpCode(HttpStatus.CREATED)
  register(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in with email and password, returns a JWT' })
  @HttpCode(HttpStatus.OK)
  login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.login(loginAuthDto.email, loginAuthDto.password);
  }

  @Post('validate-token')
  @ApiOperation({ summary: 'Validate a JWT and return its decoded payload' })
  @HttpCode(HttpStatus.OK)
  validateToken(@Body() body: { token: string }) {
    return this.authService.validateToken(body.token);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Log out the current user (records an audit event)' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@Request() req: { user: { id: number; email?: string } }) {
    return this.authService.logout(req.user.id, req.user.email);
  }
}
