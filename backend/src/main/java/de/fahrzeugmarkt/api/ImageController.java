package de.fahrzeugmarkt.api;

import de.fahrzeugmarkt.security.AppUserDetails;
import de.fahrzeugmarkt.service.ImageStorageService;
import de.fahrzeugmarkt.service.SeedImageService;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/images")
public class ImageController {

    private static final Pattern SEED_NAME = Pattern.compile("(\\d{1,18})-(\\d)\\.svg");

    private final SeedImageService seedImages;
    private final ImageStorageService uploads;

    public ImageController(SeedImageService seedImages, ImageStorageService uploads) {
        this.seedImages = seedImages;
        this.uploads = uploads;
    }

    @GetMapping("/seed/{name}")
    public ResponseEntity<String> seed(@PathVariable String name) {
        Matcher matcher = SEED_NAME.matcher(name);
        if (!matcher.matches()) {
            throw ApiException.notFound("Image not found");
        }
        String svg = seedImages.render(Long.parseLong(matcher.group(1)), Integer.parseInt(matcher.group(2)));
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("image/svg+xml"))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .body(svg);
    }

    @GetMapping("/upload/{filename}")
    public ResponseEntity<Resource> upload(@PathVariable String filename) {
        Resource resource = uploads.load(filename);
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf(uploads.contentType(filename)))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .body(resource);
    }

    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> delete(@PathVariable Long imageId, @AuthenticationPrincipal AppUserDetails principal) {
        uploads.delete(imageId, principal);
        return ResponseEntity.noContent().build();
    }
}
