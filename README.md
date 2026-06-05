# Brasfoot Manager

> Manager de futebol brasileiro moderno. Rápido, imersivo, offline-first.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| UI Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Estilo | TailwindCSS 3 |
| Estado global | Zustand (com slices) |
| Banco local | Dexie (IndexedDB) |
| PWA | vite-plugin-pwa + Workbox |
| Deploy | Netlify |

## Arquitetura

```
src/
├── app/              # Bootstrap, router baseado em estado
├── components/
│   ├── ui/           # Primitivos: Button, Card, Badge, Toast
│   └── layout/       # AppShell, Sidebar, Header
├── modules/          # Features do jogo (autocontidos)
│   ├── dashboard/    # Home, NewCareer, Dashboard
│   ├── squad/        # Elenco e jogadores
│   ├── tactics/      # Formação e instruções táticas
│   ├── match/        # Simulação e resultado de partidas
│   ├── calendar/     # Calendário de partidas
│   ├── transfer/     # Mercado de transferências
│   ├── scouting/     # Sistema de scouting
│   ├── finance/      # Gestão financeira
│   └── press/        # Imprensa e narrativa
├── engine/           # Match engine — SEM dependência de React
│   ├── simulation/   # Core: cálculo de partidas
│   ├── commentary/   # Geração de narração
│   └── momentum/     # Sistema de momentum
├── database/
│   ├── db.ts         # Instância Dexie + schema
│   └── repositories/ # Acesso a dados por entidade
├── services/         # Lógica de negócio pura
│   ├── generator/    # Geração procedural de dados
│   ├── season/       # Gestão de temporada/calendário
│   └── save/         # Export/import de saves
├── store/            # Zustand stores
│   ├── useGameStore  # Estado do save ativo
│   └── useUiStore    # Estado da interface
├── types/            # Interfaces TypeScript do domínio
├── utils/            # Funções puras
└── data/             # Dados estáticos (clubes, nomes, etc.)
```

## Decisões Técnicas

### Router baseado em estado (não URL)
O jogo usa navegação via Zustand `useUiStore.currentView` em vez de React Router baseado em URL. Isso simplifica a PWA offline, evita estados inválidos na URL e é mais natural para jogos.

### Engine desacoplada do React
A `src/engine/` não importa nada de React. Isso permite:
- Testes unitários sem setup de React
- Migração futura para Web Worker
- Lógica de jogo completamente portável

### Dexie como fonte da verdade
Zustand stores guardam apenas o estado *ativo em memória*. O banco Dexie é a fonte da verdade. Ao carregar um save, o Zustand é populado do banco. Ao avançar no jogo, o banco é atualizado e o store reflete.

### Dados separados por saveId
Todas as entidades carregam `saveId` como índice. Isso isola completamente múltiplos saves no mesmo banco e simplifica deleção (query + delete por saveId).

## Etapas de Desenvolvimento

| Etapa | Conteúdo | Status |
|-------|----------|--------|
| 1 | Setup, arquitetura, PWA, layout, tipos | ✅ Completo |
| 2 | Entidades, clubes, jogadores, geração procedural, calendário | 🔜 Próxima |
| 3 | Match engine, partidas em texto, simulação | ⏳ |
| 4 | Tabela, temporada, competições | ⏳ |
| 5 | Táticas, moral, lesões | ⏳ |
| 6 | Mercado, contratos, salários | ⏳ |
| 7 | Scouting, base, imprensa | ⏳ |
| 8 | Polimento, balancing, UX | ⏳ |

## Desenvolvimento local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```
