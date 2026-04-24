use crate::config::{self, Bookmark, ReaderSettings, ReadingHistory};
use crate::storage;
use tauri::Manager;

#[tauri::command]
pub fn open_epub_dialog(app_handle: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let result = app_handle
        .dialog()
        .file()
        .add_filter("EPUB", &["epub"])
        .blocking_pick_file();
    match result {
        Some(path) => Ok(Some(path.to_string())),
        None => Ok(None),
    }
}

#[tauri::command]
pub fn save_book_file(
    app_handle: tauri::AppHandle,
    id: String,
    source_path: String,
) -> Result<String, String> {
    let stored = storage::store_book(&app_handle, &id, &source_path)?;
    Ok(stored.to_string_lossy().to_string())
}

#[tauri::command]
pub fn delete_book_file(app_handle: tauri::AppHandle, id: String) -> Result<(), String> {
    storage::remove_book(&app_handle, &id)
}

#[tauri::command]
pub fn get_book_file_path(app_handle: tauri::AppHandle, id: String) -> Result<String, String> {
    let path = storage::book_path(&app_handle, &id)?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn load_settings(app_handle: tauri::AppHandle) -> Result<ReaderSettings, String> {
    config::load_config(&app_handle, "settings.json").or_else(|_| Ok(ReaderSettings::default()))
}

#[tauri::command]
pub fn save_settings(
    app_handle: tauri::AppHandle,
    settings: ReaderSettings,
) -> Result<(), String> {
    config::save_config(&app_handle, "settings.json", &settings)
}

#[tauri::command]
pub fn load_bookmarks(app_handle: tauri::AppHandle) -> Result<Vec<Bookmark>, String> {
    config::load_config(&app_handle, "bookmarks.json").or_else(|_| Ok(vec![]))
}

#[tauri::command]
pub fn save_bookmarks(
    app_handle: tauri::AppHandle,
    bookmarks: Vec<Bookmark>,
) -> Result<(), String> {
    config::save_config(&app_handle, "bookmarks.json", &bookmarks)
}

#[tauri::command]
pub fn load_history(app_handle: tauri::AppHandle) -> Result<Vec<ReadingHistory>, String> {
    config::load_config(&app_handle, "history.json").or_else(|_| Ok(vec![]))
}

#[tauri::command]
pub fn save_history(
    app_handle: tauri::AppHandle,
    history: Vec<ReadingHistory>,
) -> Result<(), String> {
    config::save_config(&app_handle, "history.json", &history)
}

#[tauri::command]
pub fn read_book_bytes(app_handle: tauri::AppHandle, id: String) -> Result<Vec<u8>, String> {
    let path = storage::book_path(&app_handle, &id)?;
    std::fs::read(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_cover(
    app_handle: tauri::AppHandle,
    id: String,
    bytes: Vec<u8>,
) -> Result<(), String> {
    storage::write_cover(&app_handle, &id, &bytes).map(|_| ())
}

#[tauri::command]
pub fn read_cover(app_handle: tauri::AppHandle, id: String) -> Result<Option<Vec<u8>>, String> {
    storage::read_cover(&app_handle, &id)
}

#[tauri::command]
pub fn delete_cover(app_handle: tauri::AppHandle, id: String) -> Result<(), String> {
    storage::remove_cover(&app_handle, &id)
}

#[tauri::command]
pub fn get_app_data_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    let dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    Ok(dir.to_string_lossy().to_string())
}
