import app from './app';
import { ENV } from './config/env';
import { connectDB } from './config/db';
import { startAutoClockOutJob } from './jobs/autoClockOut.job';

const startServer = async () => {
  await connectDB();
  
  app.listen(ENV.PORT, () => {
    console.log(`Server is running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`);
    startAutoClockOutJob(); // Start background cron jobs
  });
};

startServer();
