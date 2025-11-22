import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, public_metadata } = evt.data

    const email = email_addresses[0]?.email_address
    const name = [first_name, last_name].filter(Boolean).join(' ')

    // Determine role from metadata or default to free_student
    const role = (public_metadata?.role as string) || 'free_student'

    try {
      await db.insert(users).values({
        clerkId: id,
        email,
        name,
        role,
      })
      console.log('User created in database:', id)
    } catch (error) {
      console.error('Error creating user in database:', error)
      // Don't return error to Clerk, log it instead
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, public_metadata } = evt.data

    const email = email_addresses[0]?.email_address
    const name = [first_name, last_name].filter(Boolean).join(' ')
    const role = (public_metadata?.role as string) || 'free_student'

    try {
      // Check if user exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, id))
        .limit(1)

      if (existingUser) {
        // Update existing user
        await db
          .update(users)
          .set({
            email,
            name,
            role,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, id))
        console.log('User updated in database:', id)
      } else {
        // Create user if doesn't exist
        await db.insert(users).values({
          clerkId: id,
          email,
          name,
          role,
        })
        console.log('User created in database (from update event):', id)
      }
    } catch (error) {
      console.error('Error updating user in database:', error)
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    if (!id) {
      return new Response('Error occured -- no user id', {
        status: 400,
      })
    }

    try {
      await db.delete(users).where(eq(users.clerkId, id))
      console.log('User deleted from database:', id)
    } catch (error) {
      console.error('Error deleting user from database:', error)
    }
  }

  return new NextResponse('', { status: 200 })
}