package de.fahrzeugmarkt.repo;

import de.fahrzeugmarkt.domain.Inquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InquiryRepository extends JpaRepository<Inquiry, Long> {

    @Query("""
            select i from Inquiry i
            join fetch i.listing l
            where l.seller.id = :sellerId
            order by i.createdAt desc
            """)
    List<Inquiry> findBySeller(@Param("sellerId") Long sellerId);

    @Query("select i.listing.id, count(i) from Inquiry i where i.listing.id in :listingIds group by i.listing.id")
    List<Object[]> countByListingIds(@Param("listingIds") List<Long> listingIds);
}
