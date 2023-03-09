import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize/dist'
import { UserToken } from './token.model'
import * as jwt from 'jsonwebtoken'
import { SaveTokenDto } from './dto/saveToken.dto'
import { JwtPayload } from 'src/auth/dto/jwtPayload.dto'
import { UserAgentDto } from 'src/auth/dto/userAgent.dto'

@Injectable()
export class TokenService {
  constructor(
    @InjectModel(UserToken)
    private readonly userTokenModel: typeof UserToken
  ) {}

  generateTokens(payload: JwtPayload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: '6h',
    })
    const refreshToken = jwt.sign(payload, process.env.JWT_REFTESH_SECRET, {
      expiresIn: '30d',
    })
    return {
      accessToken,
      refreshToken,
    }
  }

  async validateAccessToken(token: string) {
    try {
      const userData = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET
      ) as JwtPayload

      return userData
    } catch (e) {
      return null
    }
  }

  async validateRefreshToken(token: string, userAgent: UserAgentDto) {
    try {
      const userData = jwt.verify(
        token,
        process.env.JWT_REFTESH_SECRET
      ) as JwtPayload

      const currentToken = await this.userTokenModel.findOne({
        where: { token, userId: userData.id },
      })

      if (
        !currentToken ||
        !(currentToken.os === userAgent.os) ||
        !(currentToken.deviceType === userAgent.deviceType) ||
        !(currentToken.deviceName === userAgent.deviceName) ||
        !(currentToken.browser === userAgent.browser) ||
        !(currentToken.clientIp === userAgent.clientIp)
      ) {
        throw new HttpException(
          'Пользователь не авторизован',
          HttpStatus.UNAUTHORIZED
        )
      }

      return userData
    } catch (e) {
      const currentToken = await this.userTokenModel.findOne({
        where: { token },
      })
      if (currentToken) {
        currentToken.destroy()
      }
      return null
    }
  }

  async saveToken(dto: SaveTokenDto) {
    const tokens = await this.userTokenModel.findAll({
      where: { userId: dto.userId },
    })

    if (tokens.length === 10) {
      await this.userTokenModel.destroy({
        where: {
          userId: dto.userId,
        },
      })
    }

    const candidateToken = await this.userTokenModel.findOne({
      where: {
        userId: dto.userId,
        clientIp: dto.userAgent.clientIp,
        deviceName: dto.userAgent.deviceName,
        deviceType: dto.userAgent.deviceType,
        browser: dto.userAgent.browser,
        os: dto.userAgent.os,
      },
    })

    if (candidateToken) {
      await candidateToken.destroy()
    }
    const token = await this.userTokenModel.create({
      userId: dto.userId,
      token: dto.token,
      ...dto.userAgent,
    })

    return token
  }

  async deleteToken(token: string) {
    const tokenData = await this.userTokenModel.destroy({
      where: {
        token,
      },
    })

    return tokenData
  }

  async deleteAllTokens(userId: number) {
    const tokenData = await this.userTokenModel.destroy({
      where: {
        userId,
      },
    })

    return tokenData
  }

  async findToken(token: string) {
    const tokenData = await this.userTokenModel.findOne({
      where: {
        token,
      },
    })
    return tokenData
  }

  async deleteDeadTokens(userId: number) {
    const tokens = await this.userTokenModel.findAll({
      where: {
        userId,
      },
    })

    for (const token of tokens) {
      try {
        jwt.verify(token.token, process.env.JWT_REFTESH_SECRET)
      } catch (e) {
        token.destroy()
      }
    }
  }

  parseJwt(token: string) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
  }
}
