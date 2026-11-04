/* Общие помощники для страниц заданий: поиск элементов, экранирование, форматирование чисел. */
'use strict';

const $ = (id) => document.getElementById(id);

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** Экранирование текста перед вставкой в innerHTML. */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESCAPES[c]);

const numberFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 4 });
/** Число по-русски: десятичная запятая, разряды через пробел. */
const fmt = (x) => numberFormat.format(x);
const round = (x, digits) => Math.round(x * 10 ** digits) / 10 ** digits;

/** Число в виде a·10^b (HTML). */
function sci(x) {
  if (x === 0) return '0';
  let exp = Math.floor(Math.log10(Math.abs(x)));
  let mantissa = round(x / 10 ** exp, 3);
  if (Math.abs(mantissa) >= 10) {
    mantissa /= 10;
    exp += 1;
  }
  return `${fmt(mantissa)}·10<sup>${exp}</sup>`;
}

/** Видимое представление пробельных символов в таблицах. */
function visible(ch) {
  if (ch === ' ') return '␣';
  if (ch === '\n') return '↵';
  if (ch === '\r') return '␍';
  if (ch === '\t') return '⇥';
  return ch;
}

/** Число из поля ввода: допускаются запятая вместо точки и пробелы между разрядами. NaN, если не число. */
function parseDecimal(value) {
  const s = value.replace(/\s+/g, '').replace(',', '.');
  return s === '' ? NaN : Number(s);
}
