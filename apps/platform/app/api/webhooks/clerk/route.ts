import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { prisma } from '@/lib/db';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('Missing CLERK_WEBHOOK_SECRET environment variable');
}

export async function POST(req: NextRequest) {
  try {
    const headerPayload = headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: 'Missing svix headers' },
        { status: 400 }
      );
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(webhookSecret);
    let event: any;

    try {
      event = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      });
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    const { type } = event;

    switch (type) {
      case 'user.created':
        await handleUserCreated(event.data);
        break;

      case 'user.updated':
        await handleUserUpdated(event.data);
        break;

      case 'user.deleted':
        await handleUserDeleted(event.data);
        break;

      default:
        console.log(`Unhandled webhook event type: ${type}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleUserCreated(data: any) {
  const { id, email_addresses, first_name, last_name, image_url } = data;

  const primaryEmail = email_addresses.find((email: any) => email.id === data.primary_email_address_id);

  const user = await prisma.user.create({
    data: {
      clerkId: id,
      email: primaryEmail?.email_address || '',
      name: `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown User',
      avatar: image_url,
      role: 'student', // Default role
    },
  });

  // Create user settings with defaults
  await prisma.userSettings.create({
    data: {
      userId: user.id,
      dailyGoal: 60, // 60 minutes per day
      notificationsEnabled: true,
      theme: 'light',
    },
  });

  console.log(`Created user: ${user.id} for Clerk ID: ${id}`);
}

async function handleUserUpdated(data: any) {
  const { id, email_addresses, first_name, last_name, image_url } = data;

  const primaryEmail = email_addresses.find((email: any) => email.id === data.primary_email_address_id);

  await prisma.user.update({
    where: { clerkId: id },
    data: {
      email: primaryEmail?.email_address,
      name: `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown User',
      avatar: image_url,
    },
  });

  console.log(`Updated user for Clerk ID: ${id}`);
}

async function handleUserDeleted(data: any) {
  const { id } = data;

  await prisma.user.update({
    where: { clerkId: id },
    data: {
      archived: true, // Soft delete
    },
  });

  console.log(`Soft deleted user for Clerk ID: ${id}`);
}