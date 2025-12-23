import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserActivityController } from './user-activity.controller';
import { UserActivityService } from './user-activity.service';
import { UserActivity, UserActivitySchema } from './schemas/user-activity.schema';

@Global() // Make it global so we can inject the service easily in other modules
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: UserActivity.name, schema: UserActivitySchema },
        ]),
    ],
    controllers: [UserActivityController],
    providers: [UserActivityService],
    exports: [UserActivityService],
})
export class UserActivityModule { }
