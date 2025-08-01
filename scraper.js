const puppeteer = require('puppeteer');

module.exports = async (codigoRastreio) => {
    let browser;
    try {
        // Configuração para ambientes de produção (como Render)
        const launchOptions = {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process'
            ],
            headless: 'new',
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
        };

        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        // Configura headers e user-agent
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'pt-BR,pt;q=0.9'
        });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        // Acessa a página de rastreamento
        await page.goto(`https://www.siterastreio.com.br/${codigoRastreio}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Verifica se o código é válido
        const invalidCode = await page.evaluate(() => {
            return document.body.textContent.includes('Nenhum dado de rastreamento foi encontrado');
        });

        if (invalidCode) {
            throw new Error('Código de rastreamento inválido ou não encontrado');
        }

        // Extrai os dados
        const dados = await page.evaluate(() => {
            const eventos = [];
            const elementos = document.querySelectorAll('.linha_status');
            
            elementos.forEach(item => {
                eventos.push({
                    data: item.querySelector('.sroDtEvent')?.textContent.trim() || '',
                    status: item.querySelector('.sroDescEvent')?.textContent.trim() || '',
                    local: item.querySelector('.sroLbEvent')?.textContent.trim() || ''
                });
            });

            return {
                codigo: window.location.pathname.split('/').pop(),
                eventos,
                ultimaAtualizacao: eventos[0]?.data || '',
                statusAtual: eventos[0]?.status || ''
            };
        });

        return dados;
    } catch (error) {
        console.error('Erro no scraping:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};