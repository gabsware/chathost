require('dotenv').config();
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// IA
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

// CLIENT
const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
}
});

// "BANCO DE DADOS" EM MEMÓRIA
const usuarios = {};

// QRnp
client.on('qr', (qr) => {
    console.log('📱 Escaneie o QR abaixo:');
    qrcode.generate(qr, { small: true });
});

// FUNÇÃO IA
async function perguntarIA(prompt) {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (err) {
        console.log("ERRO IA:", err);
        return "Erro ao responder, tente novamente.";
    }
}

// MENSAGENS
client.on('message', async msg => {

    if (msg.fromMe) return;
    if (!msg.body) return;
    if (msg.from === 'status@broadcast') return;
    if (msg.type !== 'chat') return;

    const user = msg.from;
    const texto = msg.body.toLowerCase().trim();

    // cria usuário
    if (!usuarios[user]) {
        usuarios[user] = { estado: null };
    }

    const userData = usuarios[user];

    const MENU = 
`📋 MENU:
1 - Explicar exercício
2 - Substituir exercício
3 - Alongamento
4 - Fortalecimento
0 - Cancelar`;

    // MENU
    if (texto === 'menu') {
        userData.estado = null;
        return msg.reply(MENU);
    }

    // CANCELAR
    if (texto === '0') {
        userData.estado = null;
        return msg.reply("❌ Operação cancelada.\nDigite 'menu'.");
    }

    // TROCA DE OPÇÃO
    if (['1','2','3','4'].includes(texto)) {
        userData.estado = null;
    }

    // 1 - EXPLICAR
    if (texto === '1') {
        userData.estado = 'explicar';
        return msg.reply("Qual exercício deseja?");
    }

    if (userData.estado === 'explicar') {
        userData.estado = null;

        const resposta = await perguntarIA(
            `Explique o exercício ${texto} como um personal trainer, com execução correta e dicas.`
        );

        return msg.reply(resposta);
    }

    // 2 - SUBSTITUIR
    if (texto === '2') {
        userData.estado = 'substituir';
        return msg.reply("Qual exercício deseja substituir?");
    }

    if (userData.estado === 'substituir') {
        userData.estado = null;

        const resposta = await perguntarIA(
            `Substitua o exercício ${texto} por outro equivalente que trabalhe os mesmos músculos.`
        );

        return msg.reply(resposta);
    }

    // 3 - ALONGAMENTO
    if (texto === '3') {
        userData.estado = 'alongamento';
        return msg.reply("Qual parte do corpo deseja alongar?");
    }

    if (userData.estado === 'alongamento') {
        userData.estado = null;

        const resposta = await perguntarIA(
            `Sugira alongamentos para ${texto}, com explicação simples e segura.`
        );

        return msg.reply(resposta);
    }

    // 4 - FORTALECIMENTO
    if (texto === '4') {
        userData.estado = 'fortalecimento';
        return msg.reply("Qual parte do corpo deseja fortalecer?");
    }

    if (userData.estado === 'fortalecimento') {
        userData.estado = null;

        const resposta = await perguntarIA(
            `Sugira exercícios de fortalecimento para ${texto}, com instruções simples.`
        );

        return msg.reply(resposta);
    }

    return msg.reply("Digite 'menu' para começar.");
});

client.initialize();

const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Bot rodando');
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Servidor web ativo');
});