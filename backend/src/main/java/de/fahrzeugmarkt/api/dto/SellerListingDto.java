package de.fahrzeugmarkt.api.dto;

import de.fahrzeugmarkt.domain.BodyType;
import de.fahrzeugmarkt.domain.FuelType;
import de.fahrzeugmarkt.domain.ListingStatus;
import de.fahrzeugmarkt.domain.Transmission;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record SellerListingDto(
        Long id,
        String title,
        String make,
        String model,
        BigDecimal priceEur,
        LocalDate firstRegistration,
        int mileageKm,
        int powerKw,
        FuelType fuelType,
        Transmission transmission,
        BodyType bodyType,
        String city,
        String coverImageUrl,
        Instant createdAt,
        ListingStatus status,
        int imageCount,
        long inquiryCount,
        long savedCount
) {
}
