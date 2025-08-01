const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/rastrear', async (req, res) => {
  const codigo = req.query.codigo;

  if (!codigo) {
    return res.status(400).json({ erro: 'Código de rastreio não informado' });
  }

  const url = `https://www.siterastreio.com.br/${codigo}`;

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const $ = cheerio.load(html);

    const eventos = [];

    // Seleciona os <li> da linha do tempo de eventos
    $('ol.flex.flex-col.mt-10 > li').each((_, el) => {
      const data = $(el).find('div.text-sm.text-gray-400').text().trim();
      const titulo = $(el).find('strong').text().trim();
      const descricao = $(el).find('p').text().trim();

      if (data || titulo || descricao) {
        eventos.push({ data, titulo, descricao });
      }
    });

    const status = eventos.length > 0 ? eventos[0].titulo : 'Desconhecido';
    const atualizadoEm = eventos.length > 0 ? eventos[0].data : null;

    res.json({
      codigo,
      status,
      atualizadoEm,
      eventos
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ erro: 'Falha ao acessar o conteúdo' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
