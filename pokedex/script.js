/*************************************************
 * CONFIGURACIÓN GENERAL
 *************************************************/
const API_URL = "https://pokeapi.co/api/v2/pokemon/";
const SPECIES_URL = "https://pokeapi.co/api/v2/pokemon-species/";
const PROB_SHINY = 0.01;
const SHINY_BOOST = 1.10;

let FORZAR_SHINY = false;
let FORZAR_HEMBRA = false;

/*************************************************
 * MAPA DE TIPOS (IMÁGENES)
 *************************************************/
const typeFileMap = {
  normal: "Tipo_normal.png",
  fighting: "Tipo_lucha.png",
  flying: "Tipo_volador.png",
  poison: "Tipo_veneno.png",
  ground: "Tipo_tierra.png",
  rock: "Tipo_roca.png",
  bug: "Tipo_bicho.png",
  ghost: "Tipo_fantasma.png",
  steel: "Tipo_acero.png",
  fire: "Tipo_fuego.png",
  water: "Tipo_agua.png",
  grass: "Tipo_planta.png",
  electric: "Tipo_electrico.png",
  psychic: "Tipo_psiquico.png",
  ice: "Tipo_hielo.png",
  dragon: "Tipo_dragon.png",
  dark: "Tipo_siniestro.png",
  fairy: "Tipo_hada.png"
};

/*************************************************
 * ESTADO GLOBAL
 *************************************************/
let numeroActual = "";
let pokemonActual = null;
let especieActual = null;

let esShinyActual = false;
let esHembraActual = null;
let mirandoEspalda = false;

let equipo = [];

/*************************************************
 * CACHE (MEJORA RENDIMIENTO)
 *************************************************/
const cachePokemon = {};
const cacheSpecies = {};

/*************************************************
 * GÉNERO FIJO (NIDORAN Y EVOS)
 *************************************************/
const GENERO_FIJO = {
  29: true, 30: true, 31: true,
  32: false, 33: false, 34: false
};

/*************************************************
 * UTILIDADES
 *************************************************/
function iconoGenero(g) {
  if (g === true) return "♀️";
  if (g === false) return "♂️";
  return "⚪";
}

function aplicarBoost(stat, shiny) {
  return shiny ? Math.floor(stat * SHINY_BOOST) : stat;
}

/*************************************************
 * LOCAL STORAGE
 *************************************************/
function guardarEquipo() {
  localStorage.setItem("equipoPokemon", JSON.stringify(equipo));
}

function cargarEquipo() {
  const data = localStorage.getItem("equipoPokemon");
  if (data) {
    equipo = JSON.parse(data);
    renderTabla();
  }
}

/*************************************************
 * TECLADO NUMÉRICO
 *************************************************/
function asignarNumero(btn) {
  if (numeroActual.length >= 4) return;
  numeroActual += btn.innerText;
  document.getElementById("pokemon-numero").innerText = numeroActual;
}

/*************************************************
 * BUSCAR POKÉMON
 *************************************************/
async function buscarPokemon() {
  if (!numeroActual) return;

  const id = numeroActual;
  numeroActual = "";

  if (cachePokemon[id]) {
    pokemonActual = cachePokemon[id];
  } else {
    const res = await fetch(API_URL + id);
    if (!res.ok) return alert("Pokémon no encontrado");
    pokemonActual = await res.json();
    cachePokemon[pokemonActual.id] = pokemonActual;
  }

  if (cacheSpecies[pokemonActual.id]) {
    especieActual = cacheSpecies[pokemonActual.id];
  } else {
    const resS = await fetch(SPECIES_URL + pokemonActual.id);
    especieActual = await resS.json();
    cacheSpecies[pokemonActual.id] = especieActual;
  }

  determinarShiny();
  determinarGenero();
  mostrarPokemon();
}

/*************************************************
 * SHINY
 *************************************************/
