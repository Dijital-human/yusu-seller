/**
 * Admin Password Recovery / Admin Parol Bərpası
 * This file handles admin password recovery mechanisms
 * Bu fayl admin parol bərpası mexanizmlərini idarə edir
 */

import crypto from 'crypto';

export class AdminPasswordRecovery {
  private static readonly RECOVERY_CODES = [
    'YUSU2024ADMIN001',
    'YUSU2024ADMIN002', 
    'YUSU2024ADMIN003',
    'YUSU2024ADMIN004',
    'YUSU2024ADMIN005'
  ];

  private static readonly BACKUP_EMAIL = 'famil.mustafayev.099@gmail.com';
  private static readonly MASTER_RECOVERY_KEY = 'YusuMasterRecovery2024SecretKey123456789';

  // Recovery kodunu yoxlamaq
  static verifyRecoveryCode(code: string): boolean {
    return this.RECOVERY_CODES.includes(code.toUpperCase());
  }

  // Master recovery key yoxlamaq
  static verifyMasterKey(key: string): boolean {
    return key === this.MASTER_RECOVERY_KEY;
  }

  // Yeni parol yaratmaq
  static generateNewPassword(): string {
    const timestamp = Date.now().toString().slice(-6);
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `YusuAdmin${timestamp}${randomPart}`;
  }

  // Parol bərpası üçün token yaratmaq
  static generateRecoveryToken(): string {
    const payload = {
      type: 'password_recovery',
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex')
    };
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex')
      .substring(0, 32)
      .toUpperCase();
  }

  // Recovery token doğrulamaq
  static verifyRecoveryToken(token: string): boolean {
    // Token format yoxlaması
    if (!token || token.length !== 32) {
      return false;
    }
    
    // Token yaşını yoxla (1 saat)
    const timestamp = parseInt(token.substring(0, 8), 16);
    const now = Date.now();
    const tokenAge = now - timestamp;
    const maxAge = 3600000; // 1 saat
    
    return tokenAge <= maxAge;
  }

  // Admin məlumatlarını almaq
  static getAdminInfo(): { email: string; recoveryCodes: string[] } {
    return {
      email: this.BACKUP_EMAIL,
      recoveryCodes: this.RECOVERY_CODES
    };
  }

  // Parol bərpası üçün təhlükəsiz yoxlama
  static validateRecoveryRequest(code: string, masterKey: string): boolean {
    return this.verifyRecoveryCode(code) && this.verifyMasterKey(masterKey);
  }
}
