package de.fahrzeugmarkt.api.dto;

import de.fahrzeugmarkt.domain.Role;
import de.fahrzeugmarkt.domain.User;

public record UserDto(Long id, String email, String displayName, Role role, String city) {

    public static UserDto of(User user) {
        return new UserDto(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole(), user.getCity());
    }
}
