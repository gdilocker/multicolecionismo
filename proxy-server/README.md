# Dynadot Proxy Server

Servidor proxy simples para encaminhar requisições da Supabase Edge Function para a API da Dynadot, resolvendo o problema de whitelist de IPs.

## Por que este proxy é necessário?

A Dynadot exige whitelist de IPs para acessar a API, mas o Supabase Edge Functions não tem IPs fixos. Este proxy resolve isso rodando em um servidor com IP fixo.

## Instalação

### Passo 1: Configurar o VPS

1. **Criar um VPS** (escolha uma opção):
   - **DigitalOcean** (Recomendado):
     - Acesse https://www.digitalocean.com/
     - Crie um Droplet básico ($6/mês)
     - Sistema: Ubuntu 22.04 LTS
     - Região: São Paulo (sa-east-1) ou mais próxima

   - **AWS EC2**:
     - Acesse AWS Console
     - EC2 > Launch Instance
     - t2.micro (free tier elegível)

   - **Outras opções**: Vultr, Linode, Contabo

2. **Anotar o IP público** do servidor criado

3. **Conectar via SSH**:
   ```bash
   ssh root@SEU_IP_DO_SERVIDOR
   ```

### Passo 2: Instalar Node.js no servidor

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verificar instalação
node --version
npm --version

# Instalar PM2 (gerenciador de processos)
npm install -g pm2
```

### Passo 3: Fazer upload do código

**Opção A - Usando Git (Recomendado):**
```bash
# No servidor
cd /opt
git clone SEU_REPOSITORIO
cd dynadot-proxy
npm install
```

**Opção B - Usando SCP (do seu computador local):**
```bash
# Do seu computador local, na pasta proxy-server
scp -r * root@SEU_IP_DO_SERVIDOR:/opt/dynadot-proxy/
```

**Opção C - Manualmente:**
```bash
# No servidor, criar pasta
mkdir -p /opt/dynadot-proxy
cd /opt/dynadot-proxy

# Copiar e colar o conteúdo dos arquivos:
nano package.json  # Cole o conteúdo e salve (Ctrl+X, Y, Enter)
nano server.js     # Cole o conteúdo e salve
```

Depois instalar dependências:
```bash
npm install
```

### Passo 4: Configurar variáveis de ambiente

```bash
cd /opt/dynadot-proxy
nano .env
```

Adicione:
```
DYNADOT_API_KEY=sua_chave_api_aqui
PORT=3000
```

Salve (Ctrl+X, Y, Enter)

### Passo 5: Iniciar o servidor

```bash
# Iniciar com PM2
pm2 start server.js --name dynadot-proxy

# Configurar para iniciar automaticamente no boot
pm2 startup
pm2 save

# Verificar status
pm2 status
pm2 logs dynadot-proxy
```

### Passo 6: Configurar Firewall

```bash
# Abrir porta 3000
ufw allow 3000/tcp
ufw allow OpenSSH
ufw enable
```

### Passo 7: Testar o proxy

```bash
# No servidor ou do seu computador
curl http://SEU_IP_DO_SERVIDOR:3000/health
```

Deve retornar:
```json
{"status":"ok","message":"Dynadot Proxy is running"}
```

### Passo 8: Adicionar IP no Dynadot

1. Acesse o painel da Dynadot
2. Vá em Tools > API
3. Em "IP Address", adicione o IP público do seu VPS
4. Salve

### Passo 9: Atualizar Edge Function para usar o proxy

Modifique a Edge Function `domains` para apontar para o proxy:

```typescript
// Trocar de:
const dynadotUrl = 'https://api.dynadot.com/api3.json';

// Para:
const proxyUrl = 'http://SEU_IP_DO_SERVIDOR:3000/api/dynadot';

// E trocar o fetch:
const response = await fetch(proxyUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    command: 'search',
    params: {
      domain0: domain,
    }
  })
});
```

## Comandos úteis

```bash
# Ver logs em tempo real
pm2 logs dynadot-proxy

# Reiniciar servidor
pm2 restart dynadot-proxy

# Parar servidor
pm2 stop dynadot-proxy

# Ver status
pm2 status

# Atualizar código (se usando Git)
cd /opt/dynadot-proxy
git pull
npm install
pm2 restart dynadot-proxy
```

## Segurança (Opcional mas Recomendado)

### Adicionar autenticação por token:

```bash
# Gerar token aleatório
openssl rand -hex 32
```

Adicione no `.env`:
```
API_TOKEN=seu_token_gerado
```

Modifique `server.js` para validar o token:
```javascript
// Adicionar antes de app.post('/api/dynadot')
app.use('/api/dynadot', (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (token !== process.env.API_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

### Configurar HTTPS com Nginx + Let's Encrypt (Opcional):

Se quiser usar HTTPS:

```bash
# Instalar Nginx e Certbot
apt install -y nginx certbot python3-certbot-nginx

# Configurar domínio (substitua proxy.seudominio.com)
nano /etc/nginx/sites-available/dynadot-proxy
```

Configuração Nginx:
```nginx
server {
    listen 80;
    server_name proxy.seudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Ativar site
ln -s /etc/nginx/sites-available/dynadot-proxy /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Obter certificado SSL
certbot --nginx -d proxy.seudominio.com
```

## Custos Estimados

- **DigitalOcean Droplet básico**: $6/mês
- **AWS EC2 t2.micro**: Grátis no free tier, depois ~$8/mês
- **Vultr**: $6/mês
- **Contabo**: €4/mês (~$4.50)

## Suporte

Se tiver problemas:
1. Verifique os logs: `pm2 logs dynadot-proxy`
2. Teste a saúde: `curl http://localhost:3000/health`
3. Verifique o firewall: `ufw status`
4. Verifique se o Node.js está rodando: `pm2 status`
