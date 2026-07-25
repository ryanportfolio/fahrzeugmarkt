package de.fahrzeugmarkt.api;

import de.fahrzeugmarkt.api.dto.AdminListingDto;
import de.fahrzeugmarkt.domain.ListingStatus;
import de.fahrzeugmarkt.service.AdminService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/listings")
    public List<AdminListingDto> listings(@RequestParam(required = false) ListingStatus status) {
        return adminService.listings(status);
    }

    @PostMapping("/listings/{id}/flag")
    public AdminListingDto flag(@PathVariable Long id) {
        return adminService.setStatus(id, ListingStatus.FLAGGED);
    }

    @PostMapping("/listings/{id}/approve")
    public AdminListingDto approve(@PathVariable Long id) {
        return adminService.setStatus(id, ListingStatus.ACTIVE);
    }
}
