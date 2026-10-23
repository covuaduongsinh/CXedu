use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

/// Địa chỉ web app CXedu; đặt `CXEDU_APP_URL` khi build để trỏ sang môi trường khác.
fn app_url() -> String {
    option_env!("CXEDU_APP_URL")
        .unwrap_or("http://localhost:3000")
        .trim_end_matches('/')
        .to_string()
}

/// Mở màn hình QR check-in toàn màn hình cho máy lễ tân.
#[tauri::command]
fn open_kiosk(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("kiosk") {
        return window.set_focus().map_err(|error| error.to_string());
    }
    let url = format!("{}/kiosk", app_url())
        .parse()
        .map_err(|error: url::ParseError| error.to_string())?;
    WebviewWindowBuilder::new(&app, "kiosk", WebviewUrl::External(url))
        .title("CXedu — QR check-in")
        .fullscreen(true)
        .build()
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![open_kiosk])
        .setup(|app| {
            let url = format!("{}/dashboard", app_url()).parse()?;
            WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url))
                .title("CXedu")
                .inner_size(1280.0, 820.0)
                .min_inner_size(960.0, 640.0)
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running CXedu desktop");
}
