import express from 'express';
import dotenv from 'dotenv';
import { authMiddleware } from './middlewares/authMiddleware'
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(authMiddleware);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
