import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

export class SocketAdapter extends IoAdapter {
    createIOServer(port: number, options?: ServerOptions): any {
        const server = super.createIOServer(port, {
            ...options,
            cors: {
                origin: (origin, callback) => {
                    callback(null, true);
                },
                credentials: true,
            },
            // Allow both, though client forces websocket.
            // Cloudflare tunnels handle websocket well if configured,
            // but polling is a safe fallback for the server to accept.
            transports: ['websocket', 'polling'],
        });
        return server;
    }
}
