import { NextRequest, NextResponse } from "next/server";
import { handleEasyPaisaPaymentSuccess, handleEasyPaisaPaymentFailure } from "@/lib/payments/easypaisa";

export async function GET(req: NextRequest) {
  return handleCallback(req);
}

export async function POST(req: NextRequest) {
  return handleCallback(req);
}

async function handleCallback(req: NextRequest) {
  const url = new URL(req.url);

  // Extract parameters from Query String or Form Body
  let orderRefNumber = url.searchParams.get("orderRefNumber") || url.searchParams.get("orderRefNum") || url.searchParams.get("orderId") || "";
  let responseCode = url.searchParams.get("responseCode") || url.searchParams.get("status") || "";
  let transactionId = url.searchParams.get("transactionId") || url.searchParams.get("transId") || `EP_${Date.now()}`;
  let appointmentId = url.searchParams.get("apptId") || "";

  if (req.method === "POST") {
    try {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        orderRefNumber = (formData.get("orderRefNumber") || formData.get("orderRefNum") || formData.get("orderId") || orderRefNumber) as string;
        responseCode = (formData.get("responseCode") || formData.get("status") || responseCode) as string;
        transactionId = (formData.get("transactionId") || formData.get("transId") || transactionId) as string;
        appointmentId = (formData.get("apptId") || appointmentId) as string;
      } else if (contentType.includes("application/json")) {
        const json = await req.json();
        orderRefNumber = json.orderRefNumber || json.orderRefNum || json.orderId || orderRefNumber;
        responseCode = json.responseCode || json.status || responseCode;
        transactionId = json.transactionId || json.transId || transactionId;
        appointmentId = json.apptId || appointmentId;
      }
    } catch {
      // ignore body parsing error, fallback to searchParams
    }
  }

  // Derive appointmentId if not passed explicitly
  if (!appointmentId && orderRefNumber) {
    if (orderRefNumber.startsWith("appt_")) {
      appointmentId = orderRefNumber.replace("appt_", "");
    } else {
      appointmentId = orderRefNumber;
    }
  }

  const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.gbelaaj.com").replace(/\/$/, "");

  // "0000" is EasyPaisa's official Response Code for SUCCESS (or "SUCCESS" in sandbox)
  const isSuccess = responseCode === "0000" || responseCode.toUpperCase() === "SUCCESS";

  if (isSuccess && appointmentId) {
    try {
      await handleEasyPaisaPaymentSuccess({
        appointmentId,
        transactionId,
        orderRefNum: orderRefNumber || `appt_${appointmentId}`,
      });

      return NextResponse.redirect(`${appBaseUrl}/patient/appointments/${appointmentId}?payment=success`, 303);
    } catch (err) {
      console.error("[easypaisa-callback] Error completing appointment:", err);
      return NextResponse.redirect(`${appBaseUrl}/patient/appointments/${appointmentId}?payment=error`, 303);
    }
  } else {
    // Payment cancelled or failed
    if (appointmentId) {
      try {
        await handleEasyPaisaPaymentFailure({
          appointmentId,
          reason: `EasyPaisa response code: ${responseCode || "CANCELLED"}`,
        });
      } catch (err) {
        console.error("[easypaisa-callback] Error handling failure:", err);
      }
    }

    return NextResponse.redirect(`${appBaseUrl}/patient/appointments?payment=failed&code=${responseCode || "CANCELLED"}`, 303);
  }
}
