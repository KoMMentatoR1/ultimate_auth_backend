import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import * as UAParser from 'ua-parser-js'

declare global {
  namespace Express {
    export interface Request {
      deviceType?: string
      deviceName?: string
      browser?: string
      clientIp?: string
      os?: string
    }
  }
}

@Injectable()
export class UserAgentMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const parser = new UAParser()
    parser.setUA(req.headers['user-agent'])

    const device = parser.getDevice()

    if (device.model) {
      req.deviceType = device.type
      req.deviceName = device.model
    } else {
      req.deviceType = 'pc'
      req.deviceName = 'pc'
    }

    const os = parser.getOS()
    req.os = os.name + ' ' + os.version

    req.browser = parser.getBrowser().name

    const clientIp =
      req.headers['x-forwarded-for'] || req.connection.remoteAddress

    req.clientIp = clientIp.toString().split(':').at(-1)

    next()
  }
}
