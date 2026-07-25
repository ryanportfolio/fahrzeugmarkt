package de.fahrzeugmarkt.api.dto;

import de.fahrzeugmarkt.domain.Inquiry;

import java.time.Instant;

public record InquiryDto(
        Long id,
        Long listingId,
        String listingTitle,
        String senderName,
        String senderEmail,
        String message,
        Instant createdAt
) {

    public static InquiryDto of(Inquiry inquiry) {
        return new InquiryDto(
                inquiry.getId(),
                inquiry.getListing().getId(),
                inquiry.getListing().getTitle(),
                inquiry.getSenderName(),
                inquiry.getSenderEmail(),
                inquiry.getMessage(),
                inquiry.getCreatedAt()
        );
    }
}
