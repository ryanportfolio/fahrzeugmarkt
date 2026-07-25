package de.fahrzeugmarkt.service;

import de.fahrzeugmarkt.api.ApiException;
import de.fahrzeugmarkt.api.dto.ListingCardDto;
import de.fahrzeugmarkt.domain.Listing;
import de.fahrzeugmarkt.domain.ListingStatus;
import de.fahrzeugmarkt.domain.SavedListing;
import de.fahrzeugmarkt.domain.User;
import de.fahrzeugmarkt.repo.ListingRepository;
import de.fahrzeugmarkt.repo.SavedListingRepository;
import de.fahrzeugmarkt.repo.UserRepository;
import de.fahrzeugmarkt.security.AppUserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SavedListingService {

    private final SavedListingRepository savedListings;
    private final ListingRepository listings;
    private final UserRepository users;
    private final ListingMapper mapper;

    public SavedListingService(SavedListingRepository savedListings,
                               ListingRepository listings,
                               UserRepository users,
                               ListingMapper mapper) {
        this.savedListings = savedListings;
        this.listings = listings;
        this.users = users;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<ListingCardDto> saved(AppUserDetails principal) {
        return savedListings.findSavedListings(principal.getId()).stream().map(mapper::toCard).toList();
    }

    @Transactional
    public void save(Long listingId, AppUserDetails principal) {
        if (savedListings.existsByUserIdAndListingId(principal.getId(), listingId)) {
            return;
        }
        Listing listing = listings.findById(listingId)
                .orElseThrow(() -> ApiException.notFound("Listing not found"));
        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw ApiException.notFound("Listing not found");
        }
        User user = users.findById(principal.getId())
                .orElseThrow(() -> ApiException.notFound("Account not found"));
        savedListings.save(new SavedListing(user, listing));
    }

    @Transactional
    public void remove(Long listingId, AppUserDetails principal) {
        savedListings.deleteByUserAndListing(principal.getId(), listingId);
    }
}
