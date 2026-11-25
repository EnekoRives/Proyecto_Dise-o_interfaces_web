
'use strict';

// ==========================================
// 1. CONFIGURACIÓN GENERAL
// ==========================================

const $ = id => document.getElementById(id);

const MAX = 13;

const API = 'https://api.scryfall.com/cards/random';

const SYMBOL_API = 'https://api.scryfall.com/symbology';

const QUERIES = {

    normal:
        'legal:commander lang:en layout:normal game:paper edhrec<=2000 -t:land',

    hard:
        'legal:commander lang:en layout:normal game:paper'

};
const COLORS = {
    W: '#e4dcb1',
    U: '#779dc4',
    B: '#85818e',
    R: '#c77b6d',
    G: '#82a98a'
};

let state = null;
let loading = false;
let lastRequest = 0;

let keyboardMode = 'letters';
let showAdvancedSymbols = false;

const symbolMap = new Map();

let stats = readStats();


// ==========================================
// 2. ESTADÍSTICAS Y LOCALSTORAGE
// ==========================================

function readStats() {

    try {

        const s = JSON.parse(
            localStorage.getItem('arcane-guess-stats')
        );

        return {
            wins: Math.max(0, Number(s?.wins) || 0),
            losses: Math.max(0, Number(s?.losses) || 0),
            streak: Math.max(0, Number(s?.streak) || 0)
        };

    } catch {

        return {
            wins: 0,
            losses: 0,
            streak: 0
        };
    }
}


function saveStats() {

    try {

        localStorage.setItem(
            'arcane-guess-stats',
            JSON.stringify(stats)
        );

    } catch {}

    renderStats();
}


function renderStats() {

    for (const k of ['wins', 'losses', 'streak']) {

        $(k).textContent = stats[k];
    }
}


// ==========================================
// 3. NORMALIZACIÓN Y TRATAMIENTO DE TEXTO
// ==========================================

const normalize = s => String(s)
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[’‘]/g, "'")
    .replace(/−/g, '-')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();


// Separar caracteres y símbolos de Magic.
//
// Ejemplo:
// "{1}{R}{R}" se convierte en:
// ["{1}", "{R}", "{R}"]

function tokens(s) {

    return String(s ?? '')
        .match(/\{[^}]+\}|[\s\S]/gu) || [];
}


// Comprobar si es un símbolo de Magic

function isMagicSymbol(t) {

    return /^\{[^{}]+\}$/.test(t);
}


// Determinar qué caracteres deben ocultarse

function hiddenToken(t) {

    return isMagicSymbol(t)
        || /[\p{L}\p{N}]/u.test(t)
        || ['+', '-', '−', '*'].includes(t);
}


// Determinar si el nombre está descubierto

function solved() {

    return tokens(state.card.name).every(t =>

        !hiddenToken(t) ||
        state.used.has(normalize(t))
    );
}

function normalizeGuess(value) {

    const normalized = normalize(value);

    // Unificar los números del 0 al 9
    // con sus correspondientes símbolos de maná.
    // {1} se convierte en 1.

    return normalized.replace(/^\{([0-9])\}$/, '$1');
}


// ==========================================
// 4. PETICIONES A SCRYFALL
// ==========================================

// Limitar la frecuencia de peticiones

