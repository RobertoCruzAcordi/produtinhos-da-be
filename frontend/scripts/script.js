// 🎯 SISTEMA DA LOJA - Página Inicial
class LojaCosmeticos {
    constructor() {
        this.produtos = [];
        this.produtosFiltrados = [];
        this.carrinho = [];
        this.API_URL = 'https://localhost:7191/api'; // URL da API C#
        this.init();
    }

    async init() {
        console.log('🏪 Loja de Cosméticos iniciada!');
        await this.carregarProdutosDaAPI();
        this.carregarCarrinhoSalvo();
        this.iniciarSlideshow();
        this.configurarBusca();
        this.configurarEventos();
        this.configurarCarrinho();
    }

    async carregarProdutosDaAPI() {
        try {
            console.log('🔄 Carregando produtos da API C#...');
            const response = await fetch(`${this.API_URL}/produtos`);

            if (!response.ok) {
                throw new Error(`Erro na API: ${response.statusText}`);
            }

            this.produtos = await response.json();
            console.log(`📦 ${this.produtos.length} produtos carregados da API`);

            localStorage.setItem('produtos', JSON.stringify(this.produtos));
            this.filtrarProdutos();

        } catch (error) {
            console.error('❌ Erro ao carregar da API C#:', error);
            console.log('⚠️ Usando fallback local...');
            this.carregarProdutosLocais();
        }
    }

    carregarProdutosLocais() {
        const produtosSalvos = localStorage.getItem('produtos');
        if (produtosSalvos) {
            this.produtos = JSON.parse(produtosSalvos);
            console.log(`📦 ${this.produtos.length} produtos carregados do localStorage`);
        } else {
            this.produtos = this.getProdutosExemplo();
            console.log('📦 Usando produtos de exemplo');
        }
        this.filtrarProdutos();
    }

