package de.fahrzeugmarkt.domain;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "saved_listings")
public class SavedListing {

    @EmbeddedId
    private SavedListingKey id;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @MapsId("listingId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected SavedListing() {
    }

    public SavedListing(User user, Listing listing) {
        this.id = new SavedListingKey(user.getId(), listing.getId());
        this.user = user;
        this.listing = listing;
    }

    public SavedListingKey getId() {
        return id;
    }

    public Listing getListing() {
        return listing;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
