const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** ULID: 48 bits de tempo + 80 bits aleatórios. Ordenável e sem colisão prática. */
export function ulid(now: number = Date.now()): string {
  let time = "";
  let t = now;
  for (let i = 0; i < 10; i++) {
    time = ALPHABET[t % 32] + time;
    t = Math.floor(t / 32);
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let rand = "";
  for (const b of bytes) rand += ALPHABET[b % 32];
  return time + rand;
}
