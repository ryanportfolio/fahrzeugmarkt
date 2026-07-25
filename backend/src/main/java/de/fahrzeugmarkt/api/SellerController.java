package de.fahrzeugmarkt.api;

import de.fahrzeugmarkt.api.dto.InquiryDto;
import de.fahrzeugmarkt.api.dto.SellerListingDto;
import de.fahrzeugmarkt.security.AppUserDetails;
import de.fahrzeugmarkt.service.SellerService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/seller")
public class SellerController {

    private final SellerService sellerService;

    public SellerController(SellerService sellerService) {
        this.sellerService = sellerService;
    }

    @GetMapping("/listings")
    public List<SellerListingDto> listings(@AuthenticationPrincipal AppUserDetails principal) {
        return sellerService.ownListings(principal);
    }

    @GetMapping("/inquiries")
    public List<InquiryDto> inquiries(@AuthenticationPrincipal AppUserDetails principal) {
        return sellerService.ownInquiries(principal);
    }
}
