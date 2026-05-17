# 🚀 Casos de Uso Técnicos (Use Cases) — KLIPYT

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