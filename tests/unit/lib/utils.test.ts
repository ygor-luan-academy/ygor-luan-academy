import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, slugify, formatDuration, cn } from '../../../src/lib/utils';

describe('formatCurrency', () => {
  it('formata valor em BRL', () => {
    expect(formatCurrency(997)).toContain('997');
    expect(formatCurrency(997)).toContain('R$');
  });

  it('formata zero', () => {
    expect(formatCurrency(0)).toContain('0');
  });
});

describe('formatDate', () => {
  it('formata string ISO para pt-BR', () => {
    const result = formatDate('2024-01-15T00:00:00.000Z');
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('formata objeto Date', () => {
    const result = formatDate(new Date('2024-06-01'));
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

describe('slugify', () => {
  it('converte texto simples', () => {
    expect(slugify('Técnicas de Barba')).toBe('tecnicas-de-barba');
  });

  it('remove acentos', () => {
    expect(slugify('Aula de Navalha')).toBe('aula-de-navalha');
  });

  it('remove caracteres especiais', () => {
    expect(slugify('Corte & Barba!')).toBe('corte-barba');
  });

  it('colapsa múltiplos hifens', () => {
    expect(slugify('aula   tripla')).toBe('aula-tripla');
  });
});

describe('formatDuration', () => {
  it('retorna minutos quando < 60', () => {
    expect(formatDuration(45)).toBe('45min');
  });

  it('retorna horas quando exato', () => {
    expect(formatDuration(60)).toBe('1h');
  });

  it('retorna horas e minutos', () => {
    expect(formatDuration(90)).toBe('1h30min');
  });
});

describe('cn', () => {
  it('junta classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('ignora falsy values', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar');
  });
});
