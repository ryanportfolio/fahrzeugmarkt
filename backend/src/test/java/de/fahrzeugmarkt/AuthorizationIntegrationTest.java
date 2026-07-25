package de.fahrzeugmarkt;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthorizationIntegrationTest extends IntegrationTest {

    private static final String LISTING_BODY = """
            {
              "title": "VW Golf 2.0 TDI Style",
              "description": "Test listing created by the integration suite with a description long enough to pass validation.",
              "priceEur": 18990,
              "vehicle": {
                "makeName": "VW",
                "modelName": "Golf",
                "bodyType": "HATCHBACK",
                "fuelType": "DIESEL",
                "transmission": "MANUAL",
                "color": "Grey",
                "mileageKm": 84000,
                "powerKw": 110,
                "doors": 5,
                "seats": 5,
                "firstRegistration": "2019-03-01",
                "nextInspection": "2027-06-01"
              }
            }
            """;

    @Test
    @DisplayName("anonymous listing creation is rejected with 401")
    void anonymousCreateIsUnauthorized() throws Exception {
        mvc.perform(post("/api/listings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LISTING_BODY))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("a buyer cannot reach seller only endpoints")
    void buyerCannotUseSellerEndpoints() throws Exception {
        MockHttpSession buyer = loginAs("buyer@demo.de");

        mvc.perform(get("/api/seller/listings").session(buyer)).andExpect(status().isForbidden());
        mvc.perform(post("/api/listings").session(buyer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LISTING_BODY))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("a seller cannot edit or delete another seller's listing")
    void foreignListingEditIsForbidden() throws Exception {
        MockHttpSession seller = loginAs("seller@demo.de");
        JsonNode own = json.readTree(mvc.perform(get("/api/seller/listings").session(seller))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        Set<Long> ownIds = new HashSet<>();
        own.forEach(listing -> ownIds.add(listing.get("id").asLong()));
        assertThat(ownIds).isNotEmpty();

        long foreignId = -1;
        for (JsonNode card : getJson("/api/listings?size=60").get("content")) {
            long id = card.get("id").asLong();
            if (!ownIds.contains(id)) {
                foreignId = id;
                break;
            }
        }
        assertThat(foreignId).isPositive();

        mvc.perform(put("/api/listings/" + foreignId).session(seller)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LISTING_BODY))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        mvc.perform(delete("/api/listings/" + foreignId).session(seller))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("a seller can create, read back and delete an own listing")
    void sellerOwnsTheListingLifecycle() throws Exception {
        MockHttpSession seller = loginAs("seller@demo.de");

        String created = mvc.perform(post("/api/listings").session(seller)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LISTING_BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.vehicle.make").value("VW"))
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(created).get("id").asLong();

        mvc.perform(put("/api/listings/" + id).session(seller)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LISTING_BODY.replace("18990", "17990")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.priceEur").value(17990));

        mvc.perform(delete("/api/listings/" + id).session(seller)).andExpect(status().isNoContent());
        mvc.perform(get("/api/listings/" + id)).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("invalid listing bodies return field errors")
    void validationReturnsFieldErrors() throws Exception {
        MockHttpSession seller = loginAs("seller@demo.de");

        mvc.perform(post("/api/listings").session(seller)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"\",\"description\":\"short\",\"priceEur\":-5}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors.title").exists())
                .andExpect(jsonPath("$.fieldErrors.priceEur").exists());
    }

    @Test
    @DisplayName("saved listings and contact require a session")
    void savedAndContactRequireLogin() throws Exception {
        long id = getJson("/api/listings?size=1").get("content").get(0).get("id").asLong();

        mvc.perform(get("/api/saved")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/listings/" + id + "/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Test\",\"email\":\"test@demo.de\",\"message\":\"Is it still available?\"}"))
                .andExpect(status().isUnauthorized());

        MockHttpSession buyer = loginAs("buyer@demo.de");
        mvc.perform(put("/api/saved/" + id).session(buyer)).andExpect(status().isNoContent());
        mvc.perform(get("/api/listings/" + id).session(buyer)).andExpect(jsonPath("$.savedByMe").value(true));
        mvc.perform(delete("/api/saved/" + id).session(buyer)).andExpect(status().isNoContent());
        mvc.perform(post("/api/listings/" + id + "/contact").session(buyer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Test\",\"email\":\"test@demo.de\",\"message\":\"Is it still available?\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("admin moderation flags and approves listings")
    void adminModeratesListings() throws Exception {
        MockHttpSession admin = loginAs("admin@demo.de");

        String flaggedJson = mvc.perform(get("/api/admin/listings?status=FLAGGED").session(admin))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(flaggedJson)).hasSizeGreaterThanOrEqualTo(2);
        assertThat(json.readTree(flaggedJson).get(0).get("sellerEmail").asText()).contains("@");

        long id = getJson("/api/listings?size=1").get("content").get(0).get("id").asLong();
        mvc.perform(post("/api/admin/listings/" + id + "/flag").session(admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FLAGGED"));
        mvc.perform(get("/api/listings/" + id)).andExpect(status().isNotFound());

        mvc.perform(post("/api/admin/listings/" + id + "/approve").session(admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
        mvc.perform(get("/api/listings/" + id)).andExpect(status().isOk());
    }

    @Test
    @DisplayName("registration signs the new account in")
    void registrationCreatesSession() throws Exception {
        MockHttpSession session = new MockHttpSession();
        mvc.perform(post("/api/auth/register").session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"new.buyer@demo.de","password":"secret123","displayName":"New Buyer",
                                 "role":"BUYER","city":"Hamburg"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("BUYER"));

        mvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("new.buyer@demo.de"));

        mvc.perform(post("/api/auth/logout").session(session)).andExpect(status().isNoContent());
    }
}
