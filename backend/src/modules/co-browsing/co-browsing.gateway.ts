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
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CoBrowsingGateway.name);

  // sessionId -> Set<userId>
  private sessions = new Map<string, Set<string>>();
  // userId -> { socketId, sessionId, username, color, role, status }
  private users = new Map<
    string,
    {
      socketId: string;
      sessionId: string;
      username: string;
      color: string;
      role: 'HOST' | 'GUEST';
      status: 'online' | 'offline';
    }
  >();
  // socketId -> userId
  private socketToUser = new Map<string, string>();
  // userId -> Timeout
  private timeouts = new Map<string, NodeJS.Timeout>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const userId = this.socketToUser.get(client.id);

    if (userId) {
      const user = this.users.get(userId);
      if (user) {
        // Soft Disconnect: Mark offline and set timeout
        user.status = 'offline';
        this.server.to(user.sessionId).emit('participant_status', { userId, status: 'offline' });

        // Clear existing timeout if any (unlikely but safe)
        if (this.timeouts.has(userId)) {
          clearTimeout(this.timeouts.get(userId));
        }

        // Set 2 minute grace period
        const timeout = setTimeout(() => {
          this.forceRemoveUser(userId);
        }, 120000); // 2 mins

        this.timeouts.set(userId, timeout);

        // Remove socket mapping immediately as this socket is dead
        this.socketToUser.delete(client.id);
      }
    }
  }

  private forceRemoveUser(userId: string) {
    const user = this.users.get(userId);
    if (user) {
      const { sessionId } = user;
      const session = this.sessions.get(sessionId);

      if (session) {
        session.delete(userId);
        this.server.to(sessionId).emit('participant_left', { userId });
        if (session.size === 0) {
          this.sessions.delete(sessionId);
        }
      }
      this.users.delete(userId);
      this.timeouts.delete(userId);
      this.logger.log(`User ${userId} fully removed after timeout.`);
    }
  }

  @SubscribeMessage('create_session')
  handleCreateSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { username: string; userId?: string },
  ) {
    const sessionId = uuidv4().slice(0, 8);
    const color = this.getRandomColor();
    const userId = data.userId || uuidv4();

    this.sessions.set(sessionId, new Set([userId]));
    this.users.set(userId, {
      socketId: client.id,
      sessionId,
      username: data.username || 'Host',
      color,
      role: 'HOST',
      status: 'online'
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

    // Check if rejoining (recovering state)
    if (this.users.has(userId)) {
      return this.handleRejoinSession(client, { sessionId, userId, username });
    }

    const color = this.getRandomColor();
    this.sessions.get(sessionId).add(userId);

    const role = 'GUEST';

    this.users.set(userId, {
      socketId: client.id,
      sessionId,
      username: username || 'Guest',
      color,
      role,
      status: 'online'
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
      status: 'online'
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

    if (!this.sessions.has(sessionId)) {
      return { error: 'Session expired or not found' };
    }

    const user = this.users.get(userId);
    if (!user) {
      // Fallback to normal join if user record is gone (timeout passed)
      return this.handleJoinSession(client, data);
    }

    // Recover User
    if (this.timeouts.has(userId)) {
      clearTimeout(this.timeouts.get(userId));
      this.timeouts.delete(userId);
    }

    // Update User Socket
    user.socketId = client.id;
    user.status = 'online';
    this.socketToUser.set(client.id, userId);

    // Explicitly update username if changed (optional)
    if (username) user.username = username;

    client.join(sessionId);

    // Notify others of return
    client.to(sessionId).emit('participant_status', { userId, status: 'online' });

    // Also emit 'participant_joined' just in case someone missed the original join or for strict sync
    // But 'status' online is cleaner. Let's send update to be sure.
    client.to(sessionId).emit('participant_joined', { ...user, userId });

    return {
      success: true,
      userId,
      color: user.color,
      role: user.role,
      participants: this.getParticipants(sessionId, userId),
    };
  }

  // ... (cursor_move, navigate, etc. unchanged)

  @SubscribeMessage('cursor_move')
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { x: number; y: number },
  ) {
    const userId = this.socketToUser.get(client.id);
    const user = this.users.get(userId);
    if (user && user.status === 'online') {
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

  // ... Keep handleNavigate, handleSyncAction, handleReaction same ...
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
