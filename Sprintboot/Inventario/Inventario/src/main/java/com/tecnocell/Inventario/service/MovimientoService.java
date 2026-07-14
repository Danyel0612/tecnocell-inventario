package com.tecnocell.Inventario.service;

import com.tecnocell.Inventario.model.Movimiento;
import com.tecnocell.Inventario.model.Producto;
import com.tecnocell.Inventario.repository.MovimientoRepository;
import com.tecnocell.Inventario.repository.ProductoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MovimientoService {

    private final MovimientoRepository repo;
    private final ProductoRepository productoRepo;

    public List<Movimiento> listarTodos() {
        return repo.findAllByOrderByFechaDescIdDesc();
    }

    public List<Movimiento> listarPorTipo(String tipo) {
        return repo.findByTipo(tipo.toUpperCase());
    }

    public List<Movimiento> listarPorProducto(Long productoId) {
        return repo.findByProductoId(productoId);
    }

    @Transactional
    public Movimiento registrarEntrada(Movimiento movimiento) {
        movimiento.setTipo("ENTRADA");
        if (movimiento.getFecha() == null) {
            movimiento.setFecha(java.time.LocalDate.now());
        }
        Producto producto = productoRepo.findById(movimiento.getProducto().getId())
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));

        // Sumar stock al producto
        producto.setStock(producto.getStock() + movimiento.getCantidad());
        if (movimiento.getPCosto() != null && movimiento.getPCosto() > 0) {
            producto.setPCosto(movimiento.getPCosto());
        }
        productoRepo.save(producto);
        return repo.save(movimiento);
    }

    @Transactional
    public Movimiento registrarSalida(Movimiento movimiento) {
        movimiento.setTipo("SALIDA");
        if (movimiento.getFecha() == null) {
            movimiento.setFecha(java.time.LocalDate.now());
        }
        Producto producto = productoRepo.findById(movimiento.getProducto().getId())
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado"));

        // Validar stock suficiente
        if (producto.getStock() < movimiento.getCantidad()) {
            throw new IllegalStateException(
                "Stock insuficiente. Disponible: " + producto.getStock() +
                ", Solicitado: " + movimiento.getCantidad()
            );
        }

        // Descontar stock del producto
        producto.setStock(producto.getStock() - movimiento.getCantidad());
        productoRepo.save(producto);
        return repo.save(movimiento);
    }
}
