# 📑 Documento de Especificação de Regras de Negócio (BRD) — Pix GO
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
$$\text{Orçamento Líquido da Campanha} = \text{Orçamento Bruto} \times (1 - \text{GLOBAL\_MARGIN})$$
* **Exemplo de Aplicação:** Em um aporte bruto de R$ 1.000,00 realizado pela empresa contratante, R$ 400,00 são imediatamente provisionados como receita líquida da plataforma (taxa de intermediação e uso tecnológico), enquanto R$ 600,00 são integralmente convertidos em lastro financeiro para as recompensas geolocalizadas na rua.
* **Configuração:** Este percentual é uma variável global e dinâmica (`GLOBAL_MARGIN`), mutável exclusivamente através do Painel Administrativo Master. Alterações nesta variável afetam apenas campanhas criadas após a modificação, preservando o histórico financeiro imutável de campanhas ativas ou encerradas.

### RN02 - Arquitetura de Desembolso Sem Custo (Zero-Fee Payout)
Para viabilizar a distribuição de prêmios de baixo valor nominal (a partir de R$ 0,50) sem inviabilizar a operação através de taxas bancárias por transação, o sistema adota as seguintes diretrizes:
* **Integração via API Pix Dedicada:** O ecossistema conecta-se nativamente à **API Pix C6 Bank BaaS** (`baas-api.c6bank.info` / sandbox) utilizando credenciais PJ, webhooks de recebimento (`PUT /v2/pix/webhook/{chave}`) e liquidação assíncrona via notificações na URL pública do Pix GO.
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