import { MailerService } from '@nestjs-modules/mailer'
import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { UserAgentDto } from 'src/auth/dto/userAgent.dto'

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  sendActivation(email: string, link: string): void {
    const finLink = process.env.API_URL + '/auth/activate/' + link
    this.mailerService
      .sendMail({
        to: email,
        from: process.env.SMTP_USER,
        subject: 'Подтверждение почты ✔',
        html: `
        <html>
          <head>
            <meta charset="utf-8">
            <title>Confirm Your Email Address</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f2f2f2;
                padding: 50px;
              }

              .container {
                background-color: #fff;
                border: 1px solid #ccc;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
                width: 500px;
                margin: 0 auto;
              }

              h2 {
                text-align: center;
                color: #333;
                margin-bottom: 30px;
              }

              a {
                display: block;
                background-color: #4CAF50;
                color: #fff !important;
                padding: 15px;
                border-radius: 10px;
                text-align: center;
                text-decoration: none;
                margin: 30px auto;
                width: 200px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Confirm Your Email Address</h2>
              <p>Thanks for signing up! Please confirm your email address by clicking the button below:</p>
              <a href="${finLink}">Confirm Email</a>
            </div>
          </body>
        </html>
      `,
      })
      .then(() => {})
      .catch(e => {
        throw new HttpException(
          'Ошибка отправления сообщения',
          HttpStatus.BAD_REQUEST
        )
      })
  }

  sendWarning(email: string, userAgent: UserAgentDto): void {
    const date = new Date()
    const finLink = process.env.API_URL + '/auth/secureAccaunt/' + email
    this.mailerService
      .sendMail({
        to: email,
        from: process.env.SMTP_USER,
        subject: 'В ваш аккаунт был выполнен вход',
        html: `
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="X-UA-Compatible" content="ie=edge">
              <title>Security Alert</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  background-color: #f5f8fa;
                }
                .container {
                  width: 600px;
                  margin: 0 auto;
                  background-color: #fff;
                  padding: 30px;
                  border-radius: 5px;
                }
                h1 {
                  font-size: 22px;
                  color: #333;
                  margin-bottom: 30px;
                }

                p {
                  font-size: 16px;
                  color: #333;
                  line-height: 1.5;
                  margin-bottom: 30px;
                }

                .alert {
                  background-color: #ffb3b3;
                  padding: 20px;
                  border-radius: 5px;
                  color: #333;
                  margin-bottom: 30px;
                }

                .btn {
                  background-color: #1877f2;
                  color: #fff !important;
                  padding: 10px 20px;
                  border-radius: 5px;
                  text-decoration: none;
                  display: inline-block;
                }

                .btn:hover {
                  background-color: #0f4c8b;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Security Alert</h1>
                <p>We wanted to inform you that a new device has logged into your account on <strong>${date.getDate()}.${
          date.getMonth() + 1
        }.${date.getFullYear()}</strong> at <strong>${date.getHours()}:${date.getMinutes()}</strong>.</p>
                <div class="alert">
                  <p><strong>IP Address:</strong> ${userAgent.clientIp}</p>
                  <p><strong>Device Name:</strong> ${userAgent.deviceName.toLocaleUpperCase()}</p>
                  <p><strong>Device Type:</strong> ${userAgent.deviceType.toLocaleUpperCase()}</p>
                  <p><strong>Operating System:</strong> ${userAgent.os}</p>
                  <p><strong>Browser:</strong> ${userAgent.browser}</p>
                </div>
                <p>If this was not you, please click on the following button to secure your account:</p>
                <a href="SECURE_ACCOUNT_LINK" class="btn">Secure My Account</a>
              </div>
            </body>
          </html>
        `,
      })
      .then(() => {})
      .catch(e => {
        throw new HttpException(
          'Ошибка отправления сообщения',
          HttpStatus.BAD_REQUEST
        )
      })
  }

  async sendSwitchPasswordCodeMail(email: string, key: string) {
    await this.mailerService.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Код для смены пароля',
      text: '',
      html: `
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Password Reset</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f2f2f2;
                padding: 40px;
              }
              h1 {
                text-align: center;
                color: #333;
                font-weight: bold;
                margin-bottom: 40px;
              }
              .container {
                background-color: #fff;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0px 0px 10px #ccc;
                text-align: center;
              }
              .code {
                background-color: #f2f2f2;
                padding: 10px 20px;
                border-radius: 20px;
                color: #333;
                font-size: 18px;
                font-weight: bold;
                margin-top: 40px;
                display: inline-block;
              }
              a {
                display: block;
                background-color: #333;
                color: #fff;
                padding: 15px 20px;
                border-radius: 20px;
                text-decoration: none;
                margin-top: 40px;
              }
            </style>
          </head>
          <body>
            <h1>Password Reset</h1>
            <div class="container">
              <p>
                Hi there,
              </p>
              <p>
                You recently requested to reset your password. Use the following code to reset it:
              </p>
              <div class="code">
                ${key}
              </div>
            </div>
          </body>
        </html>
    `,
    })
  }
}
