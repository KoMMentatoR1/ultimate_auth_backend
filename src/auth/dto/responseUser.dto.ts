export class ResponseUserDto {
  readonly id: number
  readonly email: string
  readonly lastName: string
  readonly firstName: string
  readonly role: string
  readonly isActivated: boolean

  constructor(model) {
    this.id = model.id
    this.email = model.email
    this.lastName = model.lastName
    this.firstName = model.firstName
    this.role = model.role
    this.isActivated = model.isActivated
  }
}
