package de.fahrzeugmarkt.service;

import de.fahrzeugmarkt.api.dto.ListingCardDto;
import de.fahrzeugmarkt.api.dto.ListingDetailDto;
import de.fahrzeugmarkt.domain.Listing;
import de.fahrzeugmarkt.domain.ListingImage;
import de.fahrzeugmarkt.domain.User;
import de.fahrzeugmarkt.domain.Vehicle;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ListingMapper {

    public ListingCardDto toCard(Listing listing) {
        Vehicle vehicle = listing.getVehicle();
        return new ListingCardDto(
                listing.getId(),
                listing.getTitle(),
                vehicle.getModel().getMake().getName(),
                vehicle.getModel().getName(),
                listing.getPriceEur(),
                vehicle.getFirstRegistration(),
                vehicle.getMileageKm(),
                vehicle.getPowerKw(),
                vehicle.getFuelType(),
                vehicle.getTransmission(),
                vehicle.getBodyType(),
                listing.getSeller().getCity(),
                coverImageUrl(listing),
                listing.getCreatedAt()
        );
    }

    public ListingDetailDto toDetail(Listing listing, boolean savedByMe) {
        Vehicle vehicle = listing.getVehicle();
        User seller = listing.getSeller();
        List<ListingDetailDto.ImageDto> images = listing.getImages().stream()
                .map(image -> new ListingDetailDto.ImageDto(image.getId(), image.getUrl(), image.getSortOrder()))
                .toList();
        return new ListingDetailDto(
                listing.getId(),
                listing.getTitle(),
                listing.getDescription(),
                listing.getPriceEur(),
                listing.getStatus(),
                listing.getCreatedAt(),
                new ListingDetailDto.VehicleDto(
                        vehicle.getModel().getMake().getName(),
                        vehicle.getModel().getName(),
                        vehicle.getBodyType(),
                        vehicle.getFuelType(),
                        vehicle.getTransmission(),
                        vehicle.getColor(),
                        vehicle.getMileageKm(),
                        vehicle.getPowerKw(),
                        vehicle.getDoors(),
                        vehicle.getSeats(),
                        vehicle.getFirstRegistration(),
                        vehicle.getNextInspection()
                ),
                new ListingDetailDto.SellerDto(
                        seller.getId(),
                        seller.getDisplayName(),
                        seller.getCity(),
                        seller.getPhone(),
                        seller.getCreatedAt()
                ),
                images,
                savedByMe
        );
    }

    public String coverImageUrl(Listing listing) {
        return listing.getImages().stream()
                .min((a, b) -> Integer.compare(a.getSortOrder(), b.getSortOrder()))
                .map(ListingImage::getUrl)
                .orElse(null);
    }
}
