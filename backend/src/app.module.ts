import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { KeycloakConnectModule, AuthGuard, TokenValidation } from 'nest-keycloak-connect';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { KeycloakSyncInterceptor } from './common/interceptors/keycloak-sync.interceptor';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';
import { KafkaModule } from './kafka/kafka.module';
import { NotificationsModule } from './notifications/notifications.module';
import { IncidentsModule } from './incidents/incidents.module';

const envModule = ConfigModule.forRoot({
  isGlobal: true,
})

@Module({
  imports: [
    envModule,
    KeycloakConnectModule.register({
      authServerUrl: process.env.KEYCLOAK_AUTH_URL,
      realm: process.env.KEYCLOAK_REALM,
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      secret: process.env.KEYCLOAK_SECRET,
      bearerOnly: process.env.KEYCLOAK_BEARER_ONLY === 'true',
      realmPublicKey: process.env.KEYCLOAK_REALM_PUBLIC_KEY,
      tokenValidation: TokenValidation.OFFLINE,
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    CacheModule,
    KafkaModule,
    NotificationsModule,
    IncidentsModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_INTERCEPTOR, useClass: KeycloakSyncInterceptor },
  ],
})
export class AppModule { }
