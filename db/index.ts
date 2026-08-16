export function getDb(): never {
  throw new Error(
    "A database has not been configured for this Vercel deployment yet.",
  );
}
