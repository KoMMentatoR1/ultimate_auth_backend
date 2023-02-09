import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common'
import { MailModule } from 'src/mail/mail.module'
import { TokenModule } from 'src/token/token.module'
import { UserModule } from 'src/user/user.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { UserAgentMiddleware } from './middleware/req.middleware'
import { AccessTokenStrategy } from './strategy/jwt.strategy'

@Module({
  imports: [UserModule, TokenModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenStrategy],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserAgentMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.POST })
      .apply(UserAgentMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.GET })
  }
}
