import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT;

/* ================== MIDDLEWARE ================== */
app.use(cors({
  origin: "*", // يسمح لأي Frontend
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

/* ================== TEST ROUTE ================== */
app.get("/", (req, res) => {
  res.json({ status: "AZ Backend is running 🚀" });
});

/* ================== OTP LOGIC ================== */

// توليد OTP من 6 أرقام
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// تخزين OTP مؤقت
const otpStore = new Map();

/* ================== SEND EMAIL VIA BREVO ================== */
async function sendOTPEmail(email, otp) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: { name: "AZ", email: "mohammedeamdabozeed@gmail.com" },
      to: [{ email }], // ✅ الإيميل اللي المستخدم دخله
      subject: "AZ Verification Code",
      htmlContent: `
        <h2>Your OTP code is: ${otp}</h2>
        <p>Valid for 5 minutes</p>
      `
    })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Brevo error:", text);
    throw new Error("Failed to send email");
  }
}

/* ================== REGISTER ROUTE ================== */
app.post("/auth/register", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 دقايق

    otpStore.set(email, { otp, expiresAt });

    await sendOTPEmail(email, otp);

    // ❌ ممنوع ترجع OTP للـ frontend
    res.json({
      message: "OTP sent to email"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending OTP" });
  }
});

/* ================== VERIFY OTP ROUTE ================== */
app.post("/auth/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const data = otpStore.get(email);

  if (!data) {
    return res.status(400).json({ message: "OTP not found" });
  }

  if (Date.now() > data.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ message: "OTP expired" });
  }

  if (data.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  otpStore.delete(email);
  res.json({ message: "Email verified successfully ✅" });
});

/* ================== START SERVER ================== */
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
