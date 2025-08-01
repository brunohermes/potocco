import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";

const app = express();
app.use(cors());

app.get("/rastrear", async (req, res) => {
  const codigo = req.query.codigo;

  if (!codigo) {
    return res.status(400).json({ erro: "Código de rastreio não informado." });
  }

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(`https://www.siterastreio.com.br/${codigo}`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await page.waitForSelector('[data-testid="tracking-timeline-steps"]');

    const eventos = await page.$$eval('[data-testid="tracking-timeline-steps"] li', (items) => {
      return items.map((el) => {
        const data = el.querySelector("div.text-sm")?.innerText.trim() || "";
        const titulo = el.querySelector("strong")?.innerText.trim() || "";
        const descricao = el.querySelector("p")?.innerText.trim() || "";
        return { data, titulo, descricao };
      });
    });

    await browser.close();

    res.json({
      codigo,
      status: eventos[0]?.titulo || "Desconhecido",
      atualizadoEm: eventos[0]?.data || null,
      eventos,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao extrair informações." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
