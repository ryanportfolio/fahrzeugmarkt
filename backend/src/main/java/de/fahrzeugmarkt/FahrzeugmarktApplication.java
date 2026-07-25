package de.fahrzeugmarkt;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class FahrzeugmarktApplication {

    public static void main(String[] args) {
        SpringApplication.run(FahrzeugmarktApplication.class, args);
    }
}
