import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { parseCheckinQrPayload } from "@cxedu/core";

import { cx } from "@/lib/cx";
import { colors, space, ui } from "@/lib/theme";

/** Giáo viên quét mã QR xoay vòng ở lễ tân để check-in ca dạy. */
export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onScanned = async ({ data }: { data: string }) => {
    if (busy) return;
    const parsed = parseCheckinQrPayload(data);
    if (!parsed) {
      setMessage("Đây không phải mã check-in CXedu");
      return;
    }
    setBusy(true);
    const { error } = await cx.rpc("teacher_checkin", {
      p_center_id: parsed.centerId,
      p_code: parsed.code,
    });
    setBusy(false);
    setMessage(error ? error.message : "Đã check-in ca dạy ✓");
    if (!error) setTimeout(() => router.back(), 1200);
  };

  if (!permission) return <View style={ui.screen} />;
  if (!permission.granted) {
    return (
      <View style={[ui.screen, ui.content, { justifyContent: "center" }]}>
        <Text style={ui.heading}>Cần quyền camera để quét mã QR</Text>
        <Pressable style={ui.button} onPress={() => void requestPermission()}>
          <Text style={ui.buttonText}>Cho phép camera</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={ui.screen}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={busy ? undefined : (result) => void onScanned(result)}
      />
      <View style={{ padding: space.md, backgroundColor: colors.white }}>
        <Text style={ui.muted}>
          Hướng camera vào mã QR trên màn hình lễ tân. Mã đổi mỗi 45 giây.
        </Text>
        {message && (
          <Text style={[ui.heading, { marginTop: space.sm }]}>{message}</Text>
        )}
      </View>
    </View>
  );
}
