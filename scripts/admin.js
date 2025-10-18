// 🎯 SISTEMA ADMINISTRATIVO - Gerenciador de Produtos
class ProductManager {
    constructor() {
        this.products = JSON.parse(localStorage.getItem('products')) || [];
        this.currentProductId = null;
        this.filteredProducts = [];
        this.init();
    }

    init() {
        console.log('🛠️ Sistema Admin iniciado!');
        this.setupEventListeners();
        this.setupNavigation();
        this.calculateFinalPrice();
        this.loadProducts();
        this.updateStats();
    }

    setupEventListeners() {
        // Upload de imagem
        document.getElementById('uploadArea').addEventListener('click', () => {
            document.getElementById('imagem').click();
        });

        document.getElementById('imagem').addEventListener('change', (e) => {
            this.handleImageUpload(e);
        });

        // Cálculo de preço em tempo real
        document.getElementById('preco').addEventListener('input', () => {
            this.calculateFinalPrice();
        });

        document.getElementById('desconto').addEventListener('input', () => {
            this.calculateFinalPrice();
        });

        // Form submission
        document.getElementById('form-produto').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        // Limpar formulário
        document.getElementById('btn-limpar').addEventListener('click', () => {
            this.clearForm();
        });

        // Cancelar edição
        document.getElementById('btn-cancelar').addEventListener('click', () => {
            this.cancelEdit();
        });

        // Busca e filtros
        document.getElementById('search').addEventListener('input', (e) => {
            this.searchProducts(e.target.value);
        });

        document.getElementById('filter-category').addEventListener('change', (e) => {
            this.applyFilters();
        });

        document.getElementById('filter-status').addEventListener('change', (e) => {
            this.applyFilters();
        });
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.section');

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                if (item.getAttribute('href').startsWith('#')) {
                    e.preventDefault();
                    
                    // Remove active class from all
                    navItems.forEach(nav => nav.classList.remove('active'));
                    sections.forEach(section => section.classList.remove('active'));
                    
                    // Add active class to clicked
                    item.classList.add('active');
                    const targetId = item.getAttribute('href').substring(1);
                    document.getElementById(targetId).classList.add('active');

                    // Atualiza estatísticas se for a seção de vendas
                    if (targetId === 'vendas') {
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
            if (!file.type.startsWith('image/')) {
                alert('❌ Por favor, selecione uma imagem válida!');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview do produto">`;
                preview.style.display = 'block';
                
                // Atualiza o texto da área de upload
                document.querySelector('#uploadArea span').textContent = '🖼️ Imagem selecionada';
            };
            reader.readAsDataURL(file);
        }
    }

    calculateFinalPrice() {
        const preco = parseFloat(document.getElementById('preco').value) || 0;
        const desconto = parseFloat(document.getElementById('desconto').value) || 0;
        
        const precoFinal = preco - (preco * (desconto / 100));
        document.getElementById('preco-final').value = `R$ ${precoFinal.toFixed(2).replace('.', ',')}`;
    }

    saveProduct() {
        // Validação básica
        const nome = document.getElementById('nome').value.trim();
        const preco = parseFloat(document.getElementById('preco').value);
        
        if (!nome) {
            alert('❌ Por favor, informe o nome do produto!');
            return;
        }

        if (!preco || preco <= 0) {
            alert('❌ Por favor, informe um preço válido!');
            return;
        }

        const imageInput = document.getElementById('imagem');
        const imagePreview = document.getElementById('imagePreview').querySelector('img');
        
        const product = {
            id: this.currentProductId || Date.now(),
            nome: nome,
            descricao: document.getElementById('descricao').value.trim(),
            preco: preco,
            desconto: parseFloat(document.getElementById('desconto').value) || 0,
            categoria: document.getElementById('categoria').value,
            estoque: parseInt(document.getElementById('estoque').value) || 0,
            status: document.getElementById('status').value,
            tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            imagem: imagePreview ? imagePreview.src : 'https://via.placeholder.com/300x200?text=Produto+Sem+Imagem',
            dataCadastro: new Date().toISOString(),
            dataAtualizacao: new Date().toISOString()
        };

        if (this.currentProductId) {
            // Editar produto existente
            const index = this.products.findIndex(p => p.id === this.currentProductId);
            this.products[index] = product;
            console.log('✏️ Produto atualizado:', product.nome);
        } else {
            // Adicionar novo produto
            this.products.push(product);
            console.log('📦 Novo produto cadastrado:', product.nome);
        }

        this.saveToLocalStorage();
        this.clearForm();
        this.loadProducts();
        this.updateStats();
        
        // Mostra mensagem de sucesso
        this.showMessage('✅ Produto salvo com sucesso!', 'success');
    }

    clearForm() {
        document.getElementById('form-produto').reset();
        document.getElementById('imagePreview').style.display = 'none';
        document.getElementById('preco-final').value = 'R$ 0,00';
        document.getElementById('btn-cancelar').style.display = 'none';
        document.querySelector('#uploadArea span').textContent = '📷 Clique para adicionar imagem';
        this.currentProductId = null;
        
        console.log('🔄 Formulário limpo');
    }

    cancelEdit() {
        this.clearForm();
        this.showMessage('✏️ Edição cancelada', 'info');
    }

    loadProducts() {
        const table = document.getElementById('tabela-produtos');
        
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

        this.filteredProducts.forEach(product => {
            const precoFinal = product.preco - (product.preco * (product.desconto / 100));
            const stockClass = product.estoque === 0 ? 'stock-out' : (product.estoque < 10 ? 'stock-low' : '');
            
            html += `
                <div class="product-row" data-id="${product.id}">
                    <img src="${product.imagem}" alt="${product.nome}" class="product-image" 
                         onerror="this.src='https://via.placeholder.com/60x60?text=📷'">
                    <div class="product-name">${product.nome}</div>
                    <div class="product-category">${product.categoria}</div>
                    <div class="product-price">R$ ${product.preco.toFixed(2)}</div>
                    <div class="product-discount">${product.desconto}%</div>
                    <div class="product-stock ${stockClass}">${product.estoque}</div>
                    <div class="product-actions">
                        <button class="btn-edit" onclick="productManager.editProduct(${product.id})">
                            ✏️ Editar
                        </button>
                        <button class="btn-delete" onclick="productManager.deleteProduct(${product.id})">
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
        const product = this.products.find(p => p.id === id);
        if (product) {
            document.getElementById('nome').value = product.nome;
            document.getElementById('descricao').value = product.descricao || '';
            document.getElementById('preco').value = product.preco;
            document.getElementById('desconto').value = product.desconto;
            document.getElementById('categoria').value = product.categoria;
            document.getElementById('estoque').value = product.estoque;
            document.getElementById('status').value = product.status;
            document.getElementById('tags').value = product.tags.join(', ');
            
            // Previsualização da imagem
            if (product.imagem) {
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = `<img src="${product.imagem}" alt="Preview">`;
                preview.style.display = 'block';
                document.querySelector('#uploadArea span').textContent = '🖼️ Imagem do produto';
            }
            
            this.calculateFinalPrice();
            this.currentProductId = id;
            document.getElementById('btn-cancelar').style.display = 'inline-block';

            // Navegar para a seção de cadastro
            document.querySelector('.nav-item[href="#cadastro"]').click();
            
            console.log('✏️ Editando produto:', product.nome);
        }
    }

    deleteProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (product && confirm(`Tem certeza que deseja excluir o produto "${product.nome}"?`)) {
            this.products = this.products.filter(p => p.id !== id);
            this.saveToLocalStorage();
            this.loadProducts();
            this.updateStats();
            this.showMessage('✅ Produto excluído com sucesso!', 'success');
            console.log('🗑️ Produto excluído:', product.nome);
        }
    }

    searchProducts(query) {
        this.applyFilters();
    }

    applyFilters(silent = false) {
        const searchTerm = document.getElementById('search').value.toLowerCase();
        const categoryFilter = document.getElementById('filter-category').value;
        const statusFilter = document.getElementById('filter-status').value;

        let filtered = this.products.filter(product => {
            const matchesSearch = !searchTerm || 
                product.nome.toLowerCase().includes(searchTerm) ||
                (product.descricao && product.descricao.toLowerCase().includes(searchTerm)) ||
                product.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            
            const matchesCategory = !categoryFilter || product.categoria === categoryFilter;
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
        const active = this.products.filter(p => p.status === 'ativo').length;
        
        document.getElementById('products-count').textContent = 
            filtered === total ? `${total} produtos` : `${filtered} de ${total} produtos`;
        document.getElementById('active-count').textContent = `${active} ativos`;
    }

    updateStats() {
        const totalProducts = this.products.length;
        const activeProducts = this.products.filter(p => p.status === 'ativo').length;
        const categories = [...new Set(this.products.map(p => p.categoria))].length;
        const totalStock = this.products.reduce((sum, p) => sum + p.estoque, 0);
        
        document.getElementById('total-produtos').textContent = totalProducts;
        document.getElementById('produtos-ativos').textContent = activeProducts;
        document.getElementById('total-categorias').textContent = categories;
        document.getElementById('estoque-total').textContent = totalStock;
    }

    showMessage(message, type = 'info') {
        // Remove mensagens existentes
        const existingMessage = document.querySelector('.success-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `success-message ${type}`;
        messageDiv.textContent = message;
        
        const currentSection = document.querySelector('.section.active');
        currentSection.insertBefore(messageDiv, currentSection.querySelector('.product-form, .controls-bar'));
        
        // Remove a mensagem após 5 segundos
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    saveToLocalStorage() {
        localStorage.setItem('products', JSON.stringify(this.products));
        console.log('💾 Dados salvos no localStorage');
    }
}

// 🎯 Inicializar o gerenciador de produtos quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    window.productManager = new ProductManager();
    console.log('🚀 Sistema administrativo carregado!');
});