    configurarBusca() {
        // Busca por texto
        document.getElementById('search-store').addEventListener('input', (e) => {
            this.filtrarProdutos();
        });

        // Filtro por categoria
        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.filtrarProdutos();
        });

        // Filtro por preço
        document.getElementById('price-filter').addEventListener('change', (e) => {
            this.filtrarProdutos();
        });

        // Limpar filtros
        document.getElementById('clear-filters').addEventListener('click', () => {
            this.limparFiltros();
        });
    }

    configurarCarrinho() {
        // Event listeners para o carrinho
        const btnAbrir = document.getElementById('btn-abrir-carrinho');
        const modal = document.getElementById('carrinho-modal');
        const btnFechar = document.querySelector('.fechar-carrinho');
        const btnContinuar = document.querySelector('.btn-continuar');
        const btnFinalizar = document.querySelector('.btn-finalizar');

        if (btnAbrir) {
            btnAbrir.addEventListener('click', () => this.exibirCarrinho());
        }
        if (btnFechar) {
            btnFechar.addEventListener('click', () => this.fecharCarrinho());
        }
        if (btnContinuar) {
            btnContinuar.addEventListener('click', () => this.fecharCarrinho());
        }
        if (btnFinalizar) {
            btnFinalizar.addEventListener('click', () => this.finalizarCompra());
        }

        // Fechar modal ao clicar fora
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.fecharCarrinho();
                }
            });
        }
    }

    filtrarProdutos() {
        const termoBusca = document.getElementById('search-store').value.toLowerCase();
        const categoriaSelecionada = document.getElementById('category-filter').value;
        const faixaPreco = document.getElementById('price-filter').value;

        this.produtosFiltrados = this.produtos.filter(produto => {
            // Filtro por busca
            const buscaMatch = !termoBusca || 
                produto.nome.toLowerCase().includes(termoBusca) ||
                (produto.descricao && produto.descricao.toLowerCase().includes(termoBusca)) ||
                produto.tags.some(tag => tag.toLowerCase().includes(termoBusca));
            
            // Filtro por categoria
            const categoriaMatch = !categoriaSelecionada || produto.categoria === categoriaSelecionada;
            
            // Filtro por preço
            const precoMatch = this.filtrarPorPreço(produto.preco, faixaPreco);
            
            return buscaMatch && categoriaMatch && precoMatch;
        });

        this.exibirProdutos();
        this.atualizarContador();
    }

    filtrarPorPreço(preco, faixaPreco) {
        if (!faixaPreco) return true;
        
        switch(faixaPreco) {
            case '0-50': return preco <= 50;
            case '50-100': return preco > 50 && preco <= 100;
            case '100-200': return preco > 100 && preco <= 200;
            case '200+': return preco > 200;
            default: return true;
        }
    }

    limparFiltros() {
        document.getElementById('search-store').value = '';
        document.getElementById('category-filter').value = '';
        document.getElementById('price-filter').value = '';
        this.filtrarProdutos();
    }

    atualizarContador() {
        const total = this.produtos.length;
        const exibindo = this.produtosFiltrados.length;
        const contador = document.getElementById('results-count');
        
        if (total === 0) {
            contador.textContent = 'Nenhum produto cadastrado';
        } else if (exibindo === total) {
            contador.textContent = `${total} produtos encontrados`;
        } else {
            contador.textContent = `${exibindo} de ${total} produtos encontrados`;
        }
    }

    exibirProdutos() {
        const grid = document.getElementById('products-grid');
        
        if (this.produtosFiltrados.length === 0) {
            grid.innerHTML = `
                <div class="no-products">
                    <p>🔍 Nenhum produto encontrado</p>
                    <p>Tente alterar os termos da busca ou <a href="admin.html" style="color: var(--primary-color);">cadastre novos produtos</a></p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.produtosFiltrados.map(produto => this.criarCardProduto(produto)).join('');
    }

    criarCardProduto(produto) {
        const precoFinal = produto.preco - (produto.preco * (produto.desconto / 100));
        const temDesconto = produto.desconto > 0;

        return `
            <div class="product-card" data-id="${produto.id}" data-category="${produto.categoria}">
                <div class="product-image" style="background-image: url('${produto.imagem}')"></div>
                <div class="product-info">
                    <h3>${produto.nome}</h3>
                    <p class="product-description">${produto.descricao}</p>
                    
                    <div class="product-price">
                        ${temDesconto ? `
                            <span class="original-price">R$ ${produto.preco.toFixed(2)}</span>
                            <span class="final-price">R$ ${precoFinal.toFixed(2)}</span>
                            <span class="discount-badge">-${produto.desconto}%</span>
                        ` : `
                            <span class="final-price">R$ ${produto.preco.toFixed(2)}</span>
                        `}
                    </div>
                    
                    <div class="product-meta">
                        <span class="product-category-badge">${produto.categoria}</span>
                        ${produto.estoque > 0 ? 
                            `<span class="stock-available">📦 Em estoque</span>` : 
                            `<span class="stock-out">⏳ Fora de estoque</span>`
                        }
                    </div>
                    
                    <button class="buy-button" onclick="loja.adicionarAoCarrinho(${produto.id})" 
                            ${produto.estoque === 0 ? 'disabled' : ''}>
                        ${produto.estoque > 0 ? '🛒 Adicionar ao Carrinho' : '⏳ Indisponível'}
                    </button>
                </div>
            </div>
        `;
    }

    // 🛒 SISTEMA DO CARRINHO

    adicionarAoCarrinho(idProduto) {
        try {
            const produto = this.produtos.find(p => p.id === idProduto);
            if (!produto) {
                console.error('Produto não encontrado:', idProduto);
                return;
            }

            if (produto.estoque === 0) {
                alert('❌ Este produto está fora de estoque!');
                return;
            }

            // Verificar se produto já está no carrinho
            const itemExistente = this.carrinho.find(item => item.id === idProduto);
            
            if (itemExistente) {
                itemExistente.quantidade += 1;
            } else {
                this.carrinho.push({
                    ...produto,
                    quantidade: 1
                });
            }

            console.log('🛒 Produto adicionado ao carrinho:', produto.nome);
            this.atualizarCarrinho();
            
            // Feedback visual
            this.mostrarFeedbackCarrinho(produto.nome);

        } catch (error) {
            console.error('❌ Erro ao adicionar ao carrinho:', error);
        }
    }

    removerDoCarrinho(index) {
        if (index >= 0 && index < this.carrinho.length) {
            const produtoRemovido = this.carrinho[index].nome;
            this.carrinho.splice(index, 1);
            console.log('🗑️ Produto removido do carrinho:', produtoRemovido);
            this.atualizarCarrinho();
            this.exibirCarrinho(); // Atualiza a visualização se estiver aberta
        }
    }

    atualizarQuantidade(index, novaQuantidade) {
        if (novaQuantidade <= 0) {
            this.removerDoCarrinho(index);
        } else {
            this.carrinho[index].quantidade = novaQuantidade;
            this.atualizarCarrinho();
            this.exibirCarrinho(); // Atualiza a visualização se estiver aberta
        }
    }

    atualizarCarrinho() {
        // Atualizar contador
        const contador = document.getElementById('carrinho-contador');
        const totalItens = this.carrinho.reduce((total, item) => total + item.quantidade, 0);
        
        if (contador) {
            contador.textContent = totalItens;
        }

        // Salvar no localStorage
        this.salvarCarrinho();
    }

    salvarCarrinho() {
        localStorage.setItem('carrinho', JSON.stringify(this.carrinho));
    }

    carregarCarrinhoSalvo() {
        const carrinhoSalvo = localStorage.getItem('carrinho');
        if (carrinhoSalvo) {
            this.carrinho = JSON.parse(carrinhoSalvo);
            this.atualizarCarrinho();
            console.log('🛒 Carrinho carregado:', this.carrinho.length + ' itens');
        }
    }

    exibirCarrinho() {
        const modal = document.getElementById('carrinho-modal');
        const itemsContainer = document.querySelector('.carrinho-items');
        const totalElement = document.getElementById('carrinho-total');
        
        if (!modal || !itemsContainer || !totalElement) {
            console.error('❌ Elementos do carrinho não encontrados no HTML');
            return;
        }

        // Limpar itens anteriores
        itemsContainer.innerHTML = '';

        if (this.carrinho.length === 0) {
            itemsContainer.innerHTML = `
                <div class="carrinho-vazio">
                    <p>🛒 Seu carrinho está vazio</p>
                    <p>Adicione alguns produtos incríveis!</p>
                </div>
            `;
        } else {
            // Adicionar itens atuais
            this.carrinho.forEach((item, index) => {
                const precoFinal = item.preco - (item.preco * (item.desconto / 100));
                const subtotal = precoFinal * item.quantidade;
                
                const itemElement = document.createElement('div');
                itemElement.className = 'carrinho-item';
                itemElement.innerHTML = `
                    <div class="carrinho-item-info">
                        <strong>${item.nome}</strong>
                        <div class="carrinho-item-preco">
                            R$ ${precoFinal.toFixed(2)} × 
                            <button onclick="loja.atualizarQuantidade(${index}, ${item.quantidade - 1})">-</button>
                            ${item.quantidade}
                            <button onclick="loja.atualizarQuantidade(${index}, ${item.quantidade + 1})">+</button>
                        </div>
                        <small>Subtotal: R$ ${subtotal.toFixed(2)}</small>
                    </div>
                    <button class="btn-remover" onclick="loja.removerDoCarrinho(${index})">🗑️</button>
                `;
                itemsContainer.appendChild(itemElement);
            });
        }

        // Calcular total
        const total = this.carrinho.reduce((sum, item) => {
            const precoFinal = item.preco - (item.preco * (item.desconto / 100));
            return sum + (precoFinal * item.quantidade);
        }, 0);
        
        totalElement.textContent = total.toFixed(2);

        // Mostrar modal
        modal.style.display = 'block';
    }

    fecharCarrinho() {
        const modal = document.getElementById('carrinho-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    finalizarCompra() {
        if (this.carrinho.length === 0) {
            alert('🛒 Seu carrinho está vazio!');
            return;
        }

        const total = this.carrinho.reduce((sum, item) => {
            const precoFinal = item.preco - (item.preco * (item.desconto / 100));
            return sum + (precoFinal * item.quantidade);
        }, 0);

        alert(`🎉 Compra finalizada!\nTotal: R$ ${total.toFixed(2)}\n\nObrigado pela compra!`);
        
        // Limpar carrinho após compra
        this.carrinho = [];
        this.atualizarCarrinho();
        this.fecharCarrinho();
    }

    mostrarFeedbackCarrinho(nomeProduto) {
        // Criar feedback visual temporário
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1001;
            animation: slideIn 0.3s ease-out;
        `;
        feedback.innerHTML = `✅ ${nomeProduto} adicionado ao carrinho!`;
        
        document.body.appendChild(feedback);
        
        // Remover após 3 segundos
        setTimeout(() => {
            feedback.remove();
        }, 3000);
    }

    iniciarSlideshow() {
        let slideAtual = 0;
        const slides = document.querySelectorAll('.header-slide');
        
        if (slides.length > 0) {
            slides[slideAtual].classList.add('active');
            
            setInterval(() => {
                slides[slideAtual].classList.remove('active');
                slideAtual = (slideAtual + 1) % slides.length;
                slides[slideAtual].classList.add('active');
            }, 4000);
        }
    }

    configurarEventos() {
        console.log('✅ Sistema de busca configurado');
        console.log('🛒 Sistema do carrinho configurado');
    }

    getProdutosExemplo() {
        return [
            {
                id: 1,
                nome: "Creme Facial Hidratante",
                descricao: "Hidratação profunda com ingredientes naturais",
                preco: 89.90,
                desconto: 10,
                categoria: "skincare",
                estoque: 15,
                imagem: "https://via.placeholder.com/300x200?text=Creme+Facial",
                tags: ["natural", "hidratante", "vegano"]
            },
            {
                id: 2,
                nome: "Kit Maquiagem Completo",
                descricao: "Kit com tudo que você precisa para uma make perfeita",
                preco: 149.90,
                desconto: 15,
                categoria: "maquiagem",
                estoque: 8,
                imagem: "https://via.placeholder.com/300x200?text=Kit+Maquiagem",
                tags: ["completo", "make", "profissional"]
            },
            {
                id: 3,
                nome: "Óleo Corporal Natural",
                descricao: "Hidratação intensa para pele e cabelos",
                preco: 67.90,
                desconto: 0,
                categoria: "corpo",
                estoque: 20,
                imagem: "https://via.placeholder.com/300x200?text=Óleo+Corporal",
                tags: ["natural", "hidratante", "multiuso"]
            }
        ];
    }
}

