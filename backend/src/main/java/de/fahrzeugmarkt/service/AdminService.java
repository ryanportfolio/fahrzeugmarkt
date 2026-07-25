package de.fahrzeugmarkt.service;

import de.fahrzeugmarkt.api.ApiException;
import de.fahrzeugmarkt.api.dto.AdminListingDto;
import de.fahrzeugmarkt.domain.Listing;
import de.fahrzeugmarkt.domain.ListingStatus;
import de.fahrzeugmarkt.repo.ListingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminService {

    private final ListingRepository listings;

    public AdminService(ListingRepository listings) {
        this.listings = listings;
    }

    @Transactional(readOnly = true)
    public List<AdminListingDto> listings(ListingStatus status) {
        List<Listing> found = status == null
                ? listings.findAllByOrderByCreatedAtDesc()
                : listings.findByStatusOrderByCreatedAtDesc(status);
        return found.stream()
                .map(listing -> new AdminListingDto(
                        listing.getId(),
                        listing.getTitle(),
                        listing.getPriceEur(),
                        listing.getStatus(),
                        listing.getSeller().getEmail(),
                        listing.getSeller().getDisplayName(),
                        listing.getCreatedAt()))
                .toList();
    }

    @Transactional
    public AdminListingDto setStatus(Long id, ListingStatus status) {
        Listing listing = listings.findById(id)
                .orElseThrow(() -> ApiException.notFound("Listing not found"));
        listing.setStatus(status);
        return new AdminListingDto(
                listing.getId(),
                listing.getTitle(),
                listing.getPriceEur(),
                listing.getStatus(),
                listing.getSeller().getEmail(),
                listing.getSeller().getDisplayName(),
                listing.getCreatedAt());
    }
}
