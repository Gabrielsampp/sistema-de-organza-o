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
- **Início:** progresso do dia, resumo de tarefas, gráficos (atividade 14 dias, conclusão de hábitos 30 dias), resumo financeiro do mês.
- **Tarefas:** criar com painel completo (prioridade, data, horário, categoria, recorrência, subtarefas, status), visões Hoje/Próximas/Atrasadas/Todas, **Calendário**, **Quadro** (arrastar entre colunas), filtro por categoria e busca. Recorrentes geram a próxima ocorrência ao concluir.
- **Hábitos (rotina):** dias da semana, horário, categoria, grade mensal clicável, streak/maior streak, % do mês, gráfico de 30 dias.
- **Finanças:** contas, entradas/saídas/transferências, categorias, orçamento por categoria, recorrentes mensais (gerados na abertura do app), gráficos (rosca por categoria, entradas × saídas 6 meses, resultado mensal), lista com filtro e busca.
- Busca global (Ctrl+K), atalhos (Ctrl+1…4, Ctrl+N, Ctrl+B), perfil, backup.

## TODO (não existe na UI)
Metas, Treinos, Estudos, Dieta, notificações, cartão com fatura, importação/exportação CSV, categorias financeiras editáveis na UI.
