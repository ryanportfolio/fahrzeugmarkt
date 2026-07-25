package de.fahrzeugmarkt.api.request;

import de.fahrzeugmarkt.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email @Size(max = 180) String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank @Size(max = 80) String displayName,
        @NotNull Role role,
        @Size(max = 80) String city
) {
}
