# Avaliação Formativa de Verbos no Passado em Inglês com GenAI

Este projeto é uma demonstração completa do fluxo metodológico baseado no artigo acadêmico **"Artifact-Grounded Formative Micro-Assessment with GenAI Verification Follow-Ups"**. 

A aplicação utiliza Inteligência Artificial para realizar avaliações formativas baseadas em evidências no domínio de **Verbos no Passado em Inglês** (verbos regulares, irregulares, Simple Past vs Present Perfect e regras contextuais), gerando de forma interativa perguntas de verificação (Verification Follow-Ups - VFUs) quando necessário antes de consolidar a classificação pedagógica final e o relatório para o professor.

---

## 1. Arquitetura do Projeto

O projeto é estruturado como um monorepo com suporte a múltiplos espaços de trabalho (Workspaces do NPM) contendo:
- **`data/`**: Repositório de arquivos JSON para persistência sem banco de dados (Pre-Blocks, Demo Cases, Sessions e Students).
- **`backend/`**: Servidor Node.js + Express + TypeScript integrado à API da OpenAI e com suporte a simulações locais completas (`MockProvider`).
- **`frontend/`**: Aplicação Angular 19+ desenvolvida com componentes do Angular Material e estilização moderna de Glassmorphism com animações e interface 100% em Português.

```
ia_ingles/
├── package.json                   # Configuração monorepo e comandos de inicialização
├── README.md                      # Instruções e explicações metodológicas
├── data/                          # Persistência baseada em arquivos JSON
│   ├── preblocks/                 # Modelos pedagógicos e regras de avaliação
│   └── demo-cases/                # Casos sintéticos obrigatórios (Casos 1 a 6)
├── backend/                       # Node.js, Express, TypeScript (Porta 3000)
│   └── src/
│       ├── prompts/               # Templates de Engenharia de Prompt separados
│       ├── controllers/           # Orquestração dos endpoints HTTP
│       ├── services/              # Serviços de Avaliação Formativa e Provedores LLM
│       └── server.ts              # Arquivo de inicialização do servidor
└── frontend/                      # Angular 19, TS, Angular Material (Porta 4200)
```

---

## 2. Como a Metodologia é Implementada

A aplicação realiza as seguintes etapas obrigatórias do artigo:

1. **Pre-Block Model (`data/preblocks/english-past-verbs.json`)**: Define os objetivos de aprendizagem, as evidências esperadas, as rubricas de classificação e os padrões de concepções errôneas (Misconceptions) a serem monitorados (ex: regularização de verbos irregulares como *goed*, *buyed*, ou confusão entre Simple Past e Present Perfect).
2. **Student Submission**: O estudante envia sentenças escritas em inglês (Artefato) acompanhadas de uma justificativa narrativa em português detalhando por que escolheu tais estruturas.
3. **Evidence Interpretation & Diagnostic Hypothesis (`diagnostic.prompt.ts`)**: A IA analisa o envio, mapeia contra o Pre-Block, detecta lacunas e formula uma hipótese inicial. Se a confiança for baixa/média ou se houver misconceptions suspeitos, ela decide pela necessidade de uma pergunta de verificação (VFU) para testar o aluno.
4. **Verification Follow-Up (VFU) Dialog (`vfu.prompt.ts`)**: O aluno responde a pergunta gerada pela IA, fornecendo mais evidências. O sistema suporta até **2 VFUs** (Stop Rule).
5. **Reanalysis**: A IA reavalia o estado cognitivo do estudante incorporando o histórico do diálogo e a nova resposta.
6. **Final Classification (`classification.prompt.ts`)**: Ao atingir a certeza do diagnóstico ou o limite de 2 VFUs, o sistema encerra o fluxo e classifica o estudante em uma das três categorias:
   - *Completely Correct* (Totalmente Correto)
   - *Partially Correct* (Parcialmente Correto)
   - *Completely Incorrect* (Totalmente Incorreto)
7. **Teacher Recommendation & Report (`teacher-report.prompt.ts`)**: Emite uma recomendação direta para o docente:
   - *Proceed* (Avançar para Próximo Tópico)
   - *Conditional Progression* (Progressão Condicional)
   - *Rework* (Revisar Conteúdo)
   Acompanhado de uma justificativa pedagógica descritiva (Rationale) que cita trechos das sentenças e das respostas de VFU do estudante.

