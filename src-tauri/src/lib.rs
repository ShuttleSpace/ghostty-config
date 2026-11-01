// Ghostty Config Tauri backend
// Provides platform-native file/clipboard access and Ghostty config sync.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::{Manager, WindowEvent};

#[derive(Serialize, Deserialize, Clone, Debug)]
struct GhosttyConfigPath {
    path: String,
    exists: bool,
}

/// Resolve the user's Ghostty config file path.
/// Mirrors Ghostty's own default: ~/.config/ghostty/config on Unix,
/// ~/Library/Application Support/com.mitchellh.ghostty/config on macOS.
fn ghostty_config_path() -> PathBuf {
    #[cfg(target_os = "macos")]
    {
        if let Ok(home) = std::env::var("HOME") {
            return PathBuf::from(format!(
                "{}/Library/Application Support/com.mitchellh.ghostty/config",
                home
            ));
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(xdg) = std::env::var("XDG_CONFIG_HOME") {
            if !xdg.is_empty() {
                return PathBuf::from(format!("{}/ghostty/config", xdg));
            }
        }
        if let Ok(home) = std::env::var("HOME") {
            return PathBuf::from(format!("{}/.config/ghostty/config", home));
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Ok(appdata) = std::env::var("APPDATA") {
            if !appdata.is_empty() {
                return PathBuf::from(format!("{}\\ghostty\\config", appdata));
            }
        }
    }

    PathBuf::from("ghostty-config")
}

#[tauri::command]
fn read_ghostty_config() -> Result<String, String> {
    let path = ghostty_config_path();
    match std::fs::read_to_string(&path) {
        Ok(content) => Ok(content),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(String::new()),
        Err(e) => Err(format!("Failed to read Ghostty config: {}", e)),
    }
}

#[tauri::command]
fn write_ghostty_config(content: String) -> Result<String, String> {
    let path = ghostty_config_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }
    std::fs::write(&path, content)
        .map_err(|e| format!("Failed to write Ghostty config: {}", e))?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn ghostty_config_info() -> GhosttyConfigPath {
    let path = ghostty_config_path();
    GhosttyConfigPath {
        exists: path.exists(),
        path: path.to_string_lossy().to_string(),
    }
}

/// List the system-installed font families by shelling out to `ghostty +list-fonts`.
/// Ghostty enumerates the OS font catalog (fontconfig on Linux, Core Text on macOS), so this
/// yields the same names the terminal would resolve — including user-installed fonts.
/// Returns deduplicated, sorted family names. Empty if Ghostty isn't available.
#[tauri::command]
fn list_fonts() -> Vec<String> {
    // GUI apps (esp. on macOS launched from Finder) inherit a minimal PATH, so
    // `ghostty` may not be resolvable by name even when installed. Try the PATH
    // lookup first, then well-known install locations.
    let mut candidates: Vec<String> = vec!["ghostty".to_string()];

    #[cfg(target_os = "macos")]
    candidates.push("/Applications/Ghostty.app/Contents/MacOS/ghostty".to_string());

    if let Ok(home) = std::env::var("HOME") {
        candidates.push(format!("{}/.local/bin/ghostty", home));
        #[cfg(target_os = "macos")]
        candidates.push(format!("{}/Applications/Ghostty.app/Contents/MacOS/ghostty", home));
    }
    candidates.push("/usr/local/bin/ghostty".to_string());
    candidates.push("/opt/homebrew/bin/ghostty".to_string());
    candidates.push("/usr/bin/ghostty".to_string());

    let mut stdout: Option<String> = None;
    for program in candidates {
        if program.contains('/') && !std::path::Path::new(&program).exists() {
            continue;
        }
        if let Ok(out) = std::process::Command::new(&program).arg("+list-fonts").output() {
            if out.status.success() {
                stdout = Some(String::from_utf8_lossy(&out.stdout).into_owned());
                break;
            }
        }
    }

    let mut fonts: Vec<String> = match stdout {
        Some(text) => {
            let mut seen = std::collections::HashSet::new();
            let mut collected = Vec::new();
            for line in text.lines() {
                // Style lines in Ghostty's tree output are indented; only keep top-level families.
                if line != line.trim() {
                    continue;
                }
                let trimmed = line.trim();
                if trimmed.is_empty() {
                    continue;
                }
                // Some builds print a "Font Listing" header first.
                if trimmed.eq_ignore_ascii_case("font listing") {
                    continue;
                }
                // Drop a trailing " (Style)" annotation if present.
                let family = trimmed
                    .split(" (")
                    .next()
                    .unwrap_or(trimmed)
                    .trim()
                    .to_string();
                if family.is_empty() {
                    continue;
                }
                let key = family.to_lowercase();
                if seen.insert(key) {
                    collected.push(family);
                }
            }
            collected
        }
        None => Vec::new(),
    };

    fonts.sort();
    fonts
}

/// Expose the process environment variables so the frontend can offer real
/// system values (e.g. autocompleting variable names for the `env` setting).
#[tauri::command]
fn get_env() -> std::collections::HashMap<String, String> {
    std::env::vars().collect()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // The setup closure only does work in debug builds (open devtools);
            // `let _ = app` keeps the binding referenced in release builds too.
            let _ = app;
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                // On macOS, keep the app running when the window closes
                #[cfg(target_os = "macos")]
                {
                    window.app_handle().hide().unwrap();
                    api.prevent_close();
                }
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            read_ghostty_config,
            write_ghostty_config,
            ghostty_config_info,
            list_fonts,
            get_env,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}