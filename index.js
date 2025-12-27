import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();

/* ================== MIDDLEWARE ================== */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

/* ================== HEALTH CHECK ================== */
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

/* ================== EMAIL SENDER ================== */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ================== SEND OTP ================== */
app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    await transporter.sendMail({
      from: `"AZ App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}`,
      html: `<h2>Your OTP is: ${otp}</h2>`
    });

    return res.status(200).json({
      message: "OTP sent successfully"
    });

  } catch (error) {
    console.error("Send OTP Error:", error);
    return res.status(500).json({
      message: "Error sending OTP"
    });
  }
});

/* ================== SERVER ================== */
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
