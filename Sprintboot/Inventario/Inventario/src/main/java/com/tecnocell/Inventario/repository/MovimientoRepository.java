package com.tecnocell.Inventario.repository;

import com.tecnocell.Inventario.model.Movimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface MovimientoRepository extends JpaRepository<Movimiento, Long> {
    List<Movimiento> findByTipo(String tipo);
    List<Movimiento> findByProductoId(Long productoId);
    List<Movimiento> findByFechaBetween(LocalDate inicio, LocalDate fin);
    List<Movimiento> findAllByOrderByFechaDescIdDesc();
}
