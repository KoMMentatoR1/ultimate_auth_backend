export class UserUpdateDto {
  readonly lastName?: string
  readonly firstName?: string
  readonly email: string
  readonly password?: string
  readonly activationLink?: string
  readonly isActivated?: boolean
}
