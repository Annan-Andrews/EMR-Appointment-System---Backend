require("dotenv").config({
  path: require("path").join(__dirname, "../../.env"),
});
const mongoose = require("mongoose");
const connectDB = require("./db");
const User = require("../models/User");
const Patient = require("../models/Patient");
const DoctorSchedule = require("../models/DoctorSchedule");
const Appointment = require("../models/Appointment");
const { APPOINTMENT_STATUS } = require("./constants");

const seed = async () => {
  await connectDB();
  console.log("\n🌱 Seeding database...\n");

  // ── Wipe existing data ───────────────────────────────────────────────────────
  // Clean slate every time seed runs
  await Promise.all([
    User.deleteMany({}),
    Patient.deleteMany({}),
    DoctorSchedule.deleteMany({}),
    Appointment.deleteMany({}),
  ]);
  console.log("🗑️  Cleared existing data");

  // ── Users ────────────────────────────────────────────────────────────────────
  const superAdmin = await User.create({
    name: "Super Admin",
    email: "admin@emr.com",
    password: "Admin@1234",
    role: "superadmin",
  });

  const doctorAisha = await User.create({
    name: "Dr. Aisha Khan",
    email: "aisha@emr.com",
    password: "Doctor@1234",
    role: "doctor",
    department: "Cardiology",
    specialization: "Interventional Cardiology",
    phone: "9000000001",
  });

  const doctorRavi = await User.create({
    name: "Dr. Ravi Mehta",
    email: "ravi@emr.com",
    password: "Doctor@1234",
    role: "doctor",
    department: "Orthopedics",
    specialization: "Joint Replacement",
    phone: "9000000002",
  });

  const receptionist = await User.create({
    name: "Priya Sharma",
    email: "priya@emr.com",
    password: "Recept@1234",
    role: "receptionist",
    phone: "9000000003",
  });

  console.log("✅ Users created (4)");

  // ── Doctor Schedules ─────────────────────────────────────────────────────────

  // Dr. Aisha — Mon to Fri, 15 min slots, short break
  const aishaWorkDays = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
  ];
  for (const day of aishaWorkDays) {
    await DoctorSchedule.create({
      doctorId: doctorAisha._id,
      dayOfWeek: day,
      startTime: "09:00",
      endTime: "13:00",
      slotDuration: 15,
      breaks: [{ start: "11:00", end: "11:15", label: "Short Break" }],
    });
  }

  // Dr. Ravi — Mon, Wed, Fri only, 30 min slots, lunch break
  const raviWorkDays = ["monday", "wednesday", "friday"];
  for (const day of raviWorkDays) {
    await DoctorSchedule.create({
      doctorId: doctorRavi._id,
      dayOfWeek: day,
      startTime: "10:00",
      endTime: "17:00",
      slotDuration: 30,
      breaks: [{ start: "13:00", end: "14:00", label: "Lunch Break" }],
    });
  }

  console.log("✅ Doctor schedules created");

  // ── Patients ─────────────────────────────────────────────────────────────────
  const rahulSharma = await Patient.create({
    name: "Rahul Sharma",
    mobile: "9876543210",
    gender: "male",
    dob: new Date("1990-05-15"),
    bloodGroup: "B+",
  });
  const rahulMehta = await Patient.create({
    name: "Rahul Mehta",
    mobile: "9876543211",
    gender: "male",
    dob: new Date("1985-08-22"),
    bloodGroup: "O+",
  });
  const preethi = await Patient.create({
    name: "Preethi S",
    mobile: "9812345678",
    gender: "female",
    dob: new Date("1995-03-10"),
    bloodGroup: "A+",
  });
  const mohammed = await Patient.create({
    name: "Mohammed Ali",
    mobile: "9823456789",
    gender: "male",
    dob: new Date("1978-11-30"),
  });
  const sneha = await Patient.create({
    name: "Sneha Raj",
    gender: "female",
    dob: new Date("2015-06-20"),
  });
  const anita = await Patient.create({
    name: "Anita Sharma",
    mobile: "9834567890",
    gender: "female",
    bloodGroup: "AB+",
  });

  const patients = [rahulSharma, rahulMehta, preethi, mohammed, sneha, anita];
  console.log("✅ Patients created (6)");

  // ── Pre-booked Appointments ───────────────────────────────────────────────────
  // Get a future Monday date for reliable testing
  const getNextMonday = () => {
    const today = new Date();
    const day = today.getDay(); // 0=Sun, 1=Mon...
    const daysUntilMonday =
      day === 1
        ? 7 // if today IS Monday, get next Monday
        : (8 - day) % 7 || 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysUntilMonday);
    return monday.toISOString().split("T")[0]; // "YYYY-MM-DD"
  };

  const nextMonday = getNextMonday();

  // Appointment 1 — BOOKED
  // Tests: double booking (try to book this same slot → 409)
  await Appointment.create({
    doctorId: doctorAisha._id,
    patientId: patients[0]._id, // Rahul Sharma
    slotDate: nextMonday,
    slotStart: "09:00",
    slotEnd: "09:15",
    status: APPOINTMENT_STATUS.BOOKED,
    purpose: "Routine checkup",
    bookedBy: receptionist._id,
  });

  // Appointment 2 — ARRIVED
  // Tests: cannot mark arrived again → 400
  await Appointment.create({
    doctorId: doctorAisha._id,
    patientId: patients[1]._id, // Rahul Mehta
    slotDate: nextMonday,
    slotStart: "09:15",
    slotEnd: "09:30",
    status: APPOINTMENT_STATUS.ARRIVED,
    purpose: "Follow up",
    bookedBy: receptionist._id,
    arrivedAt: new Date(),
  });

  // Appointment 3 — CANCELLED
  // Tests: cancelled slot is free → can book it again → 201
  await Appointment.create({
    doctorId: doctorAisha._id,
    patientId: patients[2]._id, // Preethi
    slotDate: nextMonday,
    slotStart: "09:30",
    slotEnd: "09:45",
    status: APPOINTMENT_STATUS.CANCELLED,
    purpose: "Consultation",
    bookedBy: receptionist._id,
    cancelledAt: new Date(),
    cancelledBy: superAdmin._id,
  });

  console.log(`✅ Sample appointments created for ${nextMonday}`);

  // ── Print summary ─────────────────────────────────────────────────────────────
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                   SEED COMPLETE                          ║
╠══════════════════════════════════════════════════════════╣
║  LOGIN CREDENTIALS                                       ║
║                                                          ║
║  SuperAdmin  : admin@emr.com       / Admin@1234          ║
║  Doctor 1    : aisha@emr.com       / Doctor@1234         ║
║  Doctor 2    : ravi@emr.com        / Doctor@1234         ║
║  Receptionist: priya@emr.com       / Recept@1234         ║
╠══════════════════════════════════════════════════════════╣
║  SAMPLE DATA                                             ║
║                                                          ║
║  Patients    : 6 created                                 ║
║  Appointments: 3 pre-booked for next Monday              ║
║                                                          ║
║  Slot: 09:00 → BOOKED    (try double booking)            ║
║  Slot: 09:15 → ARRIVED   (try marking arrived again)     ║
║  Slot: 09:30 → CANCELLED (try rebooking this slot)       ║
╠══════════════════════════════════════════════════════════╣
║  TEST SEARCHES                                           ║
║                                                          ║
║  "rahul"   → returns 2 patients                          ║
║  "987"     → matches by mobile prefix                    ║
║  "PAT0001" → matches by patientId                        ║
╚══════════════════════════════════════════════════════════╝
  `);

  mongoose.connection.close();
};

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  mongoose.connection.close();
  process.exit(1);
});
