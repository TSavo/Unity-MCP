using Microsoft.OpenApi.Models;
using UnityMCP.Client.Services;
using UnityMCP.Client.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Unity MCP Client API",
        Version = "v1",
        Description = "API for executing code in Unity and communicating with the MCP server"
    });
});

// Register services
builder.Services.AddSingleton<ICodeExecutionService, MockCodeExecutionService>();
builder.Services.AddSingleton<ILogService, LogService>();

var app = builder.Build();

// Configure middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Configure the HTTP request pipeline
// Always enable Swagger in this project for testing
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Unity MCP Client API v1");
    options.RoutePrefix = "swagger";
});

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// Configure routes
app.MapGet("/ping", () => Results.Ok("pong"))
    .WithName("Ping")
    .WithOpenApi();

app.Run();
