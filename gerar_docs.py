import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


brd_content = """# 📑 Documento de Especificação de Regras de Negócio (BRD) — KLIPYT

**Projeto:** KLIPYT — Rede de Mídia e Engajamento Urbano  
**Domínio:** https://klipyt.com  
**Versão:** 3.0.0  
**Data da Especificação:** 17 de Maio de 2026  
**Status:** Homologado para Desenvolvimento Completo  

---

## 1. Visão Geral do Produto e Posicionamento Estratégico

O **KLIPYT** é uma **rede social urbana georreferenciada** de mídia, engajamento e recompensas, operando em **klipyt.com** como Progressive Web App (PWA) com Realidade Aumentada no navegador (WebAR). O produto une três camadas em um único ecossistema:

| Camada | Público | Entrega |
|--------|---------|---------|
| **Rede social urbana** | B2C (PF) | Feed, perfis, interações e descoberta de conteúdo hiperlocal |
| **Drive-to-Store gamificado** | B2C + B2B | Moedas colecionáveis, vídeo recompensado e WebAR em pontos reais |
| **Mídia DOOH virtual 3D** | B2B (PJ) | Outdoors digitais geolocalizados com densidade Ouro / Prata / Bronze |

O objetivo central é transformar tráfego físico urbano em atenção mensurável, conversão em PDV e liquidez instantânea via **Pix** (Arranjo de Pagamentos do Banco Central), com lastro financeiro auditável e antifraude espacial.

---

## 2. Modelagem Financeira e Lógica de Monetização

### RN01 — Taxa de Retenção da Plataforma (GLOBAL_MARGIN)

A plataforma retém, por padrão, **40% (quarenta por cento)** sobre o valor bruto de qualquer campanha, emissão de moeda colecionável ou pacote publicitário contratado pelo lojista.

* **Variável global:** `GLOBAL_MARGIN = 0.40` em `platform_settings`.
* **Fórmula:**
$$\\text{Orçamento Líquido} = \\text{Orçamento Bruto} \\times (1 - \\text{GLOBAL\\_MARGIN})$$
* **Exemplo:** Aporte bruto de R$ 1.000,00 → R$ 400,00 receita da plataforma; R$ 600,00 lastro para recompensas geolocalizadas.
* **Imutabilidade histórica:** Alterações em `GLOBAL_MARGIN` afetam apenas operações criadas após a mudança.

### RN02 — Arquitetura de Desembolso Pix via C6 Bank BaaS

O ecossistema integra-se nativamente à **API Pix C6 Bank BaaS** (Business Banking as a Service), com credenciais PJ, webhooks de liquidação e confirmação assíncrona apontando para `https://klipyt.com/api/v1/webhooks/c6-pix`.

* **Proibido:** Integração com Banco Inter ou outros gateways não homologados neste BRD.
* **Liquidação:** Saques disparam requisição TLS 1.3; status `wallet_transactions` só transita para `COMPLETED` após webhook de confirmação do C6.
* **Chave Pix obrigatória:** Tipo **CPF**, idêntica ao CPF validado no cadastro (`VERIFIED`).

### RN03 — Taxa do Marketplace P2P de Moedas Colecionáveis

Vendas peer-to-peer de moedas raras no marketplace interno do KLIPYT cobram **10% (dez por cento)** sobre o preço de venda acordado entre comprador e vendedor, retidos na origem antes da transferência de propriedade.

---

## 3. Módulo B2B — Portal do Lojista (Tenant)

### RF01 — Integração Cadastral Expressa via API CNPJ

O lojista informa o CNPJ da matriz; o sistema consome API da Receita Federal, extrai filiais ativas e geocodifica endereços (WGS84) em `establishments.geom` com índice **GIST**.

### RF02 — Motor de Agendamento Sazonal (Peak-Hour Scheduler)

Parâmetros obrigatórios: orçamento bruto, janela horária (máx. 6h/dia), vídeo vertical 9:16 (H.264, 15–30s, máx. 15MB). Custo unitário por visitante permanece oculto na UI de compra.

### RF03 — Algoritmo Smart Blending 60/40

Com filtro de segmentação ativo, o orçamento líquido divide-se automaticamente:

* **60% — Camada de Conversão:** Público qualificado (ex.: 35+); moedas de alto valor **dentro** do PDV.
* **40% — Camada de Volume:** Público geral; moedas de baixo valor na **fachada, calçada ou estacionamento** para prova social.

### RF04 — Dashboard Pós-Campanha Auditado

Métricas: orçamento consumido, visitas únicas por CPF, CPV, retenção de vídeo, tempo médio no raio do PDV. Saldo não coletado retorna a `merchant_wallets`.

### RF15 — Outdoors Virtuais 3D (DOOH Georreferenciado)

O lojista ou agência reserva **painéis publicitários virtuais 3D** ancorados a coordenadas urbanas reais. Densidade e preço seguem três tiers:

| Tier | Densidade urbana | Posicionamento típico | CPM sugerido |
|------|------------------|----------------------|--------------|
| **Ouro** | Alta (centro, shoppings) | Fachadas premium, fluxo > 5k/dia | Maior visibilidade WebAR |
| **Prata** | Média (bairros comerciais) | Calçadas e cruzamentos | Equilíbrio alcance/custo |
| **Bronze** | Baixa (periferia, corredores) | Entrada de condomínios, pontos de ônibus | Volume massivo |

Cada outdoor virtual possui modelo 3D (.glb), criativo em vídeo ou imagem, período de locação (`billboard_rentals`) e métricas de impressões/interações WebAR.

### RF16 — Moedas Colecionáveis e Marketplace P2P

* **Emissão:** Lojistas ou a plataforma emitem moedas numeradas em `coin_catalogs` com valor de face e estoque derivado do orçamento bruto após `GLOBAL_MARGIN`.
* **Coleta B2C:** Usuário coleta via WebAR após vídeo recompensado; propriedade registrada em inventário unificado.
* **Marketplace:** Usuários listam moedas raras; na venda, **10%** retidos pela plataforma (`marketplace_orders.platform_fee`); propriedade transferida atomicamente.

---

## 4. Módulo B2C — PWA klipyt.com (WebAR + Rede Social)

### RF05 — Onboarding Progressivo

* **Fase 1:** Login Google → `users.status = INCOMPLETE`; `cpf`, `birth_date`, `pix_key` = NULL. Acesso ao mapa, feed social e álbum.
* **Fase 2:** Upgrade com CPF + Pix CPF → bureau valida idade → `status = VERIFIED`; mapa injeta moedas financeiras e baús qualificados.

### RF06 — Mapa Dinâmico e Ocultação por Perfil

* **Moedas Bronze / volume:** Visíveis a todos.
* **Baús de Ouro (alto valor / qualificados):** Omitidos do JSON do mapa se o usuário não atender `age_restriction` da campanha (ex.: 22 anos vs. campanha 35+).

### RF07 — Coleta por Vídeo Recompensado + WebAR

Fluxo: proximidade → vídeo fullscreen sem skip → token Redis → câmera WebAR (Three.js/A-Frame) → toque na moeda 3D → `POST /api/v1/campaigns/collect`.

### RF08 — Carteira Digital e Saque Mínimo

* Saque Pix bloqueado até **R$ 6,00** acumulados.
* Botão desbloqueia ao atingir o mínimo; liquidação via C6 Bank na chave CPF do usuário.

### RF09 — Feed Social Hiperlocal

Publicações geotagueadas, reações e compartilhamento de capturas WebAR reforçam o posicionamento de **rede de engajamento urbano**, não apenas app de recompensas.

### RF10 — Temas Sazonais Globais

Chaves CMS alteram ícones do mapa, sons de captura e sugestões de campanha (Copa, Black Friday, Natal, Dia dos Namorados).

---

## 5. Requisitos de Segurança e Antifraude

### RN04 — Protocolo Anti-Mock GPS (PostGIS)

Três camadas:

1. **Cliente (PWA):** Bloqueio imediato se `navigator.geolocation` reportar `mocked = true`.
2. **Payload assinado:** Hash HMAC(`user_id + coin_id + timestamp_ms`) em cada tentativa de coleta.
3. **Servidor (PostGIS):** `ST_Distance(geom_usuario, geom_moeda) <= 25` metros. Acima de 25m → HTTP 403, sem crédito, `users.fraud_flag = true`.

### RN05 — Rate Limiting por CPF

Máximo **1 coleta de moeda financeira** por estabelecimento a cada 24 horas. Máximo **2 pacotes de figurinhas** por estabelecimento a cada 24 horas.

---

## 6. Resumo de Variáveis Globais

| Chave | Valor padrão | Descrição |
|-------|--------------|-----------|
| `GLOBAL_MARGIN` | `0.40` | Take rate 40% |
| `MARKETPLACE_FEE` | `0.10` | Taxa P2P 10% |
| `MIN_WITHDRAWAL_BRL` | `6.00` | Saque mínimo Pix |
| `MAX_CAPTURE_RADIUS_M` | `25` | Raio ST_Distance |
| `SMART_BLEND_QUALIFIED` | `0.60` | Camada conversão |
| `SMART_BLEND_VOLUME` | `0.40` | Camada volume |
| `PIX_PROVIDER` | `C6_BANK_BAAS` | Gateway exclusivo |
"""


