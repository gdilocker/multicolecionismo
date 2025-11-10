import { createNamecheap } from '../../adapters/namecheap';
import { createCloudflare } from '../../adapters/cloudflare';
import { createEmailProvider } from '../../adapters/emailProvider';

export interface FulfillOrderParams {
  fqdn: string;
  years?: number;
  plan?: string;
}

export async function fulfillOrder(params: FulfillOrderParams): Promise<boolean> {
  const { fqdn, years = 1, plan = 'basic' } = params;

  console.log(`[WORKFLOW] Starting fulfillment for ${fqdn}`);

  const nc = createNamecheap();
  const cf = createCloudflare();
  const ep = createEmailProvider();

  try {
    console.log('[WORKFLOW] Step 1: Registering domain...');
    const reg = await nc.registerDomain(fqdn, years);
    if (!reg.success) {
      console.error('[WORKFLOW] Domain registration failed:', reg.error);
      return false;
    }
    console.log(`[WORKFLOW] Domain registered: ${reg.orderId}`);

    console.log('[WORKFLOW] Step 2: Creating email domain...');
    const emailDom = await ep.createDomain(fqdn);
    console.log(`[WORKFLOW] Email domain created: ${emailDom.providerRef}`);

    console.log('[WORKFLOW] Step 3: Applying DNS defaults...');
    await cf.applyDefaults({
      fqdn,
      mxHost: 'mail..com.rich',
      spfInclude: '_spf..com.rich',
      dkimTxt: emailDom.dkim,
      dmarcPolicy: 'v=DMARC1; p=none; pct=100; adkim=s; aspf=s; fo=1'
    });
    console.log('[WORKFLOW] DNS records applied');

    console.log('[WORKFLOW] Step 4: Creating initial mailbox...');
    await ep.createMailbox({
      fqdn,
      localpart: 'admin',
      quota_mb: 5120,
      password: 'Temp#12345'
    });
    console.log('[WORKFLOW] Initial mailbox created: admin@' + fqdn);

    console.log('[WORKFLOW] Fulfillment completed successfully');
    return true;
  } catch (error) {
    console.error('[WORKFLOW] Fulfillment failed:', error);
    return false;
  }
}
