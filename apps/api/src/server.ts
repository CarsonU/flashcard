import express from 'express';
import cors from 'cors';
import deckRoutes from './routes/decks';
import cardRoutes from './routes/cards';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/decks', deckRoutes);
app.use('/api/cards', cardRoutes);

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
