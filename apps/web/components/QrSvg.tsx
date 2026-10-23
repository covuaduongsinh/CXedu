import QRCode from "qrcode";

/** Render mã QR thành SVG phía server (không phụ thuộc dịch vụ ngoài). */
export const QrSvg = async ({
  value,
  size = 200,
  label,
}: {
  value: string;
  size?: number;
  label: string;
}) => {
  const svg = await QRCode.toString(value, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#1A1A2E", light: "#FFFFFF" },
  });
  return (
    <div
      role="img"
      aria-label={label}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
