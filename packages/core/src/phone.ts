/** Chuẩn hóa số điện thoại Việt Nam về dạng 0xxxxxxxxx. */
export const normalizeVnPhone = (input: string): string | null => {
  const digits = input.replace(/\D/gu, "");
  const local = digits.startsWith("84") ? `0${digits.slice(2)}` : digits;
  return /^0\d{9}$/u.test(local) ? local : null;
};

/** Cổng phụ huynh xác minh bằng 4 số cuối điện thoại phụ huynh. */
export const matchesPhoneSuffix = (
  phone: string | null,
  suffix: string,
): boolean => {
  if (!phone || !/^\d{4}$/u.test(suffix)) return false;
  return phone.replace(/\D/gu, "").endsWith(suffix);
};
