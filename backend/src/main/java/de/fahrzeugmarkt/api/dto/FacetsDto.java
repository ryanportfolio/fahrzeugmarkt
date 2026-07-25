package de.fahrzeugmarkt.api.dto;

import java.util.List;

public record FacetsDto(
        List<FacetCount> makes,
        List<FacetCount> fuelTypes,
        List<FacetCount> transmissions,
        List<FacetCount> bodyTypes
) {

    public record FacetCount(String value, long count) {
    }
}
