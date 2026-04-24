use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ReaderSettings {
    pub font_size: u32,
    pub line_height: f64,
    pub font_family: String,
    pub content_width: u32,
    pub theme: String,
}

impl Default for ReaderSettings {
    fn default() -> Self {
        Self {
            font_size: 18,
            line_height: 1.9,
            font_family: "\"Noto Serif SC\", \"Source Han Serif SC\", serif".to_string(),
            content_width: 65,
            theme: "light".to_string(),
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase", default)]
pub struct Bookmark {
    #[serde(default)]
    pub book_id: String,
    pub cfi: String,
    pub title: String,
    pub created_at: u64,
}

impl Default for Bookmark {
    fn default() -> Self {
        Self {
            book_id: String::new(),
            cfi: String::new(),
            title: String::new(),
            created_at: 0,
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ReadingHistory {
    pub id: String,
    pub title: String,
    #[serde(default)]
    pub author: Option<String>,
    // Legacy inline data URL — kept for backward compat with older history.json files.
    #[serde(default)]
    pub cover: Option<String>,
    #[serde(default)]
    pub has_cover: Option<bool>,
    pub last_read_at: u64,
    pub progress: u32,
    #[serde(default)]
    pub cfi: Option<String>,
}

use std::fs;
use std::path::PathBuf;
use tauri::Manager;

fn app_data_dir(app_handle: &tauri::AppHandle) -> PathBuf {
    app_handle
        .path()
        .app_data_dir()
        .expect("failed to resolve app data dir")
}

pub fn load_config<T: for<'de> Deserialize<'de>>(
    app_handle: &tauri::AppHandle,
    filename: &str,
) -> Result<T, String> {
    let dir = app_data_dir(app_handle);
    let path = dir.join(filename);
    if !path.exists() {
        return Err(format!("config file not found: {}", filename));
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

pub fn save_config<T: Serialize>(
    app_handle: &tauri::AppHandle,
    filename: &str,
    data: &T,
) -> Result<(), String> {
    let dir = app_data_dir(app_handle);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join(filename);
    let content = serde_json::to_string_pretty(data).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}