import express from 'express';
import cors from 'cors';
import connectDB from './db/mongoose.js';
import apiRouter from './routes/index.js';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(helmet());
app.use(morgan("dev"));

app.use('/', apiRouter);

await connectDB();

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`API is running on http://localhost:${PORT}`));
