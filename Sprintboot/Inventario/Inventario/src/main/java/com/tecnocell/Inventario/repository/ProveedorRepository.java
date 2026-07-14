package com.tecnocell.Inventario.repository;

import com.tecnocell.Inventario.model.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProveedorRepository extends JpaRepository<Proveedor, Long> {
    List<Proveedor> findByActivoTrue();
    Optional<Proveedor> findByRuc(String ruc);
    List<Proveedor> findByEmpresaContainingIgnoreCaseAndActivoTrue(String empresa);
}
