import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, slugify, formatDuration, cn, findAdjacentLessons } from '../../../src/lib/utils';

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

describe('findAdjacentLessons', () => {
  type Fixture = { id: string; title: string };
  const lessons: Fixture[] = [
    { id: 'a', title: 'Aula 1' },
    { id: 'b', title: 'Aula 2' },
    { id: 'c', title: 'Aula 3' },
  ];

  it('retorna defaults quando lista está vazia', () => {
    expect(findAdjacentLessons([], 'x')).toEqual({ prev: null, next: null, position: 0, total: 0 });
  });

  it('retorna defaults quando ID não é encontrado', () => {
    expect(findAdjacentLessons(lessons, 'z')).toEqual({ prev: null, next: null, position: 0, total: 3 });
  });

  it('primeira aula: prev null, next = segunda', () => {
    expect(findAdjacentLessons(lessons, 'a')).toEqual({ prev: null, next: lessons[1], position: 1, total: 3 });
  });

  it('última aula: prev = penúltima, next null', () => {
    expect(findAdjacentLessons(lessons, 'c')).toEqual({ prev: lessons[1], next: null, position: 3, total: 3 });
  });

  it('aula do meio: prev e next corretos', () => {
    expect(findAdjacentLessons(lessons, 'b')).toEqual({ prev: lessons[0], next: lessons[2], position: 2, total: 3 });
  });

  it('lista com único item: prev e next null, position 1', () => {
    expect(findAdjacentLessons([{ id: 'x', title: 'X' }], 'x')).toEqual({ prev: null, next: null, position: 1, total: 1 });
  });

  it('prev mantém identidade de referência', () => {
    const result = findAdjacentLessons(lessons, 'b');
    expect(result.prev).toBe(lessons[0]);
  });
});
