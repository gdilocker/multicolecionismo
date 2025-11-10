import { createNamecheap } from '../../adapters/namecheap';

export const POST = async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const nc = createNamecheap();

  if (path.endsWith('/availability')) {
    const fqdn = url.searchParams.get('fqdn');
    if (!fqdn) {
      return Response.json({ error: 'Missing fqdn parameter' }, { status: 400 });
    }
    const result = await nc.checkAvailability(fqdn);
    return Response.json(result);
  }

  if (path.endsWith('/register')) {
    const body = await req.json();
    const { fqdn, years } = body;

    if (!fqdn) {
      return Response.json({ error: 'Missing fqdn in body' }, { status: 400 });
    }

    const result = await nc.registerDomain(fqdn, years ?? 1);
    return Response.json(result);
  }

  return new Response('Not found', { status: 404 });
};

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path.endsWith('/availability')) {
    const fqdn = url.searchParams.get('fqdn');
    if (!fqdn) {
      return Response.json({ error: 'Missing fqdn parameter' }, { status: 400 });
    }
    const nc = createNamecheap();
    const result = await nc.checkAvailability(fqdn);
    return Response.json(result);
  }

  return new Response('Not found', { status: 404 });
};
