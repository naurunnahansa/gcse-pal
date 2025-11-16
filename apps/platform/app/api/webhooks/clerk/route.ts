import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error('Missing CLERK_WEBHOOK_SECRET environment variable');
}

export async function POST(req: NextRequest) {
  try {
    const headerPayload = await headers();
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

  const user = await db.insert(users).values({
    clerkId: id,
    email: primaryEmail?.email_address || '',
    name: `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown User',
    avatar: image_url,
    role: 'student', // Default role
    preferences: {
      theme: 'light',
      emailNotifications: true,
      pushNotifications: true,
      studyReminders: true,
      deadlineReminders: true,
      dailyGoal: 60,
      preferredStudyTime: 'evening',
      studyDays: [1, 2, 3, 4, 5]
    }
  }).returning();

  console.log(`Created user: ${user[0].id} for Clerk ID: ${id}`);
}

async function handleUserUpdated(data: any) {
  const { id, email_addresses, first_name, last_name, image_url } = data;

  const primaryEmail = email_addresses.find((email: any) => email.id === data.primary_email_address_id);

  await db.update(users)
    .set({
      email: primaryEmail?.email_address,
      name: `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown User',
      avatar: image_url,
    })
    .where(eq(users.clerkId, id));

  console.log(`Updated user for Clerk ID: ${id}`);
}

async function handleUserDeleted(data: any) {
  const { id } = data;

  // Note: The users table doesn't have an archived field in the new schema
  // We would need to add this field or handle deletion differently
  // For now, let's update the user's role to indicate deletion or simply log
  console.log(`User deletion requested for Clerk ID: ${id} - implement soft delete mechanism`);

  // TODO: Implement soft delete mechanism - either add archived field to users table
  // or use a separate deleted_users table, or handle through Clerk user deletion
}