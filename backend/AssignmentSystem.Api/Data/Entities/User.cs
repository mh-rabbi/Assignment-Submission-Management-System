using AssignmentSystem.Api.Common.Enums;

namespace AssignmentSystem.Api.Data.Entities;

/// <summary>Represents a user in the system (Admin, Teacher, or Student).</summary>
public class User
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public Role Role { get; set; }
    /// <summary>Only set when Role = Student. Null for Admin and Teacher.</summary>
    public Guid? ClassId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    // Navigation
    public ClassEntity? Class { get; set; }
    public ICollection<TeacherSubjectClass> TeacherSubjectClasses { get; set; } = new List<TeacherSubjectClass>();
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}
