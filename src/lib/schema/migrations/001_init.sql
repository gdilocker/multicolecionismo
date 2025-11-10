/*
  # Initial Schema for .com.rich MVP

  1. New Tables
    - `customers` - Customer accounts linked to auth users
    - `orders` - Domain purchase orders
    - `domains` - Registered .email domains
    - `mail_domains` - Email service provisioning for domains
    - `mailboxes` - Email mailboxes (user@domain.email)
    - `aliases` - Email aliases and forwards
    - `dns_records` - DNS records for domains
    - `invoices` - Billing invoices
    - `audit_logs` - Audit trail for all actions

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own resources
*/

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own customer data"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own customer data"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  fqdn text NOT NULL,
  years int NOT NULL DEFAULT 1,
  plan text NOT NULL,
  total_cents int NOT NULL,
  status text NOT NULL DEFAULT 'created',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

-- Domains table
CREATE TABLE IF NOT EXISTS domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  fqdn text UNIQUE NOT NULL,
  registrar_status text,
  expires_at timestamptz,
  dkim_selector text,
  dkim_public text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own domains"
  ON domains FOR SELECT
  TO authenticated
  USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

CREATE POLICY "Users can create own domains"
  ON domains FOR INSERT
  TO authenticated
  WITH CHECK (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own domains"
  ON domains FOR UPDATE
  TO authenticated
  USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()))
  WITH CHECK (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

-- Mail domains table
CREATE TABLE IF NOT EXISTS mail_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES domains(id),
  provider_ref text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mail_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mail domains"
  ON mail_domains FOR SELECT
  TO authenticated
  USING (domain_id IN (
    SELECT d.id FROM domains d
    JOIN customers c ON d.customer_id = c.id
    WHERE c.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own mail domains"
  ON mail_domains FOR INSERT
  TO authenticated
  WITH CHECK (domain_id IN (
    SELECT d.id FROM domains d
    JOIN customers c ON d.customer_id = c.id
    WHERE c.user_id = auth.uid()
  ));

-- Mailboxes table
CREATE TABLE IF NOT EXISTS mailboxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mail_domain_id uuid NOT NULL REFERENCES mail_domains(id),
  localpart text NOT NULL,
  quota_mb int NOT NULL DEFAULT 5120,
  provider_ref text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  UNIQUE(mail_domain_id, localpart)
);

ALTER TABLE mailboxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mailboxes"
  ON mailboxes FOR SELECT
  TO authenticated
  USING (mail_domain_id IN (
    SELECT md.id FROM mail_domains md
    JOIN domains d ON md.domain_id = d.id
    JOIN customers c ON d.customer_id = c.id
    WHERE c.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own mailboxes"
  ON mailboxes FOR INSERT
  TO authenticated
  WITH CHECK (mail_domain_id IN (
    SELECT md.id FROM mail_domains md
    JOIN domains d ON md.domain_id = d.id
    JOIN customers c ON d.customer_id = c.id
    WHERE c.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own mailboxes"
  ON mailboxes FOR UPDATE
  TO authenticated
  USING (mail_domain_id IN (
    SELECT md.id FROM mail_domains md
    JOIN domains d ON md.domain_id = d.id
    JOIN customers c ON d.customer_id = c.id
    WHERE c.user_id = auth.uid()
  ))
  WITH CHECK (mail_domain_id IN (
    SELECT md.id FROM mail_domains md
    JOIN domains d ON md.domain_id = d.id
    JOIN customers c ON d.customer_id = c.id
    WHERE c.user_id = auth.uid()
  ));

-- Aliases table
CREATE TABLE IF NOT EXISTS aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mail_domain_id uuid NOT NULL REFERENCES mail_domains(id),
  source text NOT NULL,
  destination text NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own aliases"
  ON aliases FOR SELECT
  TO authenticated
  USING (mail_domain_id IN (
    SELECT md.id FROM mail_domains md
    JOIN domains d ON md.domain_id = d.id
    JOIN customers c ON d.customer_id = c.id
    WHERE c.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own aliases"
  ON aliases FOR INSERT
  TO authenticated
  WITH CHECK (mail_domain_id IN (
    SELECT md.id FROM mail_domains md
    JOIN domains d ON md.domain_id = d.id
    JOIN customers c ON d.customer_id = c.id
    WHERE c.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own aliases"
  ON aliases FOR DELETE
  TO authenticated
  USING (mail_domain_id IN (
    SELECT md.id FROM mail_domains md
    JOIN domains d ON md.domain_id = d.id
    JOIN customers c ON d.customer_id = c.id
    WHERE c.user_id = auth.uid()
  ));

-- DNS records table
CREATE TABLE IF NOT EXISTS dns_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES domains(id),
  type text NOT NULL,
  name text NOT NULL,
  value text NOT NULL,
  ttl int DEFAULT 300,
  proxied boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dns_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own DNS records"
  ON dns_records FOR SELECT
  TO authenticated
  USING (domain_id IN (
    SELECT d.id FROM domains d
    JOIN customers c ON d.customer_id = c.id
    WHERE c.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own DNS records"
  ON dns_records FOR INSERT
  TO authenticated
  WITH CHECK (domain_id IN (
    SELECT d.id FROM domains d
    JOIN customers c ON d.customer_id = c.id
    WHERE c.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own DNS records"
  ON dns_records FOR UPDATE
  TO authenticated
  USING (domain_id IN (
    SELECT d.id FROM domains d
    JOIN customers c ON d.customer_id = c.id
    WHERE c.user_id = auth.uid()
  ))
  WITH CHECK (domain_id IN (
    SELECT d.id FROM domains d
    JOIN customers c ON d.customer_id = c.id
    WHERE c.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own DNS records"
  ON dns_records FOR DELETE
  TO authenticated
  USING (domain_id IN (
    SELECT d.id FROM domains d
    JOIN customers c ON d.customer_id = c.id
    WHERE c.user_id = auth.uid()
  ));

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  stripe_invoice_id text,
  amount_cents int NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (order_id IN (
    SELECT o.id FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE c.user_id = auth.uid()
  ));

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  diff_json jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (actor_id = auth.uid());

CREATE POLICY "Service can create audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
