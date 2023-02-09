import { Body, Controller, Req, Post, Res, Get } from '@nestjs/common'
import { AuthService } from './auth.service'
import { RegisterDto } from './dto/register.dto'
import { Request, Response } from 'express'
import { LoginDto } from './dto/login.dto'
import { Param, Put, Redirect } from '@nestjs/common/decorators'

@Controller('/api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const data = await this.authService.login(dto, {
      clientIp: req.clientIp,
      browser: req.browser,
      deviceName: req.deviceName,
      deviceType: req.deviceType,
      os: req.os,
    })

    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 1000,
      sameSite: 'lax',
    })

    return res.json({
      accessToken: data.accessToken,
      user: data.user,
    })
  }

  @Post('/registration')
  async registration(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const data = await this.authService.registration(dto, {
      clientIp: req.clientIp,
      browser: req.browser,
      deviceName: req.deviceName,
      deviceType: req.deviceType,
      os: req.os,
    })

    return res
      .cookie('refreshToken', data.refreshToken, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 1000,
        sameSite: 'lax',
      })
      .json({
        accessToken: data.accessToken,
        user: data.user,
      })
  }

  @Get('/refresh')
  refresh(@Req() req: Request) {
    return this.authService.refresh(req.cookies.refreshToken, {
      clientIp: req.clientIp,
      browser: req.browser,
      deviceName: req.deviceName,
      deviceType: req.deviceType,
      os: req.os,
    })
  }

  @Get('/activate/:link')
  @Redirect()
  async activate(@Param('link') link: string) {
    const data = await this.authService.activate(link)
    return { url: process.env.CLIENT_URL, status: 200 }
  }

  @Get('/secureAccaunt/:email')
  @Redirect()
  async secureAccaunt(@Param('email') email: string) {
    const data = this.authService.secureAccaunt(email)
    return { url: process.env.CLIENT_URL, status: 200 }
  }

  @Post('/forgotPass')
  async forgotPass(@Body('email') email: string) {
    return this.authService.forgotPass(email)
  }

  @Put('/forgotPass/:code')
  async validateCode(@Param('code') code: string) {
    return this.authService.validateCode(code)
  }

  @Put('/switchForgotPass/:code')
  async switchForgotPass(
    @Body('password') password: string,
    @Param('code') code: string
  ) {
    return this.authService.switchForgotPass(password, code)
  }
}
