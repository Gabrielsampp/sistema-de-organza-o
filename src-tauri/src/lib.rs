use tauri_plugin_sql::{Migration, MigrationKind};

pub fn run() {
    // Novas migrations: adicione um item com version incremental. NUNCA edite uma já aplicada.
    let migrations = vec![Migration {
        version: 1,
        description: "core",
        sql: include_str!("../migrations/0001_core.sql"),
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:atlas.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o Atlas");
}
