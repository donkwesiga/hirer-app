import axios from "axios";
import { randomUUID } from "crypto";

export default async function handler(req, res) {
  console.log("📥 POST /api/momo");

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { amount, phoneNumber } = req.body;
  if (!amount || !phoneNumber) {
    return res.status(400).json({ success: false, error: "Missing amount or phoneNumber" });
  }

  // ✅ Validate environment variables early
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
    // Step 1: Get Access Token
    const tokenResponse = await axios.post(`${momoBase}/collection/token/`, {}, {
      headers: {
        "Ocp-Apim-Subscription-Key": momoSub,
        Authorization: "Basic " + Buffer.from(`${momoUser}:${momoKey}`).toString("base64"),
      },
    });
    const accessToken = tokenResponse.data.access_token;

    // Step 2: Create Payment Request
    const referenceId = randomUUID();
    const payload = {
      amount: String(amount),
      currency: "EUR", // Sandbox uses EUR
      externalId: referenceId,
      payer: { partyIdType: "MSISDN", partyId: phoneNumber },
      payerMessage: "Ride payment",
      payeeNote: "Hirer ride payment",
    };

    await axios.post(`${momoBase}/collection/v1_0/requesttopay`, payload, {
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
    console.error("💥 MoMo Payment Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: "Payment initiation failed",
      details: error.response?.data || error.message,
    });
  }
}
