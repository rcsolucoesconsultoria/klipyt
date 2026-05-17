import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Conteúdo do arquivo BRD.md
brd_content = """# 📑 Documento de Especificação de Regras de Negócio (BRD) — Pix GO
**Projeto:** Pix GO  
**Versão:** 2.0.0  
**Data da Especificação:** 17 de Maio de 2026  
**Status:** Homologado para Desenvolvimento Completo  

---

## 1. Visão Geral do Produto e Objetivos Estratégicos
O **Pix GO** é uma plataforma multitenant de Live Marketing Georreferenciado e engajamento móvel baseada em dados (*Drive-to-Store*), operando sob o modelo de Progressive Web App (PWA) com recursos de Realidade Aumentada (WebAR).

O ecossistema atua na intersecção entre o mercado publicitário de alta conversão (B2B) e a economia de recompensas gamificadas (*Play-to-Earn* / B2C). O objetivo central é direcionar fluxos massivos e controlados de pessoas físicas para pontos de venda (PDV) específicos em janelas de tempo pré-determinadas (horários de pico ou ociosidade), utilizando incentivos de valor imediato e liquidez instantânea por meio do Arranjo de Pagamentos Pix do Banco Central do Brasil.

---

## 2. Modelagem Financeira e Lógica de Monetização

### RN01 - Taxa de Retenção da Plataforma (Take Rate)
A plataforma adota uma política de precificação baseada em retenção bruta na origem do orçamento publicitário (*Budget*).
* **Percentual Fixo:** A plataforma retém, por padrão, **40% (quarenta por cento)** sobre o valor total bruto de qualquer campanha contratada pelo lojista.
* **Fórmula de Distribuição:**
$$\\text{Orçamento Líquido da Campanha} = \\text{Orçamento Bruto} \\times (1 - \\text{GLOBAL\\_MARGIN})$$
* **Exemplo de Aplicação:** Em um aporte bruto de R$ 1.000,00 realizado pela empresa contratante, R$ 400,00 são imediatamente provisionados como receita líquida da plataforma (taxa de intermediação e uso tecnológico), enquanto R$ 600,00 são integralmente convertidos em lastro financeiro para as recompensas geolocalizadas na rua.
* **Configuração:** Este percentual é uma variável global e dinâmica (`GLOBAL_MARGIN`), mutável exclusivamente através do Painel Administrativo Master. Alterações nesta variável afetam apenas campanhas criadas após a modificação, preservando o histórico financeiro imutável de campanhas ativas ou encerradas.

### RN02 - Arquitetura de Desembolso Sem Custo (Zero-Fee Payout)
Para viabilizar a distribuição de prêmios de baixo valor nominal (a partir de R$ 0,50) sem inviabilizar a operação através de taxas bancárias por transação, o sistema adota as seguintes diretrizes:
* **Integração via API Pix Dedicada:** O ecossistema conecta-se nativamente à **API Pix C6 Bank BaaS** utilizando credenciais PJ, webhooks de recebimento e liquidação assíncrona na URL pública do Pix GO.
* **Liquidação Assíncrona:** As transações de saque dos usuários não passam por processamento manual. Ao atingirem os critérios de resgate, o backend dispara uma requisição de pagamento síncrona com o gateway bancário via TLS 1.3, atualizando o saldo do usuário para o estado "Liquidado" apenas após o recebimento do Webhook de confirmação (fim do ciclo do Pix no Banco Central).

---

## 3. Módulo B2B: Portal do Lojista (Tenant)

### RF01 - Integração Cadastral Expressa via API CNPJ
Visando reduzir drasticamente a fricção de entrada de grandes redes e estabelecimentos tradicionais, o Portal PJ elimina o preenchimento manual de dados de filiais.
* **Automação Cadastral:** O lojista insere unicamente o CNPJ da matriz da empresa. O sistema consome uma API de dados da Receita Federal em tempo real para extrair a Razão Social, Nome Fantasia e a listagem integral de filiais ativas indexadas sob aquela raiz cadastral.
* **Geocodificação Automática (Geocoding):** O backend submete a string de endereço de cada filial retornada pela Receita Federal a uma API de mapas geográfica (OpenStreetMap/Google Maps API). O sistema converte automaticamente os endereços textuais em dados geométricos estruturados (Latitude e Longitude no padrão WGS84) e os armazena na tabela de estabelecimentos. O lojista apenas visualiza a lista e marca caixas de seleção (*checkboxes*) para decidir quais filiais participarão da plataforma.

### RF02 - Motor de Agendamento Sazonal de Fluxo (Peak-Hour Scheduler)
O lojista gerencia a atração de público através de um configurador de janelas de tempo, programando os disparos para momentos de baixa conversão urbana ou grandes lançamentos.
* **Parâmetros Obrigatórios da Campanha:**
  * Orçamento Bruto Alocado (Campo monetário em Real).
  * Data de Ativação e Janela Horária Restrita (Horário de início e horário de término, limitados ao máximo de 6 horas por campanha diária).
  * Upload de Mídia Promocional: Vídeo vertical (proporção 9:16) com codec H.264/MPEG-4, com duração mínima estrita de 15 segundos e máxima de 30 segundos, limitado ao tamanho de arquivo de 15MB.
* **Ocultação de Métrica Unitária:** Na interface de compra do lojista, o custo fixo unitário por visitante é ocultado. O lojista compra impacto agregado baseado em orçamento global, evitando que estabeleça barreiras psicológicas baseadas em preço por pessoa.

### RF03 - Algoritmo de Tráfego Híbrido Dinâmico (Smart Blending)
Quando o lojista decide aplicar um filtro de segmentação de público (ex: Construtora imobiliária buscando público comprador qualificado), o sistema ativa obrigatoriamente a divisão automática de orçamento para garantir tráfego híbrido na loja, baseado na regra $60/40$:
* **Camada de Conversão (60% do Orçamento Líquido):** Destinado estritamente ao público que atende ao critério de segmentação do lojista (ex: idade igual ou superior a 35 anos). O sistema distribui esses fundos em moedas de alto valor nominal (ex: R$ 2,00 a R$ 5,00) posicionadas geograficamente **dentro** do estabelecimento ou plantão de vendas.
* **Camada de Volume e Prova Social (40% do Orçamento Líquido):** Destinado ao público geral (usuários mais jovens ou fora do perfil direto). O sistema distribui esses fundos em uma densidade massiva de moedas de baixo valor nominal (ex: R$ 0,25 a R$ 0,50) posicionadas geograficamente na **fachada, calçada ou estacionamento** do local. Essa camada tem o objetivo explícito de gerar aglomeração física imediata, ativando o gatilho mental da prova social para quem transita na região.

### RF04 - Dashboard de Fechamento Auditado (Post-Campaign Analytics)
Concluída a janela de horário da campanha, o painel do lojista consolida as métricas reais de engajamento em um relatório pós-evento:
* **Métricas Exibidas:**
  * Orçamento Total Consumido (Valores não coletados retornam como crédito para a carteira PJ do lojista).
  * Contagem Real de Visitas Únicas Validadas (Check-ins concluídos por CPF).
  * **Custo Médio por Visita Efetiva (CPV):** Calculado dividindo o Orçamento Bruto Total Consumido pelo número de CPFs validados na loja.
  * Gráfico de Retenção de Vídeo: Percentual de usuários que assistiram ao vídeo promocional por completo.
  * Tempo Médio de Permanência: Janela temporal calculada entre a abertura da câmera no local e a saída do raio geográfico do PDV.

---

## 4. Módulo B2C: Aplicativo do Usuário (PWA)

### RF05 - Onboarding Progressivo com Validação Cadastral Síncrona
Para mitigar a criação de perfis sintéticos ou a falsificação de idade por usuários menores na fase monetizada, o fluxo de onboarding adota barreiras estritas de identidade divididas em fases:
* **Fase 1 (Acesso Inicial):** O usuário faz login simplificado de um clique utilizando autenticação social do Google (Gmail). O sistema cria o registro na tabela `users` com o status de perfil marcado como `INCOMPLETE`. Neste estágio, campos como CPF, data de nascimento e chave Pix são armazenados como `NULL`. O PWA libera o acesso exclusivo ao mapa de pacotes e à interface do álbum de figurinhas.
* **Fase 2 (Upgrade para Pix Real):** Ao tentar interagir com moedas de dinheiro real ou acessar o menu da carteira de saques, o sistema exige o preenchimento síncrono do CPF e da Chave Pix. O backend consome de forma assíncrona uma API de bureau de dados cadastrais, enviando o CPF e extraindo a Data de Nascimento oficial e o Nome Completo direto da base de dados da Receita Federal. O sistema calcula a idade do usuário, grava o dado e atualiza o status do perfil para `VERIFIED`.
* **Vinculação de Saque:** O sistema exige que a chave Pix cadastrada para saques seja, obrigatoriamente, do tipo **CPF** e correspondente ao CPF validado no cadastro, inviabilizando que uma pessoa utilize múltiplos perfis para sacar em uma única conta bancária.

### RF06 - Renderização de Mapa Dinâmico e Ocultação de Ativos por Perfil
O usuário interage com uma interface de mapa georreferenciado construída sobre o PWA que consome as coordenadas do dispositivo em tempo real.
* **Diferenciação Visual das Recompensas:**
  * **Moedas de Bronze:** Representam ativos da camada de volume (baixo valor). Ficam espalhadas em áreas públicas ou calçadas de parceiros. Visibilidade pública para todos os usuários.
  * **Super Pix GO (Baús de Ouro):** Representam ativos de alto valor patrocinados por marcas ou construtoras para público qualificado.
* **Regra de Visibilidade Restrita:** O backend intercepta a requisição do mapa baseando-se no ID do usuário logado. Se a campanha ativa possuir restrição de público (ex: 35+ anos) e o usuário logado possuir 22 anos, o "Baú de Ouro" **não é renderizado no mapa deste usuário**, eliminando a possibilidade de tentativa de acesso ou frustração por bloqueio explícito em tela.

### RF07 - Fluxo de Coleta por Visualização de Vídeo (Rewarded WebAR)
O fluxo de resgate de qualquer recompensa corporativa exige o cumprimento integral do pedágio de atenção publicitária:
1. O usuário se desloca fisicamente até as coordenadas geográficas do ativo exibido no mapa.
2. Ao entrar no raio de prevenção do ponto (configurado de 15 a 25 metros), o botão `[ Desbloquear Recompensa ]` torna-se ativo em tela.
3. Ao clicar, o PWA executa um player de vídeo HTML5 customizado em tela cheia (*Fullscreen Mode*). Os controles de pulo (*skip*), avanço rápido ou fechamento são nativamente removidos e desativados via código.
4. O frontend monitora o evento `onEnded` do player de vídeo e envia um token criptografado temporário para o backend. O backend valida o tempo decorrido de reprodução e altera o status do usuário para "Autorizado para Captura".
5. O PWA ativa a câmera do dispositivo via API `getUserMedia` e renderiza o ativo 3D (a moeda Pix GO customizada com a logo do lojista) flutuando no ambiente real por meio de WebAR (utilizando bibliotecas como Three.js/A-Frame). O usuário toca na moeda em tela para efetivar a captura.

### RF08 - Regra de Saque Mínimo e Wallet Digital
O saldo coletado nas caçadas urbanas é computado em uma carteira digital interna na moeda corrente nacional (Real).
* **Limite de Saque (Gate):** O botão de transferência eletrônica direta via Pix fica bloqueado com um ícone de cadeado. O gatilho de liberação de saque só é acionado quando o montante acumulado na carteira atinge o **valor mínimo estrito de R$ 6,00**.
* **Execução:** Ao atingir os R$ 6,00 e clicar em "Sacar", o sistema dispara a requisição de transferência em lote para a API bancária para liquidar o valor na chave CPF do usuário em tempo real.

---

## 5. Módulo de Atração Viral: O Álbum Digital da Copa (Fase de Lançamento)

### RF11 - Álbum de Figurinhas 100% Gratuito e Digital
Como estratégia agressiva de aquisição de usuários (*Growth Hook*) e validação de tráfego sem custo para os lojistas iniciais, o sistema disponibiliza uma interface imersiva de Álbum de Figurinhas focado em grandes eventos esportivos sazonais (Copa do Mundo).
* **Interface Premium:** O álbum digital deve apresentar uma UI tridimensional com efeitos de física real para o folheamento de páginas, texturas esportivas em alta definição e espaços vazios com silhuetas neon numeradas dos jogadores para induzir o desejo de completude no usuário.
* **Geração de Escassez e Matriz de Probabilidade:** As figurinhas são divididas em níveis rígidos de raridade gerenciados pelo backend através de geração de números pseudoaleatórios pesados:
  * **Comuns (Bronze):** 70% de chance de drop. Cards estáticos dos jogadores.
  * **Raras (Prata):** 25% de chance de drop. Cards com efeitos metalizados que reagem ao giroscópio do smartphone.
  * **Lendárias (Ouro - Holográficas):** 5% de chance de drop (ex: Neymar, Vini Jr.). Cards holográficos dinâmicos que executam uma comemoração em vídeo animado de 3 segundos quando tocados.

### RF12 - Distribuição Georreferenciada de Pacotes e Ímã de Vendas
* **Pontos de Coleta:** Os pacotes de figurinhas digitais (contendo 3 cards aleatórios cada) são distribuídos no mapa exclusivamente em coordenadas geográficas de estabelecimentos comerciais parceiros.
* **Isenção B2B Temporária:** Durante a vigência da campanha do álbum, os lojistas não pagam pela inserção dos pacotes em seus comércios. A plataforma utiliza a atração natural do álbum para demonstrar o potencial de tráfego físico para os gerentes das lojas, preparando a conversão dessas empresas para o modelo pago (Fase 2).
* **Mecânica de Prêmios Físicos no Caixa:** Figurinhas de categoria Rara e Lendária guardam um benefício físico associado à marca proprietária do card. Ao capturar, o PWA altera a flag `has_reward` para `true` e disponibiliza na tela um cupom digital contendo a mensagem: "Apresente esta tela no caixa da loja e retire um brinde ou ganhe 15% de desconto".
* **Validação Antiduplicidade no PDV:** O PWA gera um código QR Code de uso único. O operador de caixa do estabelecimento, utilizando o Portal do Lojista, realiza a leitura do QR Code. O backend verifica se o usuário possui a figurinha em seu inventário, valida que o benefício está com o status `NOT_REDEEMED`, autoriza o lojista a conceder o desconto e transiciona o status do cupom de forma síncrona para `REDEEMED`.

### RF13 - Protocolo de Troca Local de Figurinhas Repetidas (Local Trade)
Para fomentar a interação social em frente aos estabelecimentos comerciais e forçar o marketing boca a boca orgânico:
* **Mecânica de Troca por Proximidade:** Dois usuários com figurinhas repetidas que se encontrem no mesmo espaço físico podem iniciar uma troca segura.
* **Validação por PIN:** O Usuário A seleciona a figurinha repetida e clica em "Trocar Localmente". O servidor gera um código PIN de 4 dígitos de uso único com validade de 120 segundos. O Usuário B digita esse PIN em seu respectivo aplicativo. O backend valida a proximidade geográfica de ambos os dispositivos (via GPS) e transfere a propriedade dos ativos de forma instantânea e segura entre as contas.

---

## 6. Sazonalidade e Comunicação Estágio Zero

### RF14 - Sistema de Banners de Antecipação Controlada (Teaser Banners)
Durante a Fase 1 (Operação focada no Álbum de Figurinhas Gratuito), a interface do aplicativo do usuário deve atuar agressivamente na retenção de longo prazo, preparando a base de clientes para a entrada do dinheiro real.
* **Placeholders de Comunicação:** O PWA conterá áreas nobres de exibição de conteúdo estático gerenciado via CMS administrativo no topo da tela do mapa e no interior do painel da carteira digital.
* **Mensagens Obrigatórias:** Essas áreas devem veicular de forma ininterrupta chamadas visuais em alta definição contendo textos explícitos de antecipação de funcionalidade, tais como: "Em breve: Pix Real", "Treine o seu radar: Em breve você vai caçar Pix de verdade nesta tela!" e "Carteira em modo de demonstração. Em breve saques automáticos a partir de R$ 6,00".
* **Mapeamento de Virada de Chave:** A exibição desses banners deve estar atrelada a uma flag booleana global no painel administrativo (`fase_monetizacao_ativa`). Quando alterada para true, o sistema oculta automaticamente os avisos de expectativa e libera os componentes visuais de saldo real no PWA.

### RF10 - Módulo de Interfaces Temáticas Sazonais
O painel administrativo máster conterá chaves de estilização global para adaptar todo o ecossistema urbano a grandes datas comemorativas do mercado nacional.
* **Temas Suportados:** Copa do Mundo, Dia dos Namorados, Black Friday e Natal.
* **Comportamento do Sistema:** Ao ativar o tema Dia dos Namorados, por exemplo, o servidor altera os endpoints de estilização do PWA. Os ícones das moedas padrão do mapa transformam-se automaticamente em Corações Digitais, os efeitos sonoros de captura mudam para áudios temáticos e o painel PJ sugere automaticamente pacotes de anúncios premium com custos por visita ajustados para o varejo de presentes e restaurantes de alta gastronomia.

---

## 7. Requisitos de Segurança, Integridade de Dados e Antifraude

### RN03 - Trava de Frequência Rígida por CPF (Rate Limiting)
Para evitar a drenagem predatória e maliciosa do orçamento dos lojistas por um único grupo de usuários, o backend processa uma trava rígida de consumo na tabela de transações:
* **A Regra:** Cada CPF cadastrado e validado possui o direito estrito de realizar apenas **1 (uma) coleta de moeda patrocinada por estabelecimento comercial (ou filial individual) a cada ciclo de 24 horas**. Para o álbum, o teto é de 2 pacotes por dia.
* **Comportamento:** Tentativas subsequentes de abrir o mesmo ativo no mesmo local pelo mesmo usuário serão sumariamente rejeitadas pelo backend, retornando uma mensagem de erro de limitação temporal ao dispositivo.

### RN04 - Protocolo de Bloqueio de Localização Falsa (Anti-Mock Location Protocol)
O maior vetor de risco financeiro para a plataforma reside na simulação de coordenadas geográficas através de softwares maliciosos instalados nos celulares dos usuários (*Fake GPS*). A arquitetura de segurança mitiga esse risco em três camadas:
1. **Verificação no Cliente (PWA):** O JavaScript do PWA verifica as flags nativas disponibilizadas pelo navegador através do objeto de geolocalização para identificar se a coordenada provém de um provedor de localização simulada (*Mock Provider*). Caso detectado, a interface bloqueia a renderização do mapa de imediato.
2. **Criptografia de Payload:** Toda requisição de tentativa de captura de moeda envia ao servidor um payload contendo as coordenadas geográficas atuais geradas pelo hardware do dispositivo assinadas com um *Hash* criptográfico de uso único composto pelo `ID_Usuario + ID_Moeda + Timestamp_Milisegundos`.
3. **Validação Heurística no Backend (Hetzner/PostGIS):** Ao receber o pedido de captura, o servidor executa a função espacial `ST_Distance` entre a coordenada informada pelo celular e a coordenada real e imutável da moeda armazenada no banco de dados. Se a divergência espacial for superior ao raio geométrico de tolerância estipulado (ex: 25 metros), a transação é considerada fraudulenta, o saldo não é computado e a conta do usuário é marcada com uma flag de auditoria interna para bloqueio preventivo de saques futuros.
"""

