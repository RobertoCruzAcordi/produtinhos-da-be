// scripts/admin.js

let produtos = [];

// -------------------- CARREGAR PRODUTOS --------------------
async function carregarProdutosAdmin() {
  try {
    produtos = await listarProdutos();
    renderTabelaProdutos();
  } catch (e) {
    console.error("Erro ao carregar produtos:", e);
    mostrarMensagemAdmin(
      "Erro ao carregar produtos. Atualize a página.",
      "erro"
    );
  }
}

// -------------------- TABELA --------------------
function renderTabelaProdutos() {
  const tbody = document.getElementById("tabela-produtos");
  tbody.innerHTML = "";

  produtos.forEach((p) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.nome}</td>
      <td>R$ ${p.preco.toFixed(2)}</td>
      <td>${p.promocao ? "Sim" : "Não"}</td>
      <td>${p.promocao && p.desconto ? p.desconto + "%" : "-"}</td>
      <td>${p.novo ? "Sim" : "Não"}</td>
      <td>${p.imagem || ""}</td>
      <td>
        <button class="btn-editar" data-id="${p.id}">Editar</button>
        <button class="btn-excluir" data-id="${p.id}">Excluir</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  document.querySelectorAll(".btn-editar").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      carregarProdutoNoFormulario(id);
    });
  });

  document.querySelectorAll(".btn-excluir").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      await excluirProduto(id);
    });
  });
}

// -------------------- CARREGAR NO FORM --------------------
function carregarProdutoNoFormulario(id) {
  const produto = produtos.find((p) => p.id === id);
  if (!produto) return;

  document.getElementById("produto-id").value = produto.id;
  document.getElementById("produto-nome").value = produto.nome;
  document.getElementById("produto-preco").value = produto.preco;
  document.getElementById("produto-imagem").value = produto.imagem || "";
  document.getElementById("produto-promocao").checked = !!produto.promocao;
  document.getElementById("produto-desconto").value = produto.desconto || "";
  document.getElementById("produto-novo").checked = !!produto.novo;
}

// -------------------- EXCLUIR --------------------
async function excluirProduto(id) {
  if (!confirm("Tem certeza que deseja excluir este produto?")) return;

  try {
    await deletarProduto(id);
    produtos = produtos.filter((p) => p.id !== id);
    renderTabelaProdutos();
    mostrarMensagemAdmin("Produto excluído com sucesso.", "sucesso");
  } catch (e) {
    console.error("Erro ao excluir:", e);
    mostrarMensagemAdmin("Erro ao excluir produto.", "erro");
  }
}

function limparFormulario() {
  document.getElementById("produto-id").value = "";
  document.getElementById("form-produto").reset();
}

// -------------------- MENSAGENS --------------------
function mostrarMensagemAdmin(texto, tipo) {
  const box = document.getElementById("mensagem-admin");
  if (!box) return;

  box.textContent = texto;
  box.className = "mensagem " + tipo;
  box.style.display = "block";

  setTimeout(() => {
    box.style.display = "none";
  }, 4000);
}

// -------------------- AJUSTE DE LINK IMGUR --------------------
function normalizarUrlImagem(url) {
  if (!url) return "";

  url = url.trim();

  // Se já for link direto (i.imgur.com/... com extensão), não altera
  if (url.includes("i.imgur.com") && /\.(jpg|jpeg|png|gif)$/i.test(url)) {
    return url;
  }

  // Aceita imgur.com, m.imgur.com, gallery, a/, etc
  const match = url.match(
    /(?:https?:\/\/)?(?:m\.)?(?:i\.)?imgur\.com\/(?:gallery\/|a\/)?([A-Za-z0-9]+)(?:\.(jpg|jpeg|png|gif))?/i
  );

  if (!match) return url;

  const id = match[1];
  const ext = match[2] ? match[2] : "jpg"; // se não tiver extensão, tenta .jpg

  return `https://i.imgur.com/${id}.${ext}`;
}

// ===================== INICIALIZAÇÃO =====================
document.addEventListener("DOMContentLoaded", () => {
  const btnLimpar = document.getElementById("btn-limpar");
  const form = document.getElementById("form-produto");
  const btnSair = document.getElementById("btn-sair");

  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    // Carregar produtos só depois que estiver logado
    carregarProdutosAdmin();

    // SALVAR PRODUTO
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const idCampo = document.getElementById("produto-id").value;
      const nome = document.getElementById("produto-nome").value.trim();
      const preco = Number(document.getElementById("produto-preco").value);
      let imagem = document.getElementById("produto-imagem").value.trim();
      imagem = normalizarUrlImagem(imagem);
      document.getElementById("produto-imagem").value = imagem;

      // atualiza o campo com o link já convertido
      document.getElementById("produto-imagem").value = imagem;

      const promocao = document.getElementById("produto-promocao").checked;
      let desconto = document.getElementById("produto-desconto").value.trim();
      const novo = document.getElementById("produto-novo").checked;

      if (!nome) {
        mostrarMensagemAdmin("Informe o nome do produto.", "erro");
        return;
      }

      if (isNaN(preco) || preco <= 0) {
        mostrarMensagemAdmin("Informe um preço válido.", "erro");
        return;
      }

      if (promocao) {
        desconto = Number(desconto);
        if (isNaN(desconto) || desconto <= 0 || desconto >= 100) {
          mostrarMensagemAdmin(
            "Desconto inválido. Informe um valor entre 1 e 99.",
            "erro"
          );
          return;
        }
      } else {
        desconto = 0;
      }

      const dados = {
        nome,
        preco,
        imagem,
        promocao,
        desconto,
        novo,
      };

      try {
        if (idCampo) {
          await atualizarProduto(idCampo, dados);
          const index = produtos.findIndex((p) => p.id === idCampo);
          produtos[index] = { id: idCampo, ...dados };
          mostrarMensagemAdmin("Produto atualizado!", "sucesso");
        } else {
          const novoProduto = await criarProduto(dados);
          produtos.push(novoProduto);
          mostrarMensagemAdmin("Produto cadastrado!", "sucesso");
        }

        renderTabelaProdutos();
        limparFormulario();
      } catch (e) {
        console.error("Erro ao salvar:", e);
        mostrarMensagemAdmin("Erro ao salvar produto.", "erro");
      }
    });

    btnLimpar.addEventListener("click", () => {
      limparFormulario();
    });

    btnSair.addEventListener("click", async () => {
      await firebase.auth().signOut();
      window.location.href = "login.html";
    });
  });
});
