package de.fahrzeugmarkt.api;

import de.fahrzeugmarkt.api.dto.UserDto;
import de.fahrzeugmarkt.api.request.LoginRequest;
import de.fahrzeugmarkt.api.request.RegisterRequest;
import de.fahrzeugmarkt.repo.UserRepository;
import de.fahrzeugmarkt.security.AppUserDetails;
import de.fahrzeugmarkt.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository users;

    public AuthController(AuthService authService, UserRepository users) {
        this.authService = authService;
        this.users = users;
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody RegisterRequest request,
                                            HttpServletRequest httpRequest,
                                            HttpServletResponse httpResponse) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request, httpRequest, httpResponse));
    }

    @PostMapping("/login")
    public UserDto login(@Valid @RequestBody LoginRequest request,
                         HttpServletRequest httpRequest,
                         HttpServletResponse httpResponse) {
        return authService.login(request, httpRequest, httpResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest httpRequest) {
        authService.logout(httpRequest);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal AppUserDetails principal) {
        return users.findById(principal.getId())
                .map(UserDto::of)
                .orElseThrow(() -> ApiException.notFound("Account not found"));
    }
}
