# 🚀 Casos de Uso Técnicos (Use Cases) — Pix GO

## UC01: Login Simplificado e Onboarding Progressivo (Fase 1 - Álbum)
* **Atores:** Usuário Final (PF), Sistema, Google OAuth 2.0
* **Objetivo:** Permitir a entrada imediata do usuário usando apenas a conta Google para a fase promocional do álbum.
* **Fluxo Principal:**
  1. O usuário abre o PWA e clica em `[ Entrar com o Google ]`.
  2. O sistema executa o fluxo nativo do Google OAuth e retorna o `email`, `full_name` e `avatar_url`.
  3. O backend verifica se o e-mail já existe na tabela de usuários.
  4. Se não existir: Cria o registro com `status = 'INCOMPLETE'` e mantém campos como `cpf`, `birth_date` e `pix_key` como `NULL`.
  5. O sistema gera e retorna um token JWT de autenticação.
  6. O PWA libera o acesso à aba do Álbum e à caça de pacotes.

### Cenário Gherkin:
```gherkin
Cenário: Primeiro login com conta Google para o Álbum da Copa
  Dado que o usuário clica em "Entrar com o Google"
  Quando o OAuth retornar o e-mail "usuario@gmail.com"
  Então o backend deve criar o registro na tabela "users" com "status = INCOMPLETE"
  E deve deixar os campos "cpf", "birth_date" e "pix_key" como NULL
  E deve permitir o acesso completo à aba do Álbum e à caça de pacotes
```

---

## UC02: Upgrade de Conta para Recebimento de Pix (Fase 2)
* **Atores:** Usuário Final (PF), Sistema, API de Bureau de Dados
* **Objetivo:** Capturar e validar os dados de identidade para transição do usuário para o ecossistema financeiro.
* **Fluxo Principal:**
  1. O usuário (com status `INCOMPLETE`) clica em "Ativar Modo Pix Real".
  2. O PWA exibe o formulário solicitando CPF e a Chave Pix (obrigatoriamente tipo CPF).
  3. O usuário submete os dados.
  4. O backend consome a API do Bureau de Dados enviando o CPF.
  5. A API do Bureau retorna a data de nascimento oficial.
  6. O backend calcula a idade: se for menor de idade, aborta com erro. Se maior de idade, calcula a tag de faixa etária correspondente (ex: `35+`).
  7. O backend atualiza o usuário na tabela para `status = 'VERIFIED'`.
  8. O endpoint do mapa passa a injetar as moedas de dinheiro real para o dispositivo.

### Cenário Gherkin:
```gherkin
Cenário: Usuário do álbum tentando migrar para a conta Pix Real com sucesso
  Dado que o usuário possui "status = INCOMPLETE" e está logado via Gmail
  Quando ele submeter o formulário com o CPF "111.222.333-44" e Chave Pix correspondente
  Então o backend deve validar o CPF no Bureau de dados e calcular a idade real
  E se a idade for válida e maior de 18 anos, atualizar o status do banco para "VERIFIED"
  E liberar a visualização de moedas de dinheiro real no endpoint do mapa
```

---

## UC03: Cadastro de Estabelecimentos em Lote via CNPJ (B2B)
* **Atores:** Lojista (PJ), Sistema, API Receita Federal, API Geocoding
* **Objetivo:** Permitir que grandes redes cadastrem todas as suas filiais de forma automática e instantânea (RF01).
* **Fluxo Principal:**
  1. O lojista acessa o Portal PJ e digita o CNPJ da Matriz.
  2. O backend intercepta o pedido e consome a API da Receita Federal.
  3. O sistema recupera a lista de endereços comerciais de todas as filiais ligadas àquela raiz cadastral.
  4. Para cada endereço, o backend dispara geocoding (OpenStreetMap/Google) obtendo Latitude e Longitude.
  5. O sistema persiste cada filial em `establishments` com `cnpj_root` (matriz), `cnpj` (filial) e `geom` PostGIS `GEOMETRY(Point, 4326)`.
  6. O lojista visualiza checkboxes e seleciona quais filiais participarão da plataforma.

### Cenário Gherkin:
```gherkin
Cenário: Buscar filiais e converter endereço em par geométrico no PostGIS
  Dado que o lojista insere o CNPJ da matriz da "Castelo Forte"
  Quando a API da Receita retornar as filiais com seus respectivos endereços
  Então o sistema deve chamar o Geocoding para transformar os endereços textuais em Lat/Lon
  E deve salvar no PostGIS usando ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
  E deve criar o índice GIST na tabela establishments
```

