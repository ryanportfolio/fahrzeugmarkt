package de.fahrzeugmarkt.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.BatchSize;

@Entity
@Table(name = "models")
@BatchSize(size = 64)
public class VehicleModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "make_id", nullable = false)
    private Make make;

    @Column(nullable = false)
    private String name;

    protected VehicleModel() {
    }

    public VehicleModel(Make make, String name) {
        this.make = make;
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public Make getMake() {
        return make;
    }

    public String getName() {
        return name;
    }
}
