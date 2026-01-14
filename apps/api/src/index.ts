import 'dotenv/config';
import express from 'express';
import cors from 'cors';
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

import { booksRouter } from './routes/books.routes';
import { usersRouter } from './routes/users.routes';

// ============ Routes ============
app.use('/books', booksRouter);
app.use('/users', usersRouter);

// ============ Health Check ============

app.get('/', (_req, res) => {
  res.json({
    message: 'Arcana API',
    version: '2.0.0',
    features: ['bulk-shelf-scan', 'family-profiles', 'anti-spoiler'],
  });
});

app.listen(port, () => {
  console.log(`🚀 Arcana API running on port ${port}`);
  console.log(`📚 Bulk Shelf Scan enabled (70% confidence threshold)`);
});
