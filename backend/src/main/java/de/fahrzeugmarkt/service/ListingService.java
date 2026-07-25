package de.fahrzeugmarkt.service;

import de.fahrzeugmarkt.api.ApiException;
import de.fahrzeugmarkt.api.dto.ListingCardDto;
import de.fahrzeugmarkt.api.dto.ListingDetailDto;
import de.fahrzeugmarkt.api.dto.PageDto;
import de.fahrzeugmarkt.api.request.ListingRequest;
import de.fahrzeugmarkt.domain.Listing;
import de.fahrzeugmarkt.domain.ListingStatus;
import de.fahrzeugmarkt.domain.Make;
import de.fahrzeugmarkt.domain.User;
import de.fahrzeugmarkt.domain.Vehicle;
import de.fahrzeugmarkt.domain.VehicleModel;
import de.fahrzeugmarkt.repo.ListingRepository;
import de.fahrzeugmarkt.repo.MakeRepository;
import de.fahrzeugmarkt.repo.SavedListingRepository;
import de.fahrzeugmarkt.repo.UserRepository;
import de.fahrzeugmarkt.repo.VehicleModelRepository;
import de.fahrzeugmarkt.search.ListingQuery;
import de.fahrzeugmarkt.search.ListingSpecifications;
import de.fahrzeugmarkt.security.AppUserDetails;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ListingService {

    private final ListingRepository listings;
    private final MakeRepository makes;
    private final VehicleModelRepository models;
    private final UserRepository users;
    private final SavedListingRepository savedListings;
    private final ListingMapper mapper;

    public ListingService(ListingRepository listings,
                          MakeRepository makes,
                          VehicleModelRepository models,
                          UserRepository users,
                          SavedListingRepository savedListings,
                          ListingMapper mapper) {
        this.listings = listings;
        this.makes = makes;
        this.models = models;
        this.users = users;
        this.savedListings = savedListings;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public PageDto<ListingCardDto> search(ListingQuery query) {
        Pageable pageable = PageRequest.of(query.pageIndex(), query.pageSize(), query.toSort());
        Page<Listing> page = listings.findAll(ListingSpecifications.search(query), pageable);
        List<ListingCardDto> content = page.getContent().stream().map(mapper::toCard).toList();
        return new PageDto<>(content, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }

    @Transactional(readOnly = true)
    public ListingDetailDto detail(Long id, AppUserDetails principal) {
        Listing listing = listings.findDetailById(id)
                .orElseThrow(() -> ApiException.notFound("Listing not found"));
        boolean visible = listing.getStatus() == ListingStatus.ACTIVE
                || (principal != null && (principal.isAdmin() || listing.getSeller().getId().equals(principal.getId())));
        if (!visible) {
            throw ApiException.notFound("Listing not found");
        }
        boolean saved = principal != null && savedListings.existsByUserIdAndListingId(principal.getId(), id);
        return mapper.toDetail(listing, saved);
    }

    @Transactional
    public ListingDetailDto create(ListingRequest request, AppUserDetails principal) {
        User seller = users.findById(principal.getId())
                .orElseThrow(() -> ApiException.notFound("Seller not found"));
        Vehicle vehicle = new Vehicle();
        applyVehicle(vehicle, request.vehicle());
        Listing listing = new Listing(
                vehicle,
                seller,
                request.title().trim(),
                request.description().trim(),
                request.priceEur()
        );
        listings.save(listing);
        return mapper.toDetail(listing, false);
    }

    @Transactional
    public ListingDetailDto update(Long id, ListingRequest request, AppUserDetails principal) {
        Listing listing = requireOwned(id, principal);
        listing.setTitle(request.title().trim());
        listing.setDescription(request.description().trim());
        listing.setPriceEur(request.priceEur());
        applyVehicle(listing.getVehicle(), request.vehicle());
        return mapper.toDetail(listing, savedListings.existsByUserIdAndListingId(principal.getId(), id));
    }

    @Transactional
    public void delete(Long id, AppUserDetails principal) {
        listings.delete(requireOwned(id, principal));
    }

    public Listing requireOwned(Long id, AppUserDetails principal) {
        Listing listing = listings.findById(id)
                .orElseThrow(() -> ApiException.notFound("Listing not found"));
        if (!listing.getSeller().getId().equals(principal.getId())) {
            throw new AccessDeniedException("This listing belongs to another seller");
        }
        return listing;
    }

    private void applyVehicle(Vehicle vehicle, ListingRequest.VehicleRequest request) {
        vehicle.setModel(resolveModel(request.makeName().trim(), request.modelName().trim()));
        vehicle.setBodyType(request.bodyType());
        vehicle.setFuelType(request.fuelType());
        vehicle.setTransmission(request.transmission());
        vehicle.setColor(request.color().trim());
        vehicle.setMileageKm(request.mileageKm());
        vehicle.setPowerKw(request.powerKw());
        vehicle.setDoors(request.doors());
        vehicle.setSeats(request.seats());
        vehicle.setFirstRegistration(request.firstRegistration());
        vehicle.setNextInspection(request.nextInspection());
    }

    private VehicleModel resolveModel(String makeName, String modelName) {
        Make make = makes.findByNameIgnoreCase(makeName).orElseGet(() -> makes.save(new Make(makeName)));
        return models.findByMakeIdAndNameIgnoreCase(make.getId(), modelName)
                .orElseGet(() -> models.save(new VehicleModel(make, modelName)));
    }
}