function determinarShiny() {
  esShinyActual = FORZAR_SHINY || Math.random() < PROB_SHINY;
  if (esShinyActual) activarEfectoShiny();
}

/*************************************************
 * GÉNERO
 *************************************************/
function determinarGenero() {
  if (GENERO_FIJO[pokemonActual.id] !== undefined) {
    esHembraActual = GENERO_FIJO[pokemonActual.id];
    return;
  }

  if (especieActual.gender_rate === -1) {
    esHembraActual = null;
    return;
  }

  if (FORZAR_HEMBRA) {
    esHembraActual = true;
    return;
  }

  esHembraActual = Math.random() < (especieActual.gender_rate / 8);
}

/*************************************************
 * MOSTRAR POKÉMON
 *************************************************/
function mostrarPokemon() {
  const p = pokemonActual;

  document.getElementById("pokemon-title").innerText =
    `${p.name.toUpperCase()} ${iconoGenero(esHembraActual)} ${esShinyActual ? "✨" : ""}`;

  document.getElementById("pokemon-hp").innerText =
    aplicarBoost(p.stats[0].base_stat, esShinyActual);

  document.getElementById("pokemon-attack").innerText =
    aplicarBoost(p.stats[1].base_stat, esShinyActual);

  document.getElementById("pokemon-defense").innerText =
    aplicarBoost(p.stats[2].base_stat, esShinyActual);

  document.getElementById("pokemon-speed").innerText =
    aplicarBoost(p.stats[5].base_stat, esShinyActual);

  mostrarTipos(p.types);
  mostrarSprite(p);
}

/*************************************************
 * SPRITES (GÉNERO / SHINY / ESPALDA)
 *************************************************/
function mostrarSprite(p) {
  const img = document.getElementById("screen-left-image");
  let sprite = null;

  if (esHembraActual && esShinyActual)
    sprite = mirandoEspalda ? p.sprites.back_shiny_female : p.sprites.front_shiny_female;

  if (!sprite && esHembraActual)
    sprite = mirandoEspalda ? p.sprites.back_female : p.sprites.front_female;

  if (!sprite && esShinyActual)
    sprite = mirandoEspalda ? p.sprites.back_shiny : p.sprites.front_shiny;

  if (!sprite)
    sprite = mirandoEspalda ? p.sprites.back_default : p.sprites.front_default;

  img.src = sprite;
}

/*************************************************
 * TIPOS
 *************************************************/
function mostrarTipos(types) {
  // Asegúrate de tener la carpeta 'tipos' con las imágenes o comenta estas líneas
  const type1 = document.getElementById("pokemon-type-1");
  const type2 = document.getElementById("pokemon-type-2");
  
  if(type1) type1.innerHTML = `<img src="tipos/${typeFileMap[types[0].type.name]}">`;
  if(type2) type2.innerHTML = types[1] ? `<img src="tipos/${typeFileMap[types[1].type.name]}">` : "";
}

/*************************************************
 * CRUCETA (SIN LAG)
 *************************************************/
const btnRight = document.querySelector(".arrow-right");
const btnLeft = document.querySelector(".arrow-left");
const btnTop = document.querySelector(".arrow-top");
const btnBottom = document.querySelector(".arrow-bottom");

if(btnRight) btnRight.onclick = () => {
  if (!pokemonActual) return;
  mirandoEspalda = true;
  mostrarSprite(pokemonActual);
};

if(btnLeft) btnLeft.onclick = () => {
  if (!pokemonActual) return;
  mirandoEspalda = false;
  mostrarSprite(pokemonActual);
};

if(btnTop) btnTop.onclick = () => cambiarPokemon(-1);
if(btnBottom) btnBottom.onclick = () => cambiarPokemon(1);

function cambiarPokemon(delta) {
  if (!pokemonActual) return;
  numeroActual = String(pokemonActual.id + delta);
  buscarPokemon();
}

/*************************************************
 * ALEATORIO
 *************************************************/
