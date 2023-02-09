import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize/dist'
import { UserModule } from 'src/user/user.module'
import { UserToken } from './token.model'
import { TokenService } from './token.service'

@Module({
  imports: [SequelizeModule.forFeature([UserToken])],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
