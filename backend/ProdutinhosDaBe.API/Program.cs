using Microsoft.VisualBasic;

var builder = WebApplication.CreateBuilder(args);

// Configuração CORS ( importante para o frontend)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>  
    {
        policy.WithOrigins("http://localhost:3000",
                           "http://127.0.0.1:5500",
                           "http://localhost:8080")
                .AllowAnyHeader()
                .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseCors("AllowFrontend");  

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();