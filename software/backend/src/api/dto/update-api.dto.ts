import { PartialType } from '@nestjs/mapped-types';
import { CreateApiDto } from './create-api.dto.js';
import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateApiDto extends PartialType(CreateApiDto) {
@IsNotEmpty(
    {message:"email must be valid email address"}
)
@Transform(({value})=> value?.toLowerCase().trim())
email!:String;

@IsNotEmpty({message:"password is required"})
@IsString({message:"password must be strong"})
password!:string
}
    
