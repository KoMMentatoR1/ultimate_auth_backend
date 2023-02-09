import { UserAgentDto } from 'src/auth/dto/userAgent.dto'

export class SaveTokenDto {
  readonly userId: number
  readonly token: string
  readonly userAgent: UserAgentDto
}
