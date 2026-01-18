const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store active rooms and their participants
const rooms = new Map();

wss.on('connection', (ws, req) => {
  // Extract marketId from URL
  const url = req.url;
  const marketId = url.split('/').pop();

  console.log(`✅ New client connected to market: ${marketId}`);

  // Initialize room if it doesn't exist
  if (!rooms.has(marketId)) {
    rooms.set(marketId, new Map()); // Use Map to store username -> ws
  }

  const room = rooms.get(marketId);
  let clientUsername = null;
  let clientId = Math.random().toString(36).substring(7); // Unique ID for this connection

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      if (message.type === 'join') {
        clientUsername = message.username;
        room.set(clientId, { ws, username: clientUsername });

        console.log(`👤 ${clientUsername} joined room ${marketId}. Users: ${room.size}`);

        // Broadcast user joined message to all in room
        const joinMessage = {
          type: 'user_join',
          username: clientUsername,
          timestamp: new Date().toLocaleTimeString()
        };

        room.forEach(({ ws: client }) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(joinMessage));
          }
        });
      } else if (message.type === 'message') {
        console.log(`💬 ${clientUsername}: ${message.text}`);

        // Broadcast message to all in room
        const chatMessage = {
          type: 'message',
          username: clientUsername,
          text: message.text,
          timestamp: new Date().toLocaleTimeString()
        };

        room.forEach(({ ws: client }) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(chatMessage));
          }
        });
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
    }
  });

  ws.on('close', () => {
    if (room.has(clientId)) {
      room.delete(clientId);
      console.log(`👤 ${clientUsername} left room ${marketId}. Users remaining: ${room.size}`);

      // Broadcast user left message
      if (room.size > 0) {
        const leaveMessage = {
          type: 'user_leave',
          username: clientUsername,
          timestamp: new Date().toLocaleTimeString()
        };

        room.forEach(({ ws: client }) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(leaveMessage));
          }
        });
      }

      // Delete empty rooms
      if (room.size === 0) {
        rooms.delete(marketId);
      }
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

const PORT = process.env.PORT || 5003;
server.listen(PORT, () => {
  console.log(`🚀 Watch Party WebSocket server running on ws://localhost:${PORT}`);
});
