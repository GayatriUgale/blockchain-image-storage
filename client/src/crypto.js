const MSG = "Derive file encryption key for Decentralized File Storage v1";
const keyCache = {};

async function getKey(signer, account) {
  if (keyCache[account]) return keyCache[account];
  const sig = await signer.signMessage(MSG);
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sig));
  const key = await crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
  keyCache[account] = key;
  return key;
}

export async function encryptFile(file, signer, account) {
  const key = await getKey(signer, account);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, await file.arrayBuffer());
  const out = new Uint8Array(12 + enc.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(enc), 12);
  return new Blob([out], { type: "application/octet-stream" });
}

export async function decryptToBlob(buffer, signer, account, mime) {
  const key = await getKey(signer, account);
  const bytes = new Uint8Array(buffer);
  const dec = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: bytes.slice(0, 12) },
    key,
    bytes.slice(12)
  );
  return new Blob([dec], { type: mime || "application/octet-stream" });
}