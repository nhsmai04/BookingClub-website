import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import express from 'express';
import routes from './routes/route.js';
import paymentRouter from './routes/payment.route.js';
import bookingRouter from './routes/booking.route.js';
import cors from 'cors';
import sportComplexRouter from './routes/sport_complex.route.js';
import cookieParser from "cookie-parser";
import { cancelExpiredBookings } from './services/payment.service.js';
import subFieldRouter from './routes/subfield.route.js';
import { completeFinishedBookings } from "./services/booking.service.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

//config cors
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(",") || [];

app.use(
  cors({
    origin(origin, callback) {
      // Cho phép request không có origin (Postman, curl)
      if (!origin) {
        return callback(null, true);
      }

      // Nếu nằm trong whitelist
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Nếu không hợp lệ → reject
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1', routes);
app.use('/api/v1', paymentRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/sportcomplex', sportComplexRouter);
app.use('/api/v1/subfield', subFieldRouter);

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log("Server is running on port", PORT);
  });

  setInterval(async () => {
    try {
      await cancelExpiredBookings();
    } catch (err) {
      console.error(err);
    }
  }, 60 * 1000);

  setInterval(async () => {
    try {
      await completeFinishedBookings();
      console.log("completed booking check finished");
    } catch (err) {
      console.error(err);
    }
  }, 60 * 60 * 1000);
};

startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});
