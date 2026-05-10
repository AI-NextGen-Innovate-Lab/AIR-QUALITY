import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto): Promise<any>;
    findAll(): Promise<any>;
    findOne(id: number): Promise<any>;
    update(id: number, updateUserDto: UpdateUserDto, currentUserRole: string): Promise<any>;
    updateRole(id: number, role: string, currentUserRole: string): Promise<any>;
    remove(id: number, currentUserRole: string): Promise<any>;
}
