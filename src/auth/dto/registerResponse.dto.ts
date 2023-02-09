import { ResponseUserDto } from './responseUser.dto'

export class RegisterResponseDto {
  readonly accessToken: string
  readonly refreshToken: string
  readonly user: ResponseUserDto

  constructor(
    accessToken: string,
    refreshToken: string,
    user: ResponseUserDto
  ) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    this.user = user
  }
}