use_cases_content = """# 🚀 Casos de Uso Técnicos (Use Cases) — KLIPYT

**Domínio:** https://klipyt.com  
**Total:** 10 casos de uso com cenários Gherkin completos  

---

## UC01: Login Simplificado via Google com Perfil Financeiro Incompleto

* **Atores:** Usuário Final (PF), Sistema, Google OAuth 2.0
* **Objetivo:** Permitir entrada imediata no ecossistema KLIPYT sem exigir CPF ou Pix na primeira sessão.
* **Fluxo Principal:**
  1. O usuário abre o PWA em klipyt.com e clica em `[ Entrar com o Google ]`.
  2. O sistema executa OAuth 2.0 e obtém `email`, `full_name` e `avatar_url`.
  3. O backend verifica existência do e-mail em `users`.
  4. Se inexistente: cria registro com `status = 'INCOMPLETE'` e mantém `cpf`, `birth_date` e `pix_key` como `NULL`.
  5. O sistema emite JWT e libera mapa, feed social e álbum de figurinhas.
  6. Carteira Pix e coleta de moedas financeiras permanecem bloqueadas até UC02.

### Cenário Gherkin:

```gherkin
Funcionalidade: Onboarding inicial com Google OAuth no KLIPYT

  Cenário: Primeiro login cria perfil INCOMPLETE sem campos financeiros
    Dado que o visitante acessa "https://klipyt.com" sem sessão ativa
    Quando ele clicar em "Entrar com o Google"
    E o OAuth retornar o e-mail "maria.silva@gmail.com" e nome "Maria Silva"
    Então o backend deve inserir um registro em "users" com "status = INCOMPLETE"
    E os campos "cpf", "birth_date" e "pix_key" devem permanecer NULL
    E o endpoint GET "/api/v1/map/coins" deve retornar apenas ativos não financeiros ou teaser
    E o botão "Sacar via Pix" deve aparecer bloqueado na carteira

  Cenário: Usuário recorrente com sessão Google válida
    Dado que já existe usuário com e-mail "maria.silva@gmail.com" e status INCOMPLETE
    Quando ele autenticar novamente via Google
    Então o backend não deve duplicar o registro
    E deve retornar JWT válido com o mesmo "user_id"
```

---

## UC02: Upgrade de Conta com CPF Validado para Status VERIFIED

* **Atores:** Usuário Final (PF), Sistema, API Bureau de Dados
* **Objetivo:** Validar identidade e habilitar Pix real, mapa qualificado e marketplace.
* **Fluxo Principal:**
  1. Usuário `INCOMPLETE` tenta coletar moeda financeira ou acessar carteira.
  2. PWA exibe formulário: CPF e Chave Pix (tipo CPF, igual ao CPF informado).
  3. Backend consulta bureau; obtém data de nascimento oficial.
  4. Se menor de 18 anos: HTTP 422. Se maior: calcula faixa etária (ex.: `35+` se idade >= 35).
  5. Atualiza `users.status = 'VERIFIED'`, persiste `birth_date`, `pix_key`, `faixa_etaria`.
  6. Endpoint do mapa passa a incluir baús de Ouro conforme elegibilidade.

### Cenário Gherkin:

```gherkin
Funcionalidade: Upgrade cadastral para maioria de idade verificada

  Cenário: Upgrade bem-sucedido com CPF válido e maioria de idade
    Dado que o usuário possui "status = INCOMPLETE" autenticado via Google
    Quando ele enviar POST "/api/v1/users/upgrade" com CPF "52998224725" e pix_key "52998224725"
    E o bureau retornar data de nascimento correspondente a 42 anos de idade
    Então o backend deve atualizar "status" para "VERIFIED"
    E deve gravar "faixa_etaria" como "35+"
    E o GET "/api/v1/map/coins" deve incluir moedas com "is_qualified = true" quando elegível

  Cenário: Bloqueio de upgrade para menor de idade
    Dado que o bureau retorna data de nascimento indicando 16 anos
    Quando o usuário submeter o formulário de upgrade
    Então o backend deve retornar HTTP 422 Unprocessable Entity
    E o "status" deve permanecer "INCOMPLETE"
    E nenhuma chave Pix deve ser persistida
```

---

## UC03: Upload e Validação de Vídeo Promocional PJ (ffprobe 15–30 segundos)

* **Atores:** Lojista (PJ), Sistema (FFmpeg/ffprobe), Cloudflare R2
* **Objetivo:** Garantir mídia vertical dentro da janela de 15 a 30 segundos antes de ativar campanha.
* **Fluxo Principal:**
  1. Lojista autenticado no Portal B2B envia vídeo via `POST /api/v1/campaigns/upload-video`.
  2. Frontend limita payload a 15MB.
  3. Backend salva temporariamente e executa `ffprobe -show_entries format=duration`.
  4. Se duração < 15s ou > 30s: apaga arquivo, retorna HTTP 400.
  5. Se válido: upload para R2, persiste `campaigns.video_url`.

### Cenário Gherkin:

```gherkin
Funcionalidade: Validação de vídeo promocional no Portal PJ KLIPYT

  Cenário: Rejeição de vídeo com 45 segundos
    Dado que o lojista está autenticado no portal B2B
    Quando ele enviar um arquivo MP4 para POST "/api/v1/campaigns/upload-video"
    E o ffprobe retornar "duration=45.2"
    Então o backend deve remover o arquivo temporário
    E deve retornar HTTP 400 com mensagem "O vídeo deve ter entre 15 e 30 segundos."

  Cenário: Aceite de vídeo vertical de 22 segundos
    Dado que o lojista envia vídeo de 9MB e duração 22 segundos
    Quando o ffprobe confirmar duração entre 15 e 30 segundos inclusive
    Então o sistema deve enviar o stream para o bucket R2 configurado
    E deve retornar HTTP 200 com "video_url" público persistível em "campaigns"
```

---

## UC04: Mapa Dinâmico Ocultando Baús de Ouro para Perfil Inadequado

* **Atores:** Usuário Final (PF), Sistema (Backend/Redis/PostGIS)
* **Objetivo:** Não renderizar moedas qualificadas (baús de Ouro) para usuários fora do público-alvo.
* **Fluxo Principal:**
  1. PWA envia `GET /api/v1/map/coins?lat={lat}&lon={lon}` com JWT.
  2. Backend lê idade/faixa do usuário e consulta `GEOSEARCH active_coins:geo` em 5 km.
  3. Para cada moeda com `is_qualified = true` e campanha `age_restriction = 35`, omite do JSON se usuário < 35 anos.
  4. Moedas Bronze (volume) permanecem visíveis.

### Cenário Gherkin:

```gherkin
Funcionalidade: Filtro de visibilidade de ativos premium no mapa

  Cenário: Usuário de 22 anos não vê baús de Ouro de campanha 35+
    Dado que o usuário VERIFIED possui 22 anos de idade
    E existe moeda qualificada com "is_qualified = true" e "age_restriction = 35" a 200 metros
    Quando o PWA chamar GET "/api/v1/map/coins"
    Então o JSON de resposta não deve conter o "coin_id" da moeda qualificada
    E deve listar normalmente moedas com "is_qualified = false"

  Cenário: Usuário de 40 anos visualiza baús de Ouro elegíveis
    Dado que o usuário VERIFIED possui 40 anos
    E a campanha exige "age_restriction = 35"
    Quando o PWA chamar GET "/api/v1/map/coins"
    Então o JSON deve incluir moedas qualificadas dentro do raio de busca
```

---

## UC05: Captura WebAR com Validação PostGIS Anti-Fake GPS (25 metros)

* **Atores:** Usuário Final (PF), Sistema (PWA/Backend/PostGIS/Redis)
* **Objetivo:** Coletar moeda após vídeo e WebAR, validando distância real <= 25m e ausência de mock GPS.
* **Fluxo Principal:**
  1. PWA detecta `mocked`; se true, bloqueia mapa (RN04 camada 1).
  2. Usuário entra no raio; assiste vídeo até `onEnded`; token em `video:token:{user_id}:{coin_id}`.
  3. WebAR renderiza moeda 3D; usuário toca para capturar.
  4. `POST /api/v1/campaigns/collect` com coordenadas + HMAC.
  5. Backend executa `ST_Distance` entre GPS e `financial_coins.geom`.
  6. Se <= 25m e rate limit OK: credita carteira, registra `unified_collections`, remove do Redis.
  7. Se > 25m: HTTP 403, `fraud_flag = true`.

### Cenário Gherkin:

```gherkin
Funcionalidade: Coleta segura WebAR com antifraude espacial

  Cenário: Coleta legítima a 12 metros da moeda
    Dado que o usuário VERIFIED assistiu o vídeo até o evento onEnded
    E a coordenada enviada está a 12 metros de "financial_coins.geom"
  Quando o backend executar ST_Distance e o resultado for menor ou igual a 25
    E não houver coleta do mesmo CPF na filial nas últimas 24 horas
    Então o sistema deve creditar "users.wallet_balance"
    E deve inserir registro em "unified_collections" com "asset_type = FINANCIAL_COIN"
    E deve remover a moeda de "active_coins:geo" no Redis

  Cenário: Fake GPS detectado com divergência de 300 metros
    Dado que o usuário envia POST "/api/v1/campaigns/collect"
    Quando o PostGIS calcular ST_Distance com resultado de 300 metros
    Então o backend deve retornar HTTP 403 Forbidden
    E deve definir "users.fraud_flag = true"
    E não deve alterar "wallet_balance"

  Cenário: PWA bloqueia provedor de localização simulada
    Dado que o navegador reporta "coords.mocked = true"
    Quando o usuário tentar abrir o mapa
    Então o PWA deve exibir alerta de fraude e não renderizar moedas
    E não deve disparar requisição de coleta
```

---

## UC06: Queima de Cupom de Recompensa com reward_status REDEEMED

* **Atores:** Usuário Final (PF), Operador de Caixa (Lojista), Sistema (Portal PJ)
* **Objetivo:** Consumir benefício físico/digital de figurinha ou moeda promocional uma única vez.
* **Fluxo Principal:**
  1. Usuário possui figurinha com `has_reward = true` e `reward_status = 'NOT_REDEEMED'`.
  2. PWA exibe QR com `user_stickers.qr_token`.
  3. Operador escaneia via Portal PJ `POST /api/v1/stickers/redeem`.
  4. Backend valida inventário e atualiza para `REDEEMED`.
  5. Segunda tentativa retorna HTTP 409.

### Cenário Gherkin:

```gherkin
Funcionalidade: Queima de cupom no PDV

  Cenário: Queima válida autoriza desconto no caixa
    Dado que o usuário possui figurinha com "reward_status = NOT_REDEEMED"
    E o operador está autenticado no Portal PJ da filial correta
    Quando o operador escanear o QR Code via POST "/api/v1/stickers/redeem"
    Então o backend deve alterar "reward_status" para "REDEEMED"
    E deve retornar HTTP 200 com mensagem de desconto autorizado

  Cenário: Reutilização de cupom já queimado
    Dado que o cupom já possui "reward_status = REDEEMED"
    Quando o operador escanear o mesmo QR Code novamente
    Então o backend deve retornar HTTP 409 Conflict
    E deve exibir "Cupom já utilizado neste estabelecimento"
```

---

## UC07: Emissão e Fracionamento de Moeda Colecionável com Margem 40% e Estoque Redis

* **Atores:** Lojista (PJ), Sistema (Backend/PostgreSQL/Redis)
* **Objetivo:** Emitir lote de moedas colecionáveis a partir do orçamento bruto, aplicando GLOBAL_MARGIN e espelhando estoque em Redis.
* **Fluxo Principal:**
  1. Lojista define orçamento bruto e valor de face por moeda (ex.: R$ 2,00).
  2. Backend lê `GLOBAL_MARGIN = 0.40`; calcula líquido = bruto × 0,60.
  3. Quantidade = floor(líquido / face_value); persiste em `coin_catalogs` e gera `financial_coins`.
  4. Redis: `SET coin:stock:{catalog_id} {quantity}` e `GEOADD active_coins:geo`.
  5. Smart Blending 60/40 aplicado se houver segmentação (RF03).

### Cenário Gherkin:

```gherkin
Funcionalidade: Emissão de moedas colecionáveis com margem da plataforma

  Cenário: Emissão de 300 moedas de face R$ 2,00 a partir de R$ 1.000,00 brutos
    Dado que "GLOBAL_MARGIN" está configurado como 0.40
    E o lojista informa orçamento bruto de R$ 1000.00 e valor de face R$ 2.00
    Quando o backend processar POST "/api/v1/coins/emit"
    Então deve provisionar R$ 400.00 como receita da plataforma
    E o orçamento líquido deve ser R$ 600.00
    E deve criar catálogo com quantidade 300 moedas em "coin_catalogs"
    E deve definir Redis "coin:stock:{catalog_id}" igual a 300
    E deve registrar 300 linhas em "financial_coins" com coordenadas dispersas

  Cenário: Rejeição quando orçamento líquido não cobre uma moeda
    Dado orçamento bruto de R$ 1.00 e face_value de R$ 2.00
    Quando o lojista tentar emitir o lote
    Então o backend deve retornar HTTP 400
    E não deve criar entradas em "coin_catalogs"
```

---

## UC08: Venda P2P de Moeda Rara no Marketplace com Taxa de 10%

* **Atores:** Vendedor (PF), Comprador (PF), Sistema (Backend/PostgreSQL)
* **Objetivo:** Transferir propriedade de moeda colecionável rara com retenção de 10% para a plataforma.
* **Fluxo Principal:**
  1. Vendedor lista moeda em `marketplace_orders` com preço acordado.
  2. Comprador confirma compra; saldo ou Pix interno é reservado.
  3. Backend calcula `platform_fee = preço × 0.10`; `seller_net = preço × 0.90`.
  4. Transação SQL: transfere propriedade, credita vendedor, registra taxa KLIPYT.
  5. Ordem marcada `COMPLETED`.

### Cenário Gherkin:

```gherkin
Funcionalidade: Marketplace P2P de moedas colecionáveis

  Cenário: Venda de moeda rara por R$ 100,00 com taxa de plataforma
    Dado que o vendedor possui moeda rara "catalog_id = ABC" no inventário
    E o comprador possui saldo suficiente na carteira KLIPYT
    Quando o comprador confirmar POST "/api/v1/marketplace/orders" com preço 100.00
    Então o sistema deve registrar "platform_fee = 10.00"
    E deve creditar "90.00" ao vendedor
    E deve transferir a propriedade da moeda para o comprador
    E o status da ordem deve ser "COMPLETED"

  Cenário: Cancelamento se comprador sem saldo
    Dado que o comprador possui saldo R$ 5.00
    Quando tentar comprar moeda listada por R$ 100.00
    Então o backend deve retornar HTTP 402 Payment Required
    E a propriedade da moeda deve permanecer com o vendedor
```

---

## UC09: Reserva e Locação de Outdoor Virtual 3D (B2B)

* **Atores:** Lojista ou Agência (PJ), Sistema (Backend/PostgreSQL)
* **Objetivo:** Reservar painel DOOH virtual em tier Ouro, Prata ou Bronze por período definido.
* **Fluxo Principal:**
  1. Lojista navega mapa de `virtual_billboards` filtrando por `density_tier`.
  2. Seleciona slot disponível e período (início/fim).
  3. Backend calcula preço conforme tier e duração; aplica `GLOBAL_MARGIN` se pacote combinado.
  4. Cria `billboard_rentals` com status `RESERVED` → `ACTIVE` após pagamento.
  5. Criativo 3D (.glb) + vídeo vinculados ao painel para exibição WebAR B2C.

### Cenário Gherkin:

```gherkin
Funcionalidade: Locação de outdoors virtuais 3D para anunciantes B2B

  Cenário: Reserva bem-sucedida de painel tier Ouro por 7 dias
    Dado que existe registro em "virtual_billboards" com "density_tier = OURO" disponível
    E o lojista PJ está autenticado com saldo em "merchant_wallets"
    Quando ele enviar POST "/api/v1/billboards/rent" com duração de 7 dias
    Então o sistema deve criar linha em "billboard_rentals" com status "RESERVED"
    E após confirmação de pagamento deve alterar status para "ACTIVE"
    E o criativo 3D deve ficar disponível para impressões WebAR no período

  Cenário: Conflito de reserva no mesmo período
    Dado que o painel já possui locação ACTIVE no intervalo solicitado
    Quando outro lojista tentar reservar o mesmo "billboard_id" no período sobreposto
    Então o backend deve retornar HTTP 409 Conflict
    E não deve criar segunda locação ativa
```

---

## UC10: Visualização e Interação com Outdoor WebAR ao Ar Livre (B2C)

* **Atores:** Usuário Final (PF), Sistema (PWA WebAR)
* **Objetivo:** Permitir que usuários B2C visualizem e interajam com painéis 3D em coordenadas reais, gerando métricas de engajamento.
* **Fluxo Principal:**
  1. Usuário abre mapa KLIPYT e vê ícones de outdoors ativos próximos (`GEOSEARCH billboards:geo`).
  2. Ao chegar a <= 25m, botão `[ Ver em AR ]` habilita.
  3. PWA carrega modelo 3D do outdoor via WebAR; exibe vídeo patrocinado.
  4. Interações (toque, tempo de visualização) enviadas a `POST /api/v1/billboards/interact`.
  5. Backend incrementa contadores de impressão para faturamento B2B.

### Cenário Gherkin:

```gherkin
Funcionalidade: Experiência B2C de mídia outdoor em WebAR

  Cenário: Visualização de outdoor ativo dentro do raio permitido
    Dado que existe "billboard_rentals" com status ACTIVE para o painel próximo
    E o usuário está a 18 metros de "virtual_billboards.geom"
    Quando ele tocar em "Ver em AR" no PWA
    Então o WebAR deve renderizar o modelo 3D ancorado à coordenada do painel
    E deve reproduzir o vídeo patrocinado configurado pelo anunciante
    E deve registrar POST "/api/v1/billboards/interact" com tipo "IMPRESSION"

  Cenário: Bloqueio de visualização fora do raio de 25 metros
    Dado que o usuário está a 80 metros do painel
    Quando ele tentar abrir a experiência WebAR
    Então o PWA deve manter o botão desabilitado
    E deve exibir mensagem "Aproxime-se do painel para visualizar em AR"
    E não deve registrar impressão faturável
```
"""


