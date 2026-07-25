package de.fahrzeugmarkt.repo;

import de.fahrzeugmarkt.domain.ListingImage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ListingImageRepository extends JpaRepository<ListingImage, Long> {

    int countByListingId(Long listingId);
}
