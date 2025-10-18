// 🎯 SISTEMA ADMINISTRATIVO - Gerenciador de Produtos
class ProductManager {
  constructor() {
    // PRIORIDADE: Carregar da loja principal, depois do admin
    const produtosLoja = JSON.parse(localStorage.getItem("produtos"));
    const produtosAdmin = JSON.parse(localStorage.getItem("products"));

    this.products = produtosLoja || produtosAdmin || [];
    this.currentProductId = null;
    this.filteredProducts = [];

    // Sincronizar imediatamente
    this.sincronizarComLoja();
    this.init();
  }

  init() {
    console.log("🛠️ Sistema Admin iniciado!");
    this.setupEventListeners();
    this.setupNavigation();
    this.calculateFinalPrice();
    this.loadProducts();
    this.updateStats();
  }

  setupEventListeners() {
    // Upload de imagem
    document.getElementById("uploadArea").addEventListener("click", () => {
      document.getElementById("imagem").click();
    });

    document.getElementById("imagem").addEventListener("change", (e) => {
      this.handleImageUpload(e);
    });

    // Cálculo de preço em tempo real
    document.getElementById("preco").addEventListener("input", () => {
      this.calculateFinalPrice();
    });

    document.getElementById("desconto").addEventListener("input", () => {
      this.calculateFinalPrice();
    });

    // Form submission
    document.getElementById("form-produto").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveProduct();
    });

    // Limpar formulário
    document.getElementById("btn-limpar").addEventListener("click", () => {
      this.clearForm();
    });

    // Cancelar edição
    document.getElementById("btn-cancelar").addEventListener("click", () => {
      this.cancelEdit();
    });

    // Busca e filtros
    document.getElementById("search").addEventListener("input", (e) => {
      this.searchProducts(e.target.value);
    });

    document
      .getElementById("filter-category")
      .addEventListener("change", (e) => {
        this.applyFilters();
      });

    document.getElementById("filter-status").addEventListener("change", (e) => {
      this.applyFilters();
    });
  }

  setupNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".section");

    navItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        if (item.getAttribute("href").startsWith("#")) {
          e.preventDefault();

          // Remove active class from all
          navItems.forEach((nav) => nav.classList.remove("active"));
          sections.forEach((section) => section.classList.remove("active"));

          // Add active class to clicked
          item.classList.add("active");
          const targetId = item.getAttribute("href").substring(1);
          document.getElementById(targetId).classList.add("active");

          // Atualiza estatísticas se for a seção de vendas
          if (targetId === "vendas") {
            this.updateStats();
          }
        }
      });
    });
  }

  handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
      // Verifica se é uma imagem
      if (!file.type.startsWith("image/")) {
        alert("❌ Por favor, selecione uma imagem válida!");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = document.getElementById("imagePreview");
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview do produto">`;
        preview.style.display = "block";

        // Atualiza o texto da área de upload
        document.querySelector("#uploadArea span").textContent =
          "🖼️ Imagem selecionada";
      };
      reader.readAsDataURL(file);
    }
  }

  calculateFinalPrice() {
    const preco = parseFloat(document.getElementById("preco").value) || 0;
    const desconto = parseFloat(document.getElementById("desconto").value) || 0;

    const precoFinal = preco - preco * (desconto / 100);
    document.getElementById("preco-final").value = `R$ ${precoFinal
      .toFixed(2)
      .replace(".", ",")}`;
  }

  saveProduct() {
    // Validação básica
    const nome = document.getElementById("nome").value.trim();
    const preco = parseFloat(document.getElementById("preco").value);

    if (!nome) {
      alert("❌ Por favor, informe o nome do produto!");
      return;
    }

    if (!preco || preco <= 0) {
      alert("❌ Por favor, informe um preço válido!");
      return;
    }

    const imageInput = document.getElementById("imagem");
    const imagePreview = document
      .getElementById("imagePreview")
      .querySelector("img");

    // 🎯 SOLUÇÃO: Usar placeholder em vez de Base64 para imagens novas
    let imagemUrl =
      "https://via.placeholder.com/300x200?text=Produto+Sem+Imagem";

    if (imagePreview && imagePreview.src) {
      // Se for uma imagem placeholder ou URL externa, mantém
      if (
        imagePreview.src.includes("via.placeholder.com") ||
        imagePreview.src.startsWith("http")
      ) {
        imagemUrl = imagePreview.src;
      } else if (imagePreview.src.startsWith("data:image")) {
        // Se for Base64, converte para placeholder para economizar espaço
        const categoria = document.getElementById("categoria").value;
        imagemUrl = `https://via.placeholder.com/300x200/8b5cf6/ffffff?text=${encodeURIComponent(
          categoria
        )}`;
      }
    }

    const product = {
      id: this.currentProductId || Date.now(),
      nome: nome,
      descricao: document.getElementById("descricao").value.trim(),
      preco: preco,
      desconto: parseFloat(document.getElementById("desconto").value) || 0,
      categoria: document.getElementById("categoria").value,
      estoque: parseInt(document.getElementById("estoque").value) || 0,
      status: document.getElementById("status").value,
      tags: document
        .getElementById("tags")
        .value.split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      imagem: imagemUrl, // ← USA URL EM VEZ DE BASE64
      dataCadastro: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString(),
    };

    if (this.currentProductId) {
      // Editar produto existente
      const index = this.products.findIndex(
        (p) => p.id === this.currentProductId
      );
      this.products[index] = product;
      console.log("✏️ Produto atualizado:", product.nome);
    } else {
      // Adicionar novo produto
      this.products.push(product);
      console.log("📦 Novo produto cadastrado:", product.nome);
    }

    this.saveToLocalStorage();
    this.sincronizarComLoja();
    this.clearForm();
    this.loadProducts();
    this.updateStats();

    this.showMessage("✅ Produto salvo com sucesso!", "success");
  }

  sincronizarComLoja() {
    // Garantir que ambos os storage estejam sincronizados
    localStorage.setItem("products", JSON.stringify(this.products));
    localStorage.setItem("produtos", JSON.stringify(this.products));
    console.log("🔄 Dados sincronizados entre admin e loja");

    // Atualizar a loja principal se estiver aberta
    if (
      window.loja &&
      typeof window.loja.carregarProdutosLocais === "function"
    ) {
      window.loja.carregarProdutosLocais();
      console.log("🔄 Loja principal atualizada");
    }
  }

  clearForm() {
    document.getElementById("form-produto").reset();
    document.getElementById("imagePreview").style.display = "none";
    document.getElementById("preco-final").value = "R$ 0,00";
    document.getElementById("btn-cancelar").style.display = "none";
    document.querySelector("#uploadArea span").textContent =
      "📷 Clique para adicionar imagem";
    this.currentProductId = null;

    console.log("🔄 Formulário limpo");
  }

  cancelEdit() {
    this.clearForm();
    this.showMessage("✏️ Edição cancelada", "info");
  }

  loadProducts() {
    const table = document.getElementById("tabela-produtos");

    if (this.products.length === 0) {
      table.innerHTML = `
                <div class="no-products">
                    <p>📦 Nenhum produto cadastrado</p>
                    <p>Use o formulário ao lado para adicionar seu primeiro produto!</p>
                </div>
            `;
      this.updateProductsCount();
      return;
    }

    // Aplica filtros se houver
    this.filteredProducts = this.applyFilters(true);

    let html = `
            <div class="product-row header">
                <div>Imagem</div>
                <div>Produto</div>
                <div>Categoria</div>
                <div>Preço</div>
                <div>Desconto</div>
                <div>Estoque</div>
                <div>Ações</div>
            </div>
        `;

    this.filteredProducts.forEach((product) => {
      const precoFinal =
        product.preco - product.preco * (product.desconto / 100);
      const stockClass =
        product.estoque === 0
          ? "stock-out"
          : product.estoque < 10
          ? "stock-low"
          : "";

      html += `
                <div class="product-row" data-id="${product.id}">
                    <img src="${product.imagem}" alt="${
        product.nome
      }" class="product-image" 
                         onerror="this.src='https://via.placeholder.com/60x60?text=📷'">
                    <div class="product-name">${product.nome}</div>
                    <div class="product-category">${product.categoria}</div>
                    <div class="product-price">R$ ${product.preco.toFixed(
                      2
                    )}</div>
                    <div class="product-discount">${product.desconto}%</div>
                    <div class="product-stock ${stockClass}">${
        product.estoque
      }</div>
                    <div class="product-actions">
                        <button class="btn-edit" onclick="productManager.editProduct(${
                          product.id
                        })">
                            ✏️ Editar
                        </button>
                        <button class="btn-delete" onclick="productManager.deleteProduct(${
                          product.id
                        })">
                            🗑️ Excluir
                        </button>
                    </div>
                </div>
            `;
    });

    table.innerHTML = html;
    this.updateProductsCount();
  }

  editProduct(id) {
    const product = this.products.find((p) => p.id === id);
    if (product) {
      document.getElementById("nome").value = product.nome;
      document.getElementById("descricao").value = product.descricao || "";
      document.getElementById("preco").value = product.preco;
      document.getElementById("desconto").value = product.desconto;
      document.getElementById("categoria").value = product.categoria;
      document.getElementById("estoque").value = product.estoque;
      document.getElementById("status").value = product.status;
      document.getElementById("tags").value = product.tags.join(", ");

      // Previsualização da imagem
      if (product.imagem) {
        const preview = document.getElementById("imagePreview");
        preview.innerHTML = `<img src="${product.imagem}" alt="Preview">`;
        preview.style.display = "block";
        document.querySelector("#uploadArea span").textContent =
          "🖼️ Imagem do produto";
      }

      this.calculateFinalPrice();
      this.currentProductId = id;
      document.getElementById("btn-cancelar").style.display = "inline-block";

      // Navegar para a seção de cadastro
      document.querySelector('.nav-item[href="#cadastro"]').click();

      console.log("✏️ Editando produto:", product.nome);
    }
  }

  deleteProduct(id) {
    const product = this.products.find((p) => p.id === id);
    if (
      product &&
      confirm(`Tem certeza que deseja excluir o produto "${product.nome}"?`)
    ) {
      this.products = this.products.filter((p) => p.id !== id);
      this.saveToLocalStorage();
      this.sincronizarComLoja();
      this.loadProducts();
      this.updateStats();
      this.showMessage("✅ Produto excluído com sucesso!", "success");
      console.log("🗑️ Produto excluído:", product.nome);
    }
  }

  searchProducts(query) {
    this.applyFilters();
  }

  applyFilters(silent = false) {
    const searchTerm = document.getElementById("search").value.toLowerCase();
    const categoryFilter = document.getElementById("filter-category").value;
    const statusFilter = document.getElementById("filter-status").value;

    let filtered = this.products.filter((product) => {
      const matchesSearch =
        !searchTerm ||
        product.nome.toLowerCase().includes(searchTerm) ||
        (product.descricao &&
          product.descricao.toLowerCase().includes(searchTerm)) ||
        product.tags.some((tag) => tag.toLowerCase().includes(searchTerm));

      const matchesCategory =
        !categoryFilter || product.categoria === categoryFilter;
      const matchesStatus = !statusFilter || product.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    if (!silent) {
      this.filteredProducts = filtered;
      this.loadProducts();
    }

    return filtered;
  }

  updateProductsCount() {
    const total = this.products.length;
    const filtered = this.filteredProducts.length;
    const active = this.products.filter((p) => p.status === "ativo").length;

    document.getElementById("products-count").textContent =
      filtered === total
        ? `${total} produtos`
        : `${filtered} de ${total} produtos`;
    document.getElementById("active-count").textContent = `${active} ativos`;
  }

  updateStats() {
    const totalProducts = this.products.length;
    const activeProducts = this.products.filter(
      (p) => p.status === "ativo"
    ).length;
    const categories = [...new Set(this.products.map((p) => p.categoria))]
      .length;
    const totalStock = this.products.reduce((sum, p) => sum + p.estoque, 0);

    document.getElementById("total-produtos").textContent = totalProducts;
    document.getElementById("produtos-ativos").textContent = activeProducts;
    document.getElementById("total-categorias").textContent = categories;
    document.getElementById("estoque-total").textContent = totalStock;
  }

  showMessage(message, type = "info") {
    // Remove mensagens existentes
    const existingMessage = document.querySelector(".success-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    const messageDiv = document.createElement("div");
    messageDiv.className = `success-message ${type}`;
    messageDiv.textContent = message;

    const currentSection = document.querySelector(".section.active");
    currentSection.insertBefore(
      messageDiv,
      currentSection.querySelector(".product-form, .controls-bar")
    );

    // Remove a mensagem após 5 segundos
    setTimeout(() => {
      messageDiv.remove();
    }, 5000);
  }

  verificarEspacoStorage() {
    try {
      // Testar se tem espaço
      const testData = new Array(1000).fill("test").join("");
      localStorage.setItem("test_storage", testData);
      localStorage.removeItem("test_storage");
      return true;
    } catch (error) {
      console.warn("⚠️ Storage quase cheio, limpando dados antigos...");
      this.limparDadosAntigos();
      return false;
    }
  }

  limparDadosAntigos() {
    // Manter apenas os últimos 50 produtos
    if (this.products.length > 50) {
      this.products = this.products
        .sort((a, b) => new Date(b.dataCadastro) - new Date(a.dataCadastro))
        .slice(0, 50);

      this.saveToLocalStorage();
      this.showMessage(
        "🔄 Dados antigos removidos para liberar espaço",
        "warning"
      );
    }

    // Limpar carrinho antigo
    const carrinho = JSON.parse(localStorage.getItem("carrinho") || "[]");
    if (carrinho.length > 20) {
      localStorage.setItem("carrinho", JSON.stringify([]));
    }
  }

  saveToLocalStorage() {
    try {
      // Verificar espaço antes de salvar
      if (!this.verificarEspacoStorage()) {
        throw new Error("Storage cheio");
      }

      localStorage.setItem("products", JSON.stringify(this.products));
      console.log("💾 Dados salvos no localStorage (admin)");
    } catch (error) {
      console.error("❌ Erro ao salvar no localStorage:", error);
      this.showMessage(
        "❌ Erro ao salvar: storage cheio. Limpe alguns dados.",
        "error"
      );
    }
  }

  // 🔥 MÉTODOS ADICIONAIS - DENTRO DA CLASSE!
  limparImagensBase64() {
    let produtosModificados = false;

    this.products = this.products.map((product) => {
      // Se a imagem for Base64 (começa com "data:image"), converte para placeholder
      if (product.imagem && product.imagem.startsWith("data:image")) {
        produtosModificados = true;
        return {
          ...product,
          imagem: `https://via.placeholder.com/300x200/8b5cf6/ffffff?text=${encodeURIComponent(
            product.categoria
          )}`,
        };
      }
      return product;
    });

    if (produtosModificados) {
      this.saveToLocalStorage();
      this.sincronizarComLoja();
      this.loadProducts();
      this.showMessage(
        "🔄 Imagens Base64 convertidas para URLs - Storage liberado!",
        "success"
      );
    } else {
      this.showMessage("✅ Nenhuma imagem Base64 encontrada!", "info");
    }
  }

  limparStorage() {
    if (
      confirm(
        "🚨 ATENÇÃO! Isso irá:\n\n• Limpar TODOS os produtos cadastrados\n• Limpar carrinho de compras\n• Reiniciar todo o sistema\n\n⚠️ Esta ação NÃO pode ser desfeita!\n\nContinuar?"
      )
    ) {
      // Limpar tudo
      localStorage.clear();

      // Resetar arrays
      this.products = [];
      this.filteredProducts = [];

      // Atualizar interface
      this.loadProducts();
      this.updateStats();
      this.clearForm();

      this.showMessage(
        "✅ Storage limpo com sucesso! O sistema será reiniciado...",
        "success"
      );

      // Recarregar após 2 segundos
      setTimeout(() => {
        location.reload();
      }, 2000);
    }
  }

  exportData() {
    const dataStr = JSON.stringify(this.products, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = `produtos-produtinhos-da-be-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();

    this.showMessage("✅ Dados exportados com sucesso!", "success");
  }

  importData() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const importedProducts = JSON.parse(event.target.result);
          if (Array.isArray(importedProducts)) {
            this.products = importedProducts;
            this.saveToLocalStorage();
            this.sincronizarComLoja();
            this.loadProducts();
            this.updateStats();
            this.showMessage("✅ Dados importados com sucesso!", "success");
          } else {
            throw new Error("Formato inválido");
          }
        } catch (error) {
          this.showMessage(
            "❌ Erro ao importar dados. Verifique o arquivo.",
            "error"
          );
        }
      };

      reader.readAsText(file);
    };

    input.click();
  }
} // ← FIM DA CLASSE

// 🎯 Inicializar o gerenciador de produtos quando a página carregar
document.addEventListener("DOMContentLoaded", function () {
  window.productManager = new ProductManager();
  console.log("🚀 Sistema administrativo carregado!");
});
