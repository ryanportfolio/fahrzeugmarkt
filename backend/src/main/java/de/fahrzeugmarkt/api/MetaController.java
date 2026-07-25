package de.fahrzeugmarkt.api;

import de.fahrzeugmarkt.api.dto.MetaDto;
import de.fahrzeugmarkt.domain.BodyType;
import de.fahrzeugmarkt.domain.FuelType;
import de.fahrzeugmarkt.domain.Transmission;
import de.fahrzeugmarkt.domain.VehicleModel;
import de.fahrzeugmarkt.repo.VehicleModelRepository;
import de.fahrzeugmarkt.search.ListingQuery;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@RestController
public class MetaController {

    private final VehicleModelRepository models;

    public MetaController(VehicleModelRepository models) {
        this.models = models;
    }

    @GetMapping("/api/meta")
    @Transactional(readOnly = true)
    public MetaDto meta() {
        Map<String, List<String>> grouped = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        for (VehicleModel model : models.findAllWithMake()) {
            grouped.computeIfAbsent(model.getMake().getName(), key -> new ArrayList<>()).add(model.getName());
        }
        List<MetaDto.MakeWithModels> makes = grouped.entrySet().stream()
                .map(entry -> new MetaDto.MakeWithModels(entry.getKey(), entry.getValue().stream().sorted().toList()))
                .toList();
        return new MetaDto(
                makes,
                names(FuelType.values()),
                names(Transmission.values()),
                names(BodyType.values()),
                ListingQuery.SORTS
        );
    }

    private static List<String> names(Enum<?>[] values) {
        return Arrays.stream(values).map(Enum::name).toList();
    }
}
