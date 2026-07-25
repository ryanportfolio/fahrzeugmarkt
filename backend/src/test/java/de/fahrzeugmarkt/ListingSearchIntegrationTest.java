package de.fahrzeugmarkt;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ListingSearchIntegrationTest extends IntegrationTest {

    @Test
    @DisplayName("seeded browse page returns active listings with cover images")
    void browseReturnsSeededContent() throws Exception {
        JsonNode page = getJson("/api/listings?size=24");

        assertThat(page.get("totalElements").asLong()).isGreaterThanOrEqualTo(200);
        assertThat(page.get("size").asInt()).isEqualTo(24);
        assertThat(page.get("content")).hasSize(24);

        JsonNode first = page.get("content").get(0);
        assertThat(first.get("title").asText()).isNotBlank();
        assertThat(first.get("make").asText()).isNotBlank();
        assertThat(first.get("coverImageUrl").asText()).startsWith("/api/images/seed/");
        assertThat(first.get("city").asText()).isNotBlank();
    }

    @Test
    @DisplayName("combined filters narrow the result and every row matches both filters")
    void combinedFiltersNarrowResults() throws Exception {
        long unfiltered = getJson("/api/listings?size=60").get("totalElements").asLong();
        JsonNode filtered = getJson("/api/listings?fuelType=DIESEL&priceTo=20000&size=60");

        long total = filtered.get("totalElements").asLong();
        assertThat(total).isPositive().isLessThan(unfiltered);

        for (JsonNode card : filtered.get("content")) {
            assertThat(card.get("fuelType").asText()).isEqualTo("DIESEL");
            assertThat(new BigDecimal(card.get("priceEur").asText())).isLessThanOrEqualTo(new BigDecimal("20000"));
        }
    }

    @Test
    @DisplayName("multi value filters are OR within a dimension and AND across dimensions")
    void multiValueFiltersCombine() throws Exception {
        JsonNode result = getJson("/api/listings?fuelType=PETROL&fuelType=DIESEL&transmission=AUTOMATIC&size=60");

        assertThat(result.get("totalElements").asLong()).isPositive();
        for (JsonNode card : result.get("content")) {
            assertThat(card.get("fuelType").asText()).isIn("PETROL", "DIESEL");
            assertThat(card.get("transmission").asText()).isEqualTo("AUTOMATIC");
        }
    }

    @Test
    @DisplayName("sorts are applied in SQL and come back ordered")
    void sortsAreOrdered() throws Exception {
        List<BigDecimal> prices = decimals(getJson("/api/listings?sort=price_asc&size=60"), "priceEur");
        assertThat(prices).isSorted();

        List<BigDecimal> descending = decimals(getJson("/api/listings?sort=price_desc&size=60"), "priceEur");
        assertThat(descending).isSortedAccordingTo((a, b) -> b.compareTo(a));

        List<BigDecimal> mileages = decimals(getJson("/api/listings?sort=mileage_asc&size=60"), "mileageKm");
        assertThat(mileages).isSorted();

        List<String> years = texts(getJson("/api/listings?sort=year_desc&size=60"), "firstRegistration");
        assertThat(years).isSortedAccordingTo((a, b) -> b.compareTo(a));

        List<String> created = texts(getJson("/api/listings?size=60"), "createdAt");
        assertThat(created).isSortedAccordingTo((a, b) -> b.compareTo(a));
    }

    @Test
    @DisplayName("free text search matches title, make and model")
    void freeTextSearch() throws Exception {
        JsonNode result = getJson("/api/listings?q=golf&size=60");

        assertThat(result.get("totalElements").asLong()).isPositive();
        for (JsonNode card : result.get("content")) {
            String haystack = (card.get("title").asText() + card.get("make").asText() + card.get("model").asText())
                    .toLowerCase();
            assertThat(haystack).contains("golf");
        }
    }

    @Test
    @DisplayName("facet counts add up and exclude only their own dimension")
    void facetsAreConsistent() throws Exception {
        long total = getJson("/api/listings?size=1").get("totalElements").asLong();
        JsonNode facets = getJson("/api/listings/facets");

        assertThat(sum(facets.get("makes"))).isEqualTo(total);
        assertThat(sum(facets.get("fuelTypes"))).isEqualTo(total);
        assertThat(sum(facets.get("transmissions"))).isEqualTo(total);
        assertThat(sum(facets.get("bodyTypes"))).isEqualTo(total);
        assertThat(facets.get("makes")).hasSizeGreaterThan(5);

        long dieselTotal = getJson("/api/listings?fuelType=DIESEL&size=1").get("totalElements").asLong();
        JsonNode dieselFacets = getJson("/api/listings/facets?fuelType=DIESEL");

        assertThat(sum(dieselFacets.get("makes"))).isEqualTo(dieselTotal);
        assertThat(sum(dieselFacets.get("bodyTypes"))).isEqualTo(dieselTotal);
        assertThat(sum(dieselFacets.get("fuelTypes"))).isEqualTo(total);
        assertThat(values(dieselFacets.get("fuelTypes"))).contains("PETROL", "DIESEL");
    }

    @Test
    @DisplayName("detail returns the full vehicle, seller and gallery")
    void detailReturnsFullPayload() throws Exception {
        long id = getJson("/api/listings?size=1").get("content").get(0).get("id").asLong();
        JsonNode detail = getJson("/api/listings/" + id);

        assertThat(detail.get("description").asText()).isNotBlank();
        assertThat(detail.get("status").asText()).isEqualTo("ACTIVE");
        assertThat(detail.get("vehicle").get("make").asText()).isNotBlank();
        assertThat(detail.get("vehicle").get("firstRegistration").asText()).matches("\\d{4}-\\d{2}-\\d{2}");
        assertThat(detail.get("seller").get("displayName").asText()).isNotBlank();
        assertThat(detail.get("images")).hasSizeGreaterThanOrEqualTo(2);
        assertThat(detail.get("savedByMe").asBoolean()).isFalse();
    }

    @Test
    @DisplayName("meta lists makes with models and every enum value")
    void metaListsFilterOptions() throws Exception {
        JsonNode meta = getJson("/api/meta");

        assertThat(meta.get("makes")).hasSizeGreaterThan(5);
        assertThat(meta.get("makes").get(0).get("models")).isNotEmpty();
        assertThat(meta.get("fuelTypes")).hasSize(6);
        assertThat(meta.get("transmissions")).hasSize(2);
        assertThat(meta.get("bodyTypes")).hasSize(8);
        assertThat(meta.get("sorts")).hasSize(5);
    }

    @Test
    @DisplayName("seed images render deterministic SVG per vehicle and shot")
    void seedImagesRender() throws Exception {
        long id = getJson("/api/listings?size=1").get("content").get(0).get("id").asLong();
        JsonNode detail = getJson("/api/listings/" + id);
        String url = detail.get("images").get(0).get("url").asText();

        String svg = mvc.perform(get(url))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", containsString("max-age=31536000")))
                .andReturn().getResponse().getContentAsString();

        assertThat(svg).startsWith("<svg").endsWith("</svg>").doesNotContain("<text");
    }

    private static long sum(JsonNode facet) {
        long total = 0;
        for (JsonNode entry : facet) {
            total += entry.get("count").asLong();
        }
        return total;
    }

    private static List<String> values(JsonNode facet) {
        List<String> values = new ArrayList<>();
        facet.forEach(entry -> values.add(entry.get("value").asText()));
        return values;
    }

    private static List<BigDecimal> decimals(JsonNode page, String field) {
        List<BigDecimal> values = new ArrayList<>();
        page.get("content").forEach(card -> values.add(new BigDecimal(card.get(field).asText())));
        return values;
    }

    private static List<String> texts(JsonNode page, String field) {
        List<String> values = new ArrayList<>();
        page.get("content").forEach(card -> values.add(card.get(field).asText()));
        return values;
    }
}