---

## UC04: Upload e Validação de Vídeos Promocionais de 30 Segundos (B2B)
* **Atores:** Lojista (PJ), Sistema (Backend/FFmpeg), Cloudflare R2
* **Objetivo:** Garantir a consistência e o tempo estrito do anúncio em vídeo enviado pelo lojista.
* **Fluxo Principal:**
  1. No painel de agendamento, o lojista faz o upload de um arquivo de vídeo vertical.
  2. O frontend limita o payload em no máximo 15MB.
  3. O backend recebe o arquivo e o armazena temporariamente em uma pasta local na VPS Hetzner.
  4. O backend executa o utilitário `ffprobe` do FFmpeg para inspecionar os metadados do arquivo.
  5. O sistema valida o tempo: se a duração for menor que 15 segundos ou maior que 30 segundos, o arquivo é deletado do disco e a operação falha.
  6. Se aprovado, o backend envia o arquivo via stream para o bucket do Cloudflare R2 e persiste a URL pública na tabela de campanhas.

### Cenário Gherkin:
```gherkin
Cenário: Lojista tenta subir vídeo com 45 segundos de duração
  Dado que o lojista está autenticado no Portal PJ
  Quando ele enviar um arquivo de vídeo para a rota POST "/campaign/upload-video"
  E o FFmpeg analisar os metadados e retornar "duration = 45.2"
  Então o backend deve apagar o arquivo temporário imediatamente
  E deve retornar o status HTTP 400 Bad Request com a mensagem "O vídeo não pode ter mais de 30 segundos."

Cenário: Upload de vídeo válido e persistência no Cloudflare R2
  Dado que o lojista envia um vídeo vertical de 20 segundos e tamanho de 8MB
  Quando o backend validar que a duração está entre 15 e 30 segundos
  Então o sistema deve fazer o upload do arquivo para o bucket do Cloudflare R2 e apagar o temporário
  E deve retornar o status HTTP 200 com a URL do vídeo mapeada
```

---

## UC05: Criação de Campanha com Divisão Híbrida Inteligente (Smart Blending)
* **Atores:** Lojista (PJ), Sistema (Backend/Redis/PostgreSQL)
* **Objetivo:** Processar o aporte financeiro aplicando a retenção da plataforma (RN01) e dividindo as moedas na regra 60/40 (RF03).
* **Pré-condições:** Lojista com vídeo válido cadastrado via UC04 e filial selecionada em `establishments`.
* **Fluxo Principal:**
  1. O lojista define orçamento bruto de R$ 1.000,00, janela horária (máx. 6h) e filtro de público "35+".
  2. O backend lê `GLOBAL_MARGIN` (40%) em `platform_settings` e retém R$ 400,00 para a plataforma.
  3. Sobre os R$ 600,00 líquidos: 60% (R$ 360,00) → 120 moedas de R$ 3,00 com `is_qualified = true` (internas).
  4. 40% (R$ 240,00) → 480 moedas de R$ 0,50 com `is_qualified = false` (fachada/calçada).
  5. O sistema gera coordenadas de dispersão no entorno do PDV e persiste em `financial_coins` e `campaigns` com status `ACTIVE`.
  6. O backend espelha os pontos no Redis via `GEOADD active_coins:geo {longitude} {latitude} {coin_id}` com TTL até `end_time`.

### Cenário Gherkin:
```gherkin
Cenário: Divisão de orçamento de campanha segmentada
  Dado que o lojista cria uma campanha com Orçamento Bruto de R$ 1000,00 e restrição de idade 35+
  Quando o backend processar a criação via POST "/api/v1/campaigns"
  Então deve reter R$ 400,00 na receita da plataforma conforme GLOBAL_MARGIN
  E deve gerar 120 moedas de R$ 3,00 com "is_qualified = true" em financial_coins e Redis
  E deve gerar 480 moedas de R$ 0,50 com "is_qualified = false" em financial_coins e Redis
```

---

