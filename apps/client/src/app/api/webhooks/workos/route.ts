import { NextRequest, NextResponse } from "next/server";
import { WebhookService, type WebhookEvent } from "@/lib/webhook-service";
import { createHmac } from "crypto";

// Initialize webhook service
const webhookService = new WebhookService();

/**
 * Verify WorkOS webhook signature using HMAC-SHA256
 */
function verifyWorkOSSignature(
  signature: string,
  payload: string,
  secret: string
): boolean {
  const timestamp = signature.split('t=')[1]?.split(',')[0];
  const signatureHash = signature.split('v1=')[1];
  
  if (!timestamp || !signatureHash) {
    throw new Error("Invalid signature format - missing timestamp or hash");
  }
  
  const expectedSignature = createHmac('sha256', secret)
    .update(timestamp + '.' + payload)
    .digest('hex');
  
  return expectedSignature === signatureHash;
}

/**
 * Parse WorkOS webhook payload into standard format
 */
function parseWorkOSWebhook(payload: string) {
  const webhookData = JSON.parse(payload);
  return {
    id: webhookData.id,
    event: webhookData.event,
    data: webhookData.data,
    createdAt: webhookData.created_at,
  };
}

/**
 * Handle WorkOS webhook events
 */
export async function POST(req: NextRequest) {
  try {
    // Get the raw body as text (required for signature verification)
    const rawBody = await req.text();

    // Get the signature header (WorkOS uses lowercase 'workos-signature')
    const signature = req.headers.get("workos-signature");


    if (!signature) {
      console.error("Missing WorkOS signature header");
      return NextResponse.json(
        { error: "Missing signature header" },
        { status: 200 },
      );
    }

    if (!process.env.WORKOS_WEBHOOK_SECRET) {
      console.error("Missing WORKOS_WEBHOOK_SECRET environment variable");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 200 },
      );
    }

    // Verify the webhook signature manually (WorkOS SDK v7.71.0 has signature verification bug)
    let webhook;
    try {
      if (!verifyWorkOSSignature(signature, rawBody, process.env.WORKOS_WEBHOOK_SECRET!)) {
        throw new Error("Signature verification failed - signatures don't match");
      }
      
      webhook = parseWorkOSWebhook(rawBody);

      console.log(`Received WorkOS webhook: ${webhook.event}`, {
        eventId: webhook.id,
        eventType: webhook.event,
      });
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return NextResponse.json(
        {
          error: "Invalid signature",
          details:
            error instanceof Error
              ? error.message
              : "Signature verification failed",
        },
        { status: 401 },
      );
    }

    // Convert WorkOS event to our WebhookEvent interface
    const webhookEvent: WebhookEvent = {
      id: webhook.id,
      type: webhook.event,
      data: webhook.data,
      createdAt: webhook.createdAt,
    };

    // Process the webhook event
    try {
      await webhookService.processEvent(webhookEvent);
      
      return NextResponse.json({
        success: true,
        message: "Webhook processed successfully",
        eventId: webhook.id,
      });
    } catch (processingError) {
      console.error("Webhook processing failed:", processingError);
      return NextResponse.json({
        success: false,
        message: "Webhook processing failed",
        eventId: webhook.id,
      });
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 200 },
    );
  }
}

/**
 * Health check endpoint for webhook
 */
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "webhook-handler",
  });
}
