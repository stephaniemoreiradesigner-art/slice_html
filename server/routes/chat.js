const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM = `Você é um especialista em HTML para email marketing compatível com Outlook e ActiveCampaign.

Ao receber o HTML atual e um pedido de ajuste:
1. Faça exatamente a alteração solicitada
2. Responda com uma explicação curta (1-2 frases) do que mudou
3. Inclua o HTML completo atualizado entre as tags <EMAIL_HTML> e </EMAIL_HTML>

Regras obrigatórias do HTML:
- Tabelas com border="0" cellpadding="0" cellspacing="0"
- Imagens com display:block
- Larguras em pixels absolutos
- Links com target="_blank"
- Tags de personalização suportadas: %FIRSTNAME%, %LASTNAME%, %EMAIL%, %PHONE%, %ORGNAME%

Formato da resposta:
[Explicação breve do que foi alterado]
<EMAIL_HTML>
[HTML completo]
</EMAIL_HTML>`;

router.post('/', async (req, res) => {
  const { html, message, history = [] } = req.body;

  if (!message?.trim() || !html) {
    return res.status(400).json({ error: 'html e message são obrigatórios' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada no servidor. Adicione no .env.' });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const messages = [
      ...history.slice(-4),
      {
        role: 'user',
        content: `HTML atual:\n${html}\n\nPedido: ${message}`,
      },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 8192,
      system: SYSTEM,
      messages,
    });

    const text = response.content[0].text;
    const htmlMatch = text.match(/<EMAIL_HTML>([\s\S]*?)<\/EMAIL_HTML>/);
    const updatedHtml = htmlMatch ? htmlMatch[1].trim() : null;
    const explanation = text.replace(/<EMAIL_HTML>[\s\S]*?<\/EMAIL_HTML>/, '').trim() || 'HTML atualizado com sucesso.';

    res.json({ html: updatedHtml, text: explanation });
  } catch (err) {
    console.error('[chat]', err.message);
    const msg =
      err.status === 401
        ? 'Chave ANTHROPIC_API_KEY inválida. Verifique no painel da Anthropic.'
        : 'Erro ao processar pedido de IA. Tente novamente.';
    res.status(500).json({ error: msg });
  }
});

module.exports = router;
