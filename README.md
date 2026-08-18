# Generador de Contraseñas (Frase → ASCII → Contraseña)

Aplicación web simple (HTML + CSS + JS, sin dependencias ni build) que genera
contraseñas seguras y aleatorias a partir de una frase escrita por el
usuario. Reutiliza la idea de la app **Cifrado ASCII**: convertir letras en
su código ASCII decimal, pero aquí ese código se usa como ingrediente para
"cocinar" una contraseña, no para cifrar un mensaje.

## Uso

1. Abre `index.html` en cualquier navegador (doble clic, no requiere servidor).
2. Escribe una frase cualquiera en **Frase de entrada** (por ejemplo:
   `mi perro corre rápido`). No hace falta que sea una frase real ni que la
   recuerdes: solo sirve como semilla para variar el resultado.
3. Elige la **longitud** deseada con el control deslizante (8 a 32 caracteres,
   se recomienda 16 o más).
4. Presiona **Generar contraseña** (o Enter en el campo de frase).
5. Copia el resultado con **Copiar contraseña**.

Cada clic en "Generar contraseña" produce un resultado **distinto**, aunque
no cambies la frase, porque el proceso siempre se combina con números
aleatorios criptográficamente seguros.

## Reglas de seguridad que cumple

Toda contraseña generada cumple, sin excepción, las reglas básicas que piden
la mayoría de los sitios en internet hoy en día:

| Regla | Cómo se garantiza |
|---|---|
| Mezcla de mayúsculas y minúsculas | Cada letra de la frase se recasea al azar; si por mala suerte falta alguna categoría, se fuerza al final. |
| Al menos un número | Aportado por letras con código ASCII impar, por caracteres no-letra de la frase, o forzado al final si falta. |
| Al menos un símbolo | Aportado por letras con código ASCII par, o forzado al final si falta. |
| Longitud mínima | El control deslizante no permite bajar de 8 caracteres (se recomienda 16+). |
| Sin patrones predecibles | El orden final se baraja con Fisher-Yates usando `crypto.getRandomValues`, no con `Math.random`. |

## Cómo funciona el método

1. **Frase → piezas.** Se recorre la frase carácter por carácter. Por cada
   letra se obtiene su código ASCII (igual que en Cifrado ASCII) y se generan
   hasta 2 piezas:
   - la letra misma, en mayúscula o minúscula al azar;
   - un **símbolo** si el código es par, o un **número** si es impar
     (`código % 10` o `código % símbolos.length`).

   Los caracteres que no son letra (dígitos, signos que ya traiga la frase)
   aportan un número basado en su propio código. Los espacios se ignoran.

2. **Relleno aleatorio.** Si la frase es corta y no alcanza para la longitud
   pedida, se completa con caracteres tomados al azar de todo el conjunto
   (mayúsculas + minúsculas + números + símbolos).

3. **Barajado (shuffle).** Todas las piezas se mezclan con el algoritmo
   Fisher-Yates, usando `crypto.getRandomValues` en vez de `Math.random`,
   porque es un generador de números mucho más impredecible — el mismo tipo
   que se usa para generar contraseñas y claves reales.

4. **Recorte.** El resultado se recorta exactamente a la longitud elegida.

5. **Verificación final.** Se revisa que existan mayúscula, minúscula, número
   y símbolo. Si falta alguno, se reemplaza una posición al azar por un
   carácter de ese tipo.

### Ejemplo

| Frase | Longitud | Contraseña generada (ejemplo) |
|---|---|---|
| `mi perro corre rapido` | 16 | `%O1P%oMI%97R9rRR` |
| `Hola Mundo 123!` | 12 | `1dm3Nl1=91u7` |

(Los resultados reales cambian en cada clic: son aleatorios de verdad.)

### Por qué `crypto.getRandomValues` y no `Math.random`

`Math.random()` es predecible: no está pensado para seguridad y, en teoría,
alguien podría llegar a adivinar los próximos valores. `crypto.getRandomValues`
usa el generador de números aleatorios seguro del propio navegador —el mismo
tipo de fuente que se usa para crear claves reales—, así que es la opción
correcta para cualquier cosa relacionada con contraseñas.

## Limitaciones (es una app educativa)

- Las contraseñas no se guardan en ningún lado: viven solo en la memoria del
  navegador mientras tienes la página abierta. Si cierras o recargas la
  página, se pierden.
- No sustituye a un gestor de contraseñas real. Es una herramienta educativa
  para entender cómo se puede construir un generador que cumpla reglas de
  seguridad básicas, no un producto de seguridad certificado.
- El conjunto de símbolos usado es fijo (`!@#$%^&*()-_=+[]{}<>?/`); algunos
  sitios no aceptan todos estos símbolos, en ese caso puede que debas
  regenerar o ajustar la contraseña manualmente.

## Estructura del proyecto

```
.
├── index.html   # Controles de uso: frase, longitud, botón, resultado
├── style.css    # Estilos visuales (mismo tema tipo terminal/consola)
├── script.js    # Lógica del generador, comentada línea por línea
└── README.md    # Este archivo
```

## Tecnologías

HTML, CSS y JavaScript puro (vanilla), sin frameworks ni dependencias.
Usa la Web Crypto API (`crypto.getRandomValues`), disponible en todos los
navegadores modernos. Funciona directamente abriendo `index.html`.
