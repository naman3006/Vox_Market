import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err, user) {
        // If error or no user, just return null instead of throwing
        // This allows the route to proceed even if unauthenticated
        if (err || !user) {
            return null;
        }
        return user;
    }
}