db_blueprint_content = """# 🗄️ Blueprint de Banco de Dados Completo — KLIPYT

**Domínio:** https://klipyt.com  
**SGBD:** PostgreSQL 15 + PostGIS 3.3  
**Cache:** Redis 7  

---

## 1. Modelo Relacional PostgreSQL + PostGIS

```sql
-- Extensões obrigatórias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ENUMs de controle de fluxo
CREATE TYPE user_status_enum AS ENUM ('INCOMPLETE', 'VERIFIED', 'BANNED');
CREATE TYPE rarity_enum AS ENUM ('COMMON', 'RARE', 'LEGENDARY');
CREATE TYPE campaign_status_enum AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'FINISHED');
CREATE TYPE reward_status_enum AS ENUM ('NOT_REDEEMED', 'REDEEMED');
CREATE TYPE tx_status_enum AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
CREATE TYPE density_tier_enum AS ENUM ('OURO', 'PRATA', 'BRONZE');
CREATE TYPE rental_status_enum AS ENUM ('RESERVED', 'ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE marketplace_status_enum AS ENUM ('LISTED', 'PENDING', 'COMPLETED', 'CANCELLED');

-- Configurações globais (RN01, RN03, RN04, RN05)
CREATE TABLE platform_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Seeds recomendados:
-- INSERT INTO platform_settings VALUES
-- ('GLOBAL_MARGIN', '0.40'),
-- ('MARKETPLACE_FEE', '0.10'),
-- ('MIN_WITHDRAWAL_BRL', '6.00'),
-- ('MAX_CAPTURE_RADIUS_M', '25'),
-- ('PIX_PROVIDER', '"C6_BANK_BAAS"'),
-- ('SMART_BLEND_QUALIFIED', '0.60'),
-- ('SMART_BLEND_VOLUME', '0.40');

-- Usuários B2C (onboarding progressivo)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT NULL,
    cpf VARCHAR(11) UNIQUE NULL,
    birth_date DATE NULL,
    pix_key VARCHAR(255) NULL,
    faixa_etaria VARCHAR(10) NULL,
    wallet_balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    status user_status_enum DEFAULT 'INCOMPLETE',
    fraud_flag BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_cpf ON users(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX idx_users_status ON users(status);

-- Estabelecimentos comerciais (filiais geocodificadas)
CREATE TABLE establishments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cnpj_root VARCHAR(14) NOT NULL,
    cnpj VARCHAR(14) UNIQUE NOT NULL,
    trade_name VARCHAR(255) NOT NULL,
    address_text TEXT NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_establishments_geom ON establishments USING GIST (geom);
CREATE INDEX idx_establishments_cnpj_root ON establishments(cnpj_root);
CREATE INDEX idx_establishments_active ON establishments(is_active) WHERE is_active = TRUE;

-- Carteira PJ (crédito de orçamento não consumido)
CREATE TABLE merchant_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cnpj_root VARCHAR(14) UNIQUE NOT NULL,
    balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Campanhas publicitárias monetizadas
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
    budget_gross NUMERIC(12, 2) NOT NULL,
    budget_net NUMERIC(12, 2) NOT NULL,
    app_margin_percent NUMERIC(5, 2) DEFAULT 40.00,
    video_url TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    age_restriction INT NULL,
    status campaign_status_enum DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_campaigns_establishment ON campaigns(establishment_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_window ON campaigns(start_time, end_time);

-- Catálogo de emissão de moedas colecionáveis (RF16)
CREATE TABLE coin_catalogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NULL REFERENCES campaigns(id) ON DELETE SET NULL,
    establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    face_value NUMERIC(10, 2) NOT NULL,
    budget_gross NUMERIC(12, 2) NOT NULL,
    budget_net NUMERIC(12, 2) NOT NULL,
    quantity_issued INT NOT NULL,
    rarity rarity_enum DEFAULT 'COMMON',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_coin_catalogs_establishment ON coin_catalogs(establishment_id);
CREATE INDEX idx_coin_catalogs_campaign ON coin_catalogs(campaign_id);

-- Moedas financeiras / colecionáveis georreferenciadas
CREATE TABLE financial_coins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    catalog_id UUID NULL REFERENCES coin_catalogs(id) ON DELETE SET NULL,
    value NUMERIC(10, 2) NOT NULL,
    is_qualified BOOLEAN DEFAULT FALSE,
    geom GEOMETRY(Point, 4326) NOT NULL,
    owner_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    collected_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    collected_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_financial_coins_geom ON financial_coins USING GIST (geom);
CREATE INDEX idx_financial_coins_campaign ON financial_coins(campaign_id);
CREATE INDEX idx_financial_coins_catalog ON financial_coins(catalog_id);
CREATE INDEX idx_financial_coins_owner ON financial_coins(owner_user_id);

-- Outdoors virtuais 3D DOOH (RF15)
CREATE TABLE virtual_billboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID NULL REFERENCES establishments(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    density_tier density_tier_enum NOT NULL DEFAULT 'PRATA',
    model_glb_url TEXT NOT NULL,
    creative_video_url TEXT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_virtual_billboards_geom ON virtual_billboards USING GIST (geom);
CREATE INDEX idx_virtual_billboards_tier ON virtual_billboards(density_tier);

-- Locações de outdoors (B2B)
CREATE TABLE billboard_rentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    billboard_id UUID NOT NULL REFERENCES virtual_billboards(id) ON DELETE CASCADE,
    merchant_cnpj_root VARCHAR(14) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    price_paid NUMERIC(12, 2) NOT NULL,
    status rental_status_enum DEFAULT 'RESERVED',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_billboard_rentals_billboard ON billboard_rentals(billboard_id);
CREATE INDEX idx_billboard_rentals_window ON billboard_rentals(billboard_id, start_time, end_time);
CREATE INDEX idx_billboard_rentals_merchant ON billboard_rentals(merchant_cnpj_root);

-- Catálogo de figurinhas / cards colecionáveis
CREATE TABLE stickers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
    sticker_number INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    page_number INT NOT NULL,
    rarity rarity_enum DEFAULT 'COMMON',
    image_url TEXT NOT NULL,
    has_reward BOOLEAN DEFAULT FALSE,
    reward_description TEXT NULL,
    reward_code VARCHAR(50) NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_sticker_number UNIQUE (establishment_id, sticker_number)
);
CREATE INDEX idx_stickers_establishment ON stickers(establishment_id);
CREATE INDEX idx_stickers_rarity ON stickers(rarity);

-- Inventário de figurinhas por usuário
CREATE TABLE user_stickers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sticker_id UUID NOT NULL REFERENCES stickers(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1 NOT NULL,
    is_glued BOOLEAN DEFAULT FALSE,
    reward_status reward_status_enum DEFAULT 'NOT_REDEEMED',
    qr_token VARCHAR(255) UNIQUE NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_user_sticker UNIQUE (user_id, sticker_id)
);
CREATE INDEX idx_user_stickers_user ON user_stickers(user_id);
CREATE INDEX idx_user_stickers_reward ON user_stickers(reward_status);

-- Histórico unificado de coletas (rate limiting 24h)
CREATE TABLE unified_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
    asset_type VARCHAR(30) NOT NULL,
    asset_id UUID NULL,
    collected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_unified_collections_rate ON unified_collections(user_id, establishment_id, asset_type, collected_at DESC);

-- Transações de carteira e saques Pix C6
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    status tx_status_enum DEFAULT 'PENDING',
    pix_provider VARCHAR(50) DEFAULT 'C6_BANK_BAAS',
    end_to_end_id VARCHAR(255) NULL,
    processed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_status ON wallet_transactions(status);

-- Ordens do marketplace P2P (RN03 — 10% fee)
CREATE TABLE marketplace_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buyer_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    coin_id UUID NOT NULL REFERENCES financial_coins(id) ON DELETE CASCADE,
    list_price NUMERIC(12, 2) NOT NULL,
    platform_fee NUMERIC(12, 2) NOT NULL,
    seller_net NUMERIC(12, 2) NOT NULL,
    status marketplace_status_enum DEFAULT 'LISTED',
    completed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_marketplace_orders_seller ON marketplace_orders(seller_id);
CREATE INDEX idx_marketplace_orders_buyer ON marketplace_orders(buyer_id);
CREATE INDEX idx_marketplace_orders_status ON marketplace_orders(status);
CREATE INDEX idx_marketplace_orders_coin ON marketplace_orders(coin_id);
```

---

## 2. Topologia Redis (KLIPYT)

| Chave / Padrão | Tipo | TTL | Descrição |
|----------------|------|-----|-----------|
| `active_coins:geo` | GEO | Até fim da campanha | Moedas ativas no mapa. `GEOADD active_coins:geo {lon} {lat} {coin_id}` |
| `billboards:geo` | GEO | Vigência da locação | Outdoors virtuais ativos para WebAR B2C |
| `coin:stock:{catalog_id}` | String (INT) | Até esgotar | Estoque restante da emissão UC07 |
| `campaign:{id}:meta` | Hash | Até fim da campanha | `budget_net`, `age_restriction`, `is_qualified` |
| `video:token:{user_id}:{coin_id}` | String | 300s | Autorização pós-vídeo antes da captura WebAR |
| `rate:cpf:{cpf}:est:{establishment_id}:coin` | String | 86400s | RN05 — 1 moeda financeira / 24h / filial |
| `rate:cpf:{cpf}:est:{establishment_id}:pack` | String | 86400s | RN05 — 2 pacotes / 24h / filial |
| `marketplace:lock:{coin_id}` | String | 60s | Lock otimista na compra P2P UC08 |
| `billboard:impressions:{rental_id}` | String (INT) | 30 dias | Contador de impressões WebAR UC10 |
| `session:jwt:blacklist:{jti}` | String | Expiração JWT | Revogação de tokens |

**Fluxo mapa (UC04):** `GEOSEARCH active_coins:geo FROMLONLAT {lon} {lat} BYRADIUS 5 km` → filtro `is_qualified` + `age_restriction` → JSON PWA.

**Fluxo emissão (UC07):** Transação SQL em `coin_catalogs` + `financial_coins` → `SET coin:stock:{catalog_id}` + `GEOADD` em lote.

**Fluxo marketplace (UC08):** `SET marketplace:lock:{coin_id} NX EX 60` → débito/crédito → `DEL lock` → status `COMPLETED`.
"""


