'use server'
export async function verifyPassword(password: string): Promise<boolean> {
  return password === process.env.ADMIN_PASSWORD
}