## UC06: Renderização do Mapa com Filtro de Visibilidade Oculto
* **Atores:** Usuário Final (PF), Sistema (Backend/Redis/PostGIS)
* **Objetivo:** Proteger a integridade visual do mapa escondendo ativos premium de usuários fora do público-alvo.
* **Fluxo Principal:**
  1. O usuário abre o PWA. O GPS envia a coordenada atual para o endpoint HTTP `GET /map/coins`.
  2. O backend extrai o ID do usuário do JWT e verifica seu status e idade.
  3. O backend executa `GEOSEARCH active_coins:geo` (ou `GEORADIUS`) num raio de 5 km a partir da coordenada do usuário.
  4. O sistema filtra os dados: se a moeda mapeada pertencer a uma campanha qualificada (ex: 35+) e o usuário tiver idade menor, o registro é omitido do JSON.
  5. O PWA recebe o payload limpo e renderiza moedas normais como Bronze e qualificadas como Baús de Ouro.

### Cenário Gherkin:
```gherkin
Cenário: Usuário jovem tentando ver mapa de região com campanha qualificada
  Dado que o usuário logado possui 20 anos de idade
  E está localizado nas coordenadas da calçada da Castelo Forte
  Quando o PWA requisitar a lista de moedas próximas via HTTP GET "/map/coins"
  Então o backend deve ocultar todas as moedas onde "qualificada = true" e "restricao_idade = 35"
  E deve retornar no JSON apenas as moedas de Bronze (camada de volume de R$ 0,50)
```

---

## UC07: Validação de Vídeo e Captura Segura com Antifraude Triplo (WebAR + PostGIS)
* **Atores:** Usuário Final (PF), Sistema (PWA/Backend/PostGIS/Redis)
* **Objetivo:** Validar vídeo, distância real e integridade do payload conforme RN04 (três camadas).
* **Fluxo Principal:**
  1. **Camada 1 (PWA):** Antes de renderizar o mapa, o JavaScript detecta `mocked` no objeto de geolocalização; se verdadeiro, bloqueia a UI.
  2. O usuário clica em uma moeda dentro do raio de 25 metros, assiste ao vídeo em tela cheia até `onEnded`.
  3. O backend valida o tempo assistido e emite token temporário em Redis (`video:token:{user_id}:{coin_id}`).
  4. A câmera abre em WebAR; o usuário toca na moeda 3D.
  5. **Camada 2 (Payload):** O PWA envia `POST /api/v1/campaigns/collect` com coordenadas e hash `HMAC(ID_Usuario + ID_Moeda + Timestamp_Milissegundos)`.
  6. **Camada 3 (RN03):** O backend consulta `unified_collections` — máximo 1 coleta `FINANCIAL_COIN` por CPF/filial/24h.
  7. O backend executa `ST_Distance` entre o GPS enviado e `financial_coins.geom` (coordenada autoritativa; Redis é cache de consulta).
  8. Se distância <= 25m: credita `users.wallet_balance`, registra `unified_collections`, remove moeda do Redis e marca `financial_coins.collected_by`.
  9. Se distância > 25m: HTTP 403, `users.fraud_flag = true` e bloqueio preventivo de saques.

### Cenário Gherkin:
```gherkin
Cenário: Tentativa de coleta violando a distância de segurança (Fake GPS)
  Dado que o usuário envia uma requisição de coleta para a rota POST "/campaign/collect"
  Quando o PostGIS processar a função ST_Distance e o resultado der 300 metros de divergência
  Então o backend deve recusar o computo do saldo retornando HTTP 403 Forbidden
  E deve marcar o CPF do usuário com uma flag de suspeita de fraude no banco de dados

Cenário: Coleta legítima dentro do raio de tolerância de 25 metros
  Dado que o usuário assistiu o vídeo promocional até o evento onEnded
  E a coordenada GPS enviada está a 12 metros da moeda registrada em financial_coins
  Quando o backend executar ST_Distance e o resultado for menor ou igual a 25 metros
  E o CPF não tiver coleta na mesma filial nas últimas 24 horas
  Então o sistema deve creditar o valor da moeda em users.wallet_balance
  E deve registrar a coleta na tabela unified_collections com asset_type FINANCIAL_COIN

Cenário: PWA bloqueia dispositivo com Mock GPS ativo
  Dado que o navegador reporta coordenada com flag mocked igual a true
  Quando o usuário tentar abrir o mapa de moedas
  Então o PWA deve bloquear a renderização do mapa imediatamente
  E não deve enviar requisição de coleta ao backend
```

---

