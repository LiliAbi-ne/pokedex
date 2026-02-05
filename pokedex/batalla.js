/************************************
 * BATALLA POKÉMON – BASE ESTABLE
 * Estilo Rojo Fuego
 ************************************/

/* ===============================
   VARIABLES GLOBALES
=============================== */
let rawTeam = JSON.parse(localStorage.getItem("equipoPokemon")) || [];
function adaptarPokemon(p) {
  const base = p.data;

  const hp = p.shiny
    ? Math.floor(base.stats[0].base_stat * 1.1)
    : base.stats[0].base_stat;

  // 🔥 Showdown (mejor opción)
  const showdown = base.sprites?.other?.showdown;

  // 🔥 Gen 5 animado
  const animated =
    base.sprites?.versions?.["generation-v"]?.["black-white"]?.animated;

  // 🎮 SPRITE FRENTE
  const spriteFront =
    (p.shiny && showdown?.front_shiny) ||
    showdown?.front_default ||
    (p.shiny && animated?.front_shiny) ||
    animated?.front_default ||
    (p.shiny && base.sprites.front_shiny) ||
    base.sprites.front_default;

  // 🎮 SPRITE ESPALDA
  const spriteBack =
    (p.shiny && showdown?.back_shiny) ||
    showdown?.back_default ||
    (p.shiny && animated?.back_shiny) ||
    animated?.back_default ||
    (p.shiny && base.sprites.back_shiny) ||
    base.sprites.back_default ||
    base.sprites.front_default;

  return {
    name: p.mote.toUpperCase(),
    types: base.types.map(t => t.type.name),

    stats: {
      hp: hp,
      attack: base.stats[1].base_stat,
      defense: base.stats[2].base_stat,
      speed: base.stats[5].base_stat
    },

    maxHp: hp,
    currentHp: hp,

    moves: base.moves.slice(0, 4).map(m => m.move.name),

    spriteFront,
    spriteBack,

    fainted: false
  };
}



let playerTeam = rawTeam.map(adaptarPokemon);
function formatearNombre(nombre) {
  return nombre
    .split("-")
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}
/* ===============================
   AUDIO SYSTEM
=============================== */
const audioBattle = new Audio("audio/batalla-pokemon.mp3");
audioBattle.loop = false; // importante
let loopActivo = false;
// Loop personalizado desde segundo 3
audioBattle.addEventListener("timeupdate", () => {

  // Primera vez: cuando termina la canción completa
  if (!loopActivo && audioBattle.currentTime >= audioBattle.duration - 0.2) {
    loopActivo = true;
    audioBattle.currentTime = 3;
    audioBattle.play();
  }

  // Cuando ya estamos en modo loop
  if (loopActivo && audioBattle.currentTime >= 8) {
    audioBattle.currentTime = 3;
    audioBattle.play();
  }

});

const audioLowHp = new Audio("audio/low-health-critical-health-pokemon.mp3");
const audioHeal = new Audio("audio/SFX_HEAL_UP.mp3");
const audioVictory = new Audio("audio/pokemon-red-blue-music-wild-pokemon-victory-theme-1.mp3");


audioLowHp.loop = true;

let lowHpActivo = false;



let enemyTeam = [];

let playerIndex = 0;
let enemyIndex = 0;

let turnLocked = false;


window.onload = () => {
  startBattle();
};


async function startBattle() {
  if (playerTeam.length !== 6) {
    alert("Necesitas 6 Pokémon para combatir");
    return;
  }

  enemyTeam = await generarEquipoRival();

  playerIndex = 0;
  enemyIndex = 0;
  turnLocked = false;

  renderPokemon();
  showMessage("¡El entrenador rival quiere luchar!");
  showMainMenu();
   
    setTimeout(() => {
      audioBattle.currentTime = 0;
      audioBattle.play();

    }, 3000);

}

async function generarEquipoRival() {
  const team = [];

  for (let i = 0; i < 6; i++) {
    const id = Math.floor(Math.random() * 1025) + 1;
    const data = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json());
    team.push(crearPokemonBatalla(data));
  }

  return team;
}

function crearPokemonBatalla(data) {

  const showdown = data.sprites?.other?.showdown;
  const animated =
    data.sprites?.versions?.["generation-v"]?.["black-white"]?.animated;

  const spriteFront =
    showdown?.front_default ||
    animated?.front_default ||
    data.sprites.front_default;

  const spriteBack =
    showdown?.back_default ||
    animated?.back_default ||
    data.sprites.back_default ||
    data.sprites.front_default;

  return {
    name: formatearNombre(data.name),
    types: data.types.map(t => t.type.name),

    stats: {
      hp: data.stats.find(s => s.stat.name === "hp").base_stat,
      attack: data.stats.find(s => s.stat.name === "attack").base_stat,
      defense: data.stats.find(s => s.stat.name === "defense").base_stat,
      speed: data.stats.find(s => s.stat.name === "speed").base_stat
    },

    currentHp: data.stats.find(s => s.stat.name === "hp").base_stat,

    moves: data.moves.slice(0, 4).map(m => m.move.name),

    spriteFront,
    spriteBack,

    fainted: false
  };
}


