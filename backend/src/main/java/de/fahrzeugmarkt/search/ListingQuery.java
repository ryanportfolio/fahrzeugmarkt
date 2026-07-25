package de.fahrzeugmarkt.search;

import de.fahrzeugmarkt.domain.BodyType;
import de.fahrzeugmarkt.domain.FuelType;
import de.fahrzeugmarkt.domain.Transmission;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.util.List;

public record ListingQuery(
        String make,
        String model,
        Integer yearFrom,
        Integer yearTo,
        BigDecimal priceFrom,
        BigDecimal priceTo,
        Integer mileageFrom,
        Integer mileageTo,
        Integer powerFrom,
        Integer powerTo,
        List<FuelType> fuelType,
        List<Transmission> transmission,
        List<BodyType> bodyType,
        String q,
        String sort,
        Integer page,
        Integer size
) {

    public static final int DEFAULT_SIZE = 24;
    public static final int MAX_SIZE = 60;
    public static final List<String> SORTS = List.of("newest", "price_asc", "price_desc", "mileage_asc", "year_desc");

    public int pageIndex() {
        return page == null || page < 0 ? 0 : page;
    }

    public int pageSize() {
        return size == null ? DEFAULT_SIZE : Math.clamp(size, 1, MAX_SIZE);
    }

    public Sort toSort() {
        return switch (sort == null ? "newest" : sort) {
            case "price_asc" -> Sort.by(Sort.Order.asc("priceEur"), Sort.Order.desc("id"));
            case "price_desc" -> Sort.by(Sort.Order.desc("priceEur"), Sort.Order.desc("id"));
            case "mileage_asc" -> Sort.by(Sort.Order.asc("vehicle.mileageKm"), Sort.Order.desc("id"));
            case "year_desc" -> Sort.by(Sort.Order.desc("vehicle.firstRegistration"), Sort.Order.desc("id"));
            default -> Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
        };
    }
}
