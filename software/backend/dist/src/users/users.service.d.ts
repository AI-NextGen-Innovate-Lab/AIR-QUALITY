import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    private logUserActivity;
    create(createUserDto: CreateUserDto): Promise<any>;
    findAll(): Promise<any>;
    findOne(id: number): Promise<any>;
    updateMe(id: number, updateUserDto: UpdateUserDto): Promise<any>;
    update(id: number, updateUserDto: UpdateUserDto, currentUserRole: string, actorUserId: number): Promise<any>;
    updateRole(id: number, role: string, currentUserRole: string, actorUserId: number): Promise<any>;
    remove(id: number, currentUserRole: string, actorUserId: number): Promise<any>;
    getAuditLogs(limit?: number, actorRole?: string): Promise<any>;
}