function renderPokemon() {
  const player = playerTeam[playerIndex];
  const enemy = enemyTeam[enemyIndex];

  document.getElementById("player-sprite").src = player.spriteBack;
  document.getElementById("enemy-sprite").src = enemy.spriteFront;

  document.getElementById("player-name").textContent = player.name;
  document.getElementById("enemy-name").textContent = enemy.name;

  updateHpBars();
  verificarLowHp();

}

//VIDA*/
function updateHpBars() {
  updateHp("player", playerTeam[playerIndex]);
  updateHp("enemy", enemyTeam[enemyIndex]);
}

function updateHp(side, pokemon) {
  const bar = document.getElementById(`${side}-hp-bar`);
  const text = document.getElementById(`${side}-hp-text`);

  const maxHp = pokemon.stats.hp;
  const targetPercent = Math.max(0, (pokemon.currentHp / maxHp) * 100);

  let currentPercent = parseFloat(bar.dataset.current);

  if (isNaN(currentPercent)) {
    currentPercent = targetPercent;
  }

  const speed = 1.5; // velocidad de bajada

  const interval = setInterval(() => {
    if (currentPercent <= targetPercent) {
      clearInterval(interval);
      currentPercent = targetPercent;
    } else {
      currentPercent -= speed;
    }

    bar.style.width = currentPercent + "%";
    bar.dataset.current = currentPercent;
  }, 10);

  bar.className = "hp-bar " +
    (targetPercent > 50 ? "hp-green" :
     targetPercent > 20 ? "hp-yellow" : "hp-red");

  text.textContent = `${pokemon.currentHp}/${maxHp}`;
}
function verificarLowHp() {
  const player = playerTeam[playerIndex];
  const maxHp = player.stats.hp;
  const porcentaje = player.currentHp / maxHp;

  if (player.currentHp > 0 && porcentaje <= 0.25) {
    if (!lowHpActivo) {
      audioLowHp.currentTime = 0;
      audioLowHp.play();
      lowHpActivo = true;
    }
  } else {
    if (lowHpActivo) {
      audioLowHp.pause();
      audioLowHp.currentTime = 0;
      lowHpActivo = false;
    }
  }
}


//MENSAJES*/
function showMessage(text) {
  document.getElementById("dialog-text").textContent = text;
}

//MENUS*/
function showMainMenu() {
  hideAllMenus();
  document.getElementById("main-menu").classList.remove("hidden");
}

function hideAllMenus() {
  document.getElementById("main-menu").classList.add("hidden");
  document.getElementById("moves-menu").classList.add("hidden");
  document.getElementById("bag-menu").classList.add("hidden");
  document.getElementById("change-menu").classList.add("hidden");
}

//PELEA*/
function openFightMenu() {
  if (turnLocked) return;

  hideAllMenus();

  const menu = document.getElementById("moves-menu");
  menu.innerHTML = "";

  playerTeam[playerIndex].moves.forEach(move => {
    const btn = document.createElement("button");
    btn.textContent = move.toUpperCase();
    btn.onclick = () => playerAttack(move);
    menu.appendChild(btn);
  });

  menu.classList.remove("hidden");
}

//TU TURNO*/
function playerAttack(move) {
  if (turnLocked) return;
  turnLocked = true;

  hideAllMenus();

  const attacker = playerTeam[playerIndex];
  const defender = enemyTeam[enemyIndex];

  const damage = calcularDaño(attacker, defender);
  defender.currentHp = Math.max(0, defender.currentHp - damage);


  animateAttack("enemy-sprite");
  showMessage(`${attacker.name} usó ${move.toUpperCase()}!`);

  setTimeout(() => {
    if (defender.currentHp <= 0) {
      defender.currentHp = 0;
      defender.fainted = true;
      showMessage(`¡${defender.name} se debilitó!`);
      enemyIndex++;

      if (enemyIndex >= enemyTeam.length) {
        showMessage("¡HAS GANADO LA BATALLA! 🏆");
        audioBattle.pause();
        audioBattle.currentTime = 0;
        audioVictory.currentTime = 0;
        audioVictory.play();

        return;
      }

      renderPokemon();
      turnLocked = false;
      showMainMenu();
    } else {
      enemyTurn();
    }

    updateHpBars();
    verificarLowHp();

  }, 800);
}
   /*/TURNO ENEMIGO*/
