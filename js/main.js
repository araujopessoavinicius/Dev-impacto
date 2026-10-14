//integração do leaflet

const map = L.map('mapa').setView([-8.007, -34.866], 16)

//criação do alfinete (denúncias)

const categorias = { //categorias de denúncias
  alagamento: { emoji: "🌊", cor: "#0284C7" },
  lixo:       { emoji: "🗑️", cor: "#D97706" },
  buraco:     { emoji: "🕳️", cor: "#DC2626" }
};

const grupos = { //filtros
  alagamento: L.layerGroup().addTo(map),
  lixo:       L.layerGroup().addTo(map),
  buraco:     L.layerGroup().addTo(map)
};

function criarIcone(categoria) { //função pra criar o alfinete dependendo da denúncia
  const info = categorias[categoria];

  return L.divIcon({ 
    className: "pino",
    html: `<div class="pino__bolinha" style="background:${info.cor}">${info.emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
}

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { //leaflet
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);


function desenharProblema(problema) { //função pra "desenhar" o alfinete
  const marcador = L.marker([problema.lat, problema.lng], {
    icon: criarIcone(problema.categoria)
  });

  marcador.bindPopup(`<strong>${problema.titulo}</strong><br>${problema.descricao}`);
  marcador.addTo(grupos[problema.categoria]);
}

problemas.forEach(desenharProblema); //repetir pra cada problema   

//ROTAS
const linhaPerigosa = L.polyline(rotaPerigosa, {
  color: "#DC2626",
  weight: 5,
  dashArray: "10, 10"
}).bindPopup("⚠️ Rota mais curta: passa por vários pontos de risco");

const linhaSegura = L.polyline(rotaSegura, {
  color: "#16A34A",
  weight: 6
}).bindPopup("✅ Rota segura sugerida pela comunidade");

const pontoA = L.marker(rotaSegura[0]).bindTooltip("Ponto de partida");
const pontoB = L.marker(rotaSegura[rotaSegura.length - 1]).bindTooltip("EREM Desembargador Renato Fonseca");

//BOTÕES DE ROTA
const rotas = { curta: linhaPerigosa, segura: linhaSegura };
const botoesRota = document.querySelectorAll(".botao-rota");

botoesRota.forEach((botao) => {
  botao.addEventListener("click", () => {
    const escolhida = rotas[botao.dataset.rota];
    const jaEstavaLigada = map.hasLayer(escolhida);

    //desliga todas as rotas e apaga todos os botões
    Object.values(rotas).forEach((linha) => map.removeLayer(linha));
    botoesRota.forEach((b) => b.classList.remove("ativo"));

    //se não estava ligada, liga só a escolhida
    if (!jaEstavaLigada) {
      map.addLayer(escolhida);
      map.fitBounds(escolhida.getBounds(), { padding: [40, 40] });
      botao.classList.add("ativo");
    }
  });
});

const grupoPontos = L.layerGroup([pontoA, pontoB]).addTo(map);
//REPORTAR PROBLEMA
let modoReporte = false;     //se for false o clique no mapa não faz nada
let pontoEscolhido = null;   //guarda o lugar clicado

const btnDenunciar = document.getElementById("btn-denunciar");
const dica = document.getElementById("dica");
const modal = document.getElementById("modal-reporte");
const form = document.getElementById("form-reporte");
const btnCancelar = document.getElementById("btn-cancelar");

btnDenunciar.addEventListener("click", () => {
  modoReporte = true;
  dica.classList.remove("oculto");
  map.getContainer().style.cursor = "crosshair";
  document.getElementById("mapa").scrollIntoView({ behavior: "smooth" });
});

map.on("click", (evento) => {
  if (!modoReporte) return;          //se o interruptor ta desligado, ignora

  pontoEscolhido = evento.latlng;    //guarda lat e lng do clique
  modoReporte = false;
  dica.classList.add("oculto");
  map.getContainer().style.cursor = "";
  modal.classList.remove("oculto");  //abre o formulário
});

function fecharModal() {
  modal.classList.add("oculto");
  form.reset();          //limpa os campos
  pontoEscolhido = null;
}

btnCancelar.addEventListener("click", fecharModal);

const CHAVE = "mapa-comunitario-denuncias";

function carregarDenuncias() { //salvar as denúncias
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || [];
  } catch (erro) {
    return [];
  }
}

function salvarDenuncias() {
  localStorage.setItem(CHAVE, JSON.stringify(denuncias));
}

const denuncias = carregarDenuncias();   //lista das denúncias feitos pelos usuários
denuncias.forEach(desenharProblema);    //redesenha as que já estavam salvas

form.addEventListener("submit", (evento) => { //submita a denúncia, desenha, salva no localstorage e fecha o form
  evento.preventDefault();   //impede a página de recarregar

  const novo = {
    id: Date.now(),
    categoria: document.getElementById("campo-categoria").value,
    titulo: document.getElementById("campo-titulo").value.trim(),
    descricao: document.getElementById("campo-descricao").value.trim(),
    lat: pontoEscolhido.lat,
    lng: pontoEscolhido.lng
  };

  if (!novo.titulo || !novo.descricao) {
    alert("Preencha o título e a descrição.");
    return;
  }

  desenharProblema(novo);   //alfinete aparece na hora
  denuncias.push(novo);      //entra na lista
  salvarDenuncias();         //grava no localstorage
  fecharModal();
});

document.querySelectorAll(".filtro").forEach((botao) => { //filtrar 
  botao.addEventListener("click", () => {
    const grupo = grupos[botao.dataset.categoria];

    if (map.hasLayer(grupo)) {
      map.removeLayer(grupo);
      botao.classList.remove("ativo");
    } else {
      map.addLayer(grupo);
      botao.classList.add("ativo");
    }
  });
});