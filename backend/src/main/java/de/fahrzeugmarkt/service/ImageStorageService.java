package de.fahrzeugmarkt.service;

import de.fahrzeugmarkt.api.ApiException;
import de.fahrzeugmarkt.api.dto.ListingDetailDto;
import de.fahrzeugmarkt.config.StorageProperties;
import de.fahrzeugmarkt.domain.Listing;
import de.fahrzeugmarkt.domain.ListingImage;
import de.fahrzeugmarkt.repo.ListingImageRepository;
import de.fahrzeugmarkt.security.AppUserDetails;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class ImageStorageService {

    private static final Map<String, String> ALLOWED_TYPES = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp"
    );
    private static final Pattern SAFE_NAME = Pattern.compile("[0-9a-f]{32}\\.(jpg|png|webp)");

    private final StorageProperties properties;
    private final ListingService listingService;
    private final ListingImageRepository images;
    private final SecureRandom random = new SecureRandom();

    public ImageStorageService(StorageProperties properties,
                               ListingService listingService,
                               ListingImageRepository images) {
        this.properties = properties;
        this.listingService = listingService;
        this.images = images;
    }

    @Transactional
    public ListingDetailDto.ImageDto upload(Long listingId, MultipartFile file, AppUserDetails principal) {
        Listing listing = listingService.requireOwned(listingId, principal);
        String extension = ALLOWED_TYPES.get(file.getContentType());
        if (extension == null) {
            throw ApiException.badRequest("Only JPEG, PNG and WebP images are accepted");
        }
        if (file.isEmpty() || file.getSize() > properties.maxFileSizeBytes()) {
            throw ApiException.badRequest("Image must be between 1 byte and 5 MB");
        }
        if (images.countByListingId(listingId) >= properties.maxImagesPerListing()) {
            throw ApiException.badRequest("A listing can hold at most " + properties.maxImagesPerListing() + " images");
        }

        byte[] token = new byte[16];
        random.nextBytes(token);
        String filename = HexFormat.of().formatHex(token) + "." + extension;
        try {
            Path directory = uploadDirectory();
            Files.createDirectories(directory);
            file.transferTo(directory.resolve(filename));
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        }

        int sortOrder = listing.getImages().stream().mapToInt(ListingImage::getSortOrder).max().orElse(-1) + 1;
        ListingImage image = new ListingImage(listing, "/api/images/upload/" + filename, sortOrder);
        listing.getImages().add(image);
        images.save(image);
        return new ListingDetailDto.ImageDto(image.getId(), image.getUrl(), image.getSortOrder());
    }

    @Transactional
    public void delete(Long imageId, AppUserDetails principal) {
        ListingImage image = images.findById(imageId)
                .orElseThrow(() -> ApiException.notFound("Image not found"));
        if (!image.getListing().getSeller().getId().equals(principal.getId())) {
            throw new AccessDeniedException("This image belongs to another seller");
        }
        String url = image.getUrl();
        images.delete(image);
        if (url.startsWith("/api/images/upload/")) {
            deleteFile(url.substring("/api/images/upload/".length()));
        }
    }

    public Resource load(String filename) {
        if (!SAFE_NAME.matcher(filename).matches()) {
            throw ApiException.notFound("Image not found");
        }
        Path path = uploadDirectory().resolve(filename);
        if (!Files.isRegularFile(path)) {
            throw ApiException.notFound("Image not found");
        }
        return new FileSystemResource(path);
    }

    public String contentType(String filename) {
        return switch (filename.substring(filename.lastIndexOf('.') + 1)) {
            case "png" -> "image/png";
            case "webp" -> "image/webp";
            default -> "image/jpeg";
        };
    }

    private void deleteFile(String filename) {
        if (!SAFE_NAME.matcher(filename).matches()) {
            return;
        }
        try {
            Files.deleteIfExists(uploadDirectory().resolve(filename));
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        }
    }

    private Path uploadDirectory() {
        return Paths.get(properties.uploadDir()).toAbsolutePath().normalize();
    }
}
