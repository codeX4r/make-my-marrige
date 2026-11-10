import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  displayName!: string;
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class ResendEmailDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class RevokeSessionDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;
}
