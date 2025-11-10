#!/bin/bash

echo "🔍 DIAGNÓSTICO PRODUÇÃO - https://com.rich"
echo "=========================================="
echo ""

# Teste 1: Manifest
echo "1️⃣ Testando manifest.json..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://com.rich/manifest.json 2>/dev/null || echo "ERRO")
MIME=$(curl -s -I https://com.rich/manifest.json 2>/dev/null | grep -i "content-type" | cut -d: -f2 | xargs || echo "N/A")
echo "   Status: $STATUS"
echo "   MIME: $MIME"
if [ "$STATUS" = "200" ]; then
    echo "   ✅ ACESSÍVEL"
else
    echo "   ❌ NÃO ACESSÍVEL (retornando $STATUS)"
fi
echo ""

# Teste 2: Service Worker
echo "2️⃣ Testando sw.js..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://com.rich/sw.js 2>/dev/null || echo "ERRO")
MIME=$(curl -s -I https://com.rich/sw.js 2>/dev/null | grep -i "content-type" | cut -d: -f2 | xargs || echo "N/A")
echo "   Status: $STATUS"
echo "   MIME: $MIME"
if [ "$STATUS" = "200" ]; then
    echo "   ✅ ACESSÍVEL"
else
    echo "   ❌ NÃO ACESSÍVEL (retornando $STATUS)"
fi
echo ""

# Teste 3: Ícone 192
echo "3️⃣ Testando icon-192x192.png..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://com.rich/icons/icon-192x192.png 2>/dev/null || echo "ERRO")
MIME=$(curl -s -I https://com.rich/icons/icon-192x192.png 2>/dev/null | grep -i "content-type" | cut -d: -f2 | xargs || echo "N/A")
echo "   Status: $STATUS"
echo "   MIME: $MIME"
if [ "$STATUS" = "200" ]; then
    echo "   ✅ ACESSÍVEL"
else
    echo "   ❌ NÃO ACESSÍVEL (retornando $STATUS)"
fi
echo ""

# Teste 4: Ícone 512
echo "4️⃣ Testando icon-512x512.png..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://com.rich/icons/icon-512x512.png 2>/dev/null || echo "ERRO")
MIME=$(curl -s -I https://com.rich/icons/icon-512x512.png 2>/dev/null | grep -i "content-type" | cut -d: -f2 | xargs || echo "N/A")
echo "   Status: $STATUS"
echo "   MIME: $MIME"
if [ "$STATUS" = "200" ]; then
    echo "   ✅ ACESSÍVEL"
else
    echo "   ❌ NÃO ACESSÍVEL (retornando $STATUS)"
fi
echo ""

echo "=========================================="
echo "🎯 CONCLUSÃO:"
echo ""
echo "Se TODOS retornaram 404 ou ERRO:"
echo "  → Os arquivos PWA NÃO FORAM DEPLOYADOS"
echo "  → Solução: Upload de dist/ para o servidor"
echo ""
echo "Se retornam 200 mas MIME type errado:"
echo "  → Arquivos estão lá mas servidor configurado errado"
echo "  → Solução: Configurar .htaccess ou nginx.conf"
echo ""
echo "Próximo passo:"
echo "  Execute: ls -lh dist/ para confirmar que os arquivos existem localmente"
