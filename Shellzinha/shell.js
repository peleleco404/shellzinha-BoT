const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ["--no-sandbox"] },
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("📱 Escaneie o QR Code com seu WhatsApp");
});

client.on("ready", () => {
  console.log("Shellzinha oN ✅");
});

client.on("group_join", async (notification) => {
  const chat = await notification.getChat();

  const participant = notification.id.participant;

  await chat.sendMessage(
    `🤖 Olá, @${participant.split("@")[0]}! 
🔥 Seja bem-vindo(a) ao grupo:

|🔹|  *${chat.name}*  |🔹|

> ✅ Qualquer coisa só chama o (seu nome aqui)!  

> ⚠ *LEIA A DESCRIÇÂO!*`,
    { mentions: [participant] }
  );
});

async function handleCommands(msg) {
  const chat = await msg.getChat();
  if (!chat.isGroup) return;

  const text = msg.body.toLowerCase();
  const sender = msg.author || msg.from;
  const participant = chat.participants.find(
    (p) => p.id._serialized === sender
  );
  const isAdmin = participant?.isAdmin || false;

  if (!isAdmin) return;

  if (text === "!menu") {
    return chat.sendMessage(`Shellzinha - Bot || by: *cryptoxxz7 👨‍💻*\n
|[1]  🤖 *!menu* - Mostrar todos os comandos
|[2]  ℹ️ *!info* - Info do grupo
|[3]  👮 *!admins* - Ver admins do grupo
|[4]  👥 *!membros* - Listar todos os membros
|[5]  🔗 *!link* - Obter link do grupo
|[6]  🦵 *!ban @* - Expulsar membro
|[7]  🔒 *!fechar* - Somente admins enviam mensagens.
|[8]  🔓 *!abrir* - Todos podem enviar mensagens
|[9]  👤 *!add 55DDDNUMERO* - Adiciona uma pessoa ao grupo
|[10] 👨‍💻 *!criador* - Criador do BoT
|[11] 📢 *@todos* - Mencionar todos os membros`);
  }

  if (text === "!info") {
    return chat.sendMessage(
      `🤖 Grupo: *${chat.name}*\n👥 Total de membros: *${chat.participants.length}*`
    );
  }

  if (text === "!admins") {
    const admins = chat.participants.filter((p) => p.isAdmin);
    const mentions = admins.map((admin) => `@${admin.id.user}`);
    return chat.sendMessage(`👮‍♂️ *Admins do grupo:*\n${mentions.join("\n")}`, {
      mentions: admins.map((a) => a.id._serialized),
    });
  }

  if (text === "!membros") {
    const mentions = chat.participants.map((p) => `@${p.id.user}`);
    return chat.sendMessage(`👥 *Membros do grupo:*\n${mentions.join("\n")}`, {
      mentions: chat.participants.map((p) => p.id._serialized),
    });
  }

  if (text === "!link") {
    try {
      const code = await chat.getInviteCode();
      return chat.sendMessage(
        `🔗 *Link do grupo:* https://chat.whatsapp.com/${code}`
      );
    } catch {
      return chat.sendMessage("⚠️ Não foi possível obter o link.");
    }
  }

  if (text.startsWith("!ban")) {
    if (msg.mentionedIds.length === 0)
      return chat.sendMessage("⚠️ Use: *!ban @usuário*");
    try {
      for (const id of msg.mentionedIds) {
        await chat.removeParticipants([id]);
      }
      return chat.sendMessage("✅ Lixo removido(s) com sucesso.");
    } catch {
      return chat.sendMessage("❌ Não é possível remover o criador do grupo.");
    }
  }

  if (text.startsWith("!add")) {
    const numero = text.split(" ")[1];
    if (!numero || !/^\d{11,15}$/.test(numero)) {
      return chat.sendMessage(
        "⚠️ Use: *!add 5511999999999* (formato internacional, só números)"
      );
    }

    const userId = `${numero}@c.us`;

    try {
      await chat.addParticipants([userId]);
      return chat.sendMessage(`✅ Número adicionado: ${numero}`);
    } catch {
      return chat.sendMessage(
        "❌ Erro ao adicionar. Verifique se o número existe, se o bot é admin e se o usuário permite ser adicionado."
      );
    }
  }

  if (text === "!fechar") {
    await chat.setMessagesAdminsOnly(true);
    return chat.sendMessage(
      "🔒 Grupo fechado. Apenas admins podem enviar mensagens."
    );
  }

  if (text === "!abrir") {
    await chat.setMessagesAdminsOnly(false);
    return chat.sendMessage("🔓 Grupo liberado para todos!");
  }

  if (text.startsWith("@todos")) {
    const mentions = chat.participants.map((p) => p.id._serialized);
    const msgTexto =
      msg.body.replace("@todos", "").trim() || "📢 Atenção todos!";
    return chat.sendMessage(msgTexto, { mentions });
  }

  if (text === "!criador") {
    return chat.sendMessage(`Bot original criado por *cryptoxxz7*`);
  }
}

client.on("message", async (msg) => {
  if (msg.fromMe) return;
  await handleCommands(msg);
});

client.on("message_create", async (msg) => {
  if (!msg.fromMe) return;
  await handleCommands(msg);
});

client.initialize();
