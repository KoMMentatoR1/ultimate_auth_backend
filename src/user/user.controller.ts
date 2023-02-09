import { Controller, Get } from '@nestjs/common'
import { UserService } from './user.service'

@Controller('/api/login')
export class UserController {
  constructor(private readonly userService: UserService) {}
}
