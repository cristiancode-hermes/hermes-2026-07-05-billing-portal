import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { Settings } from '../entities/settings.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, User, Settings]),
    PassportModule,
    JwtModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
