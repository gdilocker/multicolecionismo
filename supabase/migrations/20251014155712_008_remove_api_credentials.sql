/*
  # Remove API Credentials Table

  ## Changes
  1. Drop api_credentials table - credentials should be in environment variables
  
  ## Rationale
  This is a single-tenant application where the site owner (.com.rich) 
  provides services to customers. API credentials (Dynadot, PayPal, Cloudflare, 
  Mailcow) belong to the site owner, not individual users.
  
  Credentials should be stored as environment variables/secrets in Project Settings.
*/

DROP TABLE IF EXISTS api_credentials CASCADE;
