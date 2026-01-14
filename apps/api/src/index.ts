import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'Arcana API' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
