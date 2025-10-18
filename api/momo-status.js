import axios from "axios";

export default async function handler(req, res) {
  console.log("📡 Checking MoMo payment status...");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { referenceId } = req.query;
  if (!referenceId) {
    return res.status(400).json({ error: "Missing referenceId" });
  }

  try {
    const momoUser = process.env.MOMO_API_USER;
    const momoKey = process.env.MOMO_API_KEY;
    const momoSub = process.env.MOMO_SUBSCRIPTION_KEY;
    const momoBase =
      process.env.MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com";

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

    const statusResponse = await axios.get(
      `${momoBase}/collection/v1_0/requesttopay/${referenceId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Ocp-Apim-Subscription-Key": momoSub,
          "X-Target-Environment": "sandbox",
        },
      }
    );

    return res.status(200).json({
      success: true,
      referenceId,
      status: statusResponse.data.status,
      data: statusResponse.data,
    });
  } catch (error) {
    console.error("💥 ERROR checking MoMo status:", error.response?.data || error.message);
    return res.status(500).json({
      error: "Failed to check payment status",
      details: error.response?.data || error.message,
    });
  }
}