## UC08: Abertura de Pacotes de Figurinhas com Probabilidade 70/25/5
* **Atores:** Usuário Final (PF), Sistema (Backend/PostGIS)
* **Objetivo:** Distribuir pacotes georreferenciados contendo 3 figurinhas aleatórias respeitando a matriz de raridade oficial (RF11).
* **Fluxo Principal:**
  1. O usuário se desloca até um ponto em `sticker_packs` (espelhado em `active_packs:geo` no Redis).
  2. O sistema valida geofencing de 25m (mesma lógica espacial do UC07) e rate limiting de 2 pacotes/CPF/filial/24h.
  3. O usuário confirma "Rasgar Pacote Grátis" via `POST /api/v1/album/open-pack`.
  4. O backend executa três sorteios: Comum 70%, Rara 25%, Lendária 5%.
  5. Para cada slot, seleciona figurinha em `stickers` da filial com a raridade sorteada.
  6. Persiste em `user_stickers` e registra `unified_collections` com `asset_type = 'STICKER_PACK'`.
  7. Se Rara/Lendária com `has_reward = true`, gera `qr_token` e exibe cupom PDV.

### Cenário Gherkin:
```gherkin
Cenário: Abertura de pacote respeitando distribuição probabilística oficial
  Dado que o usuário está a menos de 25 metros do ponto de coleta do estabelecimento
  E não ultrapassou o limite de 2 pacotes nas últimas 24 horas na mesma filial
  Quando ele confirmar a abertura do pacote no PWA
  Então o backend deve sortear 3 figurinhas aplicando pesos de 70% COMMON, 25% RARE e 5% LEGENDARY
  E deve persistir os cards em "user_stickers"
  E deve registrar "asset_type = STICKER_PACK" em "unified_collections"

Cenário: Bloqueio por rate limiting de pacotes diários
  Dado que o usuário já coletou 2 pacotes no estabelecimento "Castelo Forte" nas últimas 24 horas
  Quando ele tentar abrir um terceiro pacote no mesmo local
  Então o backend deve retornar HTTP 429 Too Many Requests
  E deve exibir a mensagem de limitação temporal por CPF
```

---

## UC09: Queima de Cupom de Figurinha no Caixa (PDV)
* **Atores:** Usuário Final (PF), Operador de Caixa (Lojista), Sistema (Portal PJ/Backend)
* **Objetivo:** Validar e consumir de forma única o benefício físico associado a figurinhas Raras ou Lendárias (RF12).
* **Fluxo Principal:**
  1. O usuário captura figurinha Rara/Lendária com `has_reward = true` no PWA.
  2. O sistema exibe cupom digital com QR Code único (`user_stickers.qr_token`).
  3. O operador escaneia no Portal PJ via `POST /api/v1/stickers/redeem`.
  4. O backend valida inventário, `reward_status = 'NOT_REDEEMED'` e atualiza para `REDEEMED`.
  5. Tentativas subsequentes retornam HTTP 409.

### Cenário Gherkin:
```gherkin
Cenário: Queima válida de cupom de figurinha rara no PDV
  Dado que o usuário possui a figurinha "Neymar #10" com "reward_status = NOT_REDEEMED"
  E o operador de caixa está autenticado no Portal PJ
  Quando o operador escanear o QR Code único do cupom digital
  Então o backend deve validar a existência da figurinha no inventário do usuário
  E deve alterar o "reward_status" para "REDEEMED"
  E deve retornar HTTP 200 com mensagem de autorização de desconto de 15%

Cenário: Tentativa de reutilizar cupom já queimado
  Dado que o cupom da figurinha já possui "reward_status = REDEEMED"
  Quando o operador escanear novamente o mesmo QR Code
  Então o backend deve retornar HTTP 409 Conflict
  E deve exibir a mensagem "Cupom já utilizado neste estabelecimento"
```

---

## UC10: Protocolo de Troca Local de Repetidas por PIN (Redis Gateway)
* **Atores:** Usuário A (Ofertante), Usuário B (Receptor), Sistema (Backend/Redis)
* **Objetivo:** Transferir figurinhas repetidas com PIN de 4 dígitos e validação de proximidade (RF13).
* **Fluxo Principal:**
  1. Usuário A seleciona figurinha com `quantity > 1` e aciona "Trocar Localmente".
  2. Backend gera PIN (ex: 8530) e grava Hash Redis `trade:pin:8530` com `sender_id`, `sticker_id`, `lat`, `lon` e `EXPIRE 120`.
  3. Usuário B digita o PIN; backend executa `HGETALL trade:pin:{pin}`.
  4. Se expirado: HTTP 410 Gone. Se distância entre A e B > 25m: HTTP 403.
  5. Se válido: `DEL trade:pin:{pin}`, decrementa `user_stickers` de A, incrementa de B em transação SQL.

