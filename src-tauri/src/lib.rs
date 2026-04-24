mod commands;
mod config;
mod storage;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::open_epub_dialog,
            commands::save_book_file,
            commands::delete_book_file,
            commands::get_book_file_path,
            commands::load_settings,
            commands::save_settings,
            commands::load_bookmarks,
            commands::save_bookmarks,
            commands::load_history,
            commands::save_history,
            commands::read_book_bytes,
            commands::save_cover,
            commands::read_cover,
            commands::delete_cover,
            commands::get_app_data_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
