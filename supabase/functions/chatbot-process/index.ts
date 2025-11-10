import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatbotRequest {
  message: string;
  language: string;
  conversationId?: string;
  userId?: string;
}

interface KnowledgeBaseResult {
  title: string;
  content: string;
  url: string;
  relevance: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, language, conversationId, userId }: ChatbotRequest = await req.json();

    if (!message || !language) {
      return new Response(
        JSON.stringify({ error: "Message and language are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const startTime = Date.now();

    // 1. Buscar na base de conhecimento (artigos de suporte)
    const knowledgeResults = await searchKnowledgeBase(message, language);

    // 2. Detectar intent usando patterns avançados
    const intentResult = await detectAdvancedIntent(message, language);

    // 3. Se habilitado, processar com LLM (OpenAI/Claude)
    const llmResponse = await processWithLLM(message, language, knowledgeResults, intentResult);

    // 4. Combinar resultados para melhor resposta
    const finalResponse = llmResponse || intentResult?.response || generateFallbackResponse(language);

    const responseTime = Date.now() - startTime;

    // 5. Log de analytics
    await logProcessing(conversationId, userId, message, finalResponse, responseTime, intentResult);

    return new Response(
      JSON.stringify({
        response: finalResponse,
        intent: intentResult?.intent,
        confidence: intentResult?.confidence || 0,
        knowledgeBase: knowledgeResults.slice(0, 3),
        responseTime,
        usedLLM: !!llmResponse,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing chatbot request:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function searchKnowledgeBase(query: string, language: string): Promise<KnowledgeBaseResult[]> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const normalizedQuery = query.toLowerCase();
    const keywords = normalizedQuery.split(" ").filter(w => w.length > 3);

    const response = await fetch(`${supabaseUrl}/rest/v1/support_articles?select=*`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });

    if (!response.ok) return [];

    const articles = await response.json();

    const scoredArticles = articles.map((article: any) => {
      let relevance = 0;
      const articleText = `${article.title} ${article.content}`.toLowerCase();

      keywords.forEach(keyword => {
        if (articleText.includes(keyword)) {
          relevance += 1;
        }
      });

      if (article.category) {
        if (normalizedQuery.includes(article.category.toLowerCase())) {
          relevance += 2;
        }
      }

      return {
        title: article.title,
        content: article.content.substring(0, 200) + "...",
        url: `/suporte/${article.slug}`,
        relevance,
      };
    });

    return scoredArticles
      .filter((a: KnowledgeBaseResult) => a.relevance > 0)
      .sort((a: KnowledgeBaseResult, b: KnowledgeBaseResult) => b.relevance - a.relevance)
      .slice(0, 5);
  } catch (error) {
    console.error("Error searching knowledge base:", error);
    return [];
  }
}

async function detectAdvancedIntent(message: string, language: string) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/chatbot_intents?enabled=eq.true&language=eq.${language}&order=priority.desc`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) return null;

    const intents = await response.json();
    const normalizedMessage = message.toLowerCase().trim();

    for (const intent of intents) {
      let matchScore = 0;
      const patterns = intent.patterns as string[];

      for (const pattern of patterns) {
        const normalizedPattern = pattern.toLowerCase();

        if (normalizedMessage === normalizedPattern) {
          matchScore = 1.0;
          break;
        }

        if (normalizedMessage.includes(normalizedPattern)) {
          matchScore = Math.max(matchScore, 0.85);
        }

        const words = normalizedPattern.split(" ");
        const matchedWords = words.filter(word => normalizedMessage.includes(word));
        if (matchedWords.length > 0) {
          matchScore = Math.max(matchScore, (matchedWords.length / words.length) * 0.7);
        }
      }

      if (matchScore > 0.5) {
        const responses = intent.responses as string[];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        return {
          intent: intent.name,
          response: randomResponse,
          confidence: matchScore,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error detecting advanced intent:", error);
    return null;
  }
}

async function processWithLLM(
  message: string,
  language: string,
  knowledgeResults: KnowledgeBaseResult[],
  intentResult: any
): Promise<string | null> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (!openaiKey && !anthropicKey) {
    return null;
  }

  try {
    const systemPrompt = language === "pt"
      ? `Você é o assistente virtual da .com.rich, uma plataforma premium para criação de identidade digital exclusiva com domínio próprio.

Responda de forma profissional, concisa e útil. Use no máximo 3 parágrafos curtos.

Informações oficiais sobre os planos:

**Prime - $50/mês**
- 25% de comissão para afiliados ($12.50 por venda)
- Acesso Exclusivo 14 Dias
- Licença exclusiva de domínio (seunome.com.rich)
- Página de perfil personalizável (pública ou privada)
- Editor completo: bio, avatar e links ilimitados
- Analytics profissional de acessos e cliques
- Acesso à coleção de nomes premium
- Integração com redes sociais
- Programa de afiliados: 25% de comissão recorrente
- Suporte via plataforma

**Elite - $70/mês (promoção até 31/12/2024, depois $100/mês)**
- 50% de comissão para afiliados ($35.00 por venda)
- Acesso Exclusivo 14 Dias
- Tudo do plano Prime, mais:
- Identidade física personalizada com QR Code dinâmico
- Design Black & Gold Edition exclusivo
- Selo Elite Member
- Destaque nas listagens internas
- Acesso antecipado ao marketplace premium
- Convites e benefícios exclusivos
- Suporte prioritário

**Supreme - By Request (sob consulta)**
- 50% de comissão para afiliados
- Licenciamento exclusivo global
- Infraestrutura técnica personalizada
- Plataforma digital independente
- Exclusive License Fee (taxa única)
- Mensalidade sob consulta
- Gerente de conta e suporte corporativo dedicado
- Garantias de SLA e contratos customizados
- Onboarding white-glove com consultoria estratégica
- Suporte jurídico e técnico completo

Recursos disponíveis: Domínios .com.rich exclusivos, páginas personalizadas, loja online, rede social integrada.

Sempre sugira o plano adequado baseado na necessidade do usuário. Se não souber algo, seja honesto e ofereça falar com um humano.

${knowledgeResults.length > 0 ? `Base de conhecimento relevante:\n${knowledgeResults.map(kb => `- ${kb.title}: ${kb.content}`).join("\n")}` : ""}`
      : `You are the virtual assistant for .com.rich, a premium platform for creating exclusive digital identity with custom domains.

Answer professionally, concisely and helpfully. Use at most 3 short paragraphs.

Official plan information:

**Prime - $50/month**
- 25% affiliate commission ($12.50 per sale)
- 14 Days Exclusive Access
- Exclusive domain license (yourname.com.rich)
- Customizable profile page (public or private)
- Full editor: bio, avatar and unlimited links
- Professional analytics for views and clicks
- Access to premium names collection
- Social media integration
- Affiliate program: 25% recurring commission
- Platform support

**Elite - $70/month (promo until 12/31/2024, then $100/month)**
- 50% affiliate commission ($35.00 per sale)
- 14 Days Exclusive Access
- Everything in Prime, plus:
- Personalized physical identity with dynamic QR Code
- Exclusive Black & Gold Edition design
- Elite Member badge
- Featured in internal listings
- Early access to premium marketplace
- Exclusive invites and benefits
- Priority support

**Supreme - By Request (custom pricing)**
- 50% affiliate commission
- Global exclusive licensing
- Custom technical infrastructure
- Independent digital platform
- Exclusive License Fee (one-time)
- Monthly fee upon consultation
- Dedicated account manager and corporate support
- SLA guarantees and custom contracts
- White-glove onboarding with strategic consulting
- Complete legal and technical support

Available features: Exclusive .com.rich domains, custom pages, online store, integrated social network.

Always suggest the appropriate plan based on user needs. If you don't know something, be honest and offer to connect with a human.

${knowledgeResults.length > 0 ? `Relevant knowledge base:\n${knowledgeResults.map(kb => `- ${kb.title}: ${kb.content}`).join("\n")}` : ""}`;

    if (openaiKey) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0]?.message?.content || null;
      }
    }

    if (anthropicKey) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-sonnet-20240229",
          max_tokens: 300,
          messages: [
            { role: "user", content: `${systemPrompt}\n\nUser question: ${message}` },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.content[0]?.text || null;
      }
    }

    return null;
  } catch (error) {
    console.error("Error processing with LLM:", error);
    return null;
  }
}

function generateFallbackResponse(language: string): string {
  const responses = language === "pt"
    ? [
        "Desculpe, não entendi sua pergunta. Pode reformular de outra forma?",
        "Não tenho certeza sobre isso. Gostaria de falar com um atendente humano?",
        "Posso ajudar com informações sobre:\n• Domínios .com.rich\n• Planos e preços\n• Recursos da plataforma\n• Criar sua página\n\nO que você gostaria de saber?",
      ]
    : [
        "Sorry, I didn't understand your question. Can you rephrase it?",
        "I'm not sure about that. Would you like to speak with a human agent?",
        "I can help with information about:\n• .com.rich domains\n• Plans and pricing\n• Platform features\n• Creating your page\n\nWhat would you like to know?",
      ];

  return responses[Math.floor(Math.random() * responses.length)];
}

async function logProcessing(
  conversationId: string | undefined,
  userId: string | undefined,
  message: string,
  response: string,
  responseTime: number,
  intentResult: any
) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    await fetch(`${supabaseUrl}/rest/v1/chatbot_messages`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        sender: "bot",
        message_text: response,
        intent_detected: intentResult?.intent,
        confidence_score: intentResult?.confidence,
        response_time_ms: responseTime,
        metadata: {
          user_id: userId,
          processed_at: new Date().toISOString(),
        },
      }),
    });
  } catch (error) {
    console.error("Error logging processing:", error);
  }
}