function enemyTurn() {
  const attacker = enemyTeam[enemyIndex];
  const defender = playerTeam[playerIndex];

  const damage = calcularDaño(attacker, defender);
  defender.currentHp = Math.max(0, defender.currentHp - damage);


  animateAttack("player-sprite");
  showMessage(`${attacker.name} atacó!`);

  setTimeout(() => {
    if (defender.currentHp <= 0) {
      defender.currentHp = 0;
      defender.fainted = true;
      showMessage(`¡${defender.name} se debilitó!`);
      cambiarPokemon();
    } else {
      updateHpBars();
      verificarLowHp();
      turnLocked = false;
      showMainMenu();
    }
  }, 800);
}

function calcularDaño(attacker, defender) {
  let base = attacker.stats.attack - defender.stats.defense / 2;
  base = Math.max(10, base);

  const esCritico = Math.random() < 0.04;

  let dañoFinal = base;

  if (esCritico) {
    dañoFinal *= 1.5;
    showMessage("💥 ¡Golpe crítico!");
  }

  return Math.floor(dañoFinal);
}


function cambiarPokemon() {
  hideAllMenus();

  // Verificar si quedan vivos
  const vivos = playerTeam.filter(p => !p.fainted);

  if (vivos.length === 0) {
    // CAMBIO AQUÍ: Si no hay vivos, perdiste
    endBattle(false);
    return;
  }

  const menu = document.getElementById("change-menu");
  menu.innerHTML = "";

  playerTeam.forEach((p, i) => {
    if (!p.fainted && i !== playerIndex) {
      const btn = document.createElement("button");
      btn.textContent = p.name;
      btn.onclick = () => {
        playerIndex = i;
        renderPokemon();
        turnLocked = false;
        showMessage(`¡Adelante ${p.name}!`);
        showMainMenu();
      };
      menu.appendChild(btn);
    }
  });

  menu.classList.remove("hidden");
}

let itemsUsados = 0;
const MAX_ITEMS = 3;

function openBag() {
  if (itemsUsados >= MAX_ITEMS) {
    showMessage("No puedes usar más objetos en esta batalla.");
    return;
  }

  hideAllMenus();
  document.getElementById("bag-menu").classList.remove("hidden");
}
function closeBag() {
  showMainMenu();
}


function usarPocion() {
  seleccionarPokemonParaItem("pocion");
}

function usarRevivir() {
  seleccionarPokemonParaItem("revivir");
}

function usarHiperPocion() {
  seleccionarPokemonParaItem("hiper");
}

function seleccionarPokemonParaItem(tipo) {
  hideAllMenus();

  const menu = document.getElementById("change-menu");
  menu.innerHTML = "";

  playerTeam.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.textContent = `${p.name} (${p.currentHp}/${p.maxHp})`;

    btn.onclick = () => aplicarItem(tipo, i);
    menu.appendChild(btn);
  });

  menu.classList.remove("hidden");
}

function aplicarItem(tipo, index) {
  const p = playerTeam[index];

  if (itemsUsados >= MAX_ITEMS) {
    showMessage("Ya usaste 3 objetos.");
    return;
  }

  if (tipo === "pocion") {
    if (p.currentHp <= 0) return;
    p.currentHp = Math.min(p.maxHp, p.currentHp + 20);
    audioHeal.currentTime = 0;
    audioHeal.play();

  }

  if (tipo === "hiper") {
    if (p.currentHp <= 0) return;
    p.currentHp = p.stats.hp;
    audioHeal.currentTime = 0;
    audioHeal.play();


  }

  if (tipo === "revivir") {
    if (!p.fainted) return;
    p.fainted = false;
    p.currentHp =Math.floor(p.stats.hp / 2);
    audioHeal.currentTime = 0;
    audioHeal.play();


  }

  itemsUsados++;
  updateHpBars();
  verificarLowHp();
  showMessage(`${p.name} fue curado.`);
  showMainMenu();
}



function animateAttack(id) {
  const el = document.getElementById(id);
  el.classList.add("damage");
  setTimeout(() => el.classList.remove("damage"), 300);
}


function endBattle(victoria) {
  hideAllMenus();
  
  if (victoria) {
    showMessage("¡HAS GANADO LA BATALLA! 🏆");
  } else {
    showMessage("Te has quedado sin Pokémon... 😢");
  }

  // Mostrar el menú de volver
  document.getElementById("end-menu").classList.remove("hidden");
}

function returnToPokedex() {
  window.location.href = "index.html";
}

// Exponer la función al HTML
window.returnToPokedex = returnToPokedex;


window.openFightMenu = openFightMenu;
window.openBag = openBag;
window.closeBag = closeBag;
window.usarPocion = usarPocion;
window.usarRevivir = usarRevivir;
window.cambiarPokemon = cambiarPokemon;
