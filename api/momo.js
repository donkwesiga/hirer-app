import axios from "axios";

export default async function handler(req, res) {
  console.log("📥 Incoming request to /api/momo");

  if (req.method !== "POST") {
    console.log("❌ Invalid method:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { amount, phoneNumber } = req.body;
  console.log("🧾 Request body:", req.body);

  if (!amount || !phoneNumber) {
    console.log("❌ Missing required fields.");
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const momoUser = process.env.MOMO_API_USER;
    const momoKey = process.env.MOMO_API_KEY;
    const momoSub = process.env.MOMO_SUBSCRIPTION_KEY;
    const momoBase =
      process.env.MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com";

    console.log("🔑 MOMO_USER:", momoUser ? "Loaded ✅" : "Missing ❌");
    console.log("🔑 MOMO_KEY:", momoKey ? "Loaded ✅" : "Missing ❌");
    console.log("🔑 MOMO_SUB:", momoSub ? "Loaded ✅" : "Missing ❌");
    console.log("🌍 MOMO_BASE:", momoBase);

    // ✅ Generate access token
    const tokenResponse = await axios.post(
      `${momoBase}/collection/token/`,
      {},
      {
        headers: {
          "Ocp-Apim-Subscription-Key": momoSub,
          Authorization:
            "Basic " +
            Buffer.from(`${momoUser}:${momoKey}`).toString("base64"),
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log("✅ Access token generated successfully.");

    // ✅ Generate unique reference ID
    const referenceId = Date.now().toString();
    console.log("💸 Reference ID:", referenceId);

    // ✅ Build payment payload
    const payload = {
      amount: String(amount),
      currency: "EUR", // MTN Sandbox requires EUR (even for Rwanda)
      externalId: referenceId,
      payer: {
        partyIdType: "MSISDN",
        partyId: phoneNumber,
      },
      payerMessage: "Ride payment",
      payeeNote: "Hirer ride payment",
    };

    console.log("📤 Sending payment payload:", payload);

    // ✅ Make payment request
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
      message: "Payment initiated successfully",
      referenceId,
      data: paymentResponse.data,
    });
  } catch (error) {
    console.error("💥 ERROR in MoMo handler:");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.error("Headers:", error.response?.headers);
    console.error("Config Data:", error.config?.data);

    return res.status(500).json({
      error: "Payment failed",
      status: error.response?.status,
      details: error.response?.data || error.message,
    });
  }
}
