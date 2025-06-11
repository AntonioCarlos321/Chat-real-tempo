const { WebSocketServer } = require("ws");
const dotenv = require("dotenv");
const crypto = require("crypto"); // Importa o crypto para gerar UUID

dotenv.config();

const PORT = process.env.PORT || 8080;

const wss = new WebSocketServer({ port: PORT }, () => {
  console.log(`WebSocket server rodando na porta ${PORT}`);
});

const clients = new Map();

wss.on("connection", (ws) => {
  ws.id = crypto.randomUUID();
  clients.set(ws.id, ws);

  console.log(`Novo cliente conectado: ${ws.id}`);

  ws.on("error", (err) => console.error("Erro no cliente:", err));

  ws.on("message", (data) => {
    try {
      const message = data.toString();
      broadcast(message);
    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
    }
  });

  ws.on("close", () => {
    clients.delete(ws.id);
    console.log(`Cliente desconectado: ${ws.id}`);
    // Aqui você pode enviar para os outros que esse usuário saiu
  });
});

function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
}
