import express from 'express';
import dotenv from 'dotenv';
import { authMiddleware } from './middlewares/authMiddleware';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(authMiddleware);



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
