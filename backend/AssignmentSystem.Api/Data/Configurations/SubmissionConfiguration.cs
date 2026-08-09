using AssignmentSystem.Api.Common.Enums;
using AssignmentSystem.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AssignmentSystem.Api.Data.Configurations;

public class SubmissionConfiguration : IEntityTypeConfiguration<Submission>
{
    public void Configure(EntityTypeBuilder<Submission> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Content).IsRequired();
        builder.Property(s => s.FilePath).IsRequired(false);
        builder.Property(s => s.Feedback).IsRequired(false);
        builder.Property(s => s.IsLate).HasDefaultValue(false);

        builder.Property(s => s.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(SubmissionStatus.Submitted);

        // Unique composite: one submission row per student per assignment
        builder.HasIndex(s => new { s.AssignmentId, s.StudentId }).IsUnique();

        builder.HasOne(s => s.Assignment)
            .WithMany(a => a.Submissions)
            .HasForeignKey(s => s.AssignmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Student)
            .WithMany(u => u.Submissions)
            .HasForeignKey(s => s.StudentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
