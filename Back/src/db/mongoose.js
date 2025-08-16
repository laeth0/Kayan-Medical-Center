import mongoose from 'mongoose';

export default async function connectDB() {
  const uri = "mongodb+srv://laeth:123@kayan.kgbgndx.mongodb.net/?retryWrites=true&w=majority&appName=Kayan";
  const dbName = "kayan";

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err);
  });

  await mongoose.connect(uri, { dbName });
}

