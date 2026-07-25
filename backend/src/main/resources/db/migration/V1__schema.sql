CREATE TABLE makes (
    id   BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE models (
    id      BIGSERIAL PRIMARY KEY,
    make_id BIGINT NOT NULL REFERENCES makes (id),
    name    TEXT   NOT NULL,
    UNIQUE (make_id, name)
);

-- purpose: list and filter models of one make without scanning the whole model table
CREATE INDEX idx_models_make_id ON models (make_id);

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         TEXT        NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    display_name  TEXT        NOT NULL,
    role          TEXT        NOT NULL CHECK (role IN ('BUYER', 'SELLER', 'ADMIN')),
    phone         TEXT,
    city          TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vehicles (
    id                 BIGSERIAL PRIMARY KEY,
    model_id           BIGINT NOT NULL REFERENCES models (id),
    body_type          TEXT   NOT NULL CHECK (body_type IN
                                              ('SEDAN', 'ESTATE', 'HATCHBACK', 'SUV', 'COUPE', 'CONVERTIBLE', 'VAN',
                                               'PICKUP')),
    fuel_type          TEXT   NOT NULL CHECK (fuel_type IN
                                              ('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'PLUG_IN_HYBRID', 'LPG')),
    transmission       TEXT   NOT NULL CHECK (transmission IN ('MANUAL', 'AUTOMATIC')),
    color              TEXT   NOT NULL,
    mileage_km         INT    NOT NULL CHECK (mileage_km >= 0),
    power_kw           INT    NOT NULL CHECK (power_kw > 0),
    doors              INT,
    seats              INT,
    first_registration DATE   NOT NULL,
    next_inspection    DATE
);

-- purpose: resolve make/model filters and joins from vehicles to the model catalogue
CREATE INDEX idx_vehicles_model_id ON vehicles (model_id);
-- purpose: mileage range filter and mileage_asc sort
CREATE INDEX idx_vehicles_mileage_km ON vehicles (mileage_km);
-- purpose: power range filter in kW
CREATE INDEX idx_vehicles_power_kw ON vehicles (power_kw);
-- purpose: year range filter and year_desc sort on first registration
CREATE INDEX idx_vehicles_first_registration ON vehicles (first_registration);
-- purpose: fuel type facet counts and multi-value fuel filter
CREATE INDEX idx_vehicles_fuel_type ON vehicles (fuel_type);
-- purpose: transmission facet counts and multi-value transmission filter
CREATE INDEX idx_vehicles_transmission ON vehicles (transmission);
-- purpose: body type facet counts and multi-value body filter
CREATE INDEX idx_vehicles_body_type ON vehicles (body_type);

CREATE TABLE listings (
    id          BIGSERIAL PRIMARY KEY,
    vehicle_id  BIGINT         NOT NULL UNIQUE REFERENCES vehicles (id),
    seller_id   BIGINT         NOT NULL REFERENCES users (id),
    title       TEXT           NOT NULL,
    description TEXT           NOT NULL,
    price_eur   NUMERIC(10, 2) NOT NULL CHECK (price_eur > 0),
    status      TEXT           NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'FLAGGED', 'REMOVED')),
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- purpose: default browse page, active listings newest first, without a sort step
CREATE INDEX idx_listings_status_created_at ON listings (status, created_at DESC);
-- purpose: price range filter and price_asc/price_desc sorts
CREATE INDEX idx_listings_price_eur ON listings (price_eur);
-- purpose: seller dashboard listing own listings across all statuses
CREATE INDEX idx_listings_seller_id ON listings (seller_id);

CREATE TABLE listing_images (
    id         BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
    url        TEXT   NOT NULL,
    sort_order INT    NOT NULL DEFAULT 0
);

-- purpose: load the gallery and the cover image (sort_order 0) of a listing
CREATE INDEX idx_listing_images_listing_id ON listing_images (listing_id, sort_order);

CREATE TABLE saved_listings (
    user_id    BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    listing_id BIGINT      NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, listing_id)
);

-- purpose: saved counts per listing for the seller dashboard, the PK only covers user_id first
CREATE INDEX idx_saved_listings_listing_id ON saved_listings (listing_id);

CREATE TABLE inquiries (
    id           BIGSERIAL PRIMARY KEY,
    listing_id   BIGINT      NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
    sender_name  TEXT        NOT NULL,
    sender_email TEXT        NOT NULL,
    message      TEXT        NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- purpose: inquiry counts and the seller inbox grouped by listing
CREATE INDEX idx_inquiries_listing_id ON inquiries (listing_id);
