require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./database');
const { User } = require('../models');
const mongoose = require('mongoose');

async function seed() {
  try {
    await connectDB();

    // Create Principal
    const principalEmail = 'principal@school.com';
    const principalExists = await User.findOne({ email: principalEmail });
    if (!principalExists) {
      await User.create({
        name: 'Principal Admin',
        email: principalEmail,
        password_hash: await bcrypt.hash('principal123', 12),
        role: 'principal',
      });
      console.log('Principal created: principal@school.com / principal123');
    }

    // Create Teachers
    const teachers = [
      { name: 'Teacher One', email: 'teacher1@school.com', password: 'teacher123' },
      { name: 'Teacher Two', email: 'teacher2@school.com', password: 'teacher123' },
      { name: 'Teacher Three', email: 'teacher3@school.com', password: 'teacher123' },
    ];

    for (const t of teachers) {
      const exists = await User.findOne({ email: t.email });
      if (!exists) {
        await User.create({
          name: t.name,
          email: t.email,
          password_hash: await bcrypt.hash(t.password, 12),
          role: 'teacher',
        });
        console.log(`Teacher created: ${t.email} / ${t.password}`);
      }
    }

    console.log('✅ Seeding complete!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
