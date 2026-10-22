import cors from 'cors';
import express from 'express';
import { authRouter } from './auth/routes';
import { errorHandler, notFound } from './errors';
import { loansRouter } from './loans/routes';
import { uploadsDir } from './middleware/receiptUpload';

export const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));
app.use('/auth', authRouter);
app.use('/loans', loansRouter);
app.use(notFound);
app.use(errorHandler);