// 📱 CONTROLE DO MENU MOBILE
function initMenuMobile() {
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');
    
    if (hamburger && mobileNav) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileNav.classList.toggle('active');
            hamburger.textContent = mobileNav.classList.contains('active') ? '✕' : '☰';
        });
        
        // Fechar menu ao clicar em um link
        const links = mobileNav.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('active');
                hamburger.textContent = '☰';
            });
        });
        
        // Fechar menu ao clicar fora
        document.addEventListener('click', (e) => {
            if (!mobileNav.contains(e.target) && !hamburger.contains(e.target)) {
                mobileNav.classList.remove('active');
                hamburger.textContent = '☰';
            }
        });
        
        // Prevenir fechamento ao clicar dentro do menu
        mobileNav.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

// 🎯 FUNÇÕES DE SCROLL PARA O MENU

// Voltar ao topo da página
function voltarAoTopo() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    // Fechar menu mobile se estiver aberto
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileNav && mobileNav.classList.contains('active')) {
        mobileNav.classList.remove('active');
    }
}

// Scroll para produtos
function scrollToProducts() {
    const productsSection = document.getElementById('products');
    if (productsSection) {
        productsSection.scrollIntoView({ 
            behavior: 'smooth' 
        });
    }
    
    // Fechar menu mobile se estiver aberto
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileNav && mobileNav.classList.contains('active')) {
        mobileNav.classList.remove('active');
    }
}