---

## 3. Instruções de Execução

### Pré-requisitos
- **Node.js** (Versão 18+ recomendada)
- **NPM** (Versão 9+)

### Passo 1: Instalar Dependências
No diretório raiz `ia_ingles`, execute o comando abaixo para instalar as dependências de todos os workspaces (backend e frontend):
```bash
npm install
```

### Passo 2: Executar em Modo de Demonstração (Sem Chave de API)
Por padrão, a aplicação é iniciada com o **`MockProvider`**. Isso permite rodar e testar todos os 6 casos de demonstração obrigatórios sem precisar de uma chave ativa da OpenAI ou gastar créditos. O fluxo simulado se comporta de forma idêntica à IA real.

Para iniciar o backend e o frontend concorrentemente, execute na raiz do projeto:
```bash
npm start
```
Após o comando terminar, o frontend estará acessível em **http://localhost:4200** e o backend em **http://localhost:3000**.

### Passo 3: Executar com Conexão Real (OpenAI GPT-4o)
Para habilitar o uso da API da OpenAI no backend:

1. Acesse a pasta `backend/` e crie/edite o arquivo `.env`:
   ```env
   PORT=3000
   OPENAI_API_KEY=SUA_CHAVE_AQUI
   LLM_MODEL=gpt-4o
   LLM_PROVIDER=openai
   ```
2. Substitua `SUA_CHAVE_AQUI` por sua chave secreta da OpenAI.
3. Reinicie a execução no terminal (`npm start`). O servidor identificará a chave e alternará de forma automática para o `OpenAIProvider`.

---

## 4. Casos de Demonstração Obrigatórios

O sistema possui um botão **"Carregar Casos de Teste (Demo)"** no Dashboard que inicializa os 6 cenários exigidos pela especificação:

| Caso | Título / Descrição | VFUs Esperados | Erros Avaliados |
| :--- | :--- | :---: | :--- |
| **Caso 1** | **Erro Complexo** | 2 | Erros de regularização de verbos irregulares ("drinked", "goed") e uso indevido de Present Perfect com marcador temporal específico ("Yesterday I have gone"). |
| **Caso 2** | **Confusão Went vs Gone** | 2 | Uso de particípio sem auxiliar ("I gone") e Simple Past após auxiliar ("have went"). |
| **Caso 3** | **Parcialmente Correto** | 1 | Estruturas corretas no passado simples e particípio, mas falha pontual de Present Perfect com "last night". |
| **Caso 4** | **Erros de Verbos Irregulares** | 1 | Regularização incorreta de "buyed" e particípio incorreto "have drove". |
| **Caso 5** | **Domínio Completo I** | 0 | Aplicação impecável de verbos regulares, irregulares e distinção conceitual perfeita de Simple Past e Present Perfect na narrativa. |
| **Caso 6** | **Domínio Completo II** | 0 | Outro exemplo de domínio avançado com explicações gramaticais corretas. |

*Dica: Ao rodar qualquer um dos Casos de Teste carregados, a tela de diálogo VFU disponibilizará um botão **"Autopreencher Resposta (Modo Demo)"** para acelerar a demonstração prática, preenchendo as respostas sugeridas de cada caso.*

---

## 5. Visual das Telas Angular (Interface Glassmorphism)

As telas foram desenhadas seguindo princípios de design moderno de alta fidelidade:
1. **Dashboard**: Exibe o fluxo metodológico conceitual e a listagem dos 6 cenários demonstrativos com tags informando o volume de VFUs esperados.
2. **Submissão**: Campo de entrada do código/texto e narrativa, com suporte a preenchimento instantâneo ao clicar em um caso de demonstração.
3. **Diálogo VFU**: Apresenta a hipótese diagnóstica formulada, o grau de confiança da IA, competências e falhas detectadas do lado esquerdo, e a pergunta gerada pela IA com campo de resposta do lado direito.
4. **Relatório Pedagógico (Ficha Final)**: Badges dinâmicos coloridos para a classificação (Totalmente Correto, Parcialmente Correto, Incorreto) e recomendação de progressão (Avançar, Progressão Condicional, Rework), caixa de parecer descritivo (Rationale) e a linha do tempo completa documentando passo a passo todas as submissões e análises intermediárias.
