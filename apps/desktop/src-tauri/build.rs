fn main() {
    // Cho phép trang web CXedu (remote) gọi lệnh `open_kiosk` qua capability.
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(&["open_kiosk"])),
    )
    .expect("failed to run tauri-build");
}
