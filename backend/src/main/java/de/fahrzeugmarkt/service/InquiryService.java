package de.fahrzeugmarkt.service;

import de.fahrzeugmarkt.api.ApiException;
import de.fahrzeugmarkt.api.request.ContactRequest;
import de.fahrzeugmarkt.domain.Inquiry;
import de.fahrzeugmarkt.domain.Listing;
import de.fahrzeugmarkt.domain.ListingStatus;
import de.fahrzeugmarkt.repo.InquiryRepository;
import de.fahrzeugmarkt.repo.ListingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InquiryService {

    private final InquiryRepository inquiries;
    private final ListingRepository listings;

    public InquiryService(InquiryRepository inquiries, ListingRepository listings) {
        this.inquiries = inquiries;
        this.listings = listings;
    }

    /**
     * Prototype scope: the inquiry is stored for the seller dashboard, no mail is sent.
     */
    @Transactional
    public void contact(Long listingId, ContactRequest request) {
        Listing listing = listings.findById(listingId)
                .orElseThrow(() -> ApiException.notFound("Listing not found"));
        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw ApiException.notFound("Listing not found");
        }
        inquiries.save(new Inquiry(
                listing,
                request.name().trim(),
                request.email().trim().toLowerCase(),
                request.message().trim()
        ));
    }
}
