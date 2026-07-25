package de.fahrzeugmarkt.api;

import de.fahrzeugmarkt.api.dto.ListingCardDto;
import de.fahrzeugmarkt.security.AppUserDetails;
import de.fahrzeugmarkt.service.SavedListingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/saved")
public class SavedController {

    private final SavedListingService savedListings;

    public SavedController(SavedListingService savedListings) {
        this.savedListings = savedListings;
    }

    @GetMapping
    public List<ListingCardDto> saved(@AuthenticationPrincipal AppUserDetails principal) {
        return savedListings.saved(principal);
    }

    @PutMapping("/{listingId}")
    public ResponseEntity<Void> save(@PathVariable Long listingId, @AuthenticationPrincipal AppUserDetails principal) {
        savedListings.save(listingId, principal);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{listingId}")
    public ResponseEntity<Void> remove(@PathVariable Long listingId, @AuthenticationPrincipal AppUserDetails principal) {
        savedListings.remove(listingId, principal);
        return ResponseEntity.noContent().build();
    }
}
