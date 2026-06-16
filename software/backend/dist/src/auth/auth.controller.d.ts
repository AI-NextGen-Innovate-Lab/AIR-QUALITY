import { AuthService } from './auth.service.js';
import { CreateAuthDto } from './dto/create-auth.dto.js';
import { LoginAuthDto } from './dto/login-auth.dto.js';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(createAuthDto: CreateAuthDto): Promise<{
        user: any;
        access_token: string;
    }>;
    login(loginAuthDto: LoginAuthDto): Promise<{
        user: any;
        access_token: string;
    }>;
    validateToken(body: {
        token: string;
    }): Promise<any>;
    logout(req: {
        user: {
            id: number;
            email?: string;
        };
    }): Promise<{
        ok: boolean;
    }>;
}
