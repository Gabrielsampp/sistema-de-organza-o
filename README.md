# Atlas

Sistema pessoal desktop (Tauri 2 + React + SQLite). Dados 100% locais.

## Pré-requisitos (Windows)
1. Node.js 20+
2. Rust (https://rustup.rs) com toolchain MSVC
3. Visual Studio Build Tools ("Desenvolvimento para desktop com C++")
4. WebView2 (já vem no Windows 10/11)

## Gerar o .exe sem instalar nada
1. Crie um repositório no GitHub (pode ser privado) e envie esta pasta (`git push` na branch `main`).
2. Aba **Actions** → *Build Windows installer* (roda sozinho no push; ou **Run workflow**).
3. Ao terminar (~10 min na primeira vez), baixe **atlas-windows** em *Artifacts*. Dentro há o instalador `Atlas_0.1.0_x64-setup.exe`.
4. Se o Windows exibir SmartScreen: *Mais informações → Executar assim mesmo* (o app não é assinado).

## Rodar em modo dev
```
npm install
npm run tauri dev
```
Não abra `localhost:1420` no navegador: sem o Tauri não há SQLite.

## Instalador
```
npm run tauri build
```
Saída: `src-tauri/target/release/bundle/nsis/`.

## Testes
`npm test` (regras de streak e progresso).

## Onde ficam os dados
`%APPDATA%\app.atlas.personal\atlas.db`. Backup: Configurações → Exportar backup.

## Migrations
Novas tabelas: crie `src-tauri/migrations/000N_*.sql` e registre em `src-tauri/src/lib.rs` com `version` incremental. Nunca edite uma migration já aplicada.

## Implementado
Início (progresso do dia), Tarefas (CRUD, subtarefas, Hoje/Próximas/Atrasadas/Todas, filtro), Hábitos (check diário, streak, maior streak, % 30 dias, heatmap), Busca global (Ctrl+K), atalhos, sidebar recolhível, perfil, backup.

## TODO (não existe na UI)
Metas, Finanças, Treinos, Estudos, Dieta, notificações, recorrência de tarefas, drag and drop, calendário/quadro, FTS5.
