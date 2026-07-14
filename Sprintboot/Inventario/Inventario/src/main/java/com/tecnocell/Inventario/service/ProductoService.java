package com.tecnocell.Inventario.service;

import com.tecnocell.Inventario.model.Producto;
import com.tecnocell.Inventario.repository.ProductoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository repo;

    public List<Producto> listarActivos() {
        return repo.findByActivoTrue();
    }

    public List<Producto> listarTodos() {
        return repo.findAll();
    }

    public Producto obtenerPorId(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Producto no encontrado con id: " + id));
    }

    public Producto crear(Producto producto) {
        if (repo.findByCodigo(producto.getCodigo()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un producto con el codigo: " + producto.getCodigo());
        }
        if (producto.getStock() == null) producto.setStock(0);
        if (producto.getStockMinimo() == null) producto.setStockMinimo(5);
        if (producto.getPCosto() == null) producto.setPCosto(0.0);
        if (producto.getPVenta() == null) producto.setPVenta(0.0);
        if (producto.getActivo() == null) producto.setActivo(true);
        if (producto.getFechaRegistro() == null) producto.setFechaRegistro(java.time.LocalDate.now());
        return repo.save(producto);
    }

    public Producto actualizar(Long id, Producto datos) {
        Producto existente = obtenerPorId(id);
        existente.setNombre(datos.getNombre());
        existente.setCategoria(datos.getCategoria());
        existente.setMarca(datos.getMarca());
        existente.setDescripcion(datos.getDescripcion());
        existente.setStockMinimo(datos.getStockMinimo());
        existente.setPCosto(datos.getPCosto());
        existente.setPVenta(datos.getPVenta());
        existente.setActivo(datos.getActivo());
        return repo.save(existente);
    }

    public void eliminar(Long id) {
        Producto p = obtenerPorId(id);
        p.setActivo(false);
        repo.save(p);
    }

    public List<Producto> buscarPorNombre(String nombre) {
        return repo.findByNombreContainingIgnoreCaseAndActivoTrue(nombre);
    }

    public List<Producto> obtenerProductosBajoStock() {
        return repo.findByStockLessThanEqualAndActivoTrue(5);
    }
}
