import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto, req: any): Promise<any>;
    findAll(): Promise<any>;
    findMe(req: {
        user: {
            id: number;
        };
    }): Promise<any>;
    updateMe(req: {
        user: {
            id: number;
        };
    }, updateUserDto: UpdateUserDto): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, updateUserDto: UpdateUserDto, req: any): Promise<any>;
    updateRole(id: string, body: {
        role: string;
    }, req: any): Promise<any>;
    remove(id: string, req: any): Promise<any>;
}
