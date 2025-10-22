/**
 * Simple Admin Authentication / Sadə Admin Autentifikasiyası
 * This file handles admin authentication with encryption
 * Bu fayl admin autentifikasiyasını şifrələmə ilə idarə edir
 */

import crypto from 'crypto';

export class SimpleAdminAuth {
  private static readonly MASTER_KEY = process.env.ADMIN_MASTER_KEY!;
  private static readonly SALT = process.env.ADMIN_ENCRYPTION_SALT!;
  
  // Admin məlumatlarını şifrələmək
  static encryptAdminData(data: any): string {
    const key = crypto.pbkdf2Sync(this.MASTER_KEY, this.SALT, 100000, 32, 'sha512');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }
  
  // Admin məlumatlarını açmaq
  static decryptAdminData(encryptedData: string): any {
    const [ivHex, encrypted] = encryptedData.split(':');
    const key = crypto.pbkdf2Sync(this.MASTER_KEY, this.SALT, 100000, 32, 'sha512');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
  
  // Admin girişini yoxlamaq
  static verifyAdmin(email: string, password: string): boolean {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    return email === adminEmail && password === adminPassword;
  }
  
  // Admin token yaratmaq
  static generateAdminToken(adminData: any): string {
    const payload = {
      ...adminData,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    
    return this.encryptAdminData(payload);
  }
  
  // Admin token doğrulamaq
  static verifyAdminToken(token: string): any {
    try {
      const decrypted = this.decryptAdminData(token);
      const payload = JSON.parse(decrypted);
      
      // Token yaşını yoxla (1 saat)
      const now = Date.now();
      const tokenAge = now - payload.timestamp;
      const maxAge = 3600000; // 1 saat
      
      if (tokenAge > maxAge) {
        throw new Error('Token expired');
      }
      
      return payload;
    } catch (error) {
      throw new Error('Invalid admin token');
    }
  }

  // Admin parolunu yeniləmək
  static updateAdminPassword(newPassword: string): boolean {
    try {
      // Environment variable-ı yeniləmək (production-da fərqli yanaşma lazımdır)
      process.env.ADMIN_PASSWORD = newPassword;
      return true;
    } catch (error) {
      console.error('Password update failed:', error);
      return false;
    }
  }

  // Admin məlumatlarını yoxlamaq
  static getAdminInfo(): { email: string; hasPassword: boolean } {
    return {
      email: process.env.ADMIN_EMAIL || '',
      hasPassword: !!process.env.ADMIN_PASSWORD
    };
  }
}
