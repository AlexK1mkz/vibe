import "server-only";

/**
 * Адаптер WhatsApp. Провайдер не выбран (ТЗ, п. 3), поэтому по умолчанию работает заглушка,
 * которая пишет сообщение в лог. Чтобы подключить провайдера, добавьте реализацию
 * WhatsAppProvider в PROVIDERS и укажите её имя в WHATSAPP_PROVIDER.
 */

export interface SendResult {
  ok: boolean;
  provider: string;
  detail?: string;
}

export interface WhatsAppProvider {
  name: string;
  /**
   * @param to номер в формате +7XXXXXXXXXX
   * @param templateId идентификатор сообщения из content/funnel/messages.json
   * @param vars подстановки; vars.text содержит готовый текст сообщения
   */
  sendMessage(to: string, templateId: string, vars: Record<string, string>): Promise<SendResult>;
}

const stub: WhatsAppProvider = {
  name: "stub",
  async sendMessage(to, templateId, vars) {
    console.log(`[whatsapp:stub] → ${to} [${templateId}]\n${vars.text ?? JSON.stringify(vars)}`);
    return { ok: true, provider: "stub", detail: "Заглушка: сообщение записано в лог" };
  },
};

const PROVIDERS: Record<string, WhatsAppProvider> = { stub };

export function getWhatsApp(): WhatsAppProvider {
  const name = process.env.WHATSAPP_PROVIDER || "stub";
  const provider = PROVIDERS[name];
  if (!provider) {
    console.warn(`[whatsapp] провайдер «${name}» не реализован, используется заглушка`);
    return stub;
  }
  return provider;
}

export function sendMessage(to: string, templateId: string, vars: Record<string, string>): Promise<SendResult> {
  return getWhatsApp().sendMessage(to, templateId, vars);
}
