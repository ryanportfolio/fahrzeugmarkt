package de.fahrzeugmarkt.api.dto;

import de.fahrzeugmarkt.domain.ListingStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminListingDto(
        Long id,
        String title,
        BigDecimal priceEur,
        ListingStatus status,
        String sellerEmail,
        String sellerDisplayName,
        Instant createdAt
) {
}
