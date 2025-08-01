const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('✅ API de Rastreio dos Correios. Use /rastrear?codigo=SEUCODIGO');
});

app.get('/rastrear', async (req, res) => {
  const codigo = req.query.codigo;
  if (!codigo) {
    return res.status(400).json({ erro: 'Código de rastreio não informado.' });
  }

  try {
    const url = `https://www.siterastreio.com.br/${codigo}`;
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(data);
    const eventos = [];

    $('ol[data-testid="tracking-timeline-steps"] > li').each((i, el) => {
      const data = $(el).find('time').text().trim();
      const titulo = $(el).find('strong').text().trim();
      const descricao = $(el).find('p').text().trim();

      eventos.push({ data, titulo, descricao });
    });

    if (eventos.length === 0) {
      return res.status(404).json({ erro: 'Dados não encontrados.' });
    }

    res.json({
      codigo,
      status: eventos[0]?.titulo || 'Desconhecido',
      atualizadoEm: eventos[0]?.data || null,
      eventos
    });

  } catch (e) {
    console.error(e.message);
    res.status(500).json({ erro: 'Erro ao acessar a página de rastreio.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
