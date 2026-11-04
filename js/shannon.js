/* Задание 2. Символьная аппроксимация текста по Шеннону: 0-й, 1-й и 2-й порядок. */
const Shannon = (() => {
  'use strict';

  const ALPHABETS = {
    en: ' abcdefghijklmnopqrstuvwxyz',
    ru: ' абвгдежзийклмнопрстуфхцчшщъыьэюя',
  };

  /** Приводит текст к алфавиту «буквы + пробел»: строчные буквы, ё → е, всё остальное → пробел. */
  function normalize(text) {
    return text
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^a-zа-я]+/g, ' ')
      .trim();
  }

  /** Какой алфавит преобладает в тексте. */
  function detectAlphabet(text) {
    const latin = (text.match(/[a-z]/gi) || []).length;
    const cyrillic = (text.match(/[а-яё]/gi) || []).length;
    return cyrillic > latin ? 'ru' : 'en';
  }

  /** Частоты символов и пар соседних символов нормализованного текста. */
  function analyze(text) {
    const single = new Map();          // символ -> количество
    const pairs = new Map();           // предыдущий символ -> Map(следующий символ -> количество)
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      single.set(c, (single.get(c) || 0) + 1);
      if (i > 0) {
        const prev = text[i - 1];
        let row = pairs.get(prev);
        if (!row) pairs.set(prev, (row = new Map()));
        row.set(c, (row.get(c) || 0) + 1);
      }
    }
    return { length: text.length, single, pairs };
  }

  function sum(freq) {
    let total = 0;
    for (const n of freq.values()) total += n;
    return total;
  }

  /** Случайный символ из таблицы частот с вероятностью, пропорциональной частоте. */
  function pick(freq, total) {
    let r = Math.random() * total;
    let last = '';
    for (const [c, n] of freq) {
      r -= n;
      if (r < 0) return c;
      last = c;
    }
    return last;
  }

  /** 0-й порядок: символы независимы и равновероятны. */
  function zeroOrder(alphabet, length) {
    let out = '';
    for (let i = 0; i < length; i++) {
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
  }

  /** 1-й порядок: символы независимы, вероятности равны частотам в тексте. */
  function firstOrder(stats, length) {
    let out = '';
    for (let i = 0; i < length; i++) out += pick(stats.single, stats.length);
    return out;
  }

  /** 2-й порядок: следующий символ выбирается по условным частотам p(j | i) после предыдущего. */
  function secondOrder(stats, length) {
    const rowTotals = new Map();
    for (const [c, row] of stats.pairs) rowTotals.set(c, sum(row));

    let prev = pick(stats.single, stats.length);
    let out = prev;
    while (out.length < length) {
      const row = stats.pairs.get(prev);
      // у последнего символа текста может не быть продолжения — тогда берём по частотам 1-го порядка
      prev = row ? pick(row, rowTotals.get(prev)) : pick(stats.single, stats.length);
      out += prev;
    }
    return out;
  }

  /** H0 = log2 M, H1 = −Σ p(i)·log2 p(i), H2 = −Σ p(i,j)·log2 p(j | i). */
  function entropies(stats) {
    const n = stats.length;
    const M = stats.single.size;

    let h1 = 0;
    for (const k of stats.single.values()) {
      const p = k / n;
      h1 -= p * Math.log2(p);
    }

    let h2 = 0;
    const pairsTotal = n - 1;
    if (pairsTotal > 0) {
      for (const row of stats.pairs.values()) {
        const rowTotal = sum(row);
        for (const k of row.values()) h2 -= (k / pairsTotal) * Math.log2(k / rowTotal);
      }
    }

    return { M, h0: Math.log2(M), h1, h2 };
  }

  /** Самые частые пары символов: [пара, количество, p(j | i)]. */
  function topPairs(stats, limit) {
    const list = [];
    for (const [prev, row] of stats.pairs) {
      const rowTotal = sum(row);
      for (const [next, k] of row) list.push([prev + next, k, k / rowTotal]);
    }
    list.sort((a, b) => b[1] - a[1]);
    return list.slice(0, limit);
  }

  const SAMPLES = {
    en: 'Information theory studies how messages are produced, transmitted and received. ' +
      'A source of information can be described as a process that chooses symbols one after another. ' +
      'If every letter of the alphabet were equally likely, the text would look like a random sequence of ' +
      'characters without any meaning. Real languages are very different. Some letters such as e, t, a and o ' +
      'appear much more often than others, and certain pairs of letters, for example th, he, in and er, are far ' +
      'more common than the rest. Because of these regularities a written language has a large redundancy: ' +
      'many letters can be removed from a sentence and a reader is still able to restore the original message. ' +
      'The amount of information is measured by entropy. For a source with equally probable symbols the entropy ' +
      'is the logarithm of the size of the alphabet, while for a real text it is much smaller, because the next ' +
      'letter is partly predictable from the previous ones. To illustrate this idea we can build a series of ' +
      'approximations to a natural language. In the zero order approximation the symbols are independent and ' +
      'equiprobable. In the first order approximation the symbols are still independent, but each of them ' +
      'appears with the same frequency as in an ordinary text. In the second order approximation the choice of ' +
      'every new letter depends on the letter that stands before it, so the structure of common pairs is ' +
      'preserved. As the order grows, the generated text becomes more and more similar to the language it was ' +
      'taken from, although it still has no real meaning. The same principles are used today in data ' +
      'compression, in error correcting codes and in modern systems for the secure transmission of data over ' +
      'communication channels. A good code assigns short words to frequent messages and long words to rare ' +
      'ones, so that the average length of a message is close to its entropy. The theory also shows that there ' +
      'is a limit to the rate at which data can be sent through a noisy channel without errors, and this limit ' +
      'is called the capacity of the channel.',
    ru: 'Теория информации изучает способы измерения, передачи и хранения сообщений. Источник информации ' +
      'можно представить как процесс, который последовательно выбирает символы из некоторого алфавита. ' +
      'Если бы все буквы появлялись одинаково часто и независимо друг от друга, текст выглядел бы как ' +
      'случайный набор знаков без всякого смысла. Однако в настоящем языке одни буквы встречаются намного ' +
      'чаще других, а некоторые сочетания букв, например ст, но, то и на, появляются особенно часто. ' +
      'Благодаря этим закономерностям письменная речь обладает большой избыточностью: из предложения можно ' +
      'удалить многие буквы, и читатель всё равно сможет восстановить исходное сообщение. Количество ' +
      'информации измеряется энтропией. Для источника с равновероятными символами энтропия равна логарифму ' +
      'числа букв алфавита, а для реального текста она заметно меньше, потому что следующая буква отчасти ' +
      'предсказуема по предыдущим. Чтобы показать это, строят последовательность приближений к естественному ' +
      'языку. В приближении нулевого порядка все символы независимы и равновероятны. В приближении первого ' +
      'порядка символы по-прежнему независимы, но каждый из них появляется с той же частотой, что и в обычном ' +
      'тексте. В приближении второго порядка выбор каждой новой буквы зависит от предыдущей, поэтому ' +
      'сохраняется структура часто встречающихся пар. С ростом порядка получаемый текст всё больше напоминает ' +
      'язык, на основе которого он построен, хотя смысла в нём по-прежнему нет. Те же идеи сегодня применяются ' +
      'при сжатии данных, в помехоустойчивом кодировании и в системах защищённой передачи сообщений по каналам ' +
      'связи. Хороший код назначает короткие кодовые слова частым сообщениям и длинные редким, чтобы средняя ' +
      'длина сообщения была близка к его энтропии.',
  };

  return {
    ALPHABETS,
    SAMPLES,
    normalize,
    detectAlphabet,
    analyze,
    zeroOrder,
    firstOrder,
    secondOrder,
    entropies,
    topPairs,
  };
})();
