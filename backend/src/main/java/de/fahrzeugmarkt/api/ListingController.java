package de.fahrzeugmarkt.api;

import de.fahrzeugmarkt.api.dto.FacetsDto;
import de.fahrzeugmarkt.api.dto.ListingCardDto;
import de.fahrzeugmarkt.api.dto.ListingDetailDto;
import de.fahrzeugmarkt.api.dto.PageDto;
import de.fahrzeugmarkt.api.request.ContactRequest;
import de.fahrzeugmarkt.api.request.ListingRequest;
import de.fahrzeugmarkt.search.ListingQuery;
import de.fahrzeugmarkt.security.AppUserDetails;
import de.fahrzeugmarkt.service.FacetService;
import de.fahrzeugmarkt.service.ImageStorageService;
import de.fahrzeugmarkt.service.InquiryService;
import de.fahrzeugmarkt.service.ListingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingService listings;
    private final FacetService facets;
    private final InquiryService inquiries;
    private final ImageStorageService imageStorage;

    public ListingController(ListingService listings,
                             FacetService facets,
                             InquiryService inquiries,
                             ImageStorageService imageStorage) {
        this.listings = listings;
        this.facets = facets;
        this.inquiries = inquiries;
        this.imageStorage = imageStorage;
    }

    @GetMapping
    public PageDto<ListingCardDto> search(@ModelAttribute ListingQuery query) {
        return listings.search(query);
    }

    @GetMapping("/facets")
    public FacetsDto facets(@ModelAttribute ListingQuery query) {
        return facets.facets(query);
    }

    @GetMapping("/{id}")
    public ListingDetailDto detail(@PathVariable Long id, @AuthenticationPrincipal AppUserDetails principal) {
        return listings.detail(id, principal);
    }

    @PostMapping
    public ResponseEntity<ListingDetailDto> create(@Valid @RequestBody ListingRequest request,
                                                   @AuthenticationPrincipal AppUserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(listings.create(request, principal));
    }

    @PutMapping("/{id}")
    public ListingDetailDto update(@PathVariable Long id,
                                   @Valid @RequestBody ListingRequest request,
                                   @AuthenticationPrincipal AppUserDetails principal) {
        return listings.update(id, request, principal);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal AppUserDetails principal) {
        listings.delete(id, principal);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/images")
    public ResponseEntity<ListingDetailDto.ImageDto> upload(@PathVariable Long id,
                                                            @RequestParam("file") MultipartFile file,
                                                            @AuthenticationPrincipal AppUserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(imageStorage.upload(id, file, principal));
    }

    @PostMapping("/{id}/contact")
    public ResponseEntity<Void> contact(@PathVariable Long id, @Valid @RequestBody ContactRequest request) {
        inquiries.contact(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
