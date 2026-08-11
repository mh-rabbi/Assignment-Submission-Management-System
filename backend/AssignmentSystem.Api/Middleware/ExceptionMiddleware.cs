using AssignmentSystem.Api.Common.Exceptions;
using FluentValidation;
using System.Net;
using System.Text.Json;

namespace AssignmentSystem.Api.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var statusCode = HttpStatusCode.InternalServerError;
        var message = "An internal server error occurred.";
        var errors = new List<string>();

        switch (exception)
        {
            case InvalidCredentialsException credEx:
                statusCode = HttpStatusCode.Unauthorized;
                message = credEx.Message;
                break;

            case KeyNotFoundException keyEx:
                statusCode = HttpStatusCode.NotFound;
                message = keyEx.Message;
                break;

            case UnauthorizedAccessException authEx:
                statusCode = HttpStatusCode.Forbidden;
                message = authEx.Message;
                break;

            case ConflictException conflictEx:
                statusCode = HttpStatusCode.Conflict;
                message = conflictEx.Message;
                break;

            case ValidationException valEx:
                statusCode = HttpStatusCode.BadRequest;
                message = "Validation failed.";
                errors = valEx.Errors.Select(e => e.ErrorMessage).ToList();
                break;

            case ArgumentException argEx:
                statusCode = HttpStatusCode.BadRequest;
                message = argEx.Message;
                break;

            case InvalidOperationException invEx:
                statusCode = HttpStatusCode.BadRequest;
                message = invEx.Message;
                break;

            default:
                errors.Add(exception.Message);
                break;
        }

        context.Response.StatusCode = (int)statusCode;

        var response = new ErrorResponse
        {
            StatusCode = (int)statusCode,
            Message = message,
            Errors = errors.Count > 0 ? errors : null
        };

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var json = JsonSerializer.Serialize(response, options);
        await context.Response.WriteAsync(json);
    }
}

public class ErrorResponse
{
    public int StatusCode { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string>? Errors { get; set; }
}
