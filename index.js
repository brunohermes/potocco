import express from 'express';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import cors from 'cors';

puppeteer.use(StealthPlugin());

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

app.get('/rastrear', async (req, res) => {
  const codigo = req.query.codigo;
  if (!codigo) return res.status(400).json({ erro: 'Código não informado' });

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.goto(`https://www.siterastreio.com.br/${codigo}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Aguarda o seletor de eventos aparecer
    await page.waitForSelector('.linha_status', { timeout: 15000 });

    const eventos = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.linha_status')).map(el => {
        const data = el.querySelector('.data')?.innerText?.trim() || '';
        const titulo = el.querySelector('.titulo')?.innerText?.trim() || '';
        const descricao = el.querySelector('.detalhes')?.innerText?.trim() || '';
        return { data, titulo, descricao };
      });
    });

    await browser.close();

    res.json({
      codigo,
      status: eventos[0]?.titulo || 'Desconhecido',
      atualizadoEm: eventos[0]?.data || null,
      eventos
    });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao extrair informações.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
