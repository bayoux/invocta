import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendMessageResult {
  success: boolean;
  externalId?: string;
  errorMessage?: string;
}

@Injectable()
export class Ch2dService {
  private readonly logger = new Logger(Ch2dService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly senderId: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = configService.get<string>(
      'CH2D_API_URL',
      'https://api.ch2d.com',
    );
    this.apiKey = configService.get<string>('CH2D_API_KEY', '');
    this.senderId = configService.get<string>('CH2D_SENDER_ID', '');
  }

  async sendWhatsApp(
    phone: string,
    message: string,
  ): Promise<SendMessageResult> {
    try {
      // Нормализуем номер телефона
      const normalizedPhone = this.normalizePhone(phone);

      this.logger.log(
        `Sending WhatsApp to ${normalizedPhone}: ${message.substring(0, 50)}...`,
      );

      // В продакшн-среде здесь будет реальный HTTP запрос к Ch2D API:
      // const response = await fetch(`${this.apiUrl}/messages/whatsapp`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     to: normalizedPhone,
      //     from: this.senderId,
      //     type: 'text',
      //     text: { body: message },
      //   }),
      // });
      // const data = await response.json();
      // return { success: true, externalId: data.messages[0].id };

      // Мок для разработки:
      await this.simulateDelay();
      const mockId = `ch2d_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.logger.log(
        `[MOCK] WhatsApp sent successfully. External ID: ${mockId}`,
      );
      return { success: true, externalId: mockId };
    } catch (error) {
      this.logger.error(
        `Failed to send WhatsApp to ${phone}: ${error.message}`,
      );
      return { success: false, errorMessage: error.message };
    }
  }

  async sendSms(phone: string, message: string): Promise<SendMessageResult> {
    try {
      const normalizedPhone = this.normalizePhone(phone);

      this.logger.log(`Sending SMS to ${normalizedPhone}`);

      // Мок для разработки
      await this.simulateDelay();
      const mockId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.logger.log(`[MOCK] SMS sent successfully. External ID: ${mockId}`);
      return { success: true, externalId: mockId };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phone}: ${error.message}`);
      return { success: false, errorMessage: error.message };
    }
  }

  private normalizePhone(phone: string): string {
    // Убираем все кроме цифр и +
    let normalized = phone.replace(/[^\d+]/g, '');
    // Если начинается с 0, заменяем на +996
    if (normalized.startsWith('0')) {
      normalized = '+996' + normalized.slice(1);
    }
    // Если нет +, добавляем
    if (!normalized.startsWith('+')) {
      normalized = '+' + normalized;
    }
    return normalized;
  }

  private simulateDelay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 100));
  }
}
