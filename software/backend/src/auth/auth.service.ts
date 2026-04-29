import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto.js';
import { UpdateAuthDto } from './dto/update-auth.dto.js';
import { PrismaService } from 'src/prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma:PrismaService,
    private jwt:JwtService,
    
  ) {}

  //helper method to log authentication activity
  private async logAuthActivity(
    userId:number,
    action:string,
    success:boolean,
    metadata:any={},
  ){
    try {
      const prisma = this.prisma as any;
      await prisma.activityLog.create({
        data: {
          action: `AUTH_${action}`,
          description: `${action} attempt ${success ? 'succeeded' : 'failed'}`,
          userId,
          metadata: {
            success,
            timestamp: new Date().toISOString(),
            ...metadata,
          },
        },
      });
    }catch(error){
      //catch the errror
      

    }
  }
  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
