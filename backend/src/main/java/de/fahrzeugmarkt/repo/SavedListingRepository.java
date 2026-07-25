package de.fahrzeugmarkt.repo;

import de.fahrzeugmarkt.domain.Listing;
import de.fahrzeugmarkt.domain.SavedListing;
import de.fahrzeugmarkt.domain.SavedListingKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SavedListingRepository extends JpaRepository<SavedListing, SavedListingKey> {

    @Query("""
            select s.listing from SavedListing s
            where s.user.id = :userId and s.listing.status = de.fahrzeugmarkt.domain.ListingStatus.ACTIVE
            order by s.createdAt desc
            """)
    List<Listing> findSavedListings(@Param("userId") Long userId);

    @Query("select s.listing.id from SavedListing s where s.user.id = :userId and s.listing.id in :listingIds")
    List<Long> findSavedIds(@Param("userId") Long userId, @Param("listingIds") List<Long> listingIds);

    @Query("select s.listing.id, count(s) from SavedListing s where s.listing.id in :listingIds group by s.listing.id")
    List<Object[]> countByListingIds(@Param("listingIds") List<Long> listingIds);

    boolean existsByUserIdAndListingId(Long userId, Long listingId);

    @Modifying
    @Query("delete from SavedListing s where s.user.id = :userId and s.listing.id = :listingId")
    void deleteByUserAndListing(@Param("userId") Long userId, @Param("listingId") Long listingId);
}
