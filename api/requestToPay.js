import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
  console.log("📥 POST /api/requestToPay");

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { amount, phoneNumber } = req.body;
  if (!amount || !phoneNumber) {
    return res.status(400).json({ success: false, error: "Missing amount or phoneNumber" });
  }

  // Validate environment
  const momoUser = process.env.MOMO_API_USER;
  const momoKey = process.env.MOMO_API_KEY;
  const momoSub = process.env.MOMO_SUBSCRIPTION_KEY;
  const momoBase = process.env.MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com";

  if (!momoUser || !momoKey || !momoSub) {
    return res.status(500).json({
      success: false,
      error: "Missing MoMo environment variables. Check Vercel settings.",
    });
  }

  try {
    // Step 1: Token
    const tokenRes = await axios.post(`${momoBase}/collection/token/`, {}, {
      headers: {
        "Ocp-Apim-Subscription-Key": momoSub,
        Authorization: "Basic " + Buffer.from(`${momoUser}:${momoKey}`).toString("base64"),
      },
    });

    const accessToken = tokenRes.data.access_token;
    const referenceId = uuidv4();

    // Step 2: Request Payment
    await axios.post(`${momoBase}/collection/v1_0/requesttopay`, {
      amount: String(amount),
      currency: "EUR",
      externalId: referenceId,
      payer: { partyIdType: "MSISDN", partyId: phoneNumber },
      payerMessage: "Ride payment",
      payeeNote: "Hirer ride payment",
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Reference-Id": referenceId,
        "X-Target-Environment": "sandbox",
        "Ocp-Apim-Subscription-Key": momoSub,
        "Content-Type": "application/json",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Payment initiated successfully",
      referenceId,
    });
  } catch (error) {
    console.error("💥 requestToPay Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: "Payment request failed",
      details: error.response?.data || error.message,
    });
  }
}
