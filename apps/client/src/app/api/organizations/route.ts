import { WorkOS } from '@workos-inc/node';
import { withAuth } from '@workos-inc/authkit-nextjs';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export async function GET() {
  try {
    const { user } = await withAuth();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For now, return mock data since we don't have database integration yet
    const mockOrganizations = [
      {
        id: 'mock-org-1',
        name: 'My Company',
        domain: 'mycompany.com',
        role: 'admin',
        organization: {
          id: 'mock-org-1',
          name: 'My Company',
          domain: 'mycompany.com'
        }
      }
    ];

    return new Response(JSON.stringify({ 
      success: true, 
      organizations: mockOrganizations,
      user: { id: user.id, email: user.email }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch organizations' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await withAuth();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { name, domain } = await req.json();

    if (!name) {
      return new Response(JSON.stringify({ 
        error: 'Organization name is required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create organization in WorkOS
    const workosOrg = await workos.organizations.createOrganization({
      name,
      domains: domain ? [domain] : undefined,
    });

    // Return mock response for now
    const mockOrganization = {
      id: workosOrg.id,
      name: workosOrg.name,
      domain: domain || null,
      role: 'admin',
      organization: {
        id: workosOrg.id,
        name: workosOrg.name,
        domain: domain || null
      }
    };

    return new Response(JSON.stringify({ 
      success: true, 
      organization: mockOrganization,
      workosOrganization: workosOrg
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create organization' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
