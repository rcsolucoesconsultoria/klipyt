# Índice de Prompts por Fase — KLIPYT

Execute **na ordem**. Cada arquivo é autocontido para colar no Cursor Composer.

| Ordem | Arquivo | Quando usar | Resultado esperado |
|-------|---------|-------------|-------------------|
| 0 | [PROMPT_FASE_00_FUNDACAO.md](PROMPT_FASE_00_FUNDACAO.md) | Projeto novo ou validar base | Docker, migrations, DDD, health |
| 1 | [PROMPT_FASE_01_ALBUM.md](PROMPT_FASE_01_ALBUM.md) | Após Fase 0 | Álbum completo: login, pacotes, cupom, PIN |
| 2 | [PROMPT_FASE_02_PIX_REAL.md](PROMPT_FASE_02_PIX_REAL.md) | Após Fase 1 | Moedas, campanhas, coleta, carteira |
| 3 | [PROMPT_FASE_03_B2B.md](PROMPT_FASE_03_B2B.md) | Após Fase 2 | Portal lojista, CNPJ, analytics |
| 4 | [PROMPT_FASE_04_SAQUE.md](PROMPT_FASE_04_SAQUE.md) | Após Fase 3 | Saque Pix + webhook |
| 5 | [PROMPT_FASE_05_HARDENING.md](PROMPT_FASE_05_HARDENING.md) | Após Fase 4 | Segurança, CI, observabilidade |
| 6 | [PROMPT_FASE_06_ADMIN.md](PROMPT_FASE_06_ADMIN.md) | Após Fase 5 | Admin, temas, CMS — **aplicação completa** |

## Comando padrão (substitua `NN` e o nome do arquivo)

```
Implemente integralmente a fase descrita em @prompts/PROMPT_FASE_NN_....md

Leia também: @BRD.md @USE_CASES.md @DATABASE_BLUEPRINT.md @INFRASTRUCTURE.md

Regras:
- Não implemente funcionalidades das fases seguintes.
- Não invente regras fora dos documentos fonte.
- Entregue código compilável, testes e atualize o README (status da fase).
```

## Documento mestre

Visão geral de todas as fases: [IMPLEMENTATION_PROMPT.md](../IMPLEMENTATION_PROMPT.md)
