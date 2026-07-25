package de.fahrzeugmarkt.repo;

import de.fahrzeugmarkt.domain.Listing;
import de.fahrzeugmarkt.domain.ListingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ListingRepository extends JpaRepository<Listing, Long>, JpaSpecificationExecutor<Listing> {

    List<Listing> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

    List<Listing> findByStatusOrderByCreatedAtDesc(ListingStatus status);

    List<Listing> findAllByOrderByCreatedAtDesc();

    @Query("select l from Listing l join fetch l.vehicle v join fetch v.model m join fetch m.make join fetch l.seller where l.id = :id")
    Optional<Listing> findDetailById(@Param("id") Long id);
}
