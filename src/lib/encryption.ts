import CryptoJS from "crypto-js";

const KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || "default-key-change-in-production";

export function encryptData(data: string): string {
  return CryptoJS.AES.encrypt(data, KEY).toString();
}

export function decryptData(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
