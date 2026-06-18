require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Facility = require("./models/Facility");
const Reservation = require("./models/Reservation");
const {
  Sport,
  Equipment,
  Promotion,
  Trainer,
  Ad,
  Order,
  Comment,
} = require("./models/index");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected, seeding...");

  // Clear all
  await Promise.all([
    User.deleteMany({}),
    Facility.deleteMany({}),
    Reservation.deleteMany({}),
    Sport.deleteMany({}),
    Equipment.deleteMany({}),
    Promotion.deleteMany({}),
    Trainer.deleteMany({}),
    Ad.deleteMany({}),
    Order.deleteMany({}),
    Comment.deleteMany({}),
  ]);

  // Sports
  const sports = await Sport.insertMany([
    { name: "Fudbal" },
    { name: "Košarka" },
    { name: "Tenis" },
    { name: "Odbojka" },
    { name: "Plivanje" },
    { name: "Fitnes" },
  ]);
  const [fudbal, kosarka, tenis, odbojka] = sports;

  // Admin
  const adminPass = "Admin123!";
  const admin = await User.create({
    username: "admin",
    password: adminPass,
    firstName: "Admin",
    lastName: "System",
    phone: "0601234567",
    email: "admin@sportsphere.com",
    role: "admin",
    status: "active",
  });

  // Employee
  const empPass = "Zaposleni1!";
  const employee = await User.create({
    username: "zaposleni1",
    password: empPass,
    firstName: "Marko",
    lastName: "Marković",
    phone: "0611234567",
    email: "marko@sport.com",
    role: "employee",
    status: "active",
    facilityName: "SC Tašmajdan",
    facilityAddress: "Takovska 9, Beograd",
    registrationNumber: "12345678",
    pib: "123456789",
  });

  // Athletes
  const athPass = await bcrypt.hash("Sportista1!", 12);
  const athletes = await User.insertMany([
    {
      username: "sportista1",
      password: athPass,
      firstName: "Nikola",
      lastName: "Nikolić",
      phone: "0621234567",
      email: "nikola@mail.com",
      role: "athlete",
      status: "active",
      favoriteSports: [fudbal._id, tenis._id],
    },
    {
      username: "sportista2",
      password: athPass,
      firstName: "Ana",
      lastName: "Anić",
      phone: "0631234567",
      email: "ana@mail.com",
      role: "athlete",
      status: "active",
      favoriteSports: [kosarka._id, odbojka._id],
    },
    {
      username: "sportista3",
      password: athPass,
      firstName: "Petar",
      lastName: "Petrović",
      phone: "0641234567",
      email: "petar@mail.com",
      role: "athlete",
      status: "active",
      favoriteSports: [fudbal._id],
    },
  ]);

  // Facility
  const facility = await Facility.create({
    name: "SC Tašmajdan",
    city: "Beograd",
    address: "Takovska 9",
    owner: employee._id,
    sports: [fudbal._id, tenis._id, kosarka._id],
    pricePerHour: 1500,
    workingHours: { open: "08:00", close: "22:00" },
    maxNoShows: 3,
    status: "active",
    description: "Moderni sportski centar u srcu Beograda.",
    courts: [
      {
        name: "Teniski teren 1",
        type: "outdoor",
        capacity: 4,
        sports: [tenis._id],
      },
      {
        name: "Teniski teren 2",
        type: "outdoor",
        capacity: 4,
        sports: [tenis._id],
      },
      {
        name: "Sala 1",
        type: "indoor",
        capacity: 20,
        sports: [kosarka._id, odbojka._id],
      },
      {
        name: "Fudbalski teren",
        type: "outdoor",
        capacity: 22,
        sports: [fudbal._id],
      },
    ],
  });

  const facility2 = await Facility.create({
    name: "Sportski centar Novi Sad",
    city: "Novi Sad",
    address: "Bulevar Oslobođenja 22",
    owner: employee._id,
    sports: [fudbal._id, kosarka._id],
    pricePerHour: 1200,
    workingHours: { open: "08:00", close: "22:00" },
    maxNoShows: 3,
    status: "active",
    courts: [
      {
        name: "Fudbalski teren A",
        type: "outdoor",
        capacity: 22,
        sports: [fudbal._id],
      },
      {
        name: "Košarkaška sala",
        type: "indoor",
        capacity: 10,
        sports: [kosarka._id],
      },
    ],
  });

  // Some reservations (past = confirmed, future = pending)
  const now = new Date();
  const yesterday = new Date(now - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const court = facility.courts[0];
  await Reservation.insertMany([
    {
      user: athletes[0]._id,
      facility: facility._id,
      court: court._id,
      courtName: court.name,
      sport: tenis._id,
      startTime: new Date(yesterday.setHours(10, 0, 0, 0)),
      endTime: new Date(yesterday.setHours(11, 0, 0, 0)),
      status: "confirmed",
    },
    {
      user: athletes[0]._id,
      facility: facility._id,
      court: court._id,
      courtName: court.name,
      sport: tenis._id,
      startTime: new Date(tomorrow.setHours(10, 0, 0, 0)),
      endTime: new Date(tomorrow.setHours(12, 0, 0, 0)),
      status: "pending",
    },
    {
      user: athletes[1]._id,
      facility: facility._id,
      court: facility.courts[2]._id,
      courtName: facility.courts[2].name,
      sport: kosarka._id,
      startTime: new Date(tomorrow.setHours(14, 0, 0, 0)),
      endTime: new Date(tomorrow.setHours(16, 0, 0, 0)),
      status: "pending",
    },
  ]);

  // Promotion
  await Promotion.create({
    facility: facility._id,
    name: "Letnja akcija - 20% popust",
    sport: tenis._id,
    discountType: "percent",
    discountValue: 20,
    startDate: new Date(),
    endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
  });

  // Equipment
  const eq = await Equipment.create({
    facility: facility._id,
    sport: tenis._id,
    name: "Teniski reket Wilson",
    price: 4500,
    stock: 10,
  });

  // Trainer
  await Trainer.create({
    firstName: "Stefan",
    lastName: "Stefanović",
    facility: facility._id,
    sport: tenis._id,
    specialization: "Tenis za početnike",
    pricePerHour: 2000,
    isActive: true,
    ratings: [{ user: athletes[0]._id, score: 5 }],
  });

  // Ad
  await Ad.create({
    author: athletes[0]._id,
    sport: fudbal._id,
    city: "Beograd",
    date: tomorrow,
    timeSlot: "18:00-20:00",
    playersNeeded: 5,
    isActive: true,
  });

  // Like on facility
  facility.likes.push(athletes[0]._id, athletes[1]._id);
  await facility.save();

  // Comment
  await Comment.create({
    user: athletes[0]._id,
    facility: facility._id,
    text: "Odličan objekat, preporučujem svima!",
    reaction: "like",
  });

  console.log("✅ Seed complete!");
  console.log("Admin login: admin / Admin123!");
  console.log("Employee login: zaposleni1 / Zaposleni1!");
  console.log("Athlete login: sportista1 / Sportista1!");
  await mongoose.disconnect();
}

seed().catch(console.error);
