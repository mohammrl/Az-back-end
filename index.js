import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// الصفحة الرئيسية (سيبها زي ما هي)
app.get("/", (req, res) => {
  res.json({ status: "AZ Backend is running 🚀" });
});

// توليد OTP 6 أرقام
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// تخزين مؤقت للـ OTP
const otpStore = new Map();

// إرسال OTP بالإيميل عبر Brevo
async function sendOTPEmail(email, otp) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "AZ", email: "mohammedeamdabozeed@gmail.com" },
      to: [{ email }],
      subject: "AZ Verification Code",
      htmlContent: `<h2>Your OTP code is: ${otp}</h2><p>Valid for 5 minutes</p>`,
    }),
  });

  const result = await response.json();

if (response.status >= 400) {
  console.error("Brevo error:", result);
  throw new Error("Failed to send email");
}

console.log("Brevo success:", result);
}

// Register + Send OTP
app.post("/auth/register", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 دقائق

    otpStore.set(email, { otp, expiresAt });

    await sendOTPEmail(email, otp);

    res.json({ message: "OTP sent to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending OTP" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
