1. Modo de usar a Lojinha 🛍️

(Manual para a pessoa que vai usar no dia a dia – cadastrar produtos, editar, etc.)

1.1. Acessando a loja (cliente comum)

Abra o link da loja no navegador (computador ou celular).

A página inicial mostra os produtos cadastrados com:

Foto

Nome

Preço

Destaque de promoção (quando houver)

Selo de “Novo”, se marcado no cadastro (quando implementado)

Para o cliente, o fluxo é:

Rolar a página e ver os produtos.

Clicar no produto ou no botão de ação (por exemplo: “Ver detalhes” ou “Comprar pelo WhatsApp”, dependendo de como você configurou).

A partir daí:

Ou aparece mais informação do produto,

Ou abre uma conversa no WhatsApp com uma mensagem pré-pronta (nome do produto, etc.), se isso já estiver implementado.

Essa parte é simples: o cliente não precisa de login, é só acessar o link.

1.2. Acessando o painel de administração (admin)

O painel de admin é a área onde você (ou a Bê) consegue cadastrar, editar e excluir produtos.

Geralmente o fluxo é assim (ajuste para o que você já fez no projeto):

Acesse a URL do painel, algo como:

https://seu-site/admin.html

Faça login com:

E-mail de administrador

Senha cadastrada no Firebase Authentication

Depois do login, você verá:

Uma tabela com os produtos

Botões para cadastrar novo produto

Opções para editar ou apagar produtos existentes

Se o painel não tem login ainda, basta considerar que você acessa o admin.html diretamente, mas a idéia é essa.

1.3. Cadastrando um novo produto

No painel de admin:

Clique no botão “Novo produto” / “Adicionar produto” (ou equivalente).

Preencha os campos (que no seu código atual geralmente são algo como):

Nome do produto

Preço

Descrição (se existir)

URL da imagem (link direto da imagem)

Promoção? (Sim/Não)

Desconto (%) (se a promoção estiver ativa)

Novo? (Sim/Não – para mostrar selo “novo”)

Clique em Salvar / Cadastrar.

O sistema então:

Envia esses dados para o banco de dados (Firestore).

Atualiza automaticamente a lista de produtos na tabela de admin.

Faz com que o produto apareça na loja pública.

1.4. Editando um produto existente

Na tela de admin:

Encontre o produto na tabela.

Clique em “Editar” (ícone de lápis ou botão).

Altere os campos que desejar:

Preço (pra atualizar promoções, reajustes, etc.)

Nome

URL da imagem

Marcar ou desmarcar promoção

Ajustar valor do desconto

Clique em Salvar / Atualizar.

Isso atualiza o registro no Firestore e reflete na loja sem precisar mexer no código.

1.5. Excluindo um produto

Na tabela de produtos, clique em “Excluir” / ícone de lixeira.

O sistema pode pedir uma confirmação (“Tem certeza?”).

Confirmando, o produto é removido do banco de dados.

Automaticamente, ele some da loja pública.

1.6. Sobre as imagens dos produtos

Como você já sentiu na pele 😅:

A imagem funciona através de um link (URL) que aponta pra onde a imagem está hospedada.

No cadastro do produto, você preenche um campo de URL da imagem.

Na loja, esse link é usado dentro de um <img src="...">.

Hoje você pode:

Usar imagens hospedadas em sites como Imgur, ou

Usar outro serviço de armazenamento (como AWS S3 no futuro),

Ou até um caminho relativo se a imagem estiver hospedada junto com o site.

1.7. Quando atualizar a página

Se cadastrar um produto e ele não aparecer:

Aguarde alguns segundos e atualize a página (F5 ou puxar pra baixo no celular).

Se algo parecer estranho (produto duplicado, etc.):

Verifique se não cadastrou duas vezes o mesmo item.

Confira no painel admin.

2. Como a Lojinha Foi Construída (Visão Técnica) 💻

Agora, a parte “pra dev”, explicando a estrutura do projeto.

2.1. Visão geral da arquitetura

Sua lojinha hoje é, em essência:

Front-end estático (HTML + CSS + JavaScript)

Hospedado no Firebase Hosting

Banco de dados em Firebase Firestore

(Opcional) Login de admin com Firebase Authentication

Scripts JS para:

Carregar produtos do banco

Renderizar a lista na loja pública

Gerenciar o painel de administração

