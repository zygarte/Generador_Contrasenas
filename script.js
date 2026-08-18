// ============================================================
//  GENERADOR DE CONTRASEÑAS - explicado para niños de primaria 🧒
// ============================================================
//
// ¿Recuerdas la app de "Cifrado ASCII"? Ahí cada letra tenía un
// número secreto (su código ASCII), por ejemplo "A" = 65.
//
// Aquí usamos esa misma idea, pero para construir una
// CONTRASEÑA fuerte a partir de una frase que tú escribas.
//
// Piensa que tu frase es como una bolsa de ingredientes para
// cocinar. El programa toma cada letra de tu frase y "cocina"
// con ella una o dos piezas nuevas:
//
//   - la letra misma, pero a veces en mayúscula y a veces en
//     minúscula (como tirar una moneda: cara o sello),
//   - y, según si su número secreto es par o impar, también un
//     SÍMBOLO (como "!" o "#") o un NÚMERO (como "7").
//
// Después mezclamos todas esas piezas como si fueran fichas de
// un juego dentro de una bolsa, las revolvemos muy bien (con un
// generador de números "de verdad" aleatorios, no uno de
// mentiras), y revisamos que la contraseña final tenga de todo:
// mayúsculas, minúsculas, números y símbolos. Si le falta algo,
// lo agregamos. Así siempre queda una contraseña fuerte y
// distinta cada vez, aunque uses la misma frase.
// ============================================================

