require('dotenv').config();
const express = require('express');
const cors = require('cors');
const scraper = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rota de saúde
app.get('/', (req, res) => {
    res.json({ status: 'API de rastreamento funcionando' });
});

// Rota principal de rastreamento
app.get('/rastrear/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        
        if (!codigo || codigo.length < 10) {
            return res.status(400).json({ error: 'Código de rastreamento inválido' });
        }

        const dados = await scraper(codigo);
        res.json(dados);
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            error: 'Erro ao rastrear encomenda',
            message: error.message 
        });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});