import axios from "axios";

export default async function handler(req, res) {
  console.log("📥 Incoming request to /api/momo");

  if (req.method !== "POST") {
    console.log("❌ Invalid method:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { amount, phoneNumber } = req.body;
  console.log("Request body:", req.body);

  if (!amount || !phoneNumber) {
    console.log("❌ Missing required fields.");
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const momoUser = process.env.MOMO_API_USER;
    const momoKey = process.env.MOMO_API_KEY;
    const momoSub = process.env.MOMO_SUBSCRIPTION_KEY;
    const momoBase = process.env.MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com";

    console.log("🔑 Using MOMO_USER:", momoUser ? "Loaded ✅" : "Missing ❌");
    console.log("🔑 Using MOMO_KEY:", momoKey ? "Loaded ✅" : "Missing ❌");
    console.log("🔑 Using MOMO_SUB:", momoSub ? "Loaded ✅" : "Missing ❌");
    console.log("🌍 Base URL:", momoBase);

    // ✅ Generate Access Token
    const tokenResponse = await axios.post(
      `${momoBase}/collection/token/`,
      {},
      {
        headers: {
          "Ocp-Apim-Subscription-Key": momoSub,
          Authorization:
            "Basic " + Buffer.from(`${momoUser}:${momoKey}`).toString("base64"),
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log("✅ Access token generated.");

    // ✅ Generate a unique reference ID for each request
    const referenceId = Date.now().toString();

    // ✅ Build payment payload
    const payload = {
      amount: String(amount),
      currency: "EUR", // ⚠️ MTN Sandbox uses EUR even for Rwanda
      externalId: referenceId,
      payer: {
        partyIdType: "MSISDN",
        partyId: phoneNumber, // 👈 use the phone number from user input
      },
      payerMessage: "Ride payment",
      payeeNote: "Hirer ride payment",
    };

    // ✅ Make request to MTN MoMo API
    const paymentResponse = await axios.post(
      `${momoBase}/collection/v1_0/requesttopay`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Reference-Id": referenceId,
          "X-Target-Environment": "sandbox",
          "Ocp-Apim-Subscription-Key": momoSub,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Payment response:", paymentResponse.data);

    return res.status(200).json({
      success: true,
      message: "Payment initiated",
      referenceId,
      data: paymentResponse.data,
    });
  } catch (error) {
    console.error("💥 ERROR in MoMo handler:", error.response?.data || error.message);
    return res
      .status(500)
      .json({
        error: "Payment failed",
        details: error.response?.data || error.message,
      });
  }
}
