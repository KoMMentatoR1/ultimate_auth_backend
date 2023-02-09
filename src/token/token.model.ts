import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript'
import { User } from 'src/user/user.model'

@Table({ tableName: 'UserToken', timestamps: false, freezeTableName: true })
export class UserToken extends Model {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  token: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  deviceType: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  deviceName: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  clientIp: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  browser: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  os: string

  @ForeignKey(() => User)
  @Column
  userId: number
}
