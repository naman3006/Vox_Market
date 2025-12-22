import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'co-browsing',
})
export class CoBrowsingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CoBrowsingGateway.name);

  // sessionId -> Set<userId>
  private sessions = new Map<string, Set<string>>();
  // userId -> { socketId, sessionId, username, color, role }
  private users = new Map<
    string,
    {
      socketId: string;
      sessionId: string;
      username: string;
      color: string;
      role: 'HOST' | 'GUEST';
    }
  >();
  // socketId -> userId (for quick lookup on disconnect)
  private socketToUser = new Map<string, string>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const userId = this.socketToUser.get(client.id);

    if (userId) {
      const user = this.users.get(userId);
      if (user) {
        // We DON'T delete the user immediately on disconnect to allow reconnection.
        // We just mark them as inactive or simply remove the socket link.
        // For now, we will notify others that they "disconnected" but keep them in the session state for a bit?
        // Actually, for a simple "refresh" support, we can just remove the socketId.

        // If we want to show "User left", we might want a timeout.
        // But for now, let's keep it simple: strict disconnect = left.
        // The 'rejoin' will handle adding them back.

        // WAIT: If we want true persistence (refresh page), we shouldn't "leave" the session immediately.
        // However, without a persistent DB, memory is all we have.
        // Let's implement a "soft disconnect".

        // Logic:
        // 1. Remove socketId from user record.
        // 2. Notify others "User disconnected (waiting for reconnect)".
        // 3. Set a timeout to clean up if they don't return? (Optional for this sprint)

        // Active decision: To keep the UI clean, we will emit 'participant_left'
        // BUT we keep the data in `users` map for a short while or indefinitely in this memory session.

        const { sessionId } = user;
        const session = this.sessions.get(sessionId);

        if (session) {
          session.delete(userId);
          this.server
            .to(sessionId)
            .emit('participant_left', { userId, socketId: client.id });

          if (session.size === 0) {
            this.sessions.delete(sessionId);
          }
        }

        this.socketToUser.delete(client.id);
        this.users.delete(userId); // For now, fully remove to avoid stale state issues until complex persistence is needed.
      }
    }
  }

  @SubscribeMessage('create_session')
  handleCreateSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { username: string; userId?: string },
  ) {
    const sessionId = uuidv4().slice(0, 8);
    const color = this.getRandomColor();
    const userId = data.userId || uuidv4(); // User sends their existing ID or we generate one

    this.sessions.set(sessionId, new Set([userId]));
    this.users.set(userId, {
      socketId: client.id,
      sessionId,
      username: data.username || 'Host',
      color,
      role: 'HOST',
    });
    this.socketToUser.set(client.id, userId);

    client.join(sessionId);

    return { sessionId, userId, color, role: 'HOST' };
  }

  @SubscribeMessage('join_session')
  handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { sessionId: string; username: string; userId?: string },
  ) {
    const { sessionId, username } = data;

    if (!this.sessions.has(sessionId)) {
      return { error: 'Session not found' };
    }

    const userId = data.userId || uuidv4();

    // Check if user is already "in" (reconnection case where server didn't clean up yet)?
    // Or just overwrite.

    const color = this.getRandomColor();
    this.sessions.get(sessionId).add(userId);

    const role = 'GUEST'; // Joiners are always guests initially

    this.users.set(userId, {
      socketId: client.id,
      sessionId,
      username: username || 'Guest',
      color,
      role,
    });
    this.socketToUser.set(client.id, userId);

    client.join(sessionId);

    // Notify others
    client.to(sessionId).emit('participant_joined', {
      userId,
      socketId: client.id,
      username: username || 'Guest',
      color,
      role,
    });

    return {
      success: true,
      userId,
      color,
      role,
      participants: this.getParticipants(sessionId, userId),
    };
  }

  @SubscribeMessage('rejoin_session')
  handleRejoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { sessionId: string; userId: string; username: string },
  ) {
    const { sessionId, userId, username } = data;

    // If session allows "reclaiming" a user ID or just joining as a known user
    if (!this.sessions.has(sessionId)) {
      return { error: 'Session expired or not found' };
    }

    // We treat it similar to join, but we might want to preserve their old color/role if we had a database.
    // Since it's in-memory and we deleted on disconnect, we treat this as a fresh join but with a specific UserID.
    // If we hadn't deleted in handleDisconnect, we would recover state here.

    // For the "Advanced" requirement: Let's assume we want to support recovering the state if we didn't delete it.
    // But since we *did* delete it above (simple approach), we just re-add efficiently.

    return this.handleJoinSession(client, { sessionId, username, userId });
  }

  @SubscribeMessage('cursor_move')
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { x: number; y: number },
  ) {
    const userId = this.socketToUser.get(client.id);
    const user = this.users.get(userId);
    if (user) {
      client.to(user.sessionId).emit('cursor_update', {
        userId,
        socketId: client.id,
        x: data.x,
        y: data.y,
        username: user.username,
        color: user.color,
      });
    }
  }

  @SubscribeMessage('navigate')
  handleNavigate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { path: string },
  ) {
    const userId = this.socketToUser.get(client.id);
    const user = this.users.get(userId);
    if (user) {
      client.to(user.sessionId).emit('navigation_update', {
        path: data.path,
        triggeredBy: user.username,
      });
    }
  }

  @SubscribeMessage('sync_action')
  handleSyncAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { type: string; payload: any },
  ) {
    const userId = this.socketToUser.get(client.id);
    const user = this.users.get(userId);
    if (user) {
      client.to(user.sessionId).emit('action_synced', {
        type: data.type,
        payload: data.payload,
        fromUser: user.username,
        fromUserId: userId,
      });
    }
  }

  @SubscribeMessage('reaction')
  handleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { emoji: string },
  ) {
    const userId = this.socketToUser.get(client.id);
    const user = this.users.get(userId);
    if (user) {
      // Broadcast to everyone else (and maybe back to self if frontend needs it, but usually local optimistic)
      // But frontend "reaction_received" logic relies on receiving it.
      this.server.to(user.sessionId).emit('reaction_received', {
        userId,
        emoji: data.emoji,
      });
    }
  }

  private getParticipants(sessionId: string, excludeUserId: string) {
    const participants = [];
    const sessionUsers = this.sessions.get(sessionId);
    if (sessionUsers) {
      sessionUsers.forEach((uid) => {
        if (uid !== excludeUserId) {
          const info = this.users.get(uid);
          if (info) {
            participants.push({ userId: uid, ...info });
          }
        }
      });
    }
    return participants;
  }

  private getRandomColor() {
    const colors = [
      '#f44336',
      '#e91e63',
      '#9c27b0',
      '#673ab7',
      '#3f51b5',
      '#2196f3',
      '#03a9f4',
      '#00bcd4',
      '#009688',
      '#4caf50',
      '#8bc34a',
      '#cddc39',
      '#ffeb3b',
      '#ffc107',
      '#ff9800',
      '#ff5722',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
