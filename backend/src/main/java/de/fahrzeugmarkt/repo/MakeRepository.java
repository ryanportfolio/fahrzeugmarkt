package de.fahrzeugmarkt.repo;

import de.fahrzeugmarkt.domain.Make;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MakeRepository extends JpaRepository<Make, Long> {

    Optional<Make> findByNameIgnoreCase(String name);

    List<Make> findAllByOrderByNameAsc();
}
