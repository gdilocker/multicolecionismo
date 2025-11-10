import { createCloudflare } from '../../adapters/cloudflare';

export const POST = async (req: Request) => {
  const cf = createCloudflare();

  try {
    const body = await req.json();
    const result = await cf.applyDefaults(body);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
};

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const fqdn = url.searchParams.get('fqdn');

  if (!fqdn) {
    return Response.json({ error: 'Missing fqdn parameter' }, { status: 400 });
  }

  const cf = createCloudflare();
  const result = await cf.checkDNS(fqdn);
  return Response.json(result);
};