### Cenário Gherkin:
```gherkin
Cenário: Troca local bem-sucedida com PIN válido e proximidade confirmada
  Dado que o Usuário A gerou o PIN "8530" com figurinha repetida e coordenadas válidas
  E o Usuário B está a 10 metros do Usuário A
  Quando o Usuário B submeter o PIN via POST "/api/v1/album/trade/confirm-pin"
  Então o backend deve transferir a propriedade entre user_stickers
  E deve remover a chave Redis trade:pin:8530
  E deve retornar HTTP 200

Cenário: PIN expirado após 120 segundos
  Dado que o PIN "8530" foi criado há mais de 120 segundos
  Quando o Usuário B tentar confirmar a troca
  Então o backend deve retornar HTTP 410 Gone com mensagem "Código de troca expirado"
```

---

## UC11: Processamento de Saque Automatizado via API Pix (Wallet)
* **Atores:** Usuário Final (PF), Sistema, API do Banco Parceiro (Gateway Pix)
* **Objetivo:** Realizar a transferência instantânea de fundos sem custos para o usuário ao atingir a barreira de corte.
* **Fluxo Principal:**
  1. O usuário acessa a carteira digital no PWA.
  2. O sistema valida se o saldo acumulado é >= R$ 6,00. Se verdadeiro, habilita o botão de saque.
  3. O usuário clica em "Sacar via Pix".
  4. O backend abre uma transação SQL isolada, debita o valor do saldo do usuário e altera o status da transação para `PENDING`.
  5. O backend dispara uma chamada interna para a API Pix do banco digital parceiro, enviando o valor exato e a chave Pix (que obrigatoriamente é o CPF do usuário).
  6. O banco liquida o Pix e o Webhook do sistema recebe a confirmação de sucesso, alterando o status no banco de dados para `COMPLETED`.

### Cenário Gherkin:
```gherkin
Cenário: Solicitação de saque com saldo válido
  Dado que o usuário possui R$ 8,50 de saldo disponível e chave Pix CPF cadastrada
  Quando ele clicar no botão "Sacar via Pix"
  Então o sistema deve debitar R$ 8,50 da carteira e mover o estado para PENDING
  E deve disparar a chamada de endpoint para a API Pix do C6 Bank
  E ao receber o Webhook de sucesso do banco, consolidar o status como COMPLETED na tabela wallet_transactions

Cenário: Bloqueio de saque abaixo do valor mínimo de R$ 6,00
  Dado que o usuário possui R$ 4,20 de saldo disponível na carteira
  Quando ele tentar acessar a função de saque via Pix
  Então o PWA deve exibir o botão de saque bloqueado com ícone de cadeado
  E o backend não deve iniciar nenhuma transação na API Pix
```

---

## UC12: Dashboard de Fechamento Auditado Pós-Campanha (Analytics)
* **Atores:** Lojista (PJ), Sistema (Backend/PostgreSQL)
* **Objetivo:** Consolidar métricas reais após encerramento da janela horária da campanha (RF04).
* **Fluxo Principal:**
  1. Ao transicionar campanha para `FINISHED`, o backend agrega dados de `unified_collections`, `financial_coins` e reproduções de vídeo.
  2. Calcula orçamento consumido, visitas únicas por CPF, CPV (orçamento bruto / CPFs validados).
  3. Calcula retenção de vídeo (% assistiu até o fim) e tempo médio de permanência no raio do PDV.
  4. Valores não coletados retornam como crédito em `merchant_wallets` da matriz CNPJ.
  5. O Portal PJ exibe relatório exportável em PDF/CSV.

### Cenário Gherkin:
```gherkin
Cenário: Relatório pós-campanha com devolução de saldo não consumido
  Dado que a campanha "Castelo Forte Sábado" encerrou com status FINISHED
  E restaram R$ 120,00 em moedas não coletadas no lastro da campanha
  Quando o lojista acessar o dashboard POST "/api/v1/campaigns/{id}/analytics"
  Então o sistema deve creditar R$ 120,00 em merchant_wallets da matriz CNPJ
  E deve exibir CPV, visitas únicas validadas e gráfico de retenção de vídeo
```