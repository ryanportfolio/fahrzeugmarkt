package de.fahrzeugmarkt.api.dto;

import de.fahrzeugmarkt.domain.BodyType;
import de.fahrzeugmarkt.domain.FuelType;
import de.fahrzeugmarkt.domain.ListingStatus;
import de.fahrzeugmarkt.domain.Transmission;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ListingDetailDto(
        Long id,
        String title,
        String description,
        BigDecimal priceEur,
        ListingStatus status,
        Instant createdAt,
        VehicleDto vehicle,
        SellerDto seller,
        List<ImageDto> images,
        boolean savedByMe
) {

    public record VehicleDto(
            String make,
            String model,
            BodyType bodyType,
            FuelType fuelType,
            Transmission transmission,
            String color,
            int mileageKm,
            int powerKw,
            Integer doors,
            Integer seats,
            LocalDate firstRegistration,
            LocalDate nextInspection
    ) {
    }

    public record SellerDto(Long id, String displayName, String city, String phone, Instant memberSince) {
    }

    public record ImageDto(Long id, String url, int sortOrder) {
    }
}