(() => {
  // ------------------------------------------------------------
  //  Estas son nuestras "cajas de piezas": los grupos de
  //  caracteres que podemos usar para armar la contraseña.
  // ------------------------------------------------------------
  const LOWER = 'abcdefghijklmnopqrstuvwxyz';        // minúsculas
  const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';         // mayúsculas
  const DIGITS = '0123456789';                        // números
  const SYMBOLS = '!@#$%^&*()-_=+[]{}<>?/';            // símbolos
  const ALL = LOWER + UPPER + DIGITS + SYMBOLS;        // todas juntas

  // Buscamos en la página los elementos con los que vamos a
  // trabajar, como buscar las piezas de un juego de mesa antes
  // de empezar a jugar.
  const phraseInput = document.getElementById('phrase-input');
  const lengthRange = document.getElementById('length-range');
  const lengthValue = document.getElementById('length-value');
  const generateBtn = document.getElementById('generate-btn');
  const passwordOutput = document.getElementById('password-output');
  const strengthFill = document.getElementById('strength-fill');
  const strengthLabel = document.getElementById('strength-label');
  const tapeTrack = document.getElementById('tape-track');
  const copyBtn = document.getElementById('copy-btn');
  const statusEl = document.getElementById('status');

  let statusTimer = null;

  // ------------------------------------------------------------
  //  DADO DE VERDAD 🎲: en vez de usar Math.random() (que es un
  //  dado "de mentiras", fácil de adivinar), usamos
  //  crypto.getRandomValues(), que es como un dado de casino: le
  //  pedimos al navegador un número muy difícil de predecir. Esto
  //  es justo lo que se usa para hacer contraseñas de verdad
  //  seguras.
  //
  //  secureRandomInt(n) nos da un número entero al azar entre
  //  0 y n-1 (sin contar el n), como sacar una bolita numerada
  //  de una tómbola.
  // ------------------------------------------------------------
  function secureRandomInt(maxExclusive) {
    if (maxExclusive <= 0) return 0;

    // Le pedimos al navegador un número al azar gigante (32 bits).
    const maxUint32 = 0xffffffff;

    // Este truco ("rejection sampling") evita que unos números
    // salgan un poquito más seguido que otros por culpa del
    // residuo de la división. Es como descartar una tirada de
    // dado si cae en el borde de la mesa, y volver a tirar.
    const limit = Math.floor((maxUint32 + 1) / maxExclusive) * maxExclusive;

    let randomValue;
    do {
      randomValue = crypto.getRandomValues(new Uint32Array(1))[0];
    } while (randomValue >= limit);

    return randomValue % maxExclusive;
  }

  // Saca un carácter al azar de un grupo de caracteres.
  // Ejemplo: secureRandomChar("ABC") puede devolver "A", "B" o "C".
  function secureRandomChar(charset) {
    return charset[secureRandomInt(charset.length)];
  }

  // Como tirar una moneda: true (cara) o false (sello), al azar.
  function secureRandomBool() {
    return secureRandomInt(2) === 1;
  }

  // ------------------------------------------------------------
  //  BARAJAR (shuffle) 🔀: revuelve el orden de una lista de
  //  piezas, como cuando barajas cartas antes de repartirlas,
  //  para que el orden final no se parezca al de tu frase
  //  original. Usamos el método "Fisher-Yates", una forma
  //  clásica y justa de barajar.
  // ------------------------------------------------------------
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = secureRandomInt(i + 1);
      // Intercambiamos la pieza i con la pieza j (como cambiar
      // dos cartas de lugar dentro del mazo).
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const isLetter = (ch) => /[a-zA-Z]/.test(ch);

  // ------------------------------------------------------------
  //  Toma la frase del usuario y, letra por letra, "cocina"
  //  piezas nuevas usando su código ASCII (igual que en la app
  //  de Cifrado ASCII). Cada pieza sabe de qué letra vino, para
  //  poder dibujar la "cinta" más abajo.
  //
  //  Por cada letra se generan hasta 2 piezas:
  //    1) la letra misma, con mayúscula o minúscula al azar
  //    2) un símbolo (si su código es par) o un número
  //       (si su código es impar)
  //
  //  Los caracteres que no son letras (números, signos que ya
  //  traiga la frase) también aportan un número, usando su
  //  propio código. Los espacios simplemente se saltan, no
  //  aportan ninguna pieza.
  // ------------------------------------------------------------
  function buildPiecesFromPhrase(phrase) {
    const pieces = [];

    for (const ch of phrase) {
      if (ch === ' ') continue; // los espacios no aportan piezas

      const code = ch.charCodeAt(0); // el "número secreto" del carácter

      if (isLetter(ch)) {
        // Pieza 1: la letra, con mayúscula o minúscula al azar.
        const cased = secureRandomBool() ? ch.toUpperCase() : ch.toLowerCase();
        pieces.push({ from: ch, code, out: cased, kind: 'letra' });

        // Pieza 2: símbolo si el código es par, número si es impar.
        if (code % 2 === 0) {
          const symbol = SYMBOLS[code % SYMBOLS.length];
          pieces.push({ from: ch, code, out: symbol, kind: 'símbolo' });
        } else {
          const digit = String(code % 10);
          pieces.push({ from: ch, code, out: digit, kind: 'número' });
        }
      } else {
        // No es letra ni espacio (por ejemplo "5" o "!"):
        // aporta un número basado en su propio código.
        const digit = String(code % 10);
        pieces.push({ from: ch, code, out: digit, kind: 'número' });
      }
    }

    return pieces;
  }

  // ------------------------------------------------------------
  //  Revisa que la contraseña tenga, como mínimo, una mayúscula,
  //  una minúscula, un número y un símbolo (las reglas básicas
  //  que piden casi todos los sitios de internet). Si le falta
  //  algún tipo, reemplaza una posición al azar por un carácter
  //  de ese tipo, como cambiar una ficha que falta en un tablero.
  // ------------------------------------------------------------
  function ensureAllCategories(chars) {
    const hasUpper = chars.some((c) => /[A-Z]/.test(c));
    const hasLower = chars.some((c) => /[a-z]/.test(c));
    const hasDigit = chars.some((c) => /[0-9]/.test(c));
    const hasSymbol = chars.some((c) => SYMBOLS.includes(c));

    const missing = [];
    if (!hasUpper) missing.push(() => secureRandomChar(UPPER));
    if (!hasLower) missing.push(() => secureRandomChar(LOWER));
    if (!hasDigit) missing.push(() => secureRandomChar(DIGITS));
    if (!hasSymbol) missing.push(() => secureRandomChar(SYMBOLS));

    // Elegimos posiciones al azar (distintas entre sí, si es
    // posible) para colocar lo que faltaba.
    const usedPositions = new Set();
    missing.forEach((makePiece) => {
      let pos = secureRandomInt(chars.length);
      let attempts = 0;
      while (usedPositions.has(pos) && attempts < chars.length) {
        pos = secureRandomInt(chars.length);
        attempts++;
      }
      usedPositions.add(pos);
      chars[pos] = makePiece();
    });

    return chars;
  }

  // ------------------------------------------------------------
  //  Esta es la función principal: junta todo lo anterior para
  //  construir la contraseña final.
  //
  //  Pasos:
  //   1) Convierte la frase en piezas (letras/números/símbolos).
  //   2) Si faltan piezas para llegar a la longitud pedida, se
  //      completan con caracteres totalmente aleatorios.
  //   3) Se baraja todo (para que el orden no se parezca a la
  //      frase original).
  //   4) Se recorta al tamaño exacto que pidió el usuario.
  //   5) Se revisa que cumpla las reglas básicas de seguridad
  //      (mayúscula + minúscula + número + símbolo).
  // ------------------------------------------------------------
  function generatePassword(phrase, length) {
    const pieces = buildPiecesFromPhrase(phrase);
    let chars = pieces.map((p) => p.out);

    // Si la frase es corta y no alcanza, rellenamos con
    // caracteres al azar de todo el conjunto.
    while (chars.length < length) {
      chars.push(secureRandomChar(ALL));
    }

    shuffleArray(chars);          // barajar como cartas
    chars = chars.slice(0, length); // recortar al tamaño pedido
    chars = ensureAllCategories(chars); // garantizar variedad

    return { password: chars.join(''), pieces };
  }

  // ------------------------------------------------------------
  //  Calcula qué tan fuerte es la contraseña, para mostrar la
  //  barrita de colores. La idea (simplificada para que se
  //  entienda fácil): entre más variedad de caracteres y más
  //  larga sea la contraseña, más combinaciones posibles existen
  //  y más difícil es de adivinar para una computadora.
  // ------------------------------------------------------------
  function estimateStrength(password) {
    let poolSize = 0;
    if (/[a-z]/.test(password)) poolSize += LOWER.length;
    if (/[A-Z]/.test(password)) poolSize += UPPER.length;
    if (/[0-9]/.test(password)) poolSize += DIGITS.length;
    if (/[^a-zA-Z0-9]/.test(password)) poolSize += SYMBOLS.length;

    // "bits de entropía": una forma de medir cuántas
    // combinaciones distintas existen. Cuantos más bits, más
    // tiempo le tomaría a una computadora adivinarla al azar.
    const bits = password.length * Math.log2(poolSize || 1);

    if (bits < 40) return { bits: Math.round(bits), label: 'Débil', level: 1 };
    if (bits < 60) return { bits: Math.round(bits), label: 'Aceptable', level: 2 };
    if (bits < 80) return { bits: Math.round(bits), label: 'Fuerte', level: 3 };
    return { bits: Math.round(bits), label: 'Muy fuerte', level: 4 };
  }

  // ------------------------------------------------------------
  //  Dibuja la "cinta" que muestra, pieza por pieza, cómo cada
  //  letra de tu frase se convirtió en algo nuevo. Es solo para
  //  VER lo que pasó, no cambia el resultado.
  // ------------------------------------------------------------
  function renderTape(pieces) {
    tapeTrack.innerHTML = '';

    if (pieces.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'tape__empty';
      empty.textContent = 'verás aquí cómo la frase aporta piezas a la contraseña';
      tapeTrack.appendChild(empty);
      return;
    }

    pieces.forEach((piece) => {
      const cell = document.createElement('div');
      const kindClass =
        piece.kind === 'símbolo' ? ' tape__cell--symbol' :
        piece.kind === 'número' ? ' tape__cell--digit' : '';
      cell.className = 'tape__cell' + kindClass;

      const chSpan = document.createElement('span');
      chSpan.className = 'tape__ch';
      chSpan.textContent = piece.from;

      const arrowSpan = document.createElement('span');
      arrowSpan.className = 'tape__arrow';
      arrowSpan.textContent = '↓';

      const codeSpan = document.createElement('span');
      codeSpan.className = 'tape__code';
      codeSpan.textContent = piece.out;

      cell.appendChild(chSpan);
      cell.appendChild(arrowSpan);
      cell.appendChild(codeSpan);
      tapeTrack.appendChild(cell);
    });
  }

  // ------------------------------------------------------------
  //  Muestra la barrita de fuerza con su color y su etiqueta
  //  (Débil, Aceptable, Fuerte, Muy fuerte).
  // ------------------------------------------------------------
  function renderStrength(password) {
    if (!password) {
      strengthFill.className = 'strength__fill';
      strengthLabel.textContent = '';
      return;
    }
    const result = estimateStrength(password);
    strengthFill.className = 'strength__fill level-' + result.level;
    strengthLabel.textContent = `${result.label} · ${result.bits} bits`;
  }

  // ------------------------------------------------------------
  //  Mensajito corto (como "Copiado ✓") que aparece y se borra
  //  solo, después de 1.5 segundos.
  // ------------------------------------------------------------
  function flashStatus(msg) {
    statusEl.textContent = msg;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      statusEl.textContent = '';
    }, 1500);
  }

  // ------------------------------------------------------------
  //  Botón "Generar contraseña": lee la frase y la longitud,
  //  crea una contraseña nueva, y actualiza todo en pantalla.
  //  Nota: aunque escribas la MISMA frase, cada clic genera una
  //  contraseña DISTINTA, porque siempre se mezcla con números
  //  aleatorios de verdad.
  // ------------------------------------------------------------
  function handleGenerate() {
    const phrase = phraseInput.value;
    const length = parseInt(lengthRange.value, 10);

    const { password, pieces } = generatePassword(phrase, length);

    passwordOutput.value = password;
    renderStrength(password);
    renderTape(pieces);
  }

  // Actualiza el numerito que muestra la longitud elegida en el slider.
  lengthRange.addEventListener('input', () => {
    lengthValue.textContent = lengthRange.value;
  });

  generateBtn.addEventListener('click', handleGenerate);

  // También se puede generar presionando Enter dentro del campo de frase.
  phraseInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') handleGenerate();
  });

  copyBtn.addEventListener('click', async () => {
    if (!passwordOutput.value) {
      flashStatus('Nada que copiar');
      return;
    }
    try {
      await navigator.clipboard.writeText(passwordOutput.value);
      flashStatus('Copiado ✓');
    } catch (err) {
      // Si el navegador no deja usar la forma moderna, usamos
      // la manera antigua: seleccionar el texto y copiarlo.
      passwordOutput.removeAttribute('readonly');
      passwordOutput.select();
      document.execCommand('copy');
      passwordOutput.setAttribute('readonly', 'true');
      flashStatus('Copiado ✓');
    }
  });
})();
