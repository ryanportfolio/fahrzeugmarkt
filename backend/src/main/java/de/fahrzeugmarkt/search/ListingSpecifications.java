package de.fahrzeugmarkt.search;

import de.fahrzeugmarkt.domain.Listing;
import de.fahrzeugmarkt.domain.ListingStatus;
import de.fahrzeugmarkt.domain.Make;
import de.fahrzeugmarkt.domain.Vehicle;
import de.fahrzeugmarkt.domain.VehicleModel;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Every browse filter is expressed as a criteria predicate so filtering and sorting stay in SQL.
 */
public final class ListingSpecifications {

    public enum Dimension {
        MAKE,
        FUEL_TYPE,
        TRANSMISSION,
        BODY_TYPE
    }

    public record Joins(
            Root<Listing> listing,
            Join<Listing, Vehicle> vehicle,
            Join<Vehicle, VehicleModel> model,
            Join<VehicleModel, Make> make
    ) {
    }

    private ListingSpecifications() {
    }

    public static Joins join(Root<Listing> root) {
        Join<Listing, Vehicle> vehicle = root.join("vehicle");
        Join<Vehicle, VehicleModel> model = vehicle.join("model");
        Join<VehicleModel, Make> make = model.join("make");
        return new Joins(root, vehicle, model, make);
    }

    public static Specification<Listing> search(ListingQuery query) {
        return (root, criteria, cb) -> {
            List<Predicate> predicates = predicates(query, null, join(root), cb);
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static List<Predicate> predicates(ListingQuery query, Dimension exclude, Joins joins, CriteriaBuilder cb) {
        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.equal(joins.listing().get("status"), ListingStatus.ACTIVE));

        if (exclude != Dimension.MAKE && hasText(query.make())) {
            predicates.add(cb.equal(cb.lower(joins.make().get("name")), query.make().trim().toLowerCase()));
        }
        if (hasText(query.model())) {
            predicates.add(cb.equal(cb.lower(joins.model().get("name")), query.model().trim().toLowerCase()));
        }
        if (query.yearFrom() != null) {
            predicates.add(cb.greaterThanOrEqualTo(
                    joins.vehicle().get("firstRegistration"), LocalDate.of(query.yearFrom(), 1, 1)));
        }
        if (query.yearTo() != null) {
            predicates.add(cb.lessThanOrEqualTo(
                    joins.vehicle().get("firstRegistration"), LocalDate.of(query.yearTo(), 12, 31)));
        }
        if (query.priceFrom() != null) {
            predicates.add(cb.greaterThanOrEqualTo(joins.listing().get("priceEur"), query.priceFrom()));
        }
        if (query.priceTo() != null) {
            predicates.add(cb.lessThanOrEqualTo(joins.listing().get("priceEur"), query.priceTo()));
        }
        if (query.mileageFrom() != null) {
            predicates.add(cb.greaterThanOrEqualTo(joins.vehicle().get("mileageKm"), query.mileageFrom()));
        }
        if (query.mileageTo() != null) {
            predicates.add(cb.lessThanOrEqualTo(joins.vehicle().get("mileageKm"), query.mileageTo()));
        }
        if (query.powerFrom() != null) {
            predicates.add(cb.greaterThanOrEqualTo(joins.vehicle().get("powerKw"), query.powerFrom()));
        }
        if (query.powerTo() != null) {
            predicates.add(cb.lessThanOrEqualTo(joins.vehicle().get("powerKw"), query.powerTo()));
        }
        if (exclude != Dimension.FUEL_TYPE && notEmpty(query.fuelType())) {
            predicates.add(joins.vehicle().get("fuelType").in(query.fuelType()));
        }
        if (exclude != Dimension.TRANSMISSION && notEmpty(query.transmission())) {
            predicates.add(joins.vehicle().get("transmission").in(query.transmission()));
        }
        if (exclude != Dimension.BODY_TYPE && notEmpty(query.bodyType())) {
            predicates.add(joins.vehicle().get("bodyType").in(query.bodyType()));
        }
        if (hasText(query.q())) {
            String pattern = "%" + query.q().trim().toLowerCase() + "%";
            predicates.add(cb.or(
                    cb.like(cb.lower(joins.listing().get("title")), pattern),
                    cb.like(cb.lower(joins.make().get("name")), pattern),
                    cb.like(cb.lower(joins.model().get("name")), pattern)
            ));
        }
        return predicates;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static boolean notEmpty(Collection<?> values) {
        return values != null && !values.isEmpty();
    }
}
