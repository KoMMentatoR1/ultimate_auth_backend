import { Model, Table, Column } from 'sequelize-typescript'
import { HasMany } from 'sequelize-typescript/dist/associations/has/has-many'
import { DataType } from 'sequelize-typescript/dist/sequelize/data-type/data-type'
import { UserToken } from 'src/token/token.model'

export enum IRole {
  USER = 'USER',
}

@Table({ tableName: 'User', timestamps: false, freezeTableName: true })
export class User extends Model {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number

  @Column({ type: DataType.STRING, allowNull: false })
  lastName: string

  @Column({ type: DataType.STRING, allowNull: false })
  firstName: string

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  email: string

  @Column({ type: DataType.STRING, allowNull: false })
  password: string

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isActivated: boolean

  @Column({ type: DataType.STRING, allowNull: true })
  activationLink: string

  @Column({ type: DataType.STRING, allowNull: true })
  switchKey: string

  @Column({ type: DataType.STRING, allowNull: true })
  expiresInKey: string

  @Column({
    type: DataType.ENUM('USER'),
    defaultValue: 'USER',
  })
  role: IRole

  @HasMany(() => UserToken)
  userTokens: UserToken[]
}
