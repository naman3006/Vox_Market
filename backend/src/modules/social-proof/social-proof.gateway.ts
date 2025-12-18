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
import { SocialProofService } from './social-proof.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*', // Allow all for dev
    },
    namespace: 'social-proof',
})
export class SocialProofGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(SocialProofGateway.name);

    // Map to track which product a socket is viewing
    private socketProductMap = new Map<string, string>();

    constructor(private readonly socialProofService: SocialProofService) { }

    handleConnection(client: Socket) {
        this.logger.debug(`Client connected: ${client.id}`);
    }

    async handleDisconnect(client: Socket) {
        this.logger.debug(`Client disconnected: ${client.id}`);
        const productId = this.socketProductMap.get(client.id);
        if (productId) {
            this.socketProductMap.delete(client.id);
            await this.leaveProductRoom(client, productId);
        }
    }

    @SubscribeMessage('join_product')
    async handleJoinProduct(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { productId: string },
    ) {
        if (!data.productId) return;

        // specific room for this product
        const room = `product:${data.productId}`;
        await client.join(room);

        // Store mapping so we can decrement on disconnect
        // If client was viewing another product, decrement that first (simple switch logic)
        const currentProduct = this.socketProductMap.get(client.id);
        if (currentProduct && currentProduct !== data.productId) {
            await this.leaveProductRoom(client, currentProduct);
        }

        this.socketProductMap.set(client.id, data.productId);

        const count = await this.socialProofService.incrementViewers(data.productId);
        const stats = await this.socialProofService.getProductStats(data.productId);

        // Broadcast to EVERYONE in the room (including sender)
        this.server.to(room).emit('viewers_update', {
            productId: data.productId,
            count,
        });

        // Send stats only to the joining client (or everyone? stats don't change that often on view, but good to refresh)
        // Let's send to everyone to keep them in sync if we wanted, but for now just the joiner is fine.
        // Actually best to emit to the joiner specifically for stats.
        client.emit('product_stats', {
            productId: data.productId,
            ...stats
        });

        this.logger.debug(`Client ${client.id} joined ${data.productId}. Count: ${count}`);
    }

    @SubscribeMessage('leave_product')
    async handleLeaveProduct(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { productId: string },
    ) {
        if (!data.productId) return;
        await this.leaveProductRoom(client, data.productId);
    }

    private async leaveProductRoom(client: Socket, productId: string) {
        const room = `product:${productId}`;
        await client.leave(room);
        this.socketProductMap.delete(client.id);

        const count = await this.socialProofService.decrementViewers(productId);

        this.server.to(room).emit('viewers_update', {
            productId,
            count,
        });

        this.logger.debug(`Client ${client.id} left ${productId}. Count: ${count}`);
    }

    // Called by OrdersService
    broadcastNewOrder(orderData: any) {
        this.server.emit('new_activity', orderData);
    }
}