async function requestJSON(url) {

    const delay = Math.max(
        0,
        1100 - (Date.now() - lastRequest)
    );

    if (delay) {

        await new Promise(resolve => {
            setTimeout(resolve, delay);
        });
    }

    lastRequest = Date.now();

    const response = await fetch(url, {

        headers: {
            Accept: 'application/json'
        }
    });

    if (!response.ok) {

        throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
}


// ==========================================
// 5. CARGAR SÍMBOLOS GRÁFICOS DE MAGIC
// ==========================================

async function loadSymbols() {

    try {

        const data = await requestJSON(SYMBOL_API);

        for (const symbol of data.data || []) {

            symbolMap.set(
                normalize(symbol.symbol),
                symbol
            );
        }

    } catch (error) {

        console.warn(
            'No se pudieron cargar los símbolos gráficos.',
            error
        );
    }
}


// Crear representación textual de respaldo

function createFallbackSymbol(symbol) {

    const span = document.createElement('span');

    span.className = 'mana-fallback';

    const fallback = {
        '{C}': '◇',
        '{T}': '↷',
        '{Q}': '↶',
        '{E}': 'ϟ',
        '{S}': '❄'
    };

    span.textContent =
        fallback[symbol] ||
        symbol.slice(1, -1);

    span.title = symbol;

    return span;
}


// Crear una imagen SVG de un símbolo de Magic

function createSymbol(symbol) {

    symbol = normalize(symbol);

    const info = symbolMap.get(symbol);

    if (!info?.svg_uri) {

        return createFallbackSymbol(symbol);
    }

    const img = document.createElement('img');

    img.src = info.svg_uri;
    img.alt = info.english || symbol;
    img.title = info.english || symbol;

    img.className = 'mana-icon';
    img.draggable = false;

    img.addEventListener('error', () => {

        img.replaceWith(
            createFallbackSymbol(symbol)
        );
    });

    return img;
}


// Crear un símbolo oculto

function createHiddenSymbol() {

    const span = document.createElement('span');

    span.className = 'mana-hidden';

    span.textContent = '?';

    span.setAttribute(
        'aria-label',
        'Símbolo oculto'
    );

    return span;
}


// ==========================================
// 6. MOSTRAR INFORMACIÓN OCULTA
// ==========================================

function renderMasked(
    element,
    text,
    finished = false
) {

    element.replaceChildren();

    for (const token of tokens(text)) {

        const discovered =
    finished ||
    state.used.has(normalizeGuess(token));


        // Símbolos de Magic

        if (isMagicSymbol(token)) {

            if (discovered) {

                element.append(
                    createSymbol(token)
                );

            } else {

                element.append(
                    createHiddenSymbol()
                );
            }

        } else {

            // Letras, números y modificadores

            const character =
                !hiddenToken(token) || discovered
                    ? token
                    : '_';

            element.append(
                document.createTextNode(character)
            );
        }
    }
}


// ==========================================
// 7. CONFIGURACIÓN DEL TECLADO ALFABÉTICO
// ==========================================

const letterRows = [

    [...'QWERTYUIOP'],

    [...'ASDFGHJKL'],

    [...'ZXCVBNM'],

    [...'1234567890']
];


// ==========================================
// 8. CONFIGURACIÓN DEL TECLADO DE SÍMBOLOS
// ==========================================

const symbolRows = [

    {
        label: 'Maná genérico',

        keys: [
            '{1}', '{2}', '{3}', '{4}', '{5}',
            '{6}', '{7}', '{8}', '{9}', '{0}'
        ]
    },

    {
        label: 'Maná de colores e incoloro',

        keys: [
            '{W}', '{U}', '{B}',
            '{R}', '{G}', '{C}'
        ]
    },

    {
        label: 'Maná pirexiano',

        keys: [
            '{W/P}', '{U/P}', '{B/P}',
            '{R/P}', '{G/P}'
        ]
    },

    {
        label: 'Costes especiales',

        keys: [
            '{X}', '{Y}', '{Z}', '{S}'
        ]
    },

    {
        label: 'Girar, enderezar y energía',

        keys: [
            '{T}', '{Q}', '{E}'
        ]
    },

    {
        label: 'Modificadores',

        keys: [
            '+', '-', '*'
        ]
    }
];


// ==========================================
// 9. SÍMBOLOS AVANZADOS
// ==========================================

const advancedRows = [

    {
        label: 'Maná híbrido',

        keys: [
            '{W/U}', '{W/B}', '{U/B}',
            '{U/R}', '{B/R}'
        ]
    },

    {
        label: '',

        keys: [
            '{B/G}', '{R/G}', '{R/W}',
            '{G/W}', '{G/U}'
        ]
    },

    {
        label: 'Maná híbrido monocolor',

        keys: [
            '{2/W}', '{2/U}', '{2/B}',
            '{2/R}', '{2/G}'
        ]
    },

    {
        label: 'Maná híbrido incoloro',

        keys: [
            '{C/W}', '{C/U}', '{C/B}',
            '{C/R}', '{C/G}'
        ]
    },

    {
        label: 'Maná híbrido pirexiano',

        keys: [
            '{W/U/P}', '{W/B/P}', '{U/B/P}',
            '{U/R/P}', '{B/R/P}'
        ]
    },

    {
        label: '',

        keys: [
            '{B/G/P}', '{R/G/P}', '{R/W/P}',
            '{G/W/P}', '{G/U/P}'
        ]
    },

    {
        label: 'Otros costes genéricos',

        keys: [
            '{10}', '{11}', '{12}', '{13}',
            '{14}', '{15}', '{16}', '{17}',
            '{18}', '{19}', '{20}'
        ]
    }
];


// ==========================================
// 10. CREAR UNA TECLA
// ==========================================

function createKey(key) {

    const button = document.createElement('button');

    button.type = 'button';

    button.dataset.key = key;

    button.className = 'game-key';


    // Representación gráfica para símbolos

    if (isMagicSymbol(key)) {

        button.append(
            createSymbol(key)
        );

        const description =
            symbolMap.get(normalize(key))?.english
            || key;

        button.title = description;

        button.setAttribute(
            'aria-label',
            description
        );

    } else {

        button.textContent = key;
    }


    // Enviar intento al pulsar la tecla

    button.addEventListener('click', () => {

        guess(key);
    });

    return button;
}


// ==========================================
// 11. CREAR FILAS DEL TECLADO
// ==========================================

function createKeyRow(keys) {

    const row = document.createElement('div');

    row.className = 'key-row';

    for (const key of keys) {

        row.append(
            createKey(key)
        );
    }

    return row;
}


// Crear una categoría de símbolos

function createSymbolGroup(group) {

    const section = document.createElement('div');

    section.className = 'symbol-group';

    if (group.label) {

        const title = document.createElement('div');

        title.className = 'symbol-label';

        title.textContent = group.label;

        section.append(title);
    }

    section.append(
        createKeyRow(group.keys)
    );

    return section;
}


// ==========================================
// 12. SELECTOR DEL TIPO DE TECLADO
// ==========================================

function createKeyboardTab(text, mode) {

    const button = document.createElement('button');

    button.type = 'button';

    button.textContent = text;

    button.className = 'keyboard-tab';

    const active = keyboardMode === mode;

    button.classList.toggle(
        'active',
        active
    );

    button.setAttribute(
        'aria-pressed',
        String(active)
    );

    button.addEventListener('click', () => {

        keyboardMode = mode;

        makeKeyboard();
    });

    return button;
}


// ==========================================
// 13. CREAR EL TECLADO COMPLETO
// ==========================================

function makeKeyboard() {

    const root = $('keyboard');

    root.replaceChildren();


    // Selector de teclado

    const tabs = document.createElement('div');

    tabs.className = 'keyboard-tabs';

    tabs.append(

        createKeyboardTab(
            'ABC',
            'letters'
        ),

        createKeyboardTab(
            'Maná y símbolos',
            'symbols'
        )
    );

    root.append(tabs);


    // TECLADO ALFABÉTICO

    if (keyboardMode === 'letters') {

        for (const keys of letterRows) {

            root.append(
                createKeyRow(keys)
            );
        }

    } else {

        // TECLADO DE SÍMBOLOS

        for (const group of symbolRows) {

            root.append(
                createSymbolGroup(group)
            );
        }


        // Mostrar símbolos avanzados

        const advancedButton =
            document.createElement('button');

        advancedButton.type = 'button';

        advancedButton.className =
            'advanced-button';

        advancedButton.textContent =
            showAdvancedSymbols
                ? 'Ocultar símbolos avanzados'
                : 'Más símbolos y costes híbridos';

        advancedButton.setAttribute(
            'aria-expanded',
            String(showAdvancedSymbols)
        );

        advancedButton.addEventListener(
            'click',
            () => {

                showAdvancedSymbols =
                    !showAdvancedSymbols;

                makeKeyboard();
            }
        );

        root.append(advancedButton);


        if (showAdvancedSymbols) {

            for (const group of advancedRows) {

                root.append(
                    createSymbolGroup(group)
                );
            }


            // Añadir símbolos adicionales del
            // catálogo de Scryfall.

            const existing = new Set([

                ...symbolRows.flatMap(
                    group => group.keys
                ),

                ...advancedRows.flatMap(
                    group => group.keys
                )
            ]);


            const extraSymbols =
                [...symbolMap.values()]

                .filter(symbol =>

                    !symbol.funny &&

                    !existing.has(symbol.symbol)
                )

                .map(symbol => symbol.symbol);


            if (extraSymbols.length) {

                const label =
                    document.createElement('div');

                label.className = 'symbol-label';

                label.textContent = 'Otros símbolos';

                root.append(label);


                for (
                    let i = 0;
                    i < extraSymbols.length;
                    i += 10
                ) {

                    root.append(

                        createKeyRow(

                            extraSymbols.slice(
                                i,
                                i + 10
                            )
                        )
                    );
                }
            }
        }
    }

    setControls();
}


// ==========================================
// 14. CONTROL DE LOS BOTONES
// ==========================================

function setControls() {

    const active =
        !!state &&
        state.status === 'playing' &&
        !loading;


    $('guess').disabled = !active;

    $('submit').disabled = !active;

    $('new').disabled = loading;

    $('mode').disabled = loading;


    const buttons = $('keyboard')
        .querySelectorAll('button[data-key]');


    for (const button of buttons) {

        const key = normalizeGuess(
    button.dataset.key
);


        const old = state?.history.find(h =>

            h.value === key &&
            h.kind === 'token'
        );


        button.disabled =
            !active || !!old;


        button.classList.toggle(

            'key-good',

            !!old && old.correct
        );


        button.classList.toggle(

            'key-bad',

            !!old && !old.correct
        );


        button.setAttribute(

            'aria-pressed',

            String(!!old)
        );
    }
}


// ==========================================
// 15. MOSTRAR PODER, RESISTENCIA Y LEALTAD
// ==========================================

function renderPower(card, finished) {

    const element = $('power');


    // Criaturas y vehículos

    if (
        card.power != null &&
        card.toughness != null
    ) {

        element.hidden = false;

        renderMasked(

            element,

            `${card.power}/${card.toughness}`,

            finished
        );

    } else if (card.loyalty != null) {

        // Planeswalkers

        element.hidden = false;

        renderMasked(

            element,

            String(card.loyalty),

            finished
        );

    } else if (card.defense != null) {

        // Batallas

        element.hidden = false;

        renderMasked(

            element,

            String(card.defense),

            finished
        );

    } else {

        // Cartas sin estadísticas

        element.textContent = '';

        element.hidden = true;
    }
}


// ==========================================
// 16. MOSTRAR HISTORIAL DE INTENTOS
// ==========================================

function renderHistory() {

    const root = $('history');

    root.replaceChildren();


    if (!state.history.length) {

        const p = document.createElement('span');

        p.className = 'muted';

        p.textContent =
            'Aún no has hecho ningún intento.';

        root.append(p);
    }


    for (const h of state.history) {

        const el = document.createElement('span');

        el.className = 'chip ' +
            (h.correct ? 'good' : 'bad');


        // Mostrar SVG si se ha intentado
        // adivinar un símbolo de Magic.

        if (isMagicSymbol(h.value)) {

            el.append(
                createSymbol(h.value)
            );

        } else {

            el.append(
                document.createTextNode(h.value)
            );
        }


        el.append(

            document.createTextNode(

                h.correct ? ' ✓' : ' ×'
            )
        );

        root.append(el);
    }
}


// ==========================================
// 17. ACTUALIZAR INTERFAZ
// ==========================================

function render() {

    if (!state) {

        setControls();

        return;
    }


    const c = state.card;

    const hard = state.mode === 'hard';

    const finished =
        state.status !== 'playing';


    // Intentos restantes

    $('remaining').textContent =
        `${state.remaining} / ${MAX}`;

    $('meter').setAttribute(

        'aria-valuenow',

        state.remaining
    );


    // Barra de intentos

    $('meter').replaceChildren(

        ...Array.from(

            { length: MAX },

            (_, i) => {

                const el =
                    document.createElement('i');

                if (i < state.remaining) {

                    el.className = 'live';
                }

                return el;
            }
        )
    );


    // Nombre de la carta

    renderMasked(

        $('cardName'),

        c.name,

        finished
    );


    // Coste de maná
    // Un interrogante por cada símbolo

    renderMasked(

        $('mana'),

        c.mana_cost || '',

        finished
    );


    // Tipo de carta

    renderMasked(

        $('type'),

        c.type_line || '',

        finished || !hard
    );


    // Texto de habilidades

    renderMasked(

        $('oracle'),

        c.oracle_text || '',

        finished
    );


    // Poder, resistencia y lealtad

    renderPower(c, finished);


    // Color del marco

    let frameColor = '#a4a5ad';


    if (!hard || finished) {

        if (c.colors?.length === 1) {

            frameColor =
                COLORS[c.colors[0]]
                || '#a4a5ad';

        } else if (c.colors?.length > 1) {

            frameColor = '#c6ad72';
        }
    }


    $('card').style.setProperty(

        '--frame',

        frameColor
    );


    // Imagen real de la carta

    const img = $('revealed');

    const imageURL = c.image_uris?.normal;

    const showImage =
        finished && !!imageURL;


    $('card').classList.toggle(

        'finished',

        showImage
    );


    img.hidden = !showImage;


    if (showImage) {

        img.onerror = () => {

            img.hidden = true;

            $('card').classList.remove(
                'finished'
            );
        };

        img.src = imageURL;

        img.alt =
            `Carta revelada: ${c.name}`;

    } else {

        img.onerror = null;

        img.removeAttribute('src');

        img.alt = '';
    }


    // Enlace a la carta en Scryfall

    const link = $('cardLink');

    link.hidden =
        !finished || !c.scryfall_uri;


    if (!link.hidden) {

        link.href = c.scryfall_uri;
    }


    // Historial de intentos

    renderHistory();


    // Actualizar teclado

    setControls();
}


// ==========================================
// 18. INICIAR UNA NUEVA PARTIDA
// ==========================================

async function start() {

    // Evitar solicitudes simultáneas

    if (loading) return;

    loading = true;

    state = null;


    const mode = $('mode').value;


    // Reiniciar la interfaz

    $('status').textContent =
        'Buscando una carta en Scryfall…';

    $('card').classList.remove('finished');

    $('card').style.setProperty(
        '--frame',
        '#a4a5ad'
    );

    $('revealed').hidden = true;

    $('revealed').onerror = null;

    $('revealed').removeAttribute('src');

    $('cardLink').hidden = true;

    $('cardName').textContent = '—';

    $('mana').textContent = '';

    $('type').textContent = '—';

    $('oracle').textContent = 'Cargando carta…';

    $('power').textContent = '';

    $('power').hidden = true;

    $('history').replaceChildren();

    $('remaining').textContent =
        `${MAX} / ${MAX}`;

    $('meter').replaceChildren();

    $('meter').setAttribute(
        'aria-valuenow',
        MAX
    );

    $('guess').value = '';


    // Reiniciar el teclado

    keyboardMode = 'letters';

    showAdvancedSymbols = false;

    makeKeyboard();


    try {

        // Obtener una carta aleatoria

        // Seleccionar los filtros según la dificultad

        const query = QUERIES[mode] || QUERIES.normal;

        // Obtener una carta aleatoria

        const card = await requestJSON(

            `${API}?q=${encodeURIComponent(query)}`
        );


        // Validar los datos recibidos

        if (!card.name || !card.type_line) {

            throw new Error(
                'Respuesta de carta inválida'
            );
        }


        // Estado de la partida

        state = {

            card: card,

            mode: mode,

            remaining: MAX,

            used: new Set(),

            history: [],

            status: 'playing'
        };


        $('status').textContent =
            '¡Empieza a adivinar!';


    } catch (error) {

        $('status').textContent =

            `No se pudo cargar la carta (${error.message}). ` +

            'Comprueba la conexión y pulsa Nueva partida.';


    } finally {

        loading = false;

        render();
    }
}


// ==========================================
// 19. FINALIZAR UNA PARTIDA
// ==========================================

function finish(won) {

    state.status =
        won ? 'won' : 'lost';


    if (won) {

        stats.wins++;

        stats.streak++;

    } else {

        stats.losses++;

        stats.streak = 0;
    }


    saveStats();


    $('status').textContent = won

        ? `¡Has acertado! La carta era ${state.card.name}.`

        : `Se acabaron los intentos. La carta era ${state.card.name}.`;
}


// ==========================================
// 20. COMPROBAR LOS INTENTOS
// ==========================================

function guess(raw) {

    // Comprobar si la partida está activa

    if (

        loading ||

        !state ||

        state.status !== 'playing'

    ) {

        return;
    }


    const value = normalizeGuess(raw);

    if (!value) return;


    // Diferenciar carácter, símbolo o nombre

    const token =

        /^[\p{L}\p{N}]$/u.test(value)

        || isMagicSymbol(value)

        || ['+', '-', '*'].includes(value);


    const kind =
        token ? 'token' : 'name';


    // Evitar intentos repetidos

    const repeated = state.history.some(h =>

        h.value === value &&

        h.kind === kind
    );


    if (repeated) {

        $('status').textContent =

            'Ya has utilizado ese intento. ' +

            'No se descuenta otra oportunidad.';

        return;
    }


    const c = state.card;


    // Campos ocultos en los que buscar

    const visibleFields = [

        // Nombre

        c.name,

        // Habilidades

        c.oracle_text || '',

        // Coste de maná

        c.mana_cost || '',

        // Poder y resistencia

        String(c.power ?? ''),

        String(c.toughness ?? ''),

        // Lealtad de planeswalkers

        String(c.loyalty ?? ''),

        // Defensa de batallas

        String(c.defense ?? ''),

        // Tipo de carta en modo difícil

        ...(state.mode === 'hard'

            ? [c.type_line || '']

            : []
        )
    ];


    let correct;


    // Intento de carácter o símbolo

    if (token) {

correct = visibleFields.some(field =>

    tokens(field).some(t =>

        normalizeGuess(t) === value
    )
);


        state.used.add(value);


    } else {

        // Intento de nombre completo

        correct =
            normalize(c.name) === value;
    }


    // Registrar el intento

    state.history.push({

        value: value,

        kind: kind,

        correct: correct
    });


    // Descontar una oportunidad

    state.remaining--;


    // Comprobar victoria

    if (

        (kind === 'name' && correct)

        || solved()

    ) {

        finish(true);


    } else if (state.remaining <= 0) {

        // Comprobar derrota

        finish(false);


    } else {

        // Continuar jugando

        $('status').textContent = correct

            ? '¡Acierto! Se han revelado los caracteres.'

            : 'No aparece en los campos ocultos o no es el nombre correcto.';
    }


    render();
}


// ==========================================
// 21. FORMULARIO DE INTENTOS
// ==========================================

function submitGuess() {

    const input = $('guess');

    guess(input.value);

    input.value = '';
}


$('guessForm').addEventListener('submit', e => {

    e.preventDefault();

    submitGuess();
});


$('submit').addEventListener('click', e => {

    e.preventDefault();

    submitGuess();
});


// ==========================================
// 22. BOTÓN NUEVA PARTIDA
// ==========================================

$('new').addEventListener('click', () => {

    if (

        state?.status === 'playing' &&

        state.history.length &&

        !confirm(

            '¿Abandonar esta partida? ' +

            'No contará en las estadísticas.'
        )

    ) {

        return;
    }


    // No existe límite diario de partidas

    start();
});


// ==========================================
// 23. CAMBIO DE DIFICULTAD
// ==========================================

$('mode').addEventListener('change', () => {

    if (

        state?.status === 'playing' &&

        state.history.length &&

        !confirm(

            'Cambiar de dificultad iniciará otra partida. ' +

            '¿Continuar?'
        )

    ) {

        $('mode').value = state.mode;

        return;
    }

    start();
});


// ==========================================
// 24. TECLADO FÍSICO
// ==========================================

document.addEventListener('keydown', e => {

    if (

        e.repeat ||

        e.ctrlKey ||

        e.altKey ||

        e.metaKey ||

        [
            'INPUT',
            'TEXTAREA',
            'SELECT',
            'BUTTON'
        ].includes(document.activeElement?.tagName)

        || document.activeElement?.isContentEditable

    ) {

        return;
    }


    // Letras y números normales

    if (/^[a-z0-9]$/i.test(e.key)) {

        e.preventDefault();

        guess(e.key);
    }


    // Modificadores

    else if (['+', '-', '*'].includes(e.key)) {

        e.preventDefault();

        guess(e.key);
    }
});


// ==========================================
// 25. ESTILOS COMPLEMENTARIOS
// ==========================================

function addGameStyles() {

    const style = document.createElement('style');

    style.id = 'spellify-extra-styles';

    style.textContent = `

        /* Selector de teclado */

        .keyboard-tabs {
            display: flex;
            gap: 6px;
            margin-bottom: 8px;
        }

        .keyboard-tab {
            flex: 1;
            background: #343a40;
            color: white;
            padding: 10px;
            border-radius: 6px;
        }

        .keyboard-tab.active {
            background: #f5c878;
            color: #222;
        }


        /* Grupos de símbolos */

        .symbol-group {
            margin-bottom: 5px;
        }

        .symbol-label {
            font-size: 12px;
            color: var(--muted, #b5b9ca);
            margin: 8px 0 5px;
        }


        /* Teclado */

        .key-row {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 5px;
        }

        #keyboard .game-key {
            display: inline-flex;
            align-items: center;
            justify-content: center;

            flex: 1 1 30px;

            min-width: 25px;
            max-width: 65px;
            height: 43px;

            padding: 5px;

            background: #343a40;
            border: 1px solid #52565e;
            border-radius: 5px;

            color: white;
            font-size: 16px;
        }


        /* Símbolos SVG */

        .mana-icon,
        .magic-card img.mana-icon {
            display: inline-block;

            width: 22px;
            height: 22px;

            object-fit: contain;
            vertical-align: middle;
            border-radius: 0;
        }

        #keyboard .mana-icon {
            width: 23px;
            height: 23px;
        }


        /* Símbolos sin imagen */

        .mana-fallback {
            display: inline-flex;
            align-items: center;
            justify-content: center;

            min-width: 20px;
            height: 20px;
            padding: 2px;

            background: #c5c1bb;
            color: #222;
            border-radius: 50%;
            font-size: 12px;
            font-weight: bold;

            vertical-align: middle;
        }


        /* Coste de maná */

        #mana {
            display: flex;
            align-items: center;
            justify-content: flex-end;

            flex-wrap: wrap;
            flex-shrink: 0;
            gap: 3px;

            max-width: 48%;
        }


        /* Símbolos ocultos */

        .mana-hidden {
            display: inline-flex;
            align-items: center;
            justify-content: center;

            width: 20px;
            height: 20px;

            border: 1px solid #333;
            border-radius: 50%;

            background: #bdbdbd;
            color: #222;

            font-size: 13px;
            font-weight: bold;

            vertical-align: middle;
        }


        /* Símbolos en las habilidades */

        #oracle .mana-icon,
        #oracle .mana-hidden {
            width: 17px;
            height: 17px;
        }


        /* Poder, resistencia y lealtad */

        #power {
            align-self: flex-end;

            min-width: 45px;
            padding: 4px 10px;

            background: #e5e0d6;
            color: #222;

            border: 1px solid #333;
            border-radius: 6px;

            font-size: 16px;
            font-weight: bold;
            text-align: center;
        }

        #power[hidden] {
            display: none;
        }


        /* Teclas acertadas */

        #keyboard .game-key.key-good {
            background: #32d9a6;
            color: #111;
            border-color: #32d9a6;
            opacity: 1;
        }


        /* Teclas incorrectas */

        #keyboard .game-key.key-bad {
            background: #743b45;
            border-color: #c98191;
            opacity: 0.65;
        }


        /* Símbolos avanzados */

        .advanced-button {
            width: 100%;
            margin: 6px 0;
            padding: 10px;

            background: #282c3c;
            color: #f5c878;
        }


        /* Historial */

        .chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }

        .chip .mana-icon {
            width: 18px;
            height: 18px;
        }


        /* Imagen revelada */

        .magic-card #revealed[hidden] {
            display: none;
        }

        .magic-card.finished > :not(#revealed) {
            display: none;
        }


        /* Diseño responsive */

        @media (max-width: 600px) {

            #keyboard .game-key {
                flex-basis: 23px;
                min-width: 23px;
                height: 36px;
                padding: 3px;
            }

            #keyboard .mana-icon {
                width: 19px;
                height: 19px;
            }

            .mana-hidden {
                width: 17px;
                height: 17px;
            }
        }
    `;

    document.head.append(style);
}


// ==========================================
// 26. INICIALIZACIÓN DEL JUEGO
// ==========================================

async function initializeGame() {

    loading = true;


    // Añadir estilos complementarios

    addGameStyles();


    // Mostrar estadísticas

    renderStats();


    // Desactivar controles durante la carga

    setControls();


    // Cargar los SVG de Scryfall
    // Solo una vez al iniciar la aplicación

    await loadSymbols();


    // Crear teclado

    makeKeyboard();


    loading = false;


    // Iniciar primera partida

    await start();
}


initializeGame();
