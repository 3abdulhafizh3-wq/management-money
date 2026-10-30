import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module.js';

let appInstance: any;

export default async function handler(req: any, res: any) {
  if (!appInstance) {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true,
    });
    await app.init();
    appInstance = app.getHttpAdapter().getInstance();
  }
  return appInstance(req, res);
}