infra_content = """# 🐳 Engenharia de Infraestrutura Local — KLIPYT (Docker Compose)

**Domínio:** https://klipyt.com  
**PostgreSQL host:** `localhost:5433` (mapeamento para 5432 no container)  

---

## docker-compose.yml

```yaml
version: '3.8'

services:
  postgres_db:
    image: postgis/postgis:15-3.3-alpine
    container_name: klipyt_db
    restart: always
    ports:
      - "5433:5432"
    environment:
      POSTGRES_USER: klipyt_admin
      POSTGRES_PASSWORD: klipyt_strong_password
      POSTGRES_DB: klipyt_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U klipyt_admin -d klipyt_prod"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis_cache:
    image: redis:7-alpine
    container_name: klipyt_redis
    restart: always
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

---

## Variáveis de conexão recomendadas (.env)

| Variável | Valor local |
|----------|-------------|
| `DATABASE_URL` | `postgresql://klipyt_admin:klipyt_strong_password@localhost:5433/klipyt_prod` |
| `REDIS_URL` | `redis://localhost:6379` |
| `APP_DOMAIN` | `https://klipyt.com` |

---

## Comandos úteis

```bash
docker compose up -d
docker compose ps
docker exec -it klipyt_db psql -U klipyt_admin -d klipyt_prod -c "SELECT PostGIS_Version();"
docker exec -it klipyt_redis redis-cli PING
```
"""


arquivos = {
    "BRD.md": brd_content,
    "USE_CASES.md": use_cases_content,
    "DATABASE_BLUEPRINT.md": db_blueprint_content,
    "INFRASTRUCTURE.md": infra_content,
}

_impl_prompt_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "IMPLEMENTATION_PROMPT.md")
if os.path.isfile(_impl_prompt_path):
    with open(_impl_prompt_path, encoding="utf-8") as f:
        arquivos["IMPLEMENTATION_PROMPT.md"] = f.read()

print("Iniciando a geração automática de documentos mestres KLIPYT...")

for nome, conteudo in arquivos.items():
    try:
        with open(nome, "w", encoding="utf-8") as f:
            f.write(conteudo.strip())
        print(f"Arquivo criado com sucesso: {nome}")
    except OSError as e:
        print(f"Falha ao criar o arquivo {nome}. Motivo: {e}")

print("\nProcessamento concluído. Documentos disponíveis na raiz do repositório para o Cursor.")
