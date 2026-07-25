package de.fahrzeugmarkt.service;

import de.fahrzeugmarkt.api.dto.InquiryDto;
import de.fahrzeugmarkt.api.dto.ListingCardDto;
import de.fahrzeugmarkt.api.dto.SellerListingDto;
import de.fahrzeugmarkt.domain.Listing;
import de.fahrzeugmarkt.repo.InquiryRepository;
import de.fahrzeugmarkt.repo.ListingRepository;
import de.fahrzeugmarkt.repo.SavedListingRepository;
import de.fahrzeugmarkt.security.AppUserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SellerService {

    private final ListingRepository listings;
    private final InquiryRepository inquiries;
    private final SavedListingRepository savedListings;
    private final ListingMapper mapper;

    public SellerService(ListingRepository listings,
                         InquiryRepository inquiries,
                         SavedListingRepository savedListings,
                         ListingMapper mapper) {
        this.listings = listings;
        this.inquiries = inquiries;
        this.savedListings = savedListings;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<SellerListingDto> ownListings(AppUserDetails principal) {
        List<Listing> own = listings.findBySellerIdOrderByCreatedAtDesc(principal.getId());
        if (own.isEmpty()) {
            return List.of();
        }
        List<Long> ids = own.stream().map(Listing::getId).toList();
        Map<Long, Long> inquiryCounts = toCountMap(inquiries.countByListingIds(ids));
        Map<Long, Long> savedCounts = toCountMap(savedListings.countByListingIds(ids));

        return own.stream().map(listing -> {
            ListingCardDto card = mapper.toCard(listing);
            return new SellerListingDto(
                    card.id(),
                    card.title(),
                    card.make(),
                    card.model(),
                    card.priceEur(),
                    card.firstRegistration(),
                    card.mileageKm(),
                    card.powerKw(),
                    card.fuelType(),
                    card.transmission(),
                    card.bodyType(),
                    card.city(),
                    card.coverImageUrl(),
                    card.createdAt(),
                    listing.getStatus(),
                    listing.getImages().size(),
                    inquiryCounts.getOrDefault(listing.getId(), 0L),
                    savedCounts.getOrDefault(listing.getId(), 0L)
            );
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<InquiryDto> ownInquiries(AppUserDetails principal) {
        return inquiries.findBySeller(principal.getId()).stream().map(InquiryDto::of).toList();
    }

    private Map<Long, Long> toCountMap(List<Object[]> rows) {
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : rows) {
            counts.put((Long) row[0], (Long) row[1]);
        }
        return counts;
    }
}
