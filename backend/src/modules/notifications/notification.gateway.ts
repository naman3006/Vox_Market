import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins for now
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (token) {
        const payload = this.jwtService.verify(token);
        const userId = payload.sub; // Assuming 'sub' is userId
        const role = payload.role;

        client.join(userId);
        if (role) {
          client.join(`role:${role}`);
        }
        console.log(
          `Client ${client.id} (User: ${userId}, Role: ${role}) connected`,
        );
      } else {
        // Allow unauthenticated connection but limited
        console.log(`Client ${client.id} connected (Guest)`);
      }
    } catch (err) {
      console.log(`Client ${client.id} connection auth failed: ${err.message}`);
      // Don't disconnect, just treat as guest or disconnect if strict
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, userId: string) {
    // Legacy support or specific room join
    client.join(userId);
    console.log(`Client ${client.id} joined room ${userId}`);
  }

  sendNotificationToUser(userId: string, message: any) {
    this.server.to(userId).emit('notification', message);
  }

  sendToAll(message: any) {
    this.server.emit('notification', message);
  }

  sendToAdmins(message: any) {
    this.server.to('role:admin').emit('notification', message);
  }

  sendToSellers(message: any) {
    this.server.to('role:seller').emit('notification', message);
  }
}