// Scroll para seção sobre
function scrollToAbout() {
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
        aboutSection.scrollIntoView({ 
            behavior: 'smooth' 
        });
    }
    
    // Fechar menu mobile se estiver aberto
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileNav && mobileNav.classList.contains('active')) {
        mobileNav.classList.remove('active');
    }
}

// Scroll para seção contato
function scrollToContact() {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
        contactSection.scrollIntoView({ 
            behavior: 'smooth' 
        });
    }
    
    // Fechar menu mobile se estiver aberto
    const mobileNav = document.querySelector('.mobile-nav');
    if (mobileNav && mobileNav.classList.contains('active')) {
        mobileNav.classList.remove('active');
    }
}

// 🎯 FUNÇÃO TOGGLE MENU (ADICIONADA - ESTAVA FALTANDO)
function toggleMenu() {
    const mobileNav = document.querySelector('.mobile-nav');
    const hamburger = document.querySelector('.hamburger');
    
    if (mobileNav && hamburger) {
        mobileNav.classList.toggle('active');
        hamburger.textContent = mobileNav.classList.contains('active') ? '✕' : '☰';
    }
}

// 🎯 Inicializar tudo quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar menu mobile
    initMenuMobile();
    
    // Inicializar sistema da loja
    window.loja = new LojaCosmeticos();
    
    console.log('🚀 Sistema da loja carregado com sucesso!');
});

// 🎯 Ouvir redimensionamento da tela para ajustar menu
window.addEventListener('resize', function() {
    initMenuMobile();
});