package de.fahrzeugmarkt.service;

import de.fahrzeugmarkt.api.dto.FacetsDto;
import de.fahrzeugmarkt.domain.Listing;
import de.fahrzeugmarkt.search.ListingQuery;
import de.fahrzeugmarkt.search.ListingSpecifications;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Tuple;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.function.Function;

/**
 * Facet counts are grouped in SQL, each dimension counted with all filters except its own.
 */
@Service
public class FacetService {

    private final EntityManager entityManager;

    public FacetService(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public FacetsDto facets(ListingQuery query) {
        return new FacetsDto(
                count(query, ListingSpecifications.Dimension.MAKE, joins -> joins.make().get("name")),
                count(query, ListingSpecifications.Dimension.FUEL_TYPE, joins -> joins.vehicle().get("fuelType")),
                count(query, ListingSpecifications.Dimension.TRANSMISSION, joins -> joins.vehicle().get("transmission")),
                count(query, ListingSpecifications.Dimension.BODY_TYPE, joins -> joins.vehicle().get("bodyType"))
        );
    }

    private List<FacetsDto.FacetCount> count(ListingQuery query,
                                             ListingSpecifications.Dimension dimension,
                                             Function<ListingSpecifications.Joins, Expression<?>> grouping) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Tuple> criteria = cb.createTupleQuery();
        Root<Listing> root = criteria.from(Listing.class);
        ListingSpecifications.Joins joins = ListingSpecifications.join(root);
        Expression<?> group = grouping.apply(joins);
        Expression<Long> total = cb.count(root);

        List<Predicate> predicates = ListingSpecifications.predicates(query, dimension, joins, cb);
        criteria.multiselect(group, total)
                .where(predicates.toArray(new Predicate[0]))
                .groupBy(group)
                .orderBy(cb.desc(total), cb.asc(group));

        return entityManager.createQuery(criteria).getResultList().stream()
                .map(tuple -> new FacetsDto.FacetCount(String.valueOf(tuple.get(0)), tuple.get(1, Long.class)))
                .toList();
    }
}
