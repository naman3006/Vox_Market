import { Module } from '@nestjs/common';
import { CoBrowsingGateway } from './co-browsing.gateway';

@Module({
  providers: [CoBrowsingGateway],
})
export class CoBrowsingModule {}
