import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { UserService } from '../../user/user.service'
import { JwtPayload } from '../dto/jwtPayload.dto'

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-access'
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),
    })
  }

  async validate(payload: JwtPayload) {
    const user = await this.userService.getById(payload.id)
    if (!user) {
      throw new UnauthorizedException()
    }
    return user
  }
}
