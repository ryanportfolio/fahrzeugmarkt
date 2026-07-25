package de.fahrzeugmarkt.api.request;

import de.fahrzeugmarkt.domain.BodyType;
import de.fahrzeugmarkt.domain.FuelType;
import de.fahrzeugmarkt.domain.Transmission;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ListingRequest(
        @NotBlank @Size(max = 140) String title,
        @NotBlank @Size(min = 20, max = 4000) String description,
        @NotNull @DecimalMin("1.00") @DecimalMax("99999999.99") BigDecimal priceEur,
        @NotNull @Valid VehicleRequest vehicle
) {

    public record VehicleRequest(
            @NotBlank @Size(max = 60) String makeName,
            @NotBlank @Size(max = 60) String modelName,
            @NotNull BodyType bodyType,
            @NotNull FuelType fuelType,
            @NotNull Transmission transmission,
            @NotBlank @Size(max = 40) String color,
            @NotNull @Min(0) @Max(2000000) Integer mileageKm,
            @NotNull @Min(1) @Max(1500) Integer powerKw,
            @Min(2) @Max(7) Integer doors,
            @Min(1) @Max(9) Integer seats,
            @NotNull @PastOrPresent LocalDate firstRegistration,
            LocalDate nextInspection
    ) {
    }
}
