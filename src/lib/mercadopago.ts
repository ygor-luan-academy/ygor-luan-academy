import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

export const mpClient = new MercadoPagoConfig({
  accessToken: import.meta.env.MERCADOPAGO_ACCESS_TOKEN,
  options: { timeout: 5000 },
});

export const preference = new Preference(mpClient);
export const payment = new Payment(mpClient);
