package com.tecnocell.Inventario.repository;

import com.tecnocell.Inventario.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    List<Cliente> findByActivoTrue();
    Optional<Cliente> findByDoc(String doc);
    List<Cliente> findByNombreContainingIgnoreCaseAndActivoTrue(String nombre);
}