# Conteúdo do arquivo USE_CASES.md
use_cases_content = """# 🚀 Casos de Uso Técnicos (Use Cases) — Pix GO

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
"""

# Conteúdo do arquivo DATABASE_BLUEPRINT.md
db_blueprint_content = """# 🗄️ Blueprint de Banco de Dados Completo — Pix GO

## 1. Modelo Relacional PostgreSQL + Extensão Espacial PostGIS

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Definição de Tipos ENUM Estritos de Controle de Fluxo
CREATE TYPE user_status_enum AS ENUM ('INCOMPLETE', 'VERIFIED', 'BANNED');
CREATE TYPE rarity_enum AS ENUM ('COMMON', 'RARE', 'LEGENDARY');
CREATE TYPE campaign_status_enum AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'FINISHED');
CREATE TYPE reward_status_enum AS ENUM ('NOT_REDEEMED', 'REDEEMED');
CREATE TYPE tx_status_enum AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- 0. Configurações Globais da Plataforma (RF14, RN01, RF10)
CREATE TABLE platform_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Seeds: global_margin=0.40, fase_monetizacao_ativa=false, tema_ativo='COPA'

-- 1. Tabela Principal de Usuários (Onboarding Progressivo)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT NULL,
    cpf VARCHAR(11) UNIQUE NULL,            -- Armazenado apenas na Fase 2
    birth_date DATE NULL,                   -- Armazenado apenas na Fase 2
    pix_key VARCHAR(255) NULL,              -- Armazenado apenas na Fase 2
    faixa_etaria VARCHAR(10) NULL,          -- 'LIVRE' ou '35+' (Fase 2)
    wallet_balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    status user_status_enum DEFAULT 'INCOMPLETE',
    fraud_flag BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_cpf ON users(cpf) WHERE cpf IS NOT NULL;

-- 2. Tabela de Estabelecimentos Comerciais (Filiais Geocodificadas - RF01)
CREATE TABLE establishments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cnpj_root VARCHAR(14) NOT NULL,         -- CNPJ da matriz (raiz cadastral)
    cnpj VARCHAR(14) UNIQUE NOT NULL,       -- CNPJ da filial individual
    trade_name VARCHAR(255) NOT NULL,
    address_text TEXT NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,    -- Ponto WGS84
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_establishments_geom ON establishments USING GIST (geom);
CREATE INDEX idx_establishments_cnpj_root ON establishments(cnpj_root);

-- 2b. Carteira PJ para crédito de orçamento não consumido (RF04)
CREATE TABLE merchant_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cnpj_root VARCHAR(14) UNIQUE NOT NULL,
    balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Campanhas Publicitárias Monetizadas (Fase 2)
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
    budget_gross NUMERIC(10, 2) NOT NULL,
    budget_net NUMERIC(10, 2) NOT NULL,
    app_margin_percent NUMERIC(5, 2) DEFAULT 40.00,
    video_url TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    age_restriction INT NULL,
    status campaign_status_enum DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_campaigns_establishment ON campaigns(establishment_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- 4. Tabela de Moedas Financeiras Georreferenciadas (Fase 2 - Smart Blending)
CREATE TABLE financial_coins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    value NUMERIC(10, 2) NOT NULL,
    is_qualified BOOLEAN DEFAULT FALSE,     -- true = Baú de Ouro (60%), false = Bronze (40%)
    geom GEOMETRY(Point, 4326) NOT NULL,
    collected_by UUID REFERENCES users(id) NULL,
    collected_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_financial_coins_geom ON financial_coins USING GIST (geom);
CREATE INDEX idx_financial_coins_campaign ON financial_coins(campaign_id);

-- 5. Pontos de Coleta de Pacotes do Álbum no Mapa (RF12)
CREATE TABLE sticker_packs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
    geom GEOMETRY(Point, 4326) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sticker_packs_geom ON sticker_packs USING GIST (geom);

-- 6. Tabela do Catálogo de Figurinhas Patrocinadas (Módulo do Álbum - Fase 1)
CREATE TABLE stickers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
    sticker_number INT UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    page_number INT NOT NULL,
    rarity rarity_enum DEFAULT 'COMMON',
    image_url TEXT NOT NULL,
    has_reward BOOLEAN DEFAULT FALSE,
    reward_description TEXT NULL,
    reward_code VARCHAR(50) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabela de Inventário de Figurinhas e Cupons dos Usuários (Fase 1)
CREATE TABLE user_stickers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sticker_id UUID REFERENCES stickers(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    is_glued BOOLEAN DEFAULT FALSE,
    reward_status reward_status_enum DEFAULT 'NOT_REDEEMED',
    qr_token VARCHAR(255) UNIQUE NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_user_sticker UNIQUE (user_id, sticker_id)
);

-- 8. Tabela do Histórico Unificado de Coletas (Controle de Rate Limiting de 24 horas)
CREATE TABLE unified_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
    asset_type VARCHAR(20) NOT NULL,        -- 'STICKER_PACK' ou 'FINANCIAL_COIN'
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_unified_collections_rate ON unified_collections(user_id, establishment_id, asset_type, collected_at);

-- 9. Tabela de Transações Financeiras e Histórico de Saques (Wallet - Fase 2)
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    status tx_status_enum DEFAULT 'PENDING',
    end_to_end_id VARCHAR(255) NULL,
    processed_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_status ON wallet_transactions(status);
```

## 2. Topologia de Chaves e Estruturas em Memória (Redis)

| Chave / Padrão | Tipo | TTL | Descrição |
|----------------|------|-----|-----------|
| `active_coins:geo` | GEO | Até fim da campanha | Moedas financeiras ativas. `GEOADD active_coins:geo {longitude} {latitude} {coin_id}` |
| `active_packs:geo` | GEO | Vigência do álbum | Pacotes de figurinhas no mapa. `GEOADD active_packs:geo {longitude} {latitude} {establishment_id}` |
| `campaign:{id}:coins` | Hash | Até fim da campanha | Metadados: valor, `is_qualified`, `age_restriction`, `establishment_id` |
| `trade:pin:{codigo}` | Hash | 120 segundos | Troca local RF13. Campos: `sender_id`, `sticker_id`, `lat`, `lon` |
| `rate:cpf:{cpf}:est:{establishment_id}` | String | 86400 segundos | RN03 — 1 moeda / 24h por filial |
| `rate:cpf:{cpf}:pack:{establishment_id}` | String | 86400 segundos | RN03 — máximo 2 pacotes / 24h por filial |
| `video:token:{user_id}:{coin_id}` | String | 300 segundos | Token pós-vídeo RF07 |
| `session:jwt:blacklist:{jti}` | String | Expiração JWT | Revogação de tokens |

**Fluxo de consulta do mapa (UC06):**
1. `GEOSEARCH active_coins:geo FROMLONLAT {lon} {lat} BYRADIUS 5 km` para moedas próximas.
2. `HGETALL campaign:{id}:coins` para enriquecer flags de qualificação.
3. Filtro de visibilidade por `faixa_etaria` antes de serializar JSON para o PWA.

**Fluxo de pacotes do álbum (UC08):**
1. `GEOSEARCH active_packs:geo` no raio de 5 km.
2. Validação de proximidade e rate limit antes de `POST /api/v1/album/open-pack`.
"""

# Conteúdo do arquivo INFRASTRUCTURE.md
infra_content = """# 🐳 Engenharia de Infraestrutura Local — Docker Compose

```yaml
version: '3.8'

services:
  postgres_db:
    image: postgis/postgis:15-3.3-alpine
    container_name: pixgo_db
    restart: always
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=pixgo_admin
      - POSTGRES_PASSWORD=pixgo_strong_password
      - POSTGRES_DB=pixgo_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis_cache:
    image: redis:7-alpine
    container_name: pixgo_redis
    restart: always
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```
"""

# Dicionário mapeando os nomes dos arquivos ao conteúdo
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

# Criação física de cada arquivo no diretório atual
print("🚀 Iniciando a geração automática de documentos mestres corporativos...")

for nome, conteudo in arquivos.items():
    try:
        with open(nome, "w", encoding="utf-8") as f:
            f.write(conteudo.strip())
        print(f"✅ Arquivo criado com sucesso: {nome}")
    except Exception as e:
        print(f"❌ Falha ao criar o arquivo {nome}. Motivo: {e}")

print("\n🏁 Processamento concluído! Todos os documentos estão prontos na raiz desta pasta para leitura do Cursor.")
