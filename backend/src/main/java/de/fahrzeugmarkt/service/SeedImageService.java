package de.fahrzeugmarkt.service;

import de.fahrzeugmarkt.api.ApiException;
import de.fahrzeugmarkt.domain.BodyType;
import de.fahrzeugmarkt.domain.Vehicle;
import de.fahrzeugmarkt.repo.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Map;

/**
 * Renders the catalogue photography: a deterministic side profile SVG per vehicle and shot index.
 */
@Service
public class SeedImageService {

    public static final int SHOTS_PER_VEHICLE = 3;

    private static final int WIDTH = 1200;
    private static final int HEIGHT = 800;
    private static final int GROUND = 620;

    private static final Map<String, String> PAINT = Map.ofEntries(
            Map.entry("black", "#262a30"),
            Map.entry("grey", "#7d858d"),
            Map.entry("gray", "#7d858d"),
            Map.entry("silver", "#c0c7ce"),
            Map.entry("white", "#e8ecf0"),
            Map.entry("blue", "#2a5da6"),
            Map.entry("red", "#ad2a2f"),
            Map.entry("green", "#2f6a51"),
            Map.entry("brown", "#6b4a34"),
            Map.entry("beige", "#c8bda6"),
            Map.entry("yellow", "#dcb327"),
            Map.entry("orange", "#d4711f")
    );

    private record Profile(
            int rearX, int frontX,
            int rearWheelX, int frontWheelX, int wheelR, int archR,
            int sillY, int noseY, int bonnetY, int cowlX,
            int roofFrontX, int roofRearX, int roofY, int beltY,
            int deckX, int deckY, int tailX, int tailY,
            boolean openTop, boolean twoDoor
    ) {
    }

    private final VehicleRepository vehicles;

    public SeedImageService(VehicleRepository vehicles) {
        this.vehicles = vehicles;
    }

    @Transactional(readOnly = true)
    public String render(long vehicleId, int shot) {
        if (shot < 0 || shot >= SHOTS_PER_VEHICLE) {
            throw ApiException.notFound("Image not found");
        }
        Vehicle vehicle = vehicles.findById(vehicleId)
                .orElseThrow(() -> ApiException.notFound("Image not found"));
        return svg(vehicle.getBodyType(), vehicle.getColor(), vehicleId, shot);
    }

