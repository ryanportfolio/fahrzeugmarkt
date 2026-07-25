package de.fahrzeugmarkt.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDate;

@Entity
@Table(name = "vehicles")
@BatchSize(size = 64)
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "model_id", nullable = false)
    private VehicleModel model;

    @Enumerated(EnumType.STRING)
    @Column(name = "body_type", nullable = false)
    private BodyType bodyType;

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type", nullable = false)
    private FuelType fuelType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Transmission transmission;

    @Column(nullable = false)
    private String color;

    @Column(name = "mileage_km", nullable = false)
    private int mileageKm;

    @Column(name = "power_kw", nullable = false)
    private int powerKw;

    private Integer doors;

    private Integer seats;

    @Column(name = "first_registration", nullable = false)
    private LocalDate firstRegistration;

    @Column(name = "next_inspection")
    private LocalDate nextInspection;

    public Vehicle() {
    }

    public Long getId() {
        return id;
    }

    public VehicleModel getModel() {
        return model;
    }

    public BodyType getBodyType() {
        return bodyType;
    }

    public FuelType getFuelType() {
        return fuelType;
    }

    public Transmission getTransmission() {
        return transmission;
    }

    public String getColor() {
        return color;
    }

    public int getMileageKm() {
        return mileageKm;
    }

    public int getPowerKw() {
        return powerKw;
    }

    public Integer getDoors() {
        return doors;
    }

    public Integer getSeats() {
        return seats;
    }

    public LocalDate getFirstRegistration() {
        return firstRegistration;
    }

    public LocalDate getNextInspection() {
        return nextInspection;
    }

    public void setModel(VehicleModel model) {
        this.model = model;
    }

    public void setBodyType(BodyType bodyType) {
        this.bodyType = bodyType;
    }

    public void setFuelType(FuelType fuelType) {
        this.fuelType = fuelType;
    }

    public void setTransmission(Transmission transmission) {
        this.transmission = transmission;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public void setMileageKm(int mileageKm) {
        this.mileageKm = mileageKm;
    }

    public void setPowerKw(int powerKw) {
        this.powerKw = powerKw;
    }

    public void setDoors(Integer doors) {
        this.doors = doors;
    }

    public void setSeats(Integer seats) {
        this.seats = seats;
    }

    public void setFirstRegistration(LocalDate firstRegistration) {
        this.firstRegistration = firstRegistration;
    }

    public void setNextInspection(LocalDate nextInspection) {
        this.nextInspection = nextInspection;
    }
}
