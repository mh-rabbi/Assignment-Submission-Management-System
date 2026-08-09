using AssignmentSystem.Api.DTOs.Users;
using FluentValidation;

namespace AssignmentSystem.Api.Validators;

public class CreateUserDtoValidator : AbstractValidator<CreateUserDto>
{
    public CreateUserDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(255);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
        RuleFor(x => x.Role).NotEmpty().Must(r => r == "Admin" || r == "Teacher" || r == "Student")
            .WithMessage("Role must be Admin, Teacher, or Student.");
    }
}

public class UpdateUserDtoValidator : AbstractValidator<UpdateUserDto>
{
    public UpdateUserDtoValidator()
    {
        RuleFor(x => x.Name).MaximumLength(150).When(x => !string.IsNullOrEmpty(x.Name));
        RuleFor(x => x.Email).EmailAddress().MaximumLength(255).When(x => !string.IsNullOrEmpty(x.Email));
        RuleFor(x => x.Password).MinimumLength(6).When(x => !string.IsNullOrEmpty(x.Password));
    }
}
