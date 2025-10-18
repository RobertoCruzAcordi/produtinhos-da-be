using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ProdutinhosDaBe.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProdutosController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetProdutos()
        {
            var produtos = new[]
            {
                new {
                    Id = 1,
                    Nome = "Creme Facial Hidratante",
                    Descricao = "Hidratação profunda com ingredientes naturais",
                    Preco = 89.90,
                    Desconto = 10,
                    Categoria = "skincare",
                    Estoque = 15,
                    Imagem = "https://via.placeholder.com/300x200?text=Creme+Facial",
                    Tags = new[] { "natural", "hidratante", "vegano" }
                },
                new {
                    Id = 2,
                    Nome = "Kit Maquiagem Completo",
                    Descricao = "Kit com tudo que você precisa para uma make perfeita",
                    Preco = 149.90,
                    Desconto = 15,
                    Categoria = "maquiagem",
                    Estoque = 8,
                    Imagem = "https://via.placeholder.com/300x200?text=Kit+Maquiagem",
                    Tags = new[] { "completo", "make", "profissional" }
                },
                new {
                    Id = 3,
                    Nome = "Óleo Corporal Natural",
                    Descricao = "Hidratação intensa para pele e cabelos",
                    Preco = 67.90,
                    Desconto = 0,
                    Categoria = "corpo",
                    Estoque = 20,
                    Imagem = "https://via.placeholder.com/300x200?text=Óleo+Corporal",
                    Tags = new[] { "natural", "hidratante", "multiuso" }
                }
            };

            return Ok(produtos);
        }

        [HttpGet("{id}")]
        public IActionResult GetProdutoPorId(int id)
        {
            var produto = new
            {
                Id = id,
                Nome = "Produto " + id,
                Preco = 99.90,
                Categoria = "skincare"
            };
            return Ok(produto);
        }
    }
}