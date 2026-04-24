use std::fs;
use std::path::PathBuf;
use tauri::Manager;

fn app_data_dir(app_handle: &tauri::AppHandle) -> PathBuf {
    app_handle
        .path()
        .app_data_dir()
        .expect("failed to resolve app data dir")
}

fn books_dir(app_handle: &tauri::AppHandle) -> PathBuf {
    let dir = app_data_dir(app_handle).join("books");
    fs::create_dir_all(&dir).ok();
    dir
}

fn covers_dir(app_handle: &tauri::AppHandle) -> PathBuf {
    let dir = app_data_dir(app_handle).join("covers");
    fs::create_dir_all(&dir).ok();
    dir
}

pub fn store_book(
    app_handle: &tauri::AppHandle,
    id: &str,
    source_path: &str,
) -> Result<PathBuf, String> {
    let dest = books_dir(app_handle).join(format!("{}.epub", id));
    fs::copy(source_path, &dest).map_err(|e| e.to_string())?;
    Ok(dest)
}

pub fn remove_book(app_handle: &tauri::AppHandle, id: &str) -> Result<(), String> {
    let book_path = books_dir(app_handle).join(format!("{}.epub", id));
    if book_path.exists() {
        fs::remove_file(&book_path).map_err(|e| e.to_string())?;
    }
    // Also remove cached cover (jpg now; old png cleaned defensively)
    for ext in ["jpg", "png"] {
        let cover_path = covers_dir(app_handle).join(format!("{}.{}", id, ext));
        if cover_path.exists() {
            fs::remove_file(&cover_path).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

pub fn book_path(app_handle: &tauri::AppHandle, id: &str) -> Result<PathBuf, String> {
    let path = books_dir(app_handle).join(format!("{}.epub", id));
    if path.exists() {
        Ok(path)
    } else {
        Err(format!("book not found: {}", id))
    }
}

// --- Cover storage -----------------------------------------------------------

pub fn write_cover(
    app_handle: &tauri::AppHandle,
    id: &str,
    bytes: &[u8],
) -> Result<PathBuf, String> {
    let path = covers_dir(app_handle).join(format!("{}.jpg", id));
    fs::write(&path, bytes).map_err(|e| e.to_string())?;
    Ok(path)
}

pub fn read_cover(app_handle: &tauri::AppHandle, id: &str) -> Result<Option<Vec<u8>>, String> {
    let path = covers_dir(app_handle).join(format!("{}.jpg", id));
    if !path.exists() {
        return Ok(None);
    }
    fs::read(&path).map(Some).map_err(|e| e.to_string())
}

pub fn remove_cover(app_handle: &tauri::AppHandle, id: &str) -> Result<(), String> {
    let path = covers_dir(app_handle).join(format!("{}.jpg", id));
    if path.exists() {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}
