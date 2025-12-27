import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();

/* ===== middleware ===== */
app.use(cors());
app.use(express.json());

/* ===== HEALTH CHECK ===== */
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

/* ===== email sender ===== */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ===== send otp ===== */
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);

  try {
    await transporter.sendMail({
      from: `"AZ App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}`,
      html: `<h2>Your OTP is <b>${otp}</b></h2>`,
    });

    res.json({ message: "OTP sent", otp }); // otp تشيله في production
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send email" });
  }
});

/* ===== start server ===== */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
