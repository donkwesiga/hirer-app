import axios from "axios";

export default async function handler(req, res) {
  console.log("📡 GET /api/momo-status");

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { referenceId } = req.query;
  if (!referenceId) {
    return res.status(400).json({ success: false, error: "Missing referenceId" });
  }

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
    const tokenRes = await axios.post(`${momoBase}/collection/token/`, {}, {
      headers: {
        "Ocp-Apim-Subscription-Key": momoSub,
        Authorization: "Basic " + Buffer.from(`${momoUser}:${momoKey}`).toString("base64"),
      },
    });
    const accessToken = tokenRes.data.access_token;

    // Step 2: Get Transaction Status
    const statusRes = await axios.get(
      `${momoBase}/collection/v1_0/requesttopay/${referenceId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Target-Environment": "sandbox",
          "Ocp-Apim-Subscription-Key": momoSub,
        },
      }
    );

    return res.status(200).json({
      success: true,
      referenceId,
      status: statusRes.data.status,
      data: statusRes.data,
    });
  } catch (error) {
    console.error("💥 MoMo Status Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch payment status",
      details: error.response?.data || error.message,
    });
  }
}
