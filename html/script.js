document.addEventListener("DOMContentLoaded", () => {

  let pokemonId = 1;
  let isFront = true;
  let currentData = null;

  const img = document.getElementById("pokemon-img");
  const name = document.getElementById("pokemon-name");
  const type = document.getElementById("pokemon-type");
  const idText = document.getElementById("pokemon-id");

  async function loadPokemon(id) {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await res.json();
    currentData = data;

    name.textContent = data.name;
    type.textContent = "🧬 " + data.types.map(t => t.type.name).join(", ");
    idText.textContent = `#${data.id.toString().padStart(3, "0")}`;

    updateSprite();
  }

  function updateSprite() {
    const sprite = isFront
      ? currentData.sprites.front_default
      : currentData.sprites.back_default;

    img.src = sprite || currentData.sprites.front_default;
  }

  document.getElementById("up").onclick = () => {
    if (pokemonId > 1) {
      pokemonId--;
      isFront = true;
      loadPokemon(pokemonId);
    }
  };

  document.getElementById("down").onclick = () => {
    pokemonId++;
    isFront = true;
    loadPokemon(pokemonId);
  };

  document.getElementById("left").onclick = () => {
    isFront = false;
    updateSprite();
  };

  document.getElementById("right").onclick = () => {
    isFront = true;
    updateSprite();
  };

  loadPokemon(pokemonId);
});
