package de.fahrzeugmarkt.repo;

import de.fahrzeugmarkt.domain.VehicleModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface VehicleModelRepository extends JpaRepository<VehicleModel, Long> {

    Optional<VehicleModel> findByMakeIdAndNameIgnoreCase(Long makeId, String name);

    @Query("select m from VehicleModel m join fetch m.make order by m.make.name asc, m.name asc")
    List<VehicleModel> findAllWithMake();
}
