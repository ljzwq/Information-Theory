/* Задание 3. Алгоритм RSA на длинной арифметике (BigInt). */
const RSA = (() => {
  'use strict';

  const BASES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
  const MAX_CODE_POINT = 0x10FFFFn;

  /** Быстрое возведение в степень по модулю (метод «возводи в квадрат и умножай»). */
  function modPow(base, exp, mod) {
    if (mod === 1n) return 0n;
    let result = 1n;
    base %= mod;
    while (exp > 0n) {
      if (exp & 1n) result = (result * base) % mod;
      base = (base * base) % mod;
      exp >>= 1n;
    }
    return result;
  }

  function gcd(a, b) {
    while (b) [a, b] = [b, a % b];
    return a;
  }

  /** Обратный элемент a⁻¹ mod m расширенным алгоритмом Евклида; null, если НОД(a, m) ≠ 1. */
  function modInverse(a, m) {
    let [r0, r1] = [a, m];
    let [s0, s1] = [1n, 0n];
    while (r1 !== 0n) {
      const q = r0 / r1;
      [r0, r1] = [r1, r0 - q * r1];
      [s0, s1] = [s1, s0 - q * s1];
    }
    if (r0 !== 1n) return null;
    return ((s0 % m) + m) % m;
  }

  /** Тест Миллера — Рабина; с этими основаниями точен для n < 3,3·10^24. */
  function isPrime(n) {
    if (n < 2n) return false;
    for (const p of BASES) {
      if (n === p) return true;
      if (n % p === 0n) return false;
    }
    let d = n - 1n;
    let s = 0;
    while ((d & 1n) === 0n) {
      d >>= 1n;
      s++;
    }
    outer: for (const a of BASES) {
      let x = modPow(a, d, n);
      if (x === 1n || x === n - 1n) continue;
      for (let r = 1; r < s; r++) {
        x = (x * x) % n;
        if (x === n - 1n) continue outer;
      }
      return false;
    }
    return true;
  }

  /** Случайное простое число из [min, max]. */
  function randomPrime(min, max) {
    for (;;) {
      const x = BigInt(min + Math.floor(Math.random() * (max - min + 1)));
      if (isPrime(x)) return x;
    }
  }

  /** e по умолчанию: 65537, если подходит, иначе наименьшее нечётное e ≥ 3, взаимно простое с φ. */
  function defaultExponent(phi) {
    if (65537n < phi && gcd(65537n, phi) === 1n) return 65537n;
    for (let e = 3n; e < phi; e += 2n) {
      if (gcd(e, phi) === 1n) return e;
    }
    return null;
  }

  /** Генерация пары ключей по p, q и (необязательно) e. Ошибки — в виде Error с понятным текстом. */
  function generateKeys(p, q, e) {
    if (!isPrime(p)) throw new Error(`p = ${p} не является простым числом`);
    if (!isPrime(q)) throw new Error(`q = ${q} не является простым числом`);
    if (p === q) throw new Error('p и q должны быть различными');

    const n = p * q;
    const phi = (p - 1n) * (q - 1n);
    const auto = e === null;
    if (auto) {
      e = defaultExponent(phi);
      if (e === null) throw new Error('Не удалось подобрать e — возьмите p и q побольше');
    }
    if (e <= 1n || e >= phi) throw new Error(`e должно удовлетворять условию 1 < e < φ(n) = ${phi}`);
    const g = gcd(e, phi);
    if (g !== 1n) {
      throw new Error(`НОД(e, φ(n)) = НОД(${e}, ${phi}) = ${g} ≠ 1 — e и φ(n) должны быть взаимно простыми`);
    }
    const d = modInverse(e, phi);
    return { p, q, n, phi, e, d, auto };
  }

  /** Каждый символ → код Unicode m → c = m^e mod n. */
  function encrypt(text, e, n) {
    return Array.from(text).map((ch) => {
      const m = BigInt(ch.codePointAt(0));
      if (m >= n) {
        throw new Error(`Код символа «${ch}» m = ${m} не меньше n = ${n}. ` +
          'Возьмите p и q побольше (например, кнопкой «Случайные p и q»).');
      }
      return { ch, m, c: modPow(m, e, n) };
    });
  }

  /** Каждое число c → m = c^d mod n → символ. */
  function decrypt(numbers, d, n) {
    return numbers.map((c) => {
      if (c >= n) throw new Error(`Число ${c} не меньше n = ${n} — это не шифртекст для данного ключа`);
      const m = modPow(c, d, n);
      const ch = m <= MAX_CODE_POINT ? String.fromCodePoint(Number(m)) : '�';
      return { c, m, ch };
    });
  }

  /** Разбор строки с числами, разделёнными пробелами, запятыми или переводами строк. */
  function parseNumbers(str) {
    return str.trim().split(/[\s,;]+/).filter(Boolean).map((part) => {
      if (!/^\d+$/.test(part)) throw new Error(`«${part}» — не целое неотрицательное число`);
      return BigInt(part);
    });
  }

  return {
    modPow,
    gcd,
    modInverse,
    isPrime,
    randomPrime,
    generateKeys,
    encrypt,
    decrypt,
    parseNumbers,
  };
})();
