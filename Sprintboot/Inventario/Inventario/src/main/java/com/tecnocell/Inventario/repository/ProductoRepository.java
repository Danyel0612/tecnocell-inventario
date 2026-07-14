package com.tecnocell.Inventario.repository;

import com.tecnocell.Inventario.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    List<Producto> findByActivoTrue();
    List<Producto> findByNombreContainingIgnoreCaseAndActivoTrue(String nombre);
    Optional<Producto> findByCodigo(String codigo);
    List<Producto> findByStockLessThanEqualAndActivoTrue(Integer stockMinimo);
}
