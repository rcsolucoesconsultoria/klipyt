# 📑 Documento de Especificação de Regras de Negócio (BRD) — KLIPYT

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
$$\text{Orçamento Líquido} = \text{Orçamento Bruto} \times (1 - \text{GLOBAL\_MARGIN})$$
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