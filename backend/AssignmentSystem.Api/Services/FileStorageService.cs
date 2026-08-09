using AssignmentSystem.Api.Services.Interfaces;
using Microsoft.AspNetCore.Http;

namespace AssignmentSystem.Api.Services;

public class FileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _environment;
    private static readonly string[] AllowedExtensions = { ".pdf", ".docx", ".doc", ".zip", ".png", ".jpg", ".jpeg" };
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    public FileStorageService(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<string> SaveAsync(IFormFile file, Guid assignmentId, Guid studentId)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("No file provided or file is empty.");

        if (file.Length > MaxFileSize)
            throw new ArgumentException("File size exceeds maximum limit of 10MB.");

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
            throw new ArgumentException($"Invalid file extension. Allowed extensions are: {string.Join(", ", AllowedExtensions)}");

        // wwwroot/uploads/{assignmentId}/{studentId}
        var uploadsFolder = Path.Combine(_environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", assignmentId.ToString(), studentId.ToString());
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return filePath;
    }

    public void Delete(string filePath)
    {
        if (!string.IsNullOrEmpty(filePath) && File.Exists(filePath))
        {
            try
            {
                File.Delete(filePath);
            }
            catch
            {
                // Ignore errors when cleaning up old file
            }
        }
    }
}
