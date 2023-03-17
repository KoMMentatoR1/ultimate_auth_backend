import { HttpException, HttpStatus } from '@nestjs/common'
import { Injectable, UseGuards } from '@nestjs/common/decorators'
import { MailService } from 'src/mail/mail.service'
import { TokenService } from 'src/token/token.service'
import { UserService } from 'src/user/user.service'
import { RegisterDto } from './dto/register.dto'
import * as bcrypt from 'bcrypt'
import * as uuid from 'uuid'
import { ResponseUserDto } from './dto/responseUser.dto'
import { RegisterResponseDto } from './dto/registerResponse.dto'
import { LoginDto } from './dto/login.dto'
import { UserAgentDto } from './dto/userAgent.dto'
import axios from 'axios'
import { OAuth2GoogleResponse } from './dto/oAuth2GoogleResponse.dto'
import { OAuth2YandexResponse } from './dto/oAuth2YandexResponse.dto'
import { SwitchPassDto } from './dto/switchPass.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService
  ) {}

  async login(
    dto: LoginDto,
    userAgent: UserAgentDto
  ): Promise<RegisterResponseDto> {
    const user = await this.userService.getByEmail(dto.email)
    if (!user) {
      throw new HttpException(
        'Не верный логин или пароль',
        HttpStatus.BAD_REQUEST
      )
    }

    const comparePass = bcrypt.compare(dto.password, user.password)
    if (!comparePass) {
      throw new HttpException(
        'Не верный логин или пароль',
        HttpStatus.BAD_REQUEST
      )
    }

    const tokens = this.tokenService.generateTokens({
      id: user.id,
      email: user.email,
      isActivated: user.isActivated,
      role: user.role,
    })

    await this.tokenService.saveToken({
      userId: user.id,
      token: tokens.refreshToken,
      userAgent: {
        browser: userAgent.browser,
        clientIp: userAgent.clientIp,
        deviceName: userAgent.deviceName,
        deviceType: userAgent.deviceType,
        os: userAgent.os,
      },
    })

    this.mailService.sendWarning(user.email, userAgent)

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: new ResponseUserDto(user),
    }
  }

  async registration(
    dto: RegisterDto,
    userAgent: UserAgentDto
  ): Promise<RegisterResponseDto> {
    const candidate = await this.userService.getByEmail(dto.email)

    let user

    if (candidate) {
      if (candidate.password === 'null') {
        const hashPassword = await bcrypt.hash(dto.password, 5)
        candidate.email = dto.email
        candidate.firstName = dto.firstName
        candidate.lastName = dto.lastName
        candidate.password = hashPassword
        candidate.isActivated = true
        candidate.save()
        user = candidate
      } else {
        throw new HttpException(
          'Пользователь с таким email существует',
          HttpStatus.BAD_REQUEST
        )
      }
    } else {
      const hashPassword = await bcrypt.hash(dto.password, 5)
      const activationLink = uuid.v4()

      this.mailService.sendActivation(dto.email, activationLink)

      user = await this.userService.createUser({
        ...dto,
        password: hashPassword,
        activationLink,
      })
    }

    const tokens = this.tokenService.generateTokens({
      id: user.id,
      email: user.email,
      isActivated: user.isActivated,
      role: user.role,
    })

    await this.tokenService.saveToken({
      userId: user.id,
      token: tokens.refreshToken,
      userAgent: {
        browser: userAgent.browser,
        clientIp: userAgent.clientIp,
        deviceName: userAgent.deviceName,
        deviceType: userAgent.deviceType,
        os: userAgent.os,
      },
    })

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: new ResponseUserDto(user),
    }
  }

  async refresh(token: string, userAgent: UserAgentDto) {
    const userData = await this.tokenService.validateRefreshToken(
      token,
      userAgent
    )

    if (!userData) {
      throw new HttpException(
        'Пользователь не авторизован',
        HttpStatus.UNAUTHORIZED
      )
    }

    const user = await this.userService.getById(userData.id)

    const tokens = this.tokenService.generateTokens({
      id: user.id,
      email: user.email,
      isActivated: user.isActivated,
      role: user.role,
    })

    await this.tokenService.saveToken({
      userId: user.id,
      token: tokens.refreshToken,
      userAgent,
    })

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: new ResponseUserDto(user),
    }
  }

  async activate(link: string) {
    const user = await this.userService.getByActivationLInk(link)
    if (!user) {
      throw new HttpException(
        'Неккоректная ссылка активации',
        HttpStatus.BAD_REQUEST
      )
    }
    user.isActivated = true
    await user.save()
  }

  async secureAccaunt(email: string) {
    const user = await this.userService.getByEmail(email)

    if (!user) {
      throw new HttpException(
        'Пользователь не обнаружен',
        HttpStatus.BAD_REQUEST
      )
    }

    await this.tokenService.deleteAllTokens(user.id)
    return
  }

  async forgotPass(email: string) {
    const user = await this.userService.getByEmail(email)

    if (!user) {
      throw new HttpException(
        'Пользователь с таким email не существует',
        HttpStatus.BAD_REQUEST
      )
    }

    const code = await this.userService.generateSwitchPassCode(user.id)
    await this.mailService.sendSwitchPasswordCodeMail(user.email, code)

    return true
  }

  async validateCode(code: string) {
    const user = await this.userService.getBySwitchKey(code)

    if (!user) {
      throw new HttpException('Не верный код', HttpStatus.BAD_REQUEST)
    }

    if (Number(user.expiresInKey) > new Date().getTime() + 1000 * 60 * 10) {
      throw new HttpException(
        'Время действия кода закончилось',
        HttpStatus.FORBIDDEN
      )
    }

    return true
  }

  async switchForgotPass(password: string, code: string) {
    const user = await this.userService.getBySwitchKey(code)

    if (!user) {
      throw new HttpException('Не верный код', HttpStatus.BAD_REQUEST)
    }

    if (Number(user.expiresInKey) > new Date().getTime() + 1000 * 60 * 10) {
      throw new HttpException(
        'Время действия кода закончилось',
        HttpStatus.FORBIDDEN
      )
    }

    const hashPassword = await bcrypt.hash(password, 5)

    user.password = hashPassword
    user.switchKey = ''
    user.expiresInKey = ''
    user.save()

    return true
  }

  async oauth2Google(token: string, userAgent: UserAgentDto) {
    const userData = await axios.get<OAuth2GoogleResponse>(
      `https://www.googleapis.com/oauth2/v1/userinfo`,
      {
        params: {
          access_token: token,
        },
      }
    )

    const candidate = await this.userService.getByEmail(userData.data.email)

    if (candidate) {
      if (candidate.password === 'null') {
        return { accessToken: '', user: new ResponseUserDto(candidate) }
      }
      const tokens = this.tokenService.generateTokens({
        id: candidate.id,
        email: candidate.email,
        isActivated: candidate.isActivated,
        role: candidate.role,
      })

      await this.tokenService.saveToken({
        userId: candidate.id,
        token: tokens.refreshToken,
        userAgent: {
          browser: userAgent.browser,
          clientIp: userAgent.clientIp,
          deviceName: userAgent.deviceName,
          deviceType: userAgent.deviceType,
          os: userAgent.os,
        },
      })

      this.mailService.sendWarning(candidate.email, userAgent)

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: new ResponseUserDto(candidate),
      }
    } else {
      const user = await this.userService.createUser({
        email: userData.data.email,
        lastName: userData.data.given_name,
        firstName: userData.data.family_name,
        password: 'null',
      })

      return { accessToken: '', user: new ResponseUserDto(user) }
    }
  }

  async oauth2Yandex(token: string, userAgent: UserAgentDto) {
    const userData = await axios.get<OAuth2YandexResponse>(
      `https://login.yandex.ru/info`,
      {
        params: {
          oauth_token: token,
        },
      }
    )

    const candidate = await this.userService.getByEmail(
      userData.data.default_email
    )

    if (candidate) {
      if (candidate.password === 'null') {
        return { accessToken: '', user: new ResponseUserDto(candidate) }
      }
      const tokens = this.tokenService.generateTokens({
        id: candidate.id,
        email: candidate.email,
        isActivated: candidate.isActivated,
        role: candidate.role,
      })

      await this.tokenService.saveToken({
        userId: candidate.id,
        token: tokens.refreshToken,
        userAgent: {
          browser: userAgent.browser,
          clientIp: userAgent.clientIp,
          deviceName: userAgent.deviceName,
          deviceType: userAgent.deviceType,
          os: userAgent.os,
        },
      })

      this.mailService.sendWarning(candidate.email, userAgent)

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: new ResponseUserDto(candidate),
      }
    } else {
      const user = await this.userService.createUser({
        email: userData.data.default_email,
        lastName: userData.data.last_name,
        firstName: userData.data.first_name,
        password: 'null',
      })

      return { accessToken: '', user: new ResponseUserDto(user) }
    }
  }

  async switchPass(dto: SwitchPassDto) {
    const user = await this.userService.getById(dto.id)

    const isPassEquils = await bcrypt.compare(dto.password, user.password)

    if (!isPassEquils) {
      throw new HttpException('Неверный старый пароль', HttpStatus.BAD_REQUEST)
    }

    const isNewPassEquils = await bcrypt.compare(dto.newPassword, user.password)

    if (isNewPassEquils) {
      throw new HttpException(
        'Новый пароль не может совпадать со старым',
        HttpStatus.BAD_REQUEST
      )
    }

    const hashPassword = await bcrypt.hash(dto.newPassword, 3)
    await user.update({ password: hashPassword })
    return { message: 'Пароль успешно изменен' }
  }

  async logout(refreshToken: string) {
    const token = await this.tokenService.deleteToken(refreshToken)
    if (token) {
      return { message: 'Вы успешно разлогинены' }
    } else {
      throw new HttpException('Токен не существует', HttpStatus.BAD_REQUEST)
    }
  }
}
