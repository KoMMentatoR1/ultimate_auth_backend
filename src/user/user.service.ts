import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { UserCreateDto } from './dto/userCreate.dto'
import { User } from './user.model'
import { v4 as uuidv4 } from 'uuid'
import { UserUpdateDto } from './dto/updateUser.dto'

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User
  ) {}

  async getByEmail(email: string) {
    return this.userModel.findOne({
      where: {
        email,
      },
    })
  }

  async getBySwitchKey(code: string) {
    console.log(code)

    return this.userModel.findOne({
      where: {
        switchKey: code,
      },
    })
  }

  async getById(id: number) {
    return this.userModel.findByPk(id)
  }

  async getByActivationLInk(link: string) {
    return this.userModel.findOne({
      where: {
        activationLink: link,
      },
    })
  }

  async createUser(createDto: UserCreateDto) {
    return this.userModel.create({ ...createDto })
  }

  async generateSwitchPassCode(userId: number) {
    const user = await this.getById(userId)

    const code = uuidv4().replace(/[-]/g, '').substring(0, 8)
    const expiresIn = (new Date().getTime() + 1000 * 60 * 10).toString()

    user.switchKey = code
    user.expiresInKey = expiresIn
    await user.save()

    return code
  }
}
