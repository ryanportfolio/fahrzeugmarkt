package de.fahrzeugmarkt.api.dto;

import java.util.List;

public record MetaDto(
        List<MakeWithModels> makes,
        List<String> fuelTypes,
        List<String> transmissions,
        List<String> bodyTypes,
        List<String> sorts
) {

    public record MakeWithModels(String name, List<String> models) {
    }
}
