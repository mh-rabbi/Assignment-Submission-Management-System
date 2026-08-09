using AssignmentSystem.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AssignmentSystem.Api.Data.Configurations;

public class TeacherSubjectClassConfiguration : IEntityTypeConfiguration<TeacherSubjectClass>
{
    public void Configure(EntityTypeBuilder<TeacherSubjectClass> builder)
    {
        builder.HasKey(t => t.Id);

        // Unique composite index: one teaching assignment per teacher+subject+class
        builder.HasIndex(t => new { t.TeacherId, t.SubjectId, t.ClassId }).IsUnique();

        builder.HasOne(t => t.Teacher)
            .WithMany(u => u.TeacherSubjectClasses)
            .HasForeignKey(t => t.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Subject)
            .WithMany(s => s.TeacherSubjectClasses)
            .HasForeignKey(t => t.SubjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.Class)
            .WithMany(c => c.TeacherSubjectClasses)
            .HasForeignKey(t => t.ClassId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
