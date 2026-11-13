# 🍀 GameTrevo — Trivia Ditloid

> **Plataforma diária de campeonatos de enigmas Ditloid em português brasileiro, construída com Next.js 16, Supabase e Inteligência Artificial Google Gemini.**

---

## 📌 O que é o GameTrevo?

O **GameTrevo** é uma plataforma competitiva diária baseada em **Ditloids** — um gênero clássico de quebra-cabeças de equações de palavras onde números e letras iniciais representam expressões, provérbios, fatos ou elementos da cultura pop.

### Exemplos de Ditloids:
* `7 D na S` ➔ **7 Dias na Semana**
* `12 M no A` ➔ **12 Meses no Ano**
* `101 D` ➔ **101 Dálmatas**
* `24 H no D` ➔ **24 Horas no Dia**
* `3 Porquinhos` / `4 Estações do Ano`

Cada partida desafia os participantes com **20 Ditloids**, valendo rigorosamente **1 ponto por acerto** (pontuação máxima: 20 pontos por partida).

---

## 🚀 Principais Funcionalidades

### ⚡ Validação em Tempo Real e Persistência Instantânea
* **Avaliação em tempo real (`onChange`)**: Conforme o usuário digita, a resposta é normalizada (remoção de acentos, pontuações e maiúsculas) e conferida instantaneamente.
* **Salvamento atômico no Supabase**: Ao acertar, a pontuação e a resposta são persistidas no banco PostgreSQL no exato milissegundo do acerto (`upsert`), com badge visual `● Salvo no banco de dados`.
* **Zero perda de progresso**: Ao dar `F5` ou recarregar a tela, as respostas já acertadas continuam preenchidas e validadas.
* **Efeitos visuais**: Animações com confetes (`canvas-confetti`) e destaque em verde com indicador de acerto.

### 🎭 Névoa de Guerra (Fog of War)
* Durante o dia da partida, os jogadores visualizam exclusivamente a sua própria pontuação.
* A pontuação dos adversários permanece em sigilo até o encerramento da rodada.
* Ao encerrar a rodada, a névoa de guerra se dissipa e a tabela do **Ranking Geral** do campeonato é consolidada e revelada a todos.

### 🎲 Sorteio e Geração de Temas com IA (Google Gemini)
* A cada rodada, o sistema realiza um sorteio entre os participantes para definir quem escolherá o tema daquele dia.
* O jogador sorteado pode escolher temas clássicos (*Futebol e Esportes*, *Cinema e Séries*, *História e Geografia*, *Cotidiano*) ou digitar um tema livre personalizado.
* A **API do Google Gemini 2.5 Flash** gera os 20 enigmas automaticamente com base no tema escolhido.
* **Deduplicação Inteligente**: O motor de geração consulta todas as questões já jogadas em rodadas anteriores do mesmo campeonato para **nunca repetir enigmas**, mesmo que temas iguais sejam escolhidos em rodadas diferentes.

### 👥 Entrada Dinâmica de Competidores
* O anfitrião pode adicionar novos competidores mesmo com o campeonato em andamento.
* O novo competidor entra com pontuação zerada e passa a disputar a partir da rodada ativa, sendo estritamente impedido pelo sistema de responder rodadas já finalizadas.

### ⚙️ Rodadas Personalizáveis
* Definição flexível de rodadas na criação do campeonato (de 1 a 50 rodadas), com seletor livre e botões rápidos.
* Agendamento de datas de cada confronto no calendário real.

### 🔔 Notificações e Diálogos Integrados (UI Moderna)
* Notificações via **Toast** escuro e elegante (sucesso, erro, aviso, info).
* Diálogos de confirmação in-app modernos para encerramento de rodadas e saídas, sem uso dos pop-ups nativos do navegador (`window.alert` / `window.confirm`).

---

## 🛠️ Tecnologias Utilizadas

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router com Turbopack)
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
* **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Banco de Dados:** [Supabase](https://supabase.com/) (PostgreSQL com RLS)
* **Inteligência Artificial:** [Google Gemini API](https://ai.google.dev/) (`gemini-2.5-flash`)
* **Ícones:** [Lucide React](https://lucide.dev/)
* **Efeitos:** `canvas-confetti`

---

## 📦 Estrutura do Projeto

```text
GameTrevo/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/            # Rotas de Login e Registro
│   │   │   ├── championships/   # Criação, listagem e adição de participantes
│   │   │   ├── rounds/          # Sorteio, envio de respostas e encerramento
│   │   │   └── users/           # Listagem de usuários cadastrados
│   │   ├── globals.css          # Estilos Tailwind v4 e temas
│   │   ├── layout.tsx           # Layout com ToastProvider
│   │   └── page.tsx             # Dashboard principal e controle de fluxo
│   ├── components/
│   │   ├── AuthScreen.tsx       # Tela de Login / Cadastro
│   │   ├── ChampionshipView.tsx # Tabela de classificação e cronograma
│   │   ├── Navbar.tsx           # Cabeçalho limpo com perfil do usuário
│   │   ├── NewChampionshipModal.tsx # Criação de campeonatos com N rodadas
│   │   ├── RoundGameView.tsx    # Tela de jogo dos 20 enigmas Ditloid
│   │   └── ui/
│   │       └── Toast.tsx        # Sistema de Toasts e Confirmações in-app
│   ├── lib/
│   │   ├── ditloidEngine.ts     # Motor de validação, IA e pool deduplicado
│   │   ├── gameService.ts       # Serviços de banco de dados (Supabase)
│   │   └── supabase.ts          # Cliente Supabase
│   └── types/
│       └── game.ts              # Tipagens TypeScript completas
├── supabase/
│   └── schema.sql               # Esquema de banco de dados PostgreSQL
├── .env.example                 # Exemplo de variáveis de ambiente
└── package.json
```

---

## 🔧 Como Executar Localmente

### 1. Clonar o repositório:
```bash
git clone https://github.com/duchinibruno/gametrevo.git
cd gametrevo
```

### 2. Instalar as dependências:
```bash
npm install
```

### 3. Configurar as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz do projeto com base no `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
GEMINI_API_KEY=sua-chave-google-gemini
```

### 4. Executar o schema no Supabase:
Acesse o **SQL Editor** do seu painel Supabase e execute o conteúdo contido em:
👉 [`supabase/schema.sql`](./supabase/schema.sql)

### 5. Iniciar o servidor de desenvolvimento:
```bash
npm run dev
```

Acesse `http://localhost:3000` no seu navegador.

---

## 📜 Regras Oficiais do Jogo

1. **Pontuação:** Cada enigma decifrado corretamente concede **+1 ponto**. Pontuação máxima por partida: **20 pontos**.
2. **Tempo & Respostas:** O competidor pode responder os enigmas a qualquer momento ao longo do dia da partida.
3. **Persistência Automática:** Todo acerto é salvo imediatamente no banco de dados.
4. **Fechamento de Rodada:** Quando o organizador encerra a rodada (ou ao fim do dia), os pontos são consolidados no **Ranking Geral** e os resultados individuais dos competidores são revelados.
5. **Critério de Desempate:** Maior soma de pontos no campeonato; em caso de empate, o número de rodadas finalizadas com pontuação máxima (20/20).

---

## 📄 Licença

Este projeto é desenvolvido para fins educacionais e de entretenimento.
Desenvolvido com 🍀 por [Bruno Duchini](https://github.com/duchinibruno).