2.2. Estrutura de pastas (ideia geral)

Algo como:

/
├─ index.html          -> Página principal da loja (cliente)
├─ admin.html          -> Painel de administração
├─ /styles
│   └─ style.css       -> Estilos gerais
├─ /scripts
│   ├─ firebase-config.js  -> Configuração Firebase
│   ├─ loja.js             -> Lógica da página pública (listar produtos)
│   └─ admin.js            -> Lógica do painel admin
└─ firebase.json       -> Configurações do Firebase Hosting


Os nomes exatos podem variar, mas a ideia é essa.

2.3. Conexão com o Firebase

No arquivo firebase-config.js, você definiu algo assim:

// Exemplo genérico
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "XXXXXX",
  appId: "1:XXXXXX:web:YYYYYY",
};

// Inicializa o app
firebase.initializeApp(firebaseConfig);

// Referência ao Firestore
const db = firebase.firestore();


Esse arquivo é importado nos outros scripts pra poder usar db e falar com o Firestore.

2.4. Estrutura do banco de dados (Firestore)

Você provavelmente tem uma coleção principal:

Coleção: produtos
Cada documento representa um item da loja, com campos como:

id: string/numérico (pode ser o próprio doc.id ou um campo seu)

nome: string

preco: number

descricao: string (opcional)

imagemUrl: string (URL da imagem)

promocao: boolean

desconto: number (0–100)

novo: boolean

Então, um documento de exemplo seria:

{
  "nome": "Perfume X",
  "preco": 89.90,
  "imagemUrl": "https://link-da-imagem.jpg",
  "promocao": true,
  "desconto": 10,
  "novo": true
}

2.5. Lado admin: carregando e exibindo produtos

No seu scripts/admin.js, você tem algo nessa linha (você mesmo me mostrou uma parte):

let produtos = [];

// -------------------- CARREGAR PRODUTOS --------------------
async function carregarProdutosAdmin() {
  try {
    produtos = await listarProdutos(); // Função que busca no Firestore
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
      <td>
        <!-- botões de editar / excluir -->
      </td>
    `;

    tbody.appendChild(tr);
  });
}


Ideia principal:

listarProdutos() faz uma consulta ao Firestore (db.collection("produtos").get()).

carregarProdutosAdmin() guarda o resultado em produtos.

renderTabelaProdutos() monta a tabela HTML com base nesse array.

2.6. Lado público: listando produtos na loja

Na página pública (index.html ou similar), você tem outro script que:

Faz uma consulta ao Firestore (sem precisar de login).

Percorre os produtos retornados.

Cria cards ou blocos HTML com:

<img src="imagemUrl">

<h3>nome</h3>

<p>preço</p>

<span>Promoção</span> caso promocao === true

<span>Novo</span> caso novo === true

Adiciona esses elementos dentro de um container (ex: <div id="lista-produtos"></div>).

Isso faz a mágica: qualquer coisa que você cadastrar no admin aparece automaticamente na loja.

2.7. Login do admin (quando usado)

Se você ativou o Firebase Authentication:

Há um formulário de login no admin.html:

Campo e-mail

Campo senha

Quando o usuário clica em Entrar, o JS chama algo como:

firebase.auth().signInWithEmailAndPassword(email, senha)
  .then(() => {
    // mostrar painel admin
  })
  .catch((error) => {
    // exibir mensagem de erro
  });


E você pode proteger o admin.html verificando se há um usuário logado antes de mostrar a tabela.

2.8. Deploy / publicação da loja

Você configurou o Firebase Hosting mais ou menos assim:

Rodou firebase init.

Escolheu o projeto produtinhosdabe-a0ee7.

Escolheu o diretório público como . (raiz do projeto).

Desativou “single-page app” (respondeu No depois).

Para publicar:

firebase deploy


Isso envia seus arquivos HTML, CSS, JS e faz a versão nova entrar no ar.

2.9. Ideias de melhorias futuras

Só pra já deixar no radar:

Migrar armazenamento de imagens para AWS S3 (ou outro serviço), gerando links diretos.

Adicionar campo de categoria (ex: perfume, maquiagem, acessórios).

Filtros na loja: por preço, categoria, promoção, “novos”.

Painel admin com paginação, busca por nome, etc.

Relatórios simples (quantos produtos em promoção, etc.).