function pokemonAleatorio() {
  numeroActual = String(Math.floor(Math.random() * 1010) + 1);
  buscarPokemon();
}

/*************************************************
 * EQUIPO
 *************************************************/
function agregarPokemon() {
  if (!pokemonActual) return;
  if (equipo.length >= 6) return alert("Máximo 6 Pokémon");

  equipo.push({
    data: pokemonActual,
    shiny: esShinyActual,
    genero: esHembraActual,
    mote: pokemonActual.name
  });

  guardarEquipo();
  renderTabla();
}

function eliminar(i) {
  equipo.splice(i, 1);
  guardarEquipo();
  renderTabla();
}

/*************************************************
 * TABLA + BOTÓN BATALLA
 *************************************************/
function renderTabla() {
  const tbody = document.getElementById("contenido-tabla");
  if(!tbody) return;
  
  tbody.innerHTML = "";

  equipo.forEach((p, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${p.data.id}</td>
        <td>${p.mote} ${iconoGenero(p.genero)} ${p.shiny ? "✨" : ""}</td>
        <td>${aplicarBoost(p.data.stats[0].base_stat, p.shiny)}</td>
        <td>${aplicarBoost(p.data.stats[2].base_stat, p.shiny)}</td>
        <td>${aplicarBoost(p.data.stats[5].base_stat, p.shiny)}</td>
        <td>
          <button onclick="verInfo(${i})">ℹ️</button>
          <button onclick="abrirModal(${i})">✏️</button>
          <button onclick="eliminar(${i})">🗑️</button>
        </td>
      </tr>
    `;
  });

  const battle = document.getElementById("battle-container");
  if (battle) battle.style.display = equipo.length === 6 ? "block" : "none";
}

/*************************************************
 * INFO
 *************************************************/
function verInfo(i) {
  const p = equipo[i];
  const poke = p.data;

  const movimientos = poke.moves
    .slice(0, 6)
    .map(m => "• " + m.move.name.toUpperCase())
    .join("\n");

  alert(
    `🧬 ${p.mote.toUpperCase()} ${iconoGenero(p.genero)} ${p.shiny ? "✨ SHINY +10%" : ""}\n\n` +
    `📊 STATS\n` +
    `HP: ${aplicarBoost(poke.stats[0].base_stat, p.shiny)}\n` +
    `ATAQUE: ${aplicarBoost(poke.stats[1].base_stat, p.shiny)}\n` +
    `DEFENSA: ${aplicarBoost(poke.stats[2].base_stat, p.shiny)}\n` +
    `VELOCIDAD: ${aplicarBoost(poke.stats[5].base_stat, p.shiny)}\n\n` +
    `⚔️ MOVIMIENTOS\n` +
    `${movimientos || "Sin movimientos"}`
  );
}


/*************************************************
 * MODAL
 *************************************************/
function abrirModal(i) {
  document.getElementById("modal").style.display = "block";
  document.getElementById("index").value = i;
  document.getElementById("nombre_editar").value = equipo[i].mote;
}

function cerrarModal() {
  document.getElementById("modal").style.display = "none";
}

function editarPokemon() {
  const i = document.getElementById("index").value;
  equipo[i].mote = document.getElementById("nombre_editar").value;
  guardarEquipo();
  renderTabla();
  cerrarModal();
}

/*************************************************
 * BATALLA
 *************************************************/
function iniciarBatalla() {
  if (equipo.length !== 6) return;
  localStorage.setItem("equipoPokemon", JSON.stringify(equipo));
  window.location.href = "battle.html";
}

/*************************************************
 * EFECTO SHINY
 *************************************************/
function activarEfectoShiny() {
  const flash = document.createElement("div");
  flash.style = "position:fixed;inset:0;background:white;opacity:.8;z-index:9999";
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 120);
  // AUDIO ELIMINADO AQUÍ
}

/*************************************************
 * INICIO
 *************************************************/
document.addEventListener("DOMContentLoaded", cargarEquipo);