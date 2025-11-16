import { NextRequest, NextResponse } from 'next/server';
import { db, lessons } from '@/lib/db';
import { eq } from 'drizzle-orm';
import Mux from '@mux/mux-node';
import * as crypto from 'crypto';

// Initialize Mux
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// POST /api/videos/mux-webhook - Handle Mux webhooks
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('mux-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    // Verify webhook signature (optional but recommended)
    const signingSecret = process.env.MUX_WEBHOOK_SIGNING_SECRET;
    if (signingSecret) {
      const computedSignature = crypto
        .createHmac('sha256', signingSecret)
        .update(body, 'utf8')
        .digest('base64');

      if (signature !== `sha256=${computedSignature}`) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const event = JSON.parse(body);

    switch (event.type) {
      case 'video.upload.asset_created':
        await handleAssetCreated(event);
        break;

      case 'video.upload.asset_ready':
        await handleAssetReady(event);
        break;

      case 'video.upload.asset_errored':
        await handleAssetError(event);
        break;

      default:
        console.log('Unhandled webhook event type:', event.type);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Mux webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleAssetCreated(event: any) {
  const { object } = event.data;

  // Find the lesson associated with this upload
  const lessonRecords = await db.select()
    .from(lessons)
    .where(eq(lessons.muxUploadId, object.upload_id))
    .limit(1);

  const lesson = lessonRecords[0];

  if (lesson) {
    await db.update(lessons)
      .set({
        muxAssetId: object.asset_id,
        muxStatus: 'processing',
      })
      .where(eq(lessons.id, lesson.id));

    console.log(`Asset created for lesson ${lesson.id}: ${object.asset_id}`);
  }
}

async function handleAssetReady(event: any) {
  const { object } = event.data;

  // Find the lesson associated with this asset
  const lessonRecords = await db.select()
    .from(lessons)
    .where(eq(lessons.muxAssetId, object.asset_id))
    .limit(1);

  const lesson = lessonRecords[0];

  if (lesson) {
    // Get the playback URL
    const asset = await mux.video.assets.retrieve(object.asset_id);
    const playbackId = asset.playback_ids?.[0]?.id;

    await db.update(lessons)
      .set({
        muxStatus: 'ready',
        videoUrl: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null,
        videoDuration: Math.round((object.duration || 0) * 1000), // Convert to milliseconds
      })
      .where(eq(lessons.id, lesson.id));

    console.log(`Asset ready for lesson ${lesson.id}: ${object.asset_id}`);
  }
}

async function handleAssetError(event: any) {
  const { object } = event.data;

  // Find the lesson associated with this upload
  const lessonRecords = await db.select()
    .from(lessons)
    .where(eq(lessons.muxUploadId, object.upload_id))
    .limit(1);

  const lesson = lessonRecords[0];

  if (lesson) {
    await db.update(lessons)
      .set({
        muxStatus: 'error',
        videoUrl: null,
      })
      .where(eq(lessons.id, lesson.id));

    console.error(`Asset error for lesson ${lesson.id}: ${object.asset_id}`, event.data.error);
  }
}