    String svg(BodyType bodyType, String color, long vehicleId, int shot) {
        long noise = hash(vehicleId, shot);
        Profile p = profile(bodyType);

        int hue = 202 + (int) (noise % 37) - 16 + shot * 8;
        int glowX = 470 + (int) ((noise >>> 12) % 220);
        int rimStyle = (int) ((noise >>> 24) % 3);

        String base = PAINT.getOrDefault(color == null ? "" : color.trim().toLowerCase(Locale.ROOT), "#6f7883");
        String top = mix(base, "#ffffff", 0.34);
        String upper = mix(base, "#ffffff", 0.12);
        String lower = mix(base, "#000000", 0.34);
        String bottom = mix(base, "#000000", 0.58);
        String bounce = mix(base, "#ffffff", 0.20);

        StringBuilder svg = new StringBuilder(9000);
        svg.append("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"").append(viewBox(shot))
                .append("\" width=\"").append(WIDTH).append("\" height=\"").append(HEIGHT)
                .append("\" role=\"img\">");

        svg.append("<defs>");
        svg.append(linear("sky", 0, 0, 0, 1,
                stop(0, hsl(hue, 30, 20), 1),
                stop(0.55, hsl(hue + 6, 24, 33), 1),
                stop(1, hsl(hue + 12, 18, 46), 1)));
        svg.append("<radialGradient id=\"glow\" cx=\"").append((double) glowX / WIDTH)
                .append("\" cy=\"0.52\" r=\"0.62\">")
                .append(stop(0, hsl(hue + 20, 46, 78), 0.62))
                .append(stop(0.55, hsl(hue + 14, 38, 60), 0.22))
                .append(stop(1, hsl(hue + 10, 30, 40), 0))
                .append("</radialGradient>");
        svg.append(linear("floor", 0, 0, 0, 1,
                stop(0, hsl(hue, 14, 30), 1),
                stop(0.35, hsl(hue, 12, 22), 1),
                stop(1, hsl(hue, 10, 13), 1)));
        svg.append("<radialGradient id=\"floorlight\" cx=\"0.5\" cy=\"0.5\" r=\"0.5\">")
                .append(stop(0, hsl(hue + 16, 34, 66), 0.32))
                .append(stop(1, hsl(hue + 16, 34, 66), 0))
                .append("</radialGradient>");
        svg.append("<radialGradient id=\"shadow\" cx=\"0.5\" cy=\"0.5\" r=\"0.5\">")
                .append(stop(0, "#000000", 0.55))
                .append(stop(0.6, "#000000", 0.24))
                .append(stop(1, "#000000", 0))
                .append("</radialGradient>");
        svg.append(linear("paint", 0, 0, 0, 1,
                stop(0, top, 1),
                stop(0.26, upper, 1),
                stop(0.55, base, 1),
                stop(0.84, lower, 1),
                stop(1, bottom, 1)));
        svg.append(linear("glass", 0, 0, 0.25, 1,
                stop(0, "#8fa4b6", 1),
                stop(0.42, "#41525f", 1),
                stop(1, "#2a353f", 1)));
        svg.append(linear("tyre", 0, 0, 0, 1,
                stop(0, "#31353a", 1),
                stop(1, "#15181b", 1)));
        svg.append(linear("rim", 0.1, 0, 0.9, 1,
                stop(0, "#eceff2", 1),
                stop(0.45, "#a9b1b9", 1),
                stop(1, "#6c757e", 1)));
        svg.append(linear("head", 0, 0, 1, 1,
                stop(0, "#fdf6e2", 1),
                stop(1, "#b9c6cf", 1)));
        svg.append(linear("tail", 0, 0, 1, 1,
                stop(0, "#e0574f", 1),
                stop(1, "#8d1f21", 1)));
        svg.append(linear("sheen", 0, 0, 1, 0,
                stop(0, "#ffffff", 0),
                stop(0.45, "#ffffff", 0.22),
                stop(1, "#ffffff", 0)));
        svg.append("<radialGradient id=\"vignette\" cx=\"0.5\" cy=\"0.46\" r=\"0.72\">")
                .append(stop(0.55, "#000000", 0))
                .append(stop(1, "#000000", 0.34))
                .append("</radialGradient>");
        svg.append("<clipPath id=\"bodyclip\"><path d=\"").append(bodyPath(p)).append("\"/></clipPath>");
        svg.append("</defs>");

        svg.append("<rect x=\"0\" y=\"0\" width=\"").append(WIDTH).append("\" height=\"").append(HEIGHT)
                .append("\" fill=\"url(#sky)\"/>");
        svg.append("<rect x=\"0\" y=\"0\" width=\"").append(WIDTH).append("\" height=\"").append(GROUND)
                .append("\" fill=\"url(#glow)\"/>");
        svg.append("<rect x=\"0\" y=\"").append(GROUND).append("\" width=\"").append(WIDTH)
                .append("\" height=\"").append(HEIGHT - GROUND).append("\" fill=\"url(#floor)\"/>");
        svg.append("<ellipse cx=\"").append(glowX).append("\" cy=\"").append(GROUND + 60)
                .append("\" rx=\"620\" ry=\"140\" fill=\"url(#floorlight)\"/>");
        svg.append("<rect x=\"0\" y=\"").append(GROUND - 1)
                .append("\" width=\"").append(WIDTH).append("\" height=\"2\" fill=\"")
                .append(hsl(hue + 14, 30, 62)).append("\" opacity=\"0.35\"/>");

        svg.append("<ellipse cx=\"").append((p.rearX() + p.frontX()) / 2).append("\" cy=\"").append(GROUND + 14)
                .append("\" rx=\"").append((p.frontX() - p.rearX()) / 2 + 40).append("\" ry=\"34\" fill=\"url(#shadow)\"/>");

        svg.append(wheel(p.rearWheelX(), p.wheelR(), rimStyle));
        svg.append(wheel(p.frontWheelX(), p.wheelR(), rimStyle));

        svg.append("<path d=\"").append(bodyPath(p)).append("\" fill=\"url(#paint)\"/>");

        svg.append("<g clip-path=\"url(#bodyclip)\">");
        svg.append("<path d=\"M ").append(p.rearX() - 20).append(" ").append(p.beltY() + 46)
                .append(" L ").append(p.frontX() + 20).append(" ").append(p.beltY() + 18)
                .append(" L ").append(p.frontX() + 20).append(" ").append(p.beltY() + 34)
                .append(" L ").append(p.rearX() - 20).append(" ").append(p.beltY() + 64)
                .append(" Z\" fill=\"url(#sheen)\"/>");
        svg.append("<rect x=\"").append(p.rearX() - 20).append("\" y=\"").append(p.sillY() - 34)
                .append("\" width=\"").append(p.frontX() - p.rearX() + 40).append("\" height=\"70\" fill=\"")
                .append(mix(base, "#000000", 0.45)).append("\" opacity=\"0.5\"/>");
        svg.append("<rect x=\"").append(p.rearX() - 20).append("\" y=\"").append(p.sillY() - 40)
                .append("\" width=\"").append(p.frontX() - p.rearX() + 40).append("\" height=\"5\" fill=\"")
                .append(bounce).append("\" opacity=\"0.35\"/>");
        svg.append("</g>");

        svg.append("<path d=\"").append(glassPath(p)).append("\" fill=\"url(#glass)\"/>");
        if (!p.openTop()) {
            int pillar = p.roofRearX() + (int) ((p.roofFrontX() - p.roofRearX()) * 0.52);
            svg.append("<path d=\"M ").append(pillar).append(" ").append(p.beltY())
                    .append(" L ").append(pillar + 10).append(" ").append(p.roofY() + 12)
                    .append(" L ").append(pillar + 24).append(" ").append(p.roofY() + 12)
                    .append(" L ").append(pillar + 14).append(" ").append(p.beltY())
                    .append(" Z\" fill=\"").append(lower).append("\"/>");
        }

        svg.append(details(p, lower, top));

        svg.append("<path d=\"").append(bodyPath(p))
                .append("\" fill=\"none\" stroke=\"").append(mix(base, "#000000", 0.62))
                .append("\" stroke-width=\"3\" stroke-linejoin=\"round\" opacity=\"0.55\"/>");

        svg.append("<rect x=\"0\" y=\"0\" width=\"").append(WIDTH).append("\" height=\"").append(HEIGHT)
                .append("\" fill=\"url(#vignette)\"/>");
        svg.append("</svg>");
        return svg.toString();
    }

    private static String viewBox(int shot) {
        return switch (shot) {
            case 1 -> "300 168 780 520";
            case 2 -> "40 212 900 600";
            default -> "0 0 1200 800";
        };
    }

    private static Profile profile(BodyType bodyType) {
        return switch (bodyType) {
            case SEDAN -> new Profile(140, 1070, 345, 875, 76, 90,
                    560, 468, 418, 764, 704, 498, 318, 412, 408, 400, 150, 428, false, false);
            case ESTATE -> new Profile(140, 1070, 345, 875, 76, 90,
                    560, 468, 418, 764, 700, 296, 316, 412, 238, 348, 158, 446, false, false);
            case HATCHBACK -> new Profile(190, 1035, 380, 855, 74, 88,
                    558, 466, 420, 760, 672, 440, 322, 414, 380, 372, 205, 452, false, false);
            case SUV -> new Profile(150, 1060, 360, 870, 92, 104,
                    536, 440, 392, 756, 676, 310, 272, 384, 258, 308, 168, 408, false, false);
            case COUPE -> new Profile(145, 1075, 350, 885, 78, 92,
                    566, 478, 430, 790, 690, 560, 336, 424, 340, 424, 152, 444, false, true);
            case CONVERTIBLE -> new Profile(145, 1070, 350, 880, 78, 92,
                    564, 474, 428, 786, 700, 640, 372, 422, 326, 424, 155, 442, true, true);
            case VAN -> new Profile(140, 1060, 340, 880, 80, 94,
                    552, 452, 418, 832, 790, 250, 248, 396, 214, 274, 158, 430, false, false);
            case PICKUP -> new Profile(140, 1075, 330, 880, 88, 100,
                    540, 444, 396, 782, 700, 566, 286, 390, 548, 432, 150, 432, false, true);
        };
    }

    private static String bodyPath(Profile p) {
        StringBuilder d = new StringBuilder(700);
        d.append("M ").append(p.rearX()).append(" ").append(p.sillY() - 6);
        d.append(" C ").append(p.rearX()).append(" ").append(p.sillY())
                .append(" ").append(p.rearX() + 6).append(" ").append(p.sillY())
                .append(" ").append(p.rearX() + 18).append(" ").append(p.sillY());
        d.append(" L ").append(p.rearWheelX() - p.archR()).append(" ").append(p.sillY());
        d.append(" A ").append(p.archR()).append(" ").append(p.archR()).append(" 0 0 1 ")
                .append(p.rearWheelX() + p.archR()).append(" ").append(p.sillY());
        d.append(" L ").append(p.frontWheelX() - p.archR()).append(" ").append(p.sillY());
        d.append(" A ").append(p.archR()).append(" ").append(p.archR()).append(" 0 0 1 ")
                .append(p.frontWheelX() + p.archR()).append(" ").append(p.sillY());
        d.append(" L ").append(p.frontX() - 26).append(" ").append(p.sillY());
        d.append(" C ").append(p.frontX() - 6).append(" ").append(p.sillY())
                .append(" ").append(p.frontX()).append(" ").append(p.sillY() - 12)
                .append(" ").append(p.frontX()).append(" ").append(p.noseY() + 22);
        d.append(" C ").append(p.frontX()).append(" ").append(p.noseY() + 4)
                .append(" ").append(p.frontX() - 4).append(" ").append(p.noseY() - 6)
                .append(" ").append(p.frontX() - 30).append(" ").append(p.noseY() - 14);

        int bonnetMid = (p.frontX() + p.cowlX()) / 2;
        d.append(" C ").append(bonnetMid + 54).append(" ").append(p.noseY() - 30)
                .append(" ").append(bonnetMid - 34).append(" ").append(p.bonnetY() + 6)
                .append(" ").append(p.cowlX()).append(" ").append(p.bonnetY());

        d.append(" C ").append(p.cowlX() - 22).append(" ").append(p.bonnetY() - 12)
                .append(" ").append(p.roofFrontX() + 26).append(" ").append(p.roofY() + 28)
                .append(" ").append(p.roofFrontX()).append(" ").append(p.roofY());

        if (p.openTop()) {
            d.append(" C ").append(p.roofFrontX() - 14).append(" ").append(p.roofY() + 22)
                    .append(" ").append(p.roofFrontX() - 26).append(" ").append(p.beltY() - 24)
                    .append(" ").append(p.roofFrontX() - 42).append(" ").append(p.beltY() - 2);
            d.append(" L ").append(p.deckX()).append(" ").append(p.deckY());
        } else {
            int roofMid = (p.roofFrontX() + p.roofRearX()) / 2;
            d.append(" C ").append(roofMid + 30).append(" ").append(p.roofY() - 7)
                    .append(" ").append(roofMid - 30).append(" ").append(p.roofY() - 7)
                    .append(" ").append(p.roofRearX()).append(" ").append(p.roofY());
            d.append(" C ").append(p.roofRearX() - 22).append(" ").append(p.roofY() + 10)
                    .append(" ").append(p.deckX() + 22).append(" ").append(p.deckY() - 24)
                    .append(" ").append(p.deckX()).append(" ").append(p.deckY());
        }

        d.append(" C ").append(p.deckX() - 40).append(" ").append(p.deckY() + 8)
                .append(" ").append(p.tailX() + 30).append(" ").append(p.tailY() - 8)
                .append(" ").append(p.tailX()).append(" ").append(p.tailY());
        d.append(" C ").append(p.rearX() - 2).append(" ").append(p.tailY() + 14)
                .append(" ").append(p.rearX()).append(" ").append(p.tailY() + 40)
                .append(" ").append(p.rearX()).append(" ").append(p.sillY() - 6);
        d.append(" Z");
        return d.toString();
    }

    private static String glassPath(Profile p) {
        if (p.openTop()) {
            return "M " + (p.cowlX() - 4) + " " + (p.beltY() - 4)
                    + " L " + (p.roofFrontX() - 2) + " " + (p.roofY() + 10)
                    + " L " + (p.roofFrontX() + 20) + " " + (p.roofY() + 12)
                    + " L " + (p.cowlX() + 18) + " " + (p.beltY() - 2)
                    + " Z";
        }
        return "M " + (p.cowlX() - 12) + " " + p.beltY()
                + " C " + (p.cowlX() - 30) + " " + (p.beltY() - 14)
                + " " + (p.roofFrontX() + 22) + " " + (p.roofY() + 34)
                + " " + (p.roofFrontX() - 6) + " " + (p.roofY() + 13)
                + " L " + (p.roofRearX() + 10) + " " + (p.roofY() + 13)
                + " C " + (p.roofRearX() - 8) + " " + (p.roofY() + 24)
                + " " + (p.deckX() + 32) + " " + (p.beltY() - 26)
                + " " + (p.deckX() + 18) + " " + p.beltY()
                + " Z";
    }

    private static String wheel(int cx, int r, int rimStyle) {
        int cy = GROUND - r;
        StringBuilder g = new StringBuilder(700);
        g.append("<g>");
        g.append("<circle cx=\"").append(cx).append("\" cy=\"").append(cy).append("\" r=\"").append(r)
                .append("\" fill=\"url(#tyre)\"/>");
        g.append("<circle cx=\"").append(cx).append("\" cy=\"").append(cy).append("\" r=\"")
                .append((int) (r * 0.78)).append("\" fill=\"none\" stroke=\"#0f1113\" stroke-width=\"2\" opacity=\"0.7\"/>");
        g.append("<circle cx=\"").append(cx).append("\" cy=\"").append(cy).append("\" r=\"")
                .append((int) (r * 0.60)).append("\" fill=\"url(#rim)\"/>");
        int spokes = 5 + rimStyle;
        double inner = r * 0.16;
        double outer = r * 0.54;
        for (int i = 0; i < spokes; i++) {
            double angle = Math.PI * 2 * i / spokes + rimStyle * 0.31;
            int x1 = (int) Math.round(cx + Math.cos(angle) * inner);
            int y1 = (int) Math.round(cy + Math.sin(angle) * inner);
            int x2 = (int) Math.round(cx + Math.cos(angle) * outer);
            int y2 = (int) Math.round(cy + Math.sin(angle) * outer);
            g.append("<line x1=\"").append(x1).append("\" y1=\"").append(y1)
                    .append("\" x2=\"").append(x2).append("\" y2=\"").append(y2)
                    .append("\" stroke=\"#7f888f\" stroke-width=\"").append(Math.max(6, r / 9))
                    .append("\" stroke-linecap=\"round\" opacity=\"0.85\"/>");
        }
        g.append("<circle cx=\"").append(cx).append("\" cy=\"").append(cy).append("\" r=\"")
                .append((int) (r * 0.17)).append("\" fill=\"#59626a\"/>");
        g.append("<circle cx=\"").append(cx).append("\" cy=\"").append(cy).append("\" r=\"")
                .append((int) (r * 0.60)).append("\" fill=\"none\" stroke=\"#3d4449\" stroke-width=\"3\"/>");
        g.append("</g>");
        return g.toString();
    }

    private static String details(Profile p, String shadeColor, String highlight) {
        StringBuilder g = new StringBuilder(1200);
        int pillar = p.roofRearX() + (int) ((p.roofFrontX() - p.roofRearX()) * 0.52);

        g.append("<path d=\"M ").append(p.cowlX() - 22).append(" ").append(p.beltY() + 4)
                .append(" L ").append(p.cowlX() - 30).append(" ").append(p.sillY() - 20)
                .append("\" stroke=\"").append(shadeColor).append("\" stroke-width=\"3\" opacity=\"0.55\" fill=\"none\"/>");
        if (!p.twoDoor()) {
            g.append("<path d=\"M ").append(pillar + 6).append(" ").append(p.beltY() + 4)
                    .append(" L ").append(pillar - 2).append(" ").append(p.sillY() - 20)
                    .append("\" stroke=\"").append(shadeColor).append("\" stroke-width=\"3\" opacity=\"0.55\" fill=\"none\"/>");
        }

        int handleY = p.beltY() + 30;
        g.append(handle(pillar - 56, handleY, shadeColor));
        if (!p.twoDoor()) {
            g.append(handle(pillar + 34, handleY, shadeColor));
        }

        g.append("<path d=\"M ").append(p.frontX() - 10).append(" ").append(p.noseY() - 14)
                .append(" L ").append(p.frontX() - 62).append(" ").append(p.noseY() - 24)
                .append(" L ").append(p.frontX() - 58).append(" ").append(p.noseY() - 4)
                .append(" L ").append(p.frontX() - 8).append(" ").append(p.noseY() + 4)
                .append(" Z\" fill=\"url(#head)\" opacity=\"0.85\"/>");

        g.append("<path d=\"M ").append(p.rearX() + 5).append(" ").append(p.tailY() + 26)
                .append(" L ").append(p.rearX() + 46).append(" ").append(p.tailY() + 21)
                .append(" L ").append(p.rearX() + 48).append(" ").append(p.tailY() + 40)
                .append(" L ").append(p.rearX() + 5).append(" ").append(p.tailY() + 45)
                .append(" Z\" fill=\"url(#tail)\" opacity=\"0.8\"/>");

        g.append("<path d=\"M ").append(p.cowlX() - 4).append(" ").append(p.beltY() + 2)
                .append(" L ").append(p.cowlX() + 26).append(" ").append(p.beltY() - 6)
                .append(" L ").append(p.cowlX() + 28).append(" ").append(p.beltY() + 8)
                .append(" L ").append(p.cowlX() - 2).append(" ").append(p.beltY() + 12)
                .append(" Z\" fill=\"").append(shadeColor).append("\"/>");

        g.append("<path d=\"M ").append(p.rearWheelX() - p.archR() - 6).append(" ").append(p.sillY())
                .append(" A ").append(p.archR() + 6).append(" ").append(p.archR() + 6).append(" 0 0 1 ")
                .append(p.rearWheelX() + p.archR() + 6).append(" ").append(p.sillY())
                .append("\" fill=\"none\" stroke=\"#101215\" stroke-width=\"5\" opacity=\"0.35\"/>");
        g.append("<path d=\"M ").append(p.frontWheelX() - p.archR() - 6).append(" ").append(p.sillY())
                .append(" A ").append(p.archR() + 6).append(" ").append(p.archR() + 6).append(" 0 0 1 ")
                .append(p.frontWheelX() + p.archR() + 6).append(" ").append(p.sillY())
                .append("\" fill=\"none\" stroke=\"#101215\" stroke-width=\"5\" opacity=\"0.35\"/>");

        g.append("<path d=\"M ").append(p.frontWheelX() + p.archR() - 4).append(" ").append(p.beltY() + 40)
                .append(" L ").append(p.rearWheelX() - p.archR() + 20).append(" ").append(p.beltY() + 54)
                .append("\" stroke=\"").append(highlight).append("\" stroke-width=\"3\" opacity=\"0.5\" fill=\"none\"/>");
        return g.toString();
    }

    private static String handle(int x, int y, String color) {
        return "<rect x=\"" + x + "\" y=\"" + y + "\" width=\"36\" height=\"9\" rx=\"4\" fill=\"" + color
                + "\" opacity=\"0.85\"/>";
    }

    private static String linear(String id, double x1, double y1, double x2, double y2, String... stops) {
        StringBuilder gradient = new StringBuilder();
        gradient.append("<linearGradient id=\"").append(id).append("\" x1=\"").append(x1).append("\" y1=\"").append(y1)
                .append("\" x2=\"").append(x2).append("\" y2=\"").append(y2).append("\">");
        for (String stop : stops) {
            gradient.append(stop);
        }
        return gradient.append("</linearGradient>").toString();
    }

    private static String stop(double offset, String color, double opacity) {
        return "<stop offset=\"" + offset + "\" stop-color=\"" + color + "\" stop-opacity=\"" + opacity + "\"/>";
    }

    private static String hsl(int hue, int saturation, int lightness) {
        return "hsl(" + Math.floorMod(hue, 360) + " " + saturation + "% " + lightness + "%)";
    }

    private static String mix(String hex, String other, double amount) {
        int[] a = rgb(hex);
        int[] b = rgb(other);
        return String.format(Locale.ROOT, "#%02x%02x%02x",
                (int) Math.round(a[0] + (b[0] - a[0]) * amount),
                (int) Math.round(a[1] + (b[1] - a[1]) * amount),
                (int) Math.round(a[2] + (b[2] - a[2]) * amount));
    }

    private static int[] rgb(String hex) {
        int value = Integer.parseInt(hex.substring(1), 16);
        return new int[]{(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff};
    }

    private static long hash(long vehicleId, int shot) {
        long h = vehicleId * 0x9E3779B97F4A7C15L + (shot + 1L) * 0x165667B19E3779F9L;
        h ^= h >>> 30;
        h *= 0xBF58476D1CE4E5B9L;
        h ^= h >>> 27;
        h *= 0x94D049BB133111EBL;
        h ^= h >>> 31;
        return h & Long.MAX_VALUE;
    }
}
