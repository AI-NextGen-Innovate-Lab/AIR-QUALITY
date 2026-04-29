import {Transform} from "class-transformer"
import {IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength} from "class-validator"
export class CreateAuthDto {
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    @Matches(/^[a-zA-Z\s'-]+$/)
    @Transform(({value}) => value.trim())
    name!:string;


    @IsNotEmpty()
    @IsEmail()
    @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
    message: 'Email must be a valid email address',
  })
  @Transform(({value}) => value?.toLowerCase().trim())
  email!:string
   @IsNotEmpty()
  @IsString()
  @MinLength(8, {
    message: 'Password must be at least 8 characters',
  })
  @MaxLength(128)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).*$/,
    {
      message:
        'Password must include uppercase, lowercase, number, and special character',
    }
  )
  password!: string;
    
}


