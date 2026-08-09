using AssignmentSystem.Api.Data.Configurations;
using AssignmentSystem.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<ClassEntity> Classes => Set<ClassEntity>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<TeacherSubjectClass> TeacherSubjectClasses => Set<TeacherSubjectClass>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<SubmissionHistory> SubmissionHistories => Set<SubmissionHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new ClassEntityConfiguration());
        modelBuilder.ApplyConfiguration(new SubjectConfiguration());
        modelBuilder.ApplyConfiguration(new TeacherSubjectClassConfiguration());
        modelBuilder.ApplyConfiguration(new AssignmentConfiguration());
        modelBuilder.ApplyConfiguration(new SubmissionConfiguration());
        modelBuilder.ApplyConfiguration(new SubmissionHistoryConfiguration());
    }
}
