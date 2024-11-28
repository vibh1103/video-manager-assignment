import express from 'express';
import dotenv from 'dotenv';
import { authMiddleware } from './middlewares/authMiddleware';
import videoRoutes  from './Routes/videoRoutes';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const swaggerOptions:swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Video API',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for authorization',
        },
      },
    },
  },
  apis: ['./src/Routes/*.ts'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(authMiddleware);

app.use('/videos', videoRoutes)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
