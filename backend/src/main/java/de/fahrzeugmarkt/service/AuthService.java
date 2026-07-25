package de.fahrzeugmarkt.service;

import de.fahrzeugmarkt.api.ApiException;
import de.fahrzeugmarkt.api.dto.UserDto;
import de.fahrzeugmarkt.api.request.LoginRequest;
import de.fahrzeugmarkt.api.request.RegisterRequest;
import de.fahrzeugmarkt.domain.Role;
import de.fahrzeugmarkt.domain.User;
import de.fahrzeugmarkt.repo.UserRepository;
import de.fahrzeugmarkt.security.AppUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;

    public AuthService(UserRepository users,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       SecurityContextRepository securityContextRepository) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
    }

    @Transactional
    public UserDto register(RegisterRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        if (request.role() == Role.ADMIN) {
            throw ApiException.badRequest("Admin accounts cannot be self registered");
        }
        String email = request.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }
        User user = new User(
                email,
                passwordEncoder.encode(request.password()),
                request.displayName().trim(),
                request.role(),
                request.city() == null || request.city().isBlank() ? null : request.city().trim()
        );
        users.save(user);
        authenticate(email, request.password(), httpRequest, httpResponse);
        return UserDto.of(user);
    }

    @Transactional(readOnly = true)
    public UserDto login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        AppUserDetails principal = authenticate(request.email().trim(), request.password(), httpRequest, httpResponse);
        return users.findById(principal.getId())
                .map(UserDto::of)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
    }

    public void logout(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    private AppUserDetails authenticate(String email,
                                        String password,
                                        HttpServletRequest httpRequest,
                                        HttpServletResponse httpResponse) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(email, password));
        } catch (AuthenticationException exception) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);
        return (AppUserDetails) authentication.getPrincipal();
    }
